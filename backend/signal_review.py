"""
Signal Review Module for SignalLedger.

Normalizes analyst recommendations, price targets, and institutional ratings from
reputable, freely accessible financial sources:
- LSEG Refinitiv / Yahoo Finance Analyst Consensus (1.0 - 5.0 score scale)
- Wall Street broker upgrades/downgrades (actions, price targets)
- Morningstar / Intrinsic Fair Value & Star Rating framework (1 - 5 stars)
"""

from __future__ import annotations

import logging
from typing import Any

from session_manager import session_manager

try:
    import yfinance as yf
except ImportError:  # pragma: no cover
    yf = None

logger = logging.getLogger("stock_ledger.signal_review")


def _score_to_verdict(score: float | None, key: str | None) -> tuple[str, str]:
    """
    Normalizes a numerical LSEG Refinitiv score (1.0 to 5.0) or string recommendation key
    into (verdict, verdict_display).
    verdict is strictly 'BUY', 'HOLD', 'SELL', or 'UNRATED'.
    """
    if score is not None:
        try:
            val = float(score)
            if val <= 1.5:
                return "BUY", "STRONG BUY"
            if val <= 2.5:
                return "BUY", "BUY"
            if val <= 3.5:
                return "HOLD", "HOLD"
            if val <= 4.5:
                return "SELL", "UNDERPERFORM"
            return "SELL", "STRONG SELL"
        except (ValueError, TypeError):
            pass

    if key:
        norm_key = key.strip().lower().replace(" ", "_")
        if "strong_buy" in norm_key:
            return "BUY", "STRONG BUY"
        if "buy" in norm_key or "outperform" in norm_key or "overweight" in norm_key:
            return "BUY", "BUY"
        if "hold" in norm_key or "neutral" in norm_key or "equal" in norm_key:
            return "HOLD", "HOLD"
        if "underperform" in norm_key or "underweight" in norm_key:
            return "SELL", "UNDERPERFORM"
        if "sell" in norm_key:
            return "SELL", "STRONG SELL"

    return "UNRATED", "UNRATED"


def _calculate_star_rating(current_price: float | None, fair_value: float | None) -> tuple[int | None, str, float | None]:
    """
    Applies the Morningstar 1-to-5 Star Rating methodology based on discount/premium to fair value:
    - >= 20% discount: 5 Stars (Strongly Undervalued)
    - 8% to 20% discount: 4 Stars (Undervalued)
    - -8% to +8% discount: 3 Stars (Fairly Valued)
    - -20% to -8% discount (i.e. 8% to 20% premium): 2 Stars (Overvalued)
    - < -20% discount (i.e. > 20% premium): 1 Star (Strongly Overvalued)
    """
    if not current_price or not fair_value or current_price <= 0 or fair_value <= 0:
        return None, "Unrated", None

    discount_pct = round(((fair_value - current_price) / fair_value) * 100.0, 2)

    if discount_pct >= 20.0:
        return 5, "Strongly Undervalued", discount_pct
    if discount_pct >= 8.0:
        return 4, "Undervalued", discount_pct
    if discount_pct >= -8.0:
        return 3, "Fairly Valued", discount_pct
    if discount_pct >= -20.0:
        return 2, "Overvalued", discount_pct
    return 1, "Strongly Overvalued", discount_pct


