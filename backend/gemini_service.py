"""
Gemini AI service module for SignalLedger.

Provides:
- Single-ticker AI suggestion (safe Buy/Sell/Hold, timing analysis, qualitative action posture)
- Watchlist-wide sentiment briefing (market tone, sector risks, daily focus ideas)
- Strict compliance guardrails: No personalized advice, no share counts, no dollar amounts
- Secure configuration via GEMINI_API_KEY environment variable (standard on Render)
"""

from __future__ import annotations

import json
import socket
import logging
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

from cache_manager import cache_manager
from signal_review import fetch_signal_review, compute_unified_rating

logger = logging.getLogger("stock_ledger.gemini")

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
MODELS_CASCADE = ["gemini-2.5-flash", "gemini-3.6-flash", "gemini-flash-latest"]
API_TIMEOUT_SECONDS = 45          # Single-ticker analysis
WATCHLIST_TIMEOUT_SECONDS = 45   # Watchlist briefing (larger prompt + multi-ticker context)


def is_gemini_configured() -> bool:
    """Returns True if the AI_API_KEY or GEMINI_API_KEY environment variable is present and non-empty."""
    key = os.getenv("AI_API_KEY", "").strip() or os.getenv("GEMINI_API_KEY", "").strip()
    return bool(key)


def get_gemini_api_key() -> str:
    """Returns the cleaned AI_API_KEY or GEMINI_API_KEY from environment."""
    return os.getenv("AI_API_KEY", "").strip() or os.getenv("GEMINI_API_KEY", "").strip()


def _call_gemini_api(
    prompt: str,
    system_instruction: str,
    temperature: float = 0.2,
    model_name: Optional[str] = None,
    attempted_models: Optional[List[str]] = None,
    timeout: int = API_TIMEOUT_SECONDS,
) -> Dict[str, Any]:
    """
    Executes a direct HTTP request to the Google Generative Language REST API.
    Enforces structured JSON output, resilient model fallback cascade, and strict response parsing.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return {
            "success": False,
            "configured": False,
            "error": "AI API key is not configured in environment variables.",
        }

    if attempted_models is None:
        attempted_models = []

    target_model = model_name or DEFAULT_GEMINI_MODEL
    attempted_models.append(target_model)

    # Pass API key via secure x-goog-api-key header rather than exposing in URL parameter
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent"

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            candidates = data.get("candidates", [])
            if not candidates:
                return {
                    "success": False,
                    "configured": True,
                    "error": "No response candidate returned by AI service.",
                }

            parts = (candidates[0].get("content") or {}).get("parts", [])
            text_output = ""
            for part in parts:
                if isinstance(part, dict) and "text" in part:
                    if part.get("thought") and len(parts) > 1:
                        continue
                    text_output = part["text"]
                    if not part.get("thought"):
                        break

            if not text_output:
                return {
                    "success": False,
                    "configured": True,
                    "error": "Empty text response from AI service.",
                }

            clean_text = text_output.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()

            try:
                parsed_json = json.loads(clean_text)
                return {"success": True, "configured": True, "data": parsed_json, "model": target_model}
            except json.JSONDecodeError as json_err:
                logger.warning(f"Failed to parse Gemini output as JSON: {json_err}. Raw: {text_output[:200]}")
                return {
                    "success": False,
                    "configured": True,
                    "error": "AI response was not valid JSON.",
                    "raw_text": text_output,
                }

    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode("utf-8", errors="ignore")
        logger.warning(f"Gemini API HTTP {http_err.code} on model {target_model}: {err_body[:200]}")

        # Try next available model in cascade for retryable errors (404, 503, 429)
        if http_err.code in (404, 503, 429):
            next_model = next((m for m in MODELS_CASCADE if m not in attempted_models), None)
            if next_model:
                logger.info(f"Retrying Gemini call with fallback model: {next_model}")
                return _call_gemini_api(
                    prompt,
                    system_instruction,
                    temperature,
                    model_name=next_model,
                    attempted_models=attempted_models,
                    timeout=timeout,
                )

        parsed_err = None
        try:
            err_json = json.loads(err_body)
            parsed_err = (err_json.get("error") or {}).get("message") if isinstance(err_json, dict) else None
        except Exception:
            pass
        clean_msg = parsed_err or err_body.strip() or f"HTTP {http_err.code}"

        return {
            "success": False,
            "configured": True,
            "error": f"AI service error ({http_err.code}): {clean_msg}",
        }
    except (TimeoutError, socket.timeout, urllib.error.URLError) as exc:
        is_timeout = isinstance(exc, (TimeoutError, socket.timeout)) or "timed out" in str(exc).lower()
        if is_timeout:
            logger.warning(f"Gemini API timed out on model {target_model} after {timeout}s: {exc}")
            next_model = next((m for m in MODELS_CASCADE if m not in attempted_models), None)
            if next_model:
                logger.info(f"Retrying timed-out Gemini call with fallback model: {next_model}")
                return _call_gemini_api(
                    prompt,
                    system_instruction,
                    temperature,
                    model_name=next_model,
                    attempted_models=attempted_models,
                    timeout=timeout,
                )
            return {
                "success": False,
                "configured": True,
                "error": "AI service timed out. Please try again in a moment.",
            }
        else:
            logger.warning(f"Gemini API connection error on model {target_model}: {exc}")
            return {
                "success": False,
                "configured": True,
                "error": f"Connection error: {str(exc)}",
            }
    except Exception as exc:
        logger.error(f"Unexpected error calling Gemini API: {exc}")
        return {
            "success": False,
            "configured": True,
            "error": f"Connection error: {str(exc)}",
        }


TICKER_SUGGESTION_SYSTEM_PROMPT = """
You are a senior quantitative equity research analyst for SignalLedger.
Your mission is to synthesize live market data, sequential rally metrics, and institutional consensus into a safe, objective observational briefing.

