"""
Turns either (a) a Yahoo Finance ticker + date range, or (b) an uploaded
Yahoo-style history CSV, into the same normalized DataFrame shape that
analysis.py expects: Date, Open, High, Low, Close, Volume (Date as
datetime64, everything else as float).
"""

from __future__ import annotations

import io
from datetime import datetime, timedelta, timezone
from typing import Any

import pandas as pd

from session_manager import session_manager

try:
    import yfinance as yf
except ImportError:  # pragma: no cover - yfinance is a hard requirement in requirements.txt
    yf = None


class DataFetchError(Exception):
    """Raised when live data can't be retrieved (network, bad ticker, rate limit, etc.)."""


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # yfinance sometimes returns a MultiIndex column (Ticker level) — flatten it first.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [c[0] if isinstance(c, tuple) else c for c in df.columns]
    df.columns = [str(c).strip() for c in df.columns]
    return df



def fetch_live_quote(ticker: str) -> dict:
    """
    Best-effort fetch of a near-real-time price for `ticker`, for stamping
    exports with "today's price" rather than only the last daily close in
    the historical dataset. Falls back through a couple of yfinance
    accessors since availability varies by ticker/market state.
    Raises DataFetchError if nothing works (e.g. no network, bad symbol).
    """
    if yf is None:
        raise DataFetchError("yfinance is not installed on the server.")

    try:
        t = session_manager.create_ticker(ticker.strip().upper())
        price = None
        as_of_note = "live quote"

        try:
            fi = t.fast_info
            price = fi.get("last_price") if isinstance(fi, dict) else getattr(fi, "last_price", None)
        except Exception:
            price = None

        if price is None:
            hist = t.history(period="1d")
            if not hist.empty:
                price = float(hist["Close"].iloc[-1])
                as_of_note = "most recent session close"

        if price is None:
            raise DataFetchError(f"No live price available for '{ticker}'.")

        return {"price": float(price), "note": as_of_note}
    except DataFetchError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise DataFetchError(f"Could not fetch a live quote for '{ticker}': {exc}") from exc


def fetch_from_yahoo(ticker: str, years_back: int = 6) -> pd.DataFrame:
    """
    Pulls daily OHLCV history for `ticker` covering roughly the last
    `years_back` years, using the same underlying data Yahoo's own
    /quote/{ticker}/history page renders.

    Requires outbound internet access to Yahoo Finance from wherever this
    server runs. In network-restricted environments (e.g. some sandboxes)
    this will raise DataFetchError — use the CSV upload endpoint instead.
    """
    if yf is None:
        raise DataFetchError("yfinance is not installed on the server.")

    end = datetime.now(timezone.utc).replace(tzinfo=None)
    start = end - timedelta(days=365 * years_back + 30)

    try:
        raw = yf.download(
            ticker.strip().upper(),
            start=start.strftime("%Y-%m-%d"),
            end=end.strftime("%Y-%m-%d"),
            interval="1d",
            auto_adjust=True,
            progress=False,
            threads=False,
            session=session_manager.get_session(),
        )
    except Exception as exc:  # noqa: BLE001 - surface any network/library error uniformly
        raise DataFetchError(f"Could not reach Yahoo Finance for '{ticker}': {exc}") from exc

    if raw is None or raw.empty:
        raise DataFetchError(
            f"No data returned for ticker '{ticker}'. Check the symbol is correct."
        )

    raw = normalize_columns(raw.reset_index())
    return _coerce_ohlc(raw)


def parse_uploaded_csv(file_bytes: bytes) -> pd.DataFrame:
    """
    Parses a Yahoo-Finance-style exported history CSV (the same format used
    throughout this conversation): Date, Open, High, Low, Close, Volume,
    Adj Close, with the Date formatted like "Sep 11, 2026" and thousands
    separators in Volume.
    """
    df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8-sig")
    df = normalize_columns(df)

    if "Date" not in df.columns:
        raise DataFetchError("CSV is missing a 'Date' column.")

    # Try the Yahoo export format first, then fall back to a generic parser.
    try:
        df["Date"] = pd.to_datetime(df["Date"], format="%b %d, %Y")
    except (ValueError, TypeError):
        df["Date"] = pd.to_datetime(df["Date"], errors="coerce")

    if df["Date"].isna().any():
        raise DataFetchError("Some rows have an unparseable Date value.")

    return _coerce_ohlc(df)


