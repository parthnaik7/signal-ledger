"""
Core stock-history analysis logic.

All functions operate on a pandas DataFrame with at least these columns:
    Date (datetime64), Open, High, Low, Close, Volume

No I/O happens here — this module is pure computation so it can be
unit-tested against any DataFrame, whether it came from Yahoo Finance
or an uploaded CSV.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import pandas as pd


# ---------------------------------------------------------------------------
# Small data containers (kept as dicts at the API boundary, dataclasses here
# for internal clarity)
# ---------------------------------------------------------------------------

@dataclass
class Extreme:
    price: float
    date: datetime


@dataclass
class PeriodStats:
    label: str                 # e.g. "2025" or "Jun 2026"
    start: datetime
    end: datetime
    trading_days: int
    is_complete: bool          # full calendar year / full calendar month
    high: Extreme
    low: Extreme
    pct_diff: float            # (high - low) / low * 100, using this period's own high
    sequence_ok: bool          # True if low_date <= high_date (a genuine low-to-high rally)
    revised_high: Optional[Extreme] = None   # next period's high, when sequence_ok is False
    revised_pct_diff: Optional[float] = None
    revised_note: Optional[str] = None       # explains why revision is/isn't available


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extreme_high(df: pd.DataFrame) -> Extreme:
    row = df.loc[df["High"].idxmax()]
    return Extreme(price=float(row["High"]), date=row["Date"].to_pydatetime())


def _extreme_low(df: pd.DataFrame) -> Extreme:
    row = df.loc[df["Low"].idxmin()]
    return Extreme(price=float(row["Low"]), date=row["Date"].to_pydatetime())


def _pct_diff(high: float, low: float) -> float:
    if low == 0:
        return float("inf")
    return (high - low) / low * 100.0


# ---------------------------------------------------------------------------
# Yearly analysis
# ---------------------------------------------------------------------------

def yearly_analysis(df: pd.DataFrame, num_years: int, min_trading_days: int = 200) -> list[dict]:
    """
    Returns a list of per-year stats dicts for the last `num_years` calendar
    years present in the data (most recent first is NOT assumed — callers
    get chronological order, oldest to newest, which is what the UI wants
    for tables and charts).

    A year is "complete" if it has at least `min_trading_days` sessions AND
    its first session falls in the first 10 calendar days of the year and
    its last session falls in the last 10 calendar days of the year. The
    most recent year in the file is very often partial (year-to-date) and
    is still included, just marked incomplete, so the UI can show it as a
    "YTD" row without pretending it's a finished year.

    Sequencing flag: within a year, if the Low happened AFTER the High
    (i.e. the stock peaked, then bled out to its low by year end) the
    naive (High - Low) / Low % figure overstates an "achievable rally" —
    you can't buy at a low that hasn't happened yet to sell at a high
    that already passed. Those years get sequence_ok = False, and a
    revised % diff is computed using the NEXT year's high against this
    year's low (a genuine, chronologically valid low -> future high move).
    """
    df = df.sort_values("Date").reset_index(drop=True)
    df["_year"] = df["Date"].dt.year

    all_years = sorted(df["_year"].unique().tolist())
    if not all_years:
        return []

    target_years = all_years[-num_years:] if num_years > 0 else all_years

    # Pre-compute raw stats for every year present (we need year+1 lookahead
    # even for years just outside the requested window).
    raw: dict[int, dict] = {}
    for y in all_years:
        ydf = df[df["_year"] == y]
        if ydf.empty:
            continue
        high = _extreme_high(ydf)
        low = _extreme_low(ydf)
        start, end = ydf["Date"].min(), ydf["Date"].max()
        is_complete = (
            len(ydf) >= min_trading_days
            and start.timetuple().tm_yday <= 10
            and (pd.Timestamp(year=y, month=12, day=31) - end).days <= 10
        )
        raw[y] = dict(
            year=y, start=start, end=end, trading_days=len(ydf),
            is_complete=is_complete, high=high, low=low,
        )

    results: list[dict] = []
    for y in target_years:
        r = raw[y]
        high, low = r["high"], r["low"]
        sequence_ok = low.date <= high.date
        pct = _pct_diff(high.price, low.price)

        revised_high = None
        revised_pct = None
        revised_note = None

        if not sequence_ok:
            nxt = raw.get(y + 1)
            if nxt is not None:
                revised_high = nxt["high"]
                revised_pct = _pct_diff(revised_high.price, low.price)
                revised_note = f"Uses {y + 1} high (next year's data may still change if {y + 1} is incomplete)." \
                    if not nxt["is_complete"] else None
            else:
                revised_note = "No later-year data available yet to revise against."

        results.append(dict(
            label=str(y),
            start=r["start"].isoformat(),
            end=r["end"].isoformat(),
            trading_days=r["trading_days"],
            is_complete=r["is_complete"],
            high=dict(price=high.price, date=high.date.isoformat()),
            low=dict(price=low.price, date=low.date.isoformat()),
            pct_diff=round(pct, 2),
            sequence_ok=sequence_ok,
            revised_high=(dict(price=revised_high.price, date=revised_high.date.isoformat())
                          if revised_high else None),
            revised_pct_diff=(round(revised_pct, 2) if revised_pct is not None else None),
            revised_note=revised_note,
        ))

    return results


# ---------------------------------------------------------------------------
# Monthly analysis (trailing window)
# ---------------------------------------------------------------------------

def monthly_analysis(df: pd.DataFrame, num_months: int) -> list[dict]:
    """
    Trailing `num_months` calendar months ending at the most recent date in
    the data (a rolling window from "today" backwards, not fixed calendar
    years). Each month gets its own high/low/date/% diff, plus a sequencing
    flag using the same low-must-precede-high logic as the yearly view.
    """
    df = df.sort_values("Date").reset_index(drop=True)
    end_date = df["Date"].max()
    start_date = end_date - pd.DateOffset(months=num_months) + pd.Timedelta(days=1)
    window = df[(df["Date"] >= start_date) & (df["Date"] <= end_date)].copy()
    if window.empty:
        return []

    window["_ym"] = window["Date"].dt.to_period("M")

    results = []
    for ym, mdf in window.groupby("_ym", sort=True):
        high = _extreme_high(mdf)
        low = _extreme_low(mdf)
        pct = _pct_diff(high.price, low.price)
        sequence_ok = low.date <= high.date
        month_start = mdf["Date"].min()
        month_end = mdf["Date"].max()
        calendar_days_in_month = pd.Period(ym, freq="M").days_in_month
        # "complete" here just means the window wasn't clipped at either edge
        is_complete = (month_start.day <= 3) and (
            (pd.Period(ym, freq="M").end_time.normalize() - month_end).days <= 3
        )
        results.append(dict(
            label=ym.strftime("%b %Y"),
            start=month_start.isoformat(),
            end=month_end.isoformat(),
            trading_days=len(mdf),
            is_complete=bool(is_complete),
            high=dict(price=high.price, date=high.date.isoformat()),
            low=dict(price=low.price, date=low.date.isoformat()),
            pct_diff=round(pct, 2),
            sequence_ok=sequence_ok,
        ))
    return results


# ---------------------------------------------------------------------------
# Sequential max-gain ("best time to buy/sell") over an arbitrary window
# ---------------------------------------------------------------------------

def sequential_max_gain(df: pd.DataFrame, start_date=None, end_date=None) -> Optional[dict]:
    """
    Finds the single best chronologically-valid low -> later high move in
    the window: the low date always precedes the high date. This is the
    classic "best time to buy and sell a stock" scan, applied to daily
    High/Low rather than Close, so it reflects intraday extremes.
    """
    df = df.sort_values("Date").reset_index(drop=True)
    if start_date is not None:
        df = df[df["Date"] >= pd.Timestamp(start_date)]
    if end_date is not None:
        df = df[df["Date"] <= pd.Timestamp(end_date)]
    if df.empty:
        return None

    best_pct = -1.0
    best_low_price = None
    best_low_date = None
    best_high_price = None
    best_high_date = None

    running_min_low = float("inf")
    running_min_date = None

    for _, row in df.iterrows():
        if running_min_low != float("inf"):
            pct = _pct_diff(row["High"], running_min_low)
            if pct > best_pct:
                best_pct = pct
                best_low_price = running_min_low
                best_low_date = running_min_date
                best_high_price = row["High"]
                best_high_date = row["Date"]
        if row["Low"] < running_min_low:
            running_min_low = row["Low"]
            running_min_date = row["Date"]

    if best_low_date is None:
        return None

    return dict(
        low=dict(price=float(best_low_price), date=best_low_date.isoformat()),
        high=dict(price=float(best_high_price), date=best_high_date.isoformat()),
        pct_diff=round(best_pct, 2),
    )