STRICT REGULATORY & FINANCIAL COMPLIANCE GUARDRAILS:
1. Provide direct, individualized, or fiduciary investment advice.
2. Prescribe exact position sizes, dollar amounts, share quantities, or portfolio leverage.
3. State guarantees of future performance, price targets, or certainty.
4. Frame all conclusions as scenario observations and educational analytical perspectives.
5. Emphasize risk asymmetry, downside invalidation levels, and capital preservation.

OUTPUT SCHEMA (Strict JSON):
{
  "signal": "BUY" | "HOLD" | "SELL" | "NEUTRAL",
  "risk_level": "LOW" | "MODERATE" | "HIGH",
  "confidence": "HIGH" | "MODERATE" | "LOW",
  "posture": "Short 3-6 word qualitative posture (e.g. 'Patience / Wait for Confirmation', 'Scale-In on Dips', 'Hold Core Position', 'Cautious / Prune Strength')",
  "timing_rationale": "2-3 concise sentences explaining why the timing of this entry or exit matters right now (e.g. proximity to 52-week support/resistance, sequential cycle extension, valuation premium/discount, or analyst target skew).",
  "action_perspective": "1-2 sentences giving qualitative guidance on what level of action is reasonable without giving any share quantities or dollar amounts (e.g. 'Staggering entries in smaller tranches allows tracking support without overcommitting ahead of resistance').",
  "key_drivers": [
    "Driver 1: Concise positive or technical catalyst",
    "Driver 2: Fundamental or consensus factor",
    "Driver 3: Sequence or range observation"
  ],
  "risk_catalysts": [
    "Risk 1: Primary downside invalidation or technical break point",
    "Risk 2: Macro, sector, or earnings vulnerability"
  ],
  "disclaimer": "AI-generated observational market perspective for educational purposes only. Not personalized financial, investment, or legal advice. Capital is at risk."
}