def _coerce_ohlc(df: pd.DataFrame) -> pd.DataFrame:
    required = ["Date", "Open", "High", "Low", "Close"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise DataFetchError(f"Missing required column(s): {', '.join(missing)}")

    out = df.copy()
    for col in ["Open", "High", "Low", "Close", "Adj Close", "Volume"]:
        if col in out.columns:
            out[col] = (
                out[col].astype(str).str.replace(",", "", regex=False).str.strip()
            )
            out[col] = pd.to_numeric(out[col], errors="coerce")

    out = out.dropna(subset=["High", "Low", "Close"])
    out["Date"] = pd.to_datetime(out["Date"]).dt.tz_localize(None)
    out = out.sort_values("Date").reset_index(drop=True)

    if out.empty:
        raise DataFetchError("No usable rows after parsing — check the file contents.")

    return out


def fetch_ticker_quote_details(
    ticker: str, ticker_obj: Any | None = None, info: dict | None = None
) -> dict | None:
    """
    Fetches the 16 standard Yahoo Finance summary metrics (Previous close, Open, Bid, Ask,
    Day's range, 52-week range, Volume, Avg. volume, Market cap, Beta, PE, EPS, Earnings date,
    Forward dividend & yield, Ex-dividend date, 1y target est).
    Reuses provided ticker_obj / info to prevent redundant network calls.
    """
    if yf is None:
        return None
    try:
        t = ticker_obj or session_manager.create_ticker(ticker.strip().upper())
        if info is None:
            info = t.info or {}

        def fmt_num(v, decimals=2, prefix=""):
            if v is None or pd.isna(v):
                return "—"
            try:
                return f"{prefix}{float(v):,.{decimals}f}"
            except Exception:
                return str(v)

        def fmt_int(v):
            if v is None or pd.isna(v):
                return "—"
            try:
                return f"{int(v):,}"
            except Exception:
                return str(v)

        def fmt_cap(v):
            if not v or pd.isna(v):
                return "—"
            try:
                v = float(v)
                if v >= 1e12:
                    return f"{v/1e12:.3f}T"
                if v >= 1e9:
                    return f"{v/1e9:.3f}B"
                if v >= 1e6:
                    return f"{v/1e6:.3f}M"
                return f"{v:,.2f}"
            except Exception:
                return str(v)

        def fmt_date(d):
            if not d or pd.isna(d):
                return "—"
            try:
                if hasattr(d, "strftime"):
                    return d.strftime("%d %b %Y")
                if isinstance(d, (int, float)):
                    return datetime.fromtimestamp(d).strftime("%d %b %Y")
                return str(d)
            except Exception:
                return str(d)

        # Bid / Ask
        bid_val = info.get("bid")
        bid_size = info.get("bidSize")
        bid_multiplier = 100 if bid_size and bid_size < 1000 else 1
        bid_str = f"{fmt_num(bid_val)} x {int(bid_size) * bid_multiplier if bid_size else ''}".strip() if bid_val else "—"

        ask_val = info.get("ask")
        ask_size = info.get("askSize")
        ask_multiplier = 100 if ask_size and ask_size < 1000 else 1
        ask_str = f"{fmt_num(ask_val)} x {int(ask_size) * ask_multiplier if ask_size else ''}".strip() if ask_val else "—"

        # Ranges
        d_low, d_high = info.get("regularMarketDayLow"), info.get("regularMarketDayHigh")
        day_range = f"{fmt_num(d_low)} - {fmt_num(d_high)}" if d_low is not None and d_high is not None else "—"

        w_low, w_high = info.get("fiftyTwoWeekLow"), info.get("fiftyTwoWeekHigh")
        w52_range = f"{fmt_num(w_low)} - {fmt_num(w_high)}" if w_low is not None and w_high is not None else "—"

        # Dividend & Yield
        div_rate = info.get("dividendRate")
        div_yield = info.get("dividendYield")
        div_str = "—"
        if div_rate is not None and div_rate > 0:
            if div_yield is not None:
                # Yahoo Finance dividendYield is typically a decimal ratio (e.g. 0.025 for 2.5%, 0.12 for 12%).
                # If div_yield < 1.0, scale by 100. If already >= 1.0 (some endpoints report 2.5), use directly.
                try:
                    raw_y = float(div_yield)
                    yp_val = raw_y * 100.0 if raw_y < 1.0 else raw_y
                    div_str = f"{div_rate:.2f} ({yp_val:.2f}%)"
                except (ValueError, TypeError):
                    div_str = f"{div_rate:.2f}"
            else:
                div_str = f"{div_rate:.2f}"

        # Earnings Date
        earnings_str = "—"
        try:
            ed = getattr(t, "earnings_dates", None)
            if ed is not None and not ed.empty:
                future = ed[ed["Reported EPS"].isna()]
                if not future.empty:
                    earnings_str = future.index[0].strftime("%d %b %Y")
                else:
                    earnings_str = ed.index[0].strftime("%d %b %Y")
        except Exception:
            pass
        if earnings_str == "—":
            cal = getattr(t, "calendar", None)
            if isinstance(cal, dict) and "Earnings Date" in cal:
                ed_list = cal["Earnings Date"]
                if isinstance(ed_list, list) and ed_list:
                    earnings_str = fmt_date(ed_list[0])
                else:
                    earnings_str = fmt_date(ed_list)
            elif info.get("earningsTimestampStart"):
                earnings_str = fmt_date(info.get("earningsTimestampStart"))

        # Ex-dividend date
        ex_div = info.get("exDividendDate") or (getattr(t, "calendar", None) or {}).get("Ex-Dividend Date")

        return {
            "Previous close": fmt_num(info.get("previousClose") or info.get("regularMarketPreviousClose")),
            "Open": fmt_num(info.get("open") or info.get("regularMarketOpen")),
            "Bid": bid_str,
            "Ask": ask_str,
            "Day's range": day_range,
            "52-week range": w52_range,
            "Volume": fmt_int(info.get("volume") or info.get("regularMarketVolume")),
            "Avg. Volume": fmt_int(info.get("averageVolume") or info.get("averageDailyVolume3Month")),
            "Market cap (intra-day)": fmt_cap(info.get("marketCap")),
            "Beta (5Y monthly)": fmt_num(info.get("beta")),
            "PE ratio (TTM)": fmt_num(info.get("trailingPE")),
            "EPS (TTM)": fmt_num(info.get("trailingEps")),
            "Earnings date": earnings_str,
            "Forward dividend & yield": div_str,
            "Ex-dividend date": fmt_date(ex_div),
            "1y target est": fmt_num(info.get("targetMeanPrice")),
        }
    except Exception:
        return None


def fetch_similar_stocks(ticker: str) -> list[str]:
    """
    Retrieves similar / peer stock symbols from Yahoo Finance recommendations API
    using the unified persistent connection pool.
    """
    clean_ticker = (ticker or "").strip().upper()
    if not clean_ticker:
        return []

    url = f"https://query2.finance.yahoo.com/v6/finance/recommendationsbysymbol/{clean_ticker}"
    try:
        resp = session_manager.get(url, timeout=4.0)
        if resp.ok:
            data = resp.json()
            results = data.get("finance", {}).get("result", [])
            if results and "recommendedSymbols" in results[0]:
                symbols = [item["symbol"] for item in results[0]["recommendedSymbols"] if "symbol" in item]
                return symbols[:6]
    except Exception:
        pass

    return []


def fetch_ticker_metadata_bundle(ticker: str) -> dict:
    """
    Consolidated metadata query: fetches ticker info once via the unified session,
    then derives company name, ATH, ATL, the 16 quote stats, and peer recommendations.
    Reduces 3-4 redundant Yahoo API calls into a single unified pass.
    """
    clean_sym = (ticker or "").strip().upper()
    if not clean_sym or yf is None:
        return {
            "company_name": None,
            "all_time_high": None,
            "all_time_low": None,
            "quote_details": None,
            "similar_stocks": [],
        }

    try:
        t = session_manager.create_ticker(clean_sym)
        info = (getattr(t, "info", None) or {}) if t else {}
    except Exception:
        t = None
        info = {}

    if not info and t is not None:
        try:
            fi = getattr(t, "fast_info", None)
            if fi and getattr(fi, "last_price", None) is not None:
                info = {
                    "symbol": clean_sym,
                    "shortName": clean_sym,
                    "regularMarketPrice": getattr(fi, "last_price", None),
                    "previousClose": getattr(fi, "previous_close", None),
                    "fiftyTwoWeekHigh": getattr(fi, "year_high", None),
                    "fiftyTwoWeekLow": getattr(fi, "year_low", None),
                }
        except Exception:
            pass

    quote_details = fetch_ticker_quote_details(clean_sym, ticker_obj=t, info=info)
    similar_stocks = fetch_similar_stocks(clean_sym)
    try:
        from signal_review import fetch_signal_review
        signal_review = fetch_signal_review(clean_sym, info=info, ticker_obj=t)
    except Exception:
        signal_review = None

    return {
        "company_name": info.get("longName") or info.get("shortName") or None,
        "all_time_high": info.get("allTimeHigh"),
        "all_time_low": info.get("allTimeLow"),
        "quote_details": quote_details,
        "similar_stocks": similar_stocks,
        "signal_review": signal_review,
    }