def fetch_signal_review(
    ticker: str,
    info: dict[str, Any] | None = None,
    ticker_obj: Any = None,
) -> dict[str, Any]:
    """
    Fetches and normalizes institutional ratings and consensus price targets for `ticker`.
    Returns a unified, typed review object. Gracefully returns UNRATED for ETFs or assets
    without Wall Street analyst coverage.
    """
    clean_ticker = (ticker or "").strip().upper()
    default_review: dict[str, Any] = {
        "ticker": clean_ticker,
        "verdict": "UNRATED",
        "verdict_display": "UNRATED",
        "score": None,
        "scale": "1.0 (Strong Buy) to 5.0 (Strong Sell)",
        "confidence": "NONE",
        "analyst_count": 0,
        "distribution": {
            "strong_buy": 0,
            "buy": 0,
            "hold": 0,
            "sell": 0,
            "strong_sell": 0,
        },
        "price_targets": {
            "current": None,
            "mean": None,
            "median": None,
            "high": None,
            "low": None,
            "implied_upside_pct": None,
        },
        "valuation": {
            "star_rating": None,
            "fair_value": None,
            "status": "Unrated",
            "discount_pct": None,
        },
        "recent_broker_actions": [],
        "sources": [
            "LSEG Refinitiv Consensus",
            "Yahoo Finance Analyst Ratings",
            "Morningstar / Intrinsic Valuation",
        ],
        "summary": f"No institutional analyst coverage currently tracked for {clean_ticker}.",
    }

    if not clean_ticker or yf is None:
        return default_review

    t = ticker_obj
    if t is None:
        try:
            t = yf.Ticker(clean_ticker, session=session_manager.get_session())
        except Exception as exc:
            logger.warning("Could not initialize Ticker for %s: %s", clean_ticker, exc)
            return default_review

    # Extract or fallback info dict
    if info is None:
        try:
            info = getattr(t, "info", None) or {}
        except Exception:
            info = {}

    # 1. Consensus Rating & Score (LSEG Refinitiv)
    rec_mean_raw = info.get("recommendationMean")
    rec_mean = round(float(rec_mean_raw), 2) if rec_mean_raw is not None else None
    rec_key = info.get("recommendationKey")
    verdict, verdict_display = _score_to_verdict(rec_mean, rec_key)

    # 2. Analyst Counts & Distribution
    analyst_count = int(info.get("numberOfAnalystOpinions") or 0)
    distribution = {
        "strong_buy": 0,
        "buy": 0,
        "hold": 0,
        "sell": 0,
        "strong_sell": 0,
    }

    try:
        recs_df = getattr(t, "recommendations", None)
        if recs_df is not None and not recs_df.empty:
            row0 = recs_df.iloc[0]
            distribution["strong_buy"] = int(row0.get("strongBuy", 0) or 0)
            distribution["buy"] = int(row0.get("buy", 0) or 0)
            distribution["hold"] = int(row0.get("hold", 0) or 0)
            distribution["sell"] = int(row0.get("sell", 0) or 0)
            distribution["strong_sell"] = int(row0.get("strongSell", 0) or 0)
            calculated_sum = sum(distribution.values())
            if calculated_sum > analyst_count:
                analyst_count = calculated_sum
    except Exception as exc:
        logger.debug("Could not parse recommendations breakdown for %s: %s", clean_ticker, exc)

    # Confidence rating based on coverage depth
    if analyst_count >= 20:
        confidence = "HIGH"
    elif analyst_count >= 6:
        confidence = "MEDIUM"
    elif analyst_count >= 1:
        confidence = "LOW"
    else:
        confidence = "NONE"

    # 3. Price Targets & Implied Upside
    price_targets_raw = {}
    try:
        price_targets_raw = getattr(t, "analyst_price_targets", None) or {}
    except Exception:
        price_targets_raw = {}

    current_price = (
        price_targets_raw.get("current")
        or info.get("currentPrice")
        or info.get("regularMarketPrice")
        or info.get("previousClose")
    )
    current_price = round(float(current_price), 2) if current_price is not None else None

    target_mean = price_targets_raw.get("mean") or info.get("targetMeanPrice")
    target_mean = round(float(target_mean), 2) if target_mean is not None else None

    target_median = price_targets_raw.get("median") or info.get("targetMedianPrice") or target_mean
    target_median = round(float(target_median), 2) if target_median is not None else None

    target_high = price_targets_raw.get("high") or info.get("targetHighPrice")
    target_high = round(float(target_high), 2) if target_high is not None else None

    target_low = price_targets_raw.get("low") or info.get("targetLowPrice")
    target_low = round(float(target_low), 2) if target_low is not None else None

    implied_upside = None
    if current_price and target_mean and current_price > 0:
        implied_upside = round(((target_mean - current_price) / current_price) * 100.0, 2)

    # 4. Morningstar Fair Value & Star Rating Model
    fair_value = target_median or target_mean
    star_rating, val_status, discount_pct = _calculate_star_rating(current_price, fair_value)

    # 5. Recent Broker Upgrades / Downgrades
    recent_broker_actions = []
    try:
        ud_df = getattr(t, "upgrades_downgrades", None)
        if ud_df is not None and not ud_df.empty:
            for idx, row in ud_df.head(6).iterrows():
                date_str = ""
                if hasattr(idx, "strftime"):
                    date_str = idx.strftime("%Y-%m-%d")
                elif "GradeDate" in row and hasattr(row["GradeDate"], "strftime"):
                    date_str = row["GradeDate"].strftime("%Y-%m-%d")
                else:
                    date_str = str(idx)[:10]

                firm = str(row.get("Firm") or "").strip()
                to_grade = str(row.get("ToGrade") or "").strip()
                action = str(row.get("Action") or row.get("priceTargetAction") or "").strip()
                target_pt = row.get("currentPriceTarget")
                target_pt_val = round(float(target_pt), 2) if target_pt is not None and str(target_pt) != "nan" else None

                if firm:
                    recent_broker_actions.append({
                        "date": date_str,
                        "firm": firm,
                        "to_grade": to_grade or "—",
                        "action": action.capitalize() if action else "Maintains",
                        "price_target": target_pt_val,
                    })
    except Exception as exc:
        logger.debug("Could not parse broker upgrades/downgrades for %s: %s", clean_ticker, exc)

    # 6. Concise Institutional Summary
    if analyst_count > 0:
        positives = distribution["strong_buy"] + distribution["buy"]
        negatives = distribution["sell"] + distribution["strong_sell"]
        score_str = f"score {rec_mean:.2f}/5.0" if rec_mean else f"rating: {verdict_display}"
        target_str = f", target median ${target_median:,.2f}" if target_median else ""
        upside_str = f" ({'+' if (implied_upside or 0) >= 0 else ''}{implied_upside}%)" if implied_upside is not None else ""
        summary = (
            f"Consensus {verdict_display} from {analyst_count} analysts (LSEG Refinitiv {score_str}). "
            f"{positives} positive vs {negatives} negative{target_str}{upside_str}."
        )
    else:
        summary = f"No active Wall Street analyst coverage currently reported for {clean_ticker}."

    return {
        "ticker": clean_ticker,
        "verdict": verdict,
        "verdict_display": verdict_display,
        "score": rec_mean,
        "scale": "1.0 (Strong Buy) to 5.0 (Strong Sell)",
        "confidence": confidence,
        "analyst_count": analyst_count,
        "distribution": distribution,
        "price_targets": {
            "current": current_price,
            "mean": target_mean,
            "median": target_median,
            "high": target_high,
            "low": target_low,
            "implied_upside_pct": implied_upside,
        },
        "valuation": {
            "star_rating": star_rating,
            "fair_value": fair_value,
            "status": val_status,
            "discount_pct": discount_pct,
        },
        "recent_broker_actions": recent_broker_actions[:5],
        "sources": [
            "LSEG Refinitiv Consensus",
            "Yahoo Finance Analyst Ratings",
            "Morningstar / Intrinsic Valuation",
        ],
        "summary": summary,
    }