RISK LEVEL & CONFIDENCE EVALUATION RULES:
- "risk_level": "LOW" applies ONLY when the asset trades near established support/lows with significant upside skew (>12%) and no signs of cycle exhaustion.
- "risk_level": "MODERATE" applies when the stock is mid-range, consolidating, or trading near 52-week highs (within 5-8%) where a pullback or stall is normal.
- "risk_level": "HIGH" applies when extended (>25% from 52W low) without price target buffer, overbought, or facing immediate resistance.
- "confidence": "HIGH" requires strong alignment between technical structure and consensus upside.
- "confidence": "MODERATE" applies when data is mixed, upside is limited, or the stock is near cycle highs requiring patience.
- "confidence": "LOW" applies when vital metrics are unrated or missing.
- CRITICAL CONSISTENCY: A "HOLD" or "NEUTRAL" signal (wait for confirmation / pullback) CANNOT be "Risk: LOW". If holding or waiting, entry risk is at least "MODERATE".
"""


def analyze_ticker_with_gemini(ticker_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates an institutional AI research perspective for a single ticker.
    Anchors signal, confidence, and risk level strictly to the deterministic
    quantitative formula from real Wall Street, price target, and Morningstar inputs.
    """

    ticker = ticker_payload.get("ticker", "").upper()
    company = ticker_payload.get("company_name") or ticker
    latest_close = ticker_payload.get("latest_close")
    latest_low = ticker_payload.get("latest_low")
    diff_low_pct = ticker_payload.get("diff_from_latest_low_pct")
    latest_high = ticker_payload.get("latest_high")
    diff_high_pct = ticker_payload.get("diff_from_latest_high_pct")
    all_time_low = ticker_payload.get("all_time_low")
    all_time_high = ticker_payload.get("all_time_high")
    best_move_yr = ticker_payload.get("best_move_year_pct")
    best_move_at = ticker_payload.get("best_move_alltime_pct")
    signal_review = ticker_payload.get("signal_review") or {}

    # Extract price targets & valuation safely from both nested and top-level keys
    price_targets = signal_review.get("price_targets") or {}
    valuation = signal_review.get("valuation") or {}

    price_target_mean = price_targets.get("mean") or signal_review.get("price_target_mean")
    price_target_low = price_targets.get("low") or signal_review.get("price_target_low")
    price_target_high = price_targets.get("high") or signal_review.get("price_target_high")
    upside_pct = price_targets.get("implied_upside_pct") if price_targets.get("implied_upside_pct") is not None else signal_review.get("upside_pct")
    star_rating = valuation.get("star_rating") or signal_review.get("star_rating")
    fair_value = valuation.get("fair_value") or signal_review.get("fair_value")
    review_score = signal_review.get("score")
    analyst_count = signal_review.get("analyst_count") or 0
    review_verdict = signal_review.get("verdict", "UNRATED")

    # Compute deterministic unified quantitative rating
    tech_context = {
        "latest_close": latest_close,
        "diff_from_latest_high_pct": diff_high_pct,
        "diff_from_latest_low_pct": diff_low_pct,
    }
    unified = signal_review.get("unified_rating")
    if not unified or not isinstance(unified, dict):
        unified = compute_unified_rating(signal_review, technical_metrics=tech_context)

    target_signal = unified.get("signal", "HOLD")
    target_confidence = unified.get("confidence", "MEDIUM")
    target_risk = unified.get("risk_level", "MODERATE")

    diff_low_str = f"{diff_low_pct:+.2f}%" if diff_low_pct is not None else "N/A"
    diff_high_str = f"{diff_high_pct:+.2f}%" if diff_high_pct is not None else "N/A"
    upside_str = f"{upside_pct:+.2f}%" if upside_pct is not None else "N/A"
    score_str = f"{review_score:.2f}" if review_score is not None else "N/A"

    prompt = f"""
Analyze the following asset and provide an observational trade perspective adhering to your strict compliance guardrails:

ASSET DETAILS:
- Symbol: {ticker} ({company})
- Latest Close Price: ${latest_close}
- 52-Week Range: Low ${latest_low} ({diff_low_str} from low) | High ${latest_high} ({diff_high_str} from high)
- All-Time Range: Low ${all_time_low} | High ${all_time_high}
- Best Sequential Move (Year): {f'{best_move_yr:.2f}%' if best_move_yr is not None else 'N/A'}
- Best Sequential Move (All-Time): {f'{best_move_at:.2f}%' if best_move_at is not None else 'N/A'}

INSTITUTIONAL CONSENSUS:
- Refinitiv / Wall St Consensus: {review_verdict} (Score: {score_str}/5.0 based on {analyst_count} analysts)
- Target Price: Mean ${price_target_mean} (Low: ${price_target_low}, High: ${price_target_high})
- Target Upside: {upside_str}
- Morningstar Star Rating: {f'{star_rating} / 5 Stars' if star_rating else 'Unrated'}
- Fair Value Estimate: ${fair_value if fair_value else 'N/A'}

QUANTITATIVE SIGNAL GROUND TRUTH (MANDATORY):
- Unified Signal: {target_signal}
- Derived Confidence: {target_confidence}
- Derived Risk Level: {target_risk}
- Quantitative Score: {unified.get('composite_score', 0.0):+.2f}

Your task is to provide objective observational commentary (posture, timing_rationale, action_perspective) that directly explains and interprets this quantitative ground truth. Do NOT generate or suggest a conflicting signal, confidence, or risk level.
Format your entire response strictly as valid JSON matching the requested schema.
"""

    res = _call_gemini_api(prompt, TICKER_SUGGESTION_SYSTEM_PROMPT, temperature=0.15)
    if res.get("success") and res.get("data"):
        data = res["data"]
        # Hard lock output to the deterministic quantitative ground truth
        data["signal"] = target_signal
        data["confidence"] = target_confidence
        data["risk_level"] = target_risk
        data["composite_score"] = unified.get("composite_score", 0.0)
        data["pillars"] = unified.get("pillars", {})
        data["unified_rating"] = unified

        # Cache this verified result
        cache_manager.set(f"gemini:ticker:{ticker}", res, ttl_seconds=3600)
    return res


