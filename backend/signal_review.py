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
from data_source import DataFetchError

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
            if 1.0 <= val <= 1.5:
                return "BUY", "STRONG BUY"
            if 1.5 < val <= 2.5:
                return "BUY", "BUY"
            if 2.5 < val <= 3.5:
                return "HOLD", "HOLD"
            if 3.5 < val <= 4.5:
                return "SELL", "UNDERPERFORM"
            if 4.5 < val <= 5.0:
                return "SELL", "STRONG SELL"
            # Scores outside standard 1.0-5.0 range (e.g. 0.0 unrated placeholders)
            return "UNRATED", "UNRATED"
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



def compute_unified_rating(
    review_data: dict[str, Any] | None,
    technical_metrics: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Derives a deterministic, unified quantitative signal (BUY, HOLD, SELL),
    confidence level (HIGH, MEDIUM, LOW), and risk level (LOW, MODERATE, HIGH)
    from real, verifiable financial inputs:
    1. Wall Street Analyst Consensus (Refinitiv 1.0 to 5.0)
    2. Analyst Opinions Distribution (strong_buy, buy, hold, sell, strong_sell)
    3. Price Targets & Implied Upside (current price vs mean/median target)
    4. Morningstar Fair Value & Star Rating (1 to 5 stars)
    5. Technical Range Position (proximity to 52-week high / low)

    Confidence reflects actual inter-source agreement and data coverage depth,
    rather than an arbitrary AI guess.
    """
    if not review_data or not isinstance(review_data, dict):
        return {
            "signal": "HOLD",
            "confidence": "LOW",
            "risk_level": "MODERATE",
            "composite_score": 0.0,
            "dispersion": 1.0,
            "pillars": {},
            "rationale": "Insufficient analyst and valuation coverage to establish a high-conviction signal.",
        }

    score = review_data.get("score")
    distribution = review_data.get("distribution") or {}
    price_targets = review_data.get("price_targets") or {}
    valuation = review_data.get("valuation") or {}
    analyst_count = int(review_data.get("analyst_count") or 0)
    verdict = (review_data.get("verdict") or "UNRATED").upper()

    # If asset has zero analyst coverage and no valuation model (e.g. index ETF):
    if analyst_count == 0 and verdict == "UNRATED" and not price_targets.get("mean") and not valuation.get("star_rating"):
        return {
            "signal": "UNRATED",
            "confidence": "NONE",
            "risk_level": "MODERATE",
            "composite_score": 0.0,
            "dispersion": 1.0,
            "pillars": {},
            "rationale": "No active Wall Street analyst coverage or valuation model available for this asset.",
        }

    current_price = price_targets.get("current")
    target_mean = price_targets.get("mean") or review_data.get("price_target_mean")
    implied_upside = price_targets.get("implied_upside_pct")
    if implied_upside is None:
        implied_upside = review_data.get("upside_pct")
    if implied_upside is None and current_price and target_mean and current_price > 0:
        implied_upside = round(((target_mean - current_price) / current_price) * 100.0, 2)

    star_rating = valuation.get("star_rating") or review_data.get("star_rating")
    discount_pct = valuation.get("discount_pct") or review_data.get("discount_pct")

    tech = technical_metrics or {}
    diff_from_high = tech.get("diff_from_latest_high_pct")

    # 1. Consensus Rating Score (1.0 to 5.0) -> [-2.0, +2.0]
    s_consensus = None
    if score is not None:
        try:
            val = float(score)
            s_consensus = max(-2.0, min(2.0, 2.0 - (val - 1.0)))
        except (ValueError, TypeError):
            pass
    elif verdict != "UNRATED":
        s_consensus = 1.2 if verdict == "BUY" else (-1.2 if verdict == "SELL" else 0.0)

    # 2. Analyst Distribution Net Bullish Ratio -> [-2.0, +2.0]
    s_distribution = None
    tot_opinions = sum(distribution.values()) if isinstance(distribution, dict) else 0
    if tot_opinions > 0:
        sb = distribution.get("strong_buy", 0)
        b = distribution.get("buy", 0)
        s = distribution.get("sell", 0)
        ss = distribution.get("strong_sell", 0)
        weighted_net = (sb * 2.0 + b * 1.0 - s * 1.0 - ss * 2.0) / tot_opinions
        s_distribution = max(-2.0, min(2.0, weighted_net))

    # 3. Price Target Implied Upside -> [-2.0, +2.0]
    s_targets = None
    if implied_upside is not None:
        if implied_upside >= 25.0:
            s_targets = 2.0
        elif implied_upside >= 15.0:
            s_targets = 1.4
        elif implied_upside >= 7.0:
            s_targets = 0.7
        elif implied_upside >= -5.0:
            s_targets = 0.0  # fairly priced
        elif implied_upside >= -15.0:
            s_targets = -1.0
        else:
            s_targets = -2.0

    # 4. Morningstar Valuation -> [-2.0, +2.0]
    s_valuation = None
    if star_rating is not None:
        s_valuation = {5: 2.0, 4: 1.2, 3: 0.0, 2: -1.2, 1: -2.0}.get(star_rating, 0.0)
    elif discount_pct is not None:
        if discount_pct >= 20.0:
            s_valuation = 2.0
        elif discount_pct >= 8.0:
            s_valuation = 1.2
        elif discount_pct >= -8.0:
            s_valuation = 0.0
        elif discount_pct >= -20.0:
            s_valuation = -1.2
        else:
            s_valuation = -2.0

    weights = {
        "consensus": (0.35, s_consensus),
        "distribution": (0.15, s_distribution),
        "targets": (0.30, s_targets),
        "valuation": (0.20, s_valuation),
    }

    available = {k: (w, s) for k, (w, s) in weights.items() if s is not None}
    if available:
        total_w = sum(w for w, _ in available.values())
        composite_score = sum(w * s for w, s in available.values()) / total_w
    else:
        composite_score = 0.0

    composite_score = round(composite_score, 3)

    # Determine Signal (BUY / HOLD / SELL)
    if composite_score >= 0.50:
        signal = "BUY"
    elif composite_score <= -0.50:
        signal = "SELL"
    else:
        signal = "HOLD"

    # Technical Range Guardrail:
    # If stock is within 6% of 52-week high after large run-up and target upside is limited (< 8%):
    # posture is observational HOLD / wait for pullback, not aggressive new BUY entry.
    is_extended_at_high = False
    if diff_from_high is not None:
        is_extended_at_high = diff_from_high >= -0.06 or diff_from_high >= -6.0

    if is_extended_at_high and implied_upside is not None and implied_upside < 8.0 and signal == "BUY" and composite_score < 0.85:
        signal = "HOLD"

    active_scores = [s for _, s in available.values()]
    num_pillars = len(active_scores)
    has_positive = any(s >= 0.5 for s in active_scores)
    has_negative = any(s <= -0.5 for s in active_scores)
    conflict = has_positive and has_negative

    if num_pillars > 1:
        mean_s = sum(active_scores) / num_pillars
        dispersion = (sum((s - mean_s) ** 2 for s in active_scores) / num_pillars) ** 0.5
    else:
        dispersion = 1.0

    if num_pillars >= 3 and not conflict and dispersion < 0.8 and analyst_count >= 10:
        confidence = "HIGH"
    elif analyst_count >= 4 and not conflict and (num_pillars >= 2 or analyst_count >= 15):
        confidence = "MEDIUM"
    elif conflict or analyst_count < 4 or num_pillars < 2:
        confidence = "LOW"
    else:
        confidence = "MEDIUM"

    if signal == "SELL" or (implied_upside is not None and implied_upside < -10.0) or star_rating == 1:
        risk_level = "HIGH"
    elif star_rating in (4, 5) and implied_upside is not None and implied_upside >= 15.0 and not is_extended_at_high and signal == "BUY":
        risk_level = "LOW"
    else:
        risk_level = "MODERATE"

    return {
        "signal": signal,
        "confidence": confidence,
        "risk_level": risk_level,
        "composite_score": composite_score,
        "dispersion": round(dispersion, 3),
        "pillars": {k: round(s, 2) for k, (_, s) in available.items()},
        "implied_upside_pct": implied_upside,
        "star_rating": star_rating,
        "analyst_count": analyst_count,
    }


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
    if not clean_ticker:
        raise DataFetchError("Ticker symbol cannot be empty.")
    if yf is None:
        raise DataFetchError("yfinance is not installed on the server.")

    t = ticker_obj
    if t is None:
        try:
            t = session_manager.create_ticker(clean_ticker)
        except Exception as exc:
            raise DataFetchError(f"Could not reach Yahoo Finance for '{clean_ticker}': {exc}") from exc

    # Extract or fetch info dict
    if info is None:
        try:
            info = getattr(t, "info", None) or {}
        except Exception as exc:
            raise DataFetchError(f"Could not retrieve ticker information for '{clean_ticker}': {exc}") from exc

    if not info or not info.get("recommendationMean") or not info.get("symbol"):
        from data_source import fetch_universal_quote_data
        universal = fetch_universal_quote_data(clean_ticker)
        if universal:
            if not info:
                info = {}
            for k, v in universal.items():
                if v is not None and (info.get(k) is None or k in ("recommendationMean", "recommendationKey", "numberOfAnalystOpinions", "targetMeanPrice", "targetHighPrice", "targetLowPrice", "targetMedianPrice", "distribution")):
                    info[k] = v

    # Enforce that the ticker actually exists on Yahoo Finance with real market data
    has_valid_info = bool(
        info and (
            info.get("symbol")
            or info.get("regularMarketPrice") is not None
            or info.get("previousClose") is not None
            or info.get("shortName")
            or info.get("longName")
        )
    )
    if not has_valid_info and t is not None:
        try:
            fi = getattr(t, "fast_info", None)
            if fi is not None:
                last_p = getattr(fi, "last_price", None)
                if isinstance(last_p, (int, float)) and last_p > 0:
                    has_valid_info = True
                    if not info:
                        prev_c = getattr(fi, "previous_close", None)
                        info = {
                            "symbol": clean_ticker,
                            "regularMarketPrice": last_p,
                            "previousClose": prev_c if isinstance(prev_c, (int, float)) else None,
                        }
        except Exception:
            pass

    if not has_valid_info:
        raise DataFetchError(f"No market data or quote found for symbol '{clean_ticker}'. Check that the symbol is correct.")

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
        elif info.get("distribution"):
            distribution.update(info["distribution"])
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

    if not price_targets_raw or not price_targets_raw.get("mean"):
        mean_tgt = info.get("targetMeanPrice")
        if mean_tgt is not None:
            cur_p = info.get("regularMarketPrice") or info.get("currentPrice") or info.get("previousClose")
            price_targets_raw = {
                "current": cur_p,
                "mean": mean_tgt,
                "median": info.get("targetMedianPrice") or mean_tgt,
                "high": info.get("targetHighPrice") or mean_tgt,
                "low": info.get("targetLowPrice") or mean_tgt,
            }

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

    # 4. Consensus Valuation Model (star rating derived from discount/premium to analyst median PT)
    # Prefer median to reduce sensitivity to skewed bullish outlier targets; log when falling back to mean.
    if target_median:
        fair_value = target_median
    elif target_mean:
        logger.debug(
            "%s: analyst PT median unavailable, falling back to mean ($%.2f) for star rating — "
            "result may be inflated if analyst distribution is right-skewed.",
            clean_ticker, target_mean,
        )
        fair_value = target_mean
    else:
        fair_value = None
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

    # Compute unified quantitative rating
    unified = compute_unified_rating({
        "score": rec_mean,
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
        "analyst_count": analyst_count,
        "verdict": verdict,
    })

    return {
        "ticker": clean_ticker,
        "verdict": unified["signal"],
        "verdict_display": verdict_display,
        "score": rec_mean,
        "scale": "1.0 (Strong Buy) to 5.0 (Strong Sell)",
        "confidence": unified["confidence"],
        "risk_level": unified["risk_level"],
        "unified_rating": unified,
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
        "price_target_mean": target_mean,
        "price_target_low": target_low,
        "price_target_high": target_high,
        "upside_pct": implied_upside,
        "fair_value": fair_value,
        "star_rating": star_rating,
        "valuation_status": val_status,
        "discount_pct": discount_pct,
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