WATCHLIST_BRIEFING_SYSTEM_PROMPT = """
You are a senior macro and equity portfolio strategist for SignalLedger.
Your mission is to evaluate a multi-ticker watchlist basket and produce an executive-level market briefing and daily focus watch.

STRICT REGULATORY & FINANCIAL COMPLIANCE GUARDRAILS:
1. Provide individualized investment advice or portfolio construction rules.
2. Specify dollar amounts, allocation percentages, or share numbers.
3. State that any trade is guaranteed to win or risk-free.
4. Frame candidate recommendations strictly as 'Watchlist Focus Ideas' based on observable technical and consensus setups.
5. Include explicit downside risk caveats.

RISK & CONFIDENCE CONSISTENCY RULES (MANDATORY):
- "risk_level": "LOW" must ONLY be assigned to setups near verified support bases with favorable asymmetric upside.
- NEVER assign "risk_level": "LOW" and "confidence": "HIGH" to a stock trading near its 52-week or all-time highs (e.g. JPM, mature rally leaders). Stocks near historical peaks face immediate resistance and have "MODERATE" or "HIGH" risk for new entries.
- If a stock is in a mature rally or consolidating near highs (like JPM or mega-cap leaders), assign "risk_level": "MODERATE" and "confidence": "MEDIUM" (reflecting a HOLD/wait posture).
- For market_opportunities: Suggest only genuinely notable setups. Ensure the risk_level and confidence accurately reflect technical extension.

OUTPUT SCHEMA (Strict JSON):
{
  "overall_sentiment": "BULLISH" | "NEUTRAL" | "CAUTIOUS" | "DEFENSIVE",
  "sentiment_score": 1.0 to 5.0 (where 1.0 is extremely defensive, 3.0 neutral, 5.0 broad bullishness),
  "market_briefing": "2-3 concise sentences summarizing overarching trends across the basket (e.g. rally momentum, range consolidation, tech divergence, or defensive rotation).",
  "focus_trades": [
    {
      "ticker": "SYMBOL",
      "rating": "BUY" | "HOLD" | "WATCH" | "TRIM",
      "setup_type": "e.g. Favorable Support Rebound, Momentum Breakout, Overextended Range",
      "rationale": "1-2 sentences on why this ticker is noteworthy today based on its range metrics and consensus.",
      "timing_note": "Short observation on timing sensitivity (e.g. Near 52W low, Approaching earnings, At historical resistance).",
      "risk_level": "LOW" | "MODERATE" | "HIGH",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "confidence_score": 0.0 to 1.0 (internal certainty score of the setup, e.g. 0.85)
    }
  ],
  "macro_risks": [
    "Risk 1: Dominant market, interest rate, or cyclical headwind affecting the basket",
    "Risk 2: Technical dispersion or valuation headwind"
  ],
  "market_opportunities": [
    {
      "ticker": "SYMBOL (must NOT be in the user's watchlist)",
      "rating": "BUY" | "HOLD" | "WATCH" | "SELL",
      "risk_level": "LOW" | "MODERATE" | "HIGH",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "rationale": "1-2 sentences on why this stock is technically notable in the current market environment based on publicly observable setups and broad consensus."
    }
  ],
  "disclaimer": "AI-generated watchlist overview for educational and informational purposes only. Not personalized financial advice. Past range performance does not guarantee future results."
}
"""


def analyze_watchlist_with_gemini(watchlist_items: List[Dict[str, Any]], filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Generates an executive briefing across all tickers in the watchlist.
    """
    if not watchlist_items:
        return {
            "success": False,
            "configured": True,
            "error": "Watchlist is empty. Add tickers before generating a briefing.",
        }

    # Prepare compact summary of up to 30 watchlist items
    ticker_summaries = []
    for item in watchlist_items[:30]:
        sym = item.get("ticker", "").upper()
        name = item.get("companyName", "")
        m = item.get("metrics") or {}
        close = m.get("latest_close")
        sig_rev = m.get("signal_review") or {}
        sig = sig_rev.get("verdict") or m.get("signal") or "UNRATED"
        diff_low = m.get("diff_from_latest_low_pct")
        diff_high = m.get("diff_from_latest_high_pct")
        move_yr = m.get("best_move_year_pct")
        upside = sig_rev.get("upside_pct")

        summary_line = f"- {sym} ({name}): Close ${close}, Signal: {sig}"
        if diff_low is not None:
            summary_line += f", {diff_low:+.1f}% from 52W Low"
        if diff_high is not None:
            summary_line += f", {diff_high:+.1f}% from 52W High"
        if upside is not None:
            summary_line += f", Target Upside: {upside:+.1f}%"
        if move_yr is not None:
            summary_line += f", Best Move Yr: {move_yr:.1f}%"
        ticker_summaries.append(summary_line)

    watchlist_tickers = [item.get("ticker", "").upper() for item in watchlist_items if item.get("ticker")]
    excluded_tickers_str = ", ".join(watchlist_tickers)
    basket_text = "\n".join(ticker_summaries)

    filter_instructions = []
    if filters and isinstance(filters, dict):
        risk_f = [r.upper() for r in filters.get("risk", []) if r]
        conf_f = [c.upper().replace("MODERATE", "MEDIUM") for c in filters.get("confidence", []) if c]
        rating_f = [rt.upper() for rt in filters.get("rating", []) if rt]

        if risk_f:
            filter_instructions.append(f"- ONLY return market_opportunities with risk_level in: {', '.join(risk_f)}")
        if conf_f:
            filter_instructions.append(f"- ONLY return market_opportunities with confidence in: {', '.join(conf_f)}")
        if rating_f:
            filter_instructions.append(f"- ONLY return market_opportunities with rating in: {', '.join(rating_f)}")

    if filter_instructions:
        joined_filters = "\n".join(filter_instructions)
        opps_filter_instruction = f"""Select 4–8 focus_ideas from the watchlist basket (balance high-conviction setups with notable risk alerts).

USER FILTER CONSTRAINTS FOR market_opportunities:
{joined_filters}
- If these filter constraints make the candidate pool narrow, you may return fewer candidates (down to a minimum of 2) rather than violating the filter to hit a quota.
- Still enforce all risk & confidence harmonization rules. Exclude all watchlist tickers listed above."""
    else:
        opps_filter_instruction = "Select 4–8 focus_ideas from the watchlist basket (balance high-conviction setups with notable risk alerts). Select 4–8 market_opportunities from the broader market, excluding all watchlist tickers listed above."
    prompt = f"""
Evaluate the following portfolio watchlist basket of {len(ticker_summaries)} assets and generate an executive-level market sentiment briefing and top focus ideas for today's session.

WATCHLIST BASKET:
{basket_text}

WATCHLIST TICKERS (already tracked by the user — EXCLUDE these from market_opportunities):
{excluded_tickers_str}

## SELECTION CRITERIA
For BOTH focus_ideas and market_opportunities, prioritize stocks that show:
1. **Confirmed trend strength** — price above key moving averages (20/50-day), positive momentum (not just a single-day spike).
2. **Favorable entry point** — trading near a support level, pullback, or consolidation base rather than extended far above recent highs. Do NOT recommend high confidence on names that are overbought or near all-time highs with no pullback.
3. **Asymmetric risk/reward** — meaningful upside to target vs. limited downside to nearest support/stop level.
4. A real catalyst or fundamental driver (earnings, sector rotation, analyst upgrades, macro tailwind) — not just chart pattern alone.

{opps_filter_instruction}

## RISK & CONFIDENCE — STRICT HARMONIZATION RULES
`risk_level` and `confidence` must reflect the SAME underlying technical/fundamental picture — they are never independent:

| Technical Position | risk_level | confidence |
|---|---|---|
| Near all-time high / extended momentum, no clear pullback | MODERATE or HIGH | MEDIUM |
| At a favorable base/support with asymmetric upside | LOW | HIGH |
| Choppy, unclear trend, or mixed signals | MODERATE | LOW or MEDIUM |

`confidence` specifically measures: **conviction in the stated rating (Buy/Hold/Sell) given the current setup** — not a separate or unrelated metric. Never output LOW risk + HIGH confidence for a stock that is extended/at highs — this combination is only valid at a favorable base entry.

Before finalizing each entry, self-check: does the risk_level logically match the confidence and the stated rating? If not, revise until consistent.

## OUTPUT
Format your entire output strictly as JSON according to your system prompt instructions.
"""

    res = _call_gemini_api(prompt, WATCHLIST_BRIEFING_SYSTEM_PROMPT, temperature=0.2, timeout=WATCHLIST_TIMEOUT_SECONDS)
    if res.get("success") and res.get("data"):
        data = res["data"]
        
        from concurrent.futures import ThreadPoolExecutor

        # 1. Reconcile focus_trades with deterministic unified ratings
        wl_map = {item.get("ticker", "").upper(): item for item in watchlist_items if item.get("ticker")}
        focus_trades = data.get("focus_trades") or []
        for trade in focus_trades:
            sym = (trade.get("ticker") or "").strip().upper()
            if not sym:
                continue

            item = wl_map.get(sym)
            if item:
                m = item.get("metrics") or {}
                sig_rev = m.get("signal_review") or {}
                tech_m = {
                    "latest_close": m.get("latest_close"),
                    "diff_from_latest_high_pct": m.get("diff_from_latest_high_pct"),
                    "diff_from_latest_low_pct": m.get("diff_from_latest_low_pct"),
                }
                unified = sig_rev.get("unified_rating")
                if not unified:
                    unified = compute_unified_rating(sig_rev, technical_metrics=tech_m)

                trade["rating"] = unified["signal"]
                trade["risk_level"] = unified["risk_level"]
                trade["confidence"] = unified["confidence"]
                trade["confidence_score"] = 0.85 if unified["confidence"] == "HIGH" else (0.65 if unified["confidence"] == "MEDIUM" else 0.40)
            else:
                cached_ticker = cache_manager.get(f"gemini:ticker:{sym}")
                if cached_ticker and cached_ticker.get("success"):
                    t_data = cached_ticker.get("data", {})
                    trade["rating"] = t_data.get("signal", trade.get("rating", "HOLD"))
                    trade["risk_level"] = t_data.get("risk_level", trade.get("risk_level", "MODERATE"))
                    trade["confidence"] = t_data.get("confidence", trade.get("confidence", "MEDIUM"))

        # 2. Reconcile market_opportunities with verified institutional data & unified scoring
        opps = data.get("market_opportunities") or []
        unique_opp_tickers = []
        for opp in opps:
            s = (opp.get("ticker") or "").strip().upper()
            if s and s not in watchlist_tickers and s not in unique_opp_tickers:
                unique_opp_tickers.append(s)

        # Batch resolve signal reviews concurrently
        def get_or_fetch_review(sym_to_fetch):
            cached = cache_manager.get(f"signal_review:{sym_to_fetch}")
            if cached:
                return sym_to_fetch, cached
            try:
                r = fetch_signal_review(sym_to_fetch)
                cache_manager.set(f"signal_review:{sym_to_fetch}", r, ttl_seconds=3600)
                return sym_to_fetch, r
            except Exception:
                return sym_to_fetch, None

        opp_reviews = {}
        if unique_opp_tickers:
            try:
                with ThreadPoolExecutor(max_workers=min(len(unique_opp_tickers), 5)) as ex:
                    for s_res, rev in ex.map(get_or_fetch_review, unique_opp_tickers):
                        if rev:
                            opp_reviews[s_res] = rev
            except Exception:
                pass

        reconciled_opps = []
        for opp in opps:
            sym = (opp.get("ticker") or "").strip().upper()
            if not sym or sym in watchlist_tickers:
                continue

            rev = opp_reviews.get(sym)
            if rev:
                unified = rev.get("unified_rating") or compute_unified_rating(rev)
                opp["rating"] = unified["signal"]
                opp["risk_level"] = unified["risk_level"]
                opp["confidence"] = unified["confidence"]
                opp["composite_score"] = unified.get("composite_score", 0.0)
            else:
                cached_ticker = cache_manager.get(f"gemini:ticker:{sym}")
                if cached_ticker and cached_ticker.get("success"):
                    t_data = cached_ticker.get("data", {})
                    opp["rating"] = t_data.get("signal", "BUY")
                    opp["risk_level"] = t_data.get("risk_level", "MODERATE")
                    opp["confidence"] = t_data.get("confidence", "MEDIUM")
                else:
                    raw_rating = (opp.get("rating") or "HOLD").upper()
                    if raw_rating not in ("BUY", "HOLD", "WATCH", "SELL"):
                        raw_rating = "HOLD"
                    opp["rating"] = raw_rating
                    opp["risk_level"] = (opp.get("risk_level") or "MODERATE").upper()
                    opp["confidence"] = (opp.get("confidence") or "MEDIUM").upper().replace("MODERATE", "MEDIUM")

            reconciled_opps.append(opp)

        if filters and isinstance(filters, dict):
            risk_f = [r.upper() for r in filters.get("risk", []) if r]
            conf_f = [c.upper().replace("MODERATE", "MEDIUM") for c in filters.get("confidence", []) if c]
            rating_f = [rt.upper() for rt in filters.get("rating", []) if rt]

            filtered_opps = []
            for opp in reconciled_opps:
                if risk_f and (opp.get("risk_level") or "").upper() not in risk_f:
                    continue
                if conf_f and (opp.get("confidence") or "").upper().replace("MODERATE", "MEDIUM") not in conf_f:
                    continue
                if rating_f and (opp.get("rating") or "").upper() not in rating_f:
                    continue
                filtered_opps.append(opp)
            reconciled_opps = filtered_opps

        data["market_opportunities"] = reconciled_opps


    return res
