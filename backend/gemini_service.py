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
import logging
import os
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional

logger = logging.getLogger("stock_ledger.gemini")

DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
FALLBACK_GEMINI_MODEL = "gemini-1.5-flash"
API_TIMEOUT_SECONDS = 15


def is_gemini_configured() -> bool:
    """Returns True if the GEMINI_API_KEY environment variable is present and non-empty."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return bool(key)


def get_gemini_api_key() -> str:
    """Returns the cleaned GEMINI_API_KEY from environment."""
    return os.getenv("GEMINI_API_KEY", "").strip()


def _call_gemini_api(
    prompt: str,
    system_instruction: str,
    temperature: float = 0.2,
    model_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Executes a direct HTTP request to the Google Generative Language REST API.
    Enforces structured JSON output and strict response parsing.
    """
    api_key = get_gemini_api_key()
    if not api_key:
        return {
            "success": False,
            "configured": False,
            "error": "GEMINI_API_KEY is not configured in environment variables.",
        }

    target_model = model_name or DEFAULT_GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={api_key}"

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
        },
    }

    req_data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=req_data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=API_TIMEOUT_SECONDS) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            candidates = data.get("candidates", [])
            if not candidates:
                return {
                    "success": False,
                    "configured": True,
                    "error": "No response candidate returned by Gemini API.",
                }

            text_output = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            if not text_output:
                return {
                    "success": False,
                    "configured": True,
                    "error": "Empty text response from Gemini API.",
                }

            try:
                parsed_json = json.loads(text_output)
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
        err_msg = http_err.read().decode("utf-8", errors="ignore")
        logger.error(f"Gemini API HTTP {http_err.code}: {err_msg}")
        # If the primary model returns 404 and is not the fallback, attempt fallback model once
        if http_err.code == 404 and target_model != FALLBACK_GEMINI_MODEL:
            logger.info(f"Retrying Gemini call with fallback model: {FALLBACK_GEMINI_MODEL}")
            return _call_gemini_api(prompt, system_instruction, temperature, model_name=FALLBACK_GEMINI_MODEL)

        return {
            "success": False,
            "configured": True,
            "error": f"Gemini API error ({http_err.code}): {err_msg[:200]}",
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
"""


def analyze_ticker_with_gemini(ticker_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates an institutional AI research perspective for a single ticker.
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

    review_verdict = signal_review.get("verdict", "UNRATED")
    review_score = signal_review.get("score")
    analyst_count = signal_review.get("analyst_count")
    price_target_mean = signal_review.get("price_target_mean")
    price_target_low = signal_review.get("price_target_low")
    price_target_high = signal_review.get("price_target_high")
    upside_pct = signal_review.get("upside_pct")
    star_rating = signal_review.get("star_rating")
    fair_value = signal_review.get("fair_value")

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
- Refinitiv / Wall St Consensus: {review_verdict} (Score: {score_str}/5.0 based on {analyst_count or 0} analysts)
- Target Price: Mean ${price_target_mean} (Low: ${price_target_low}, High: ${price_target_high})
- Target Upside: {upside_str}
- Morningstar Star Rating: {f'{star_rating} / 5 Stars' if star_rating else 'Unrated'}
- Fair Value Estimate: ${fair_value if fair_value else 'N/A'}

Format your entire response strictly as valid JSON matching the requested schema.
"""

    return _call_gemini_api(prompt, TICKER_SUGGESTION_SYSTEM_PROMPT, temperature=0.15)


WATCHLIST_BRIEFING_SYSTEM_PROMPT = """
You are a senior macro and equity portfolio strategist for SignalLedger.
Your mission is to evaluate a multi-ticker watchlist basket and produce an executive-level market briefing and daily focus watch.

STRICT REGULATORY & FINANCIAL COMPLIANCE GUARDRAILS:
1. Provide individualized investment advice or portfolio construction rules.
2. Specify dollar amounts, allocation percentages, or share numbers.
3. State that any trade is guaranteed to win or risk-free.
4. Frame candidate recommendations strictly as 'Watchlist Focus Ideas' based on observable technical and consensus setups.
5. Include explicit downside risk caveats.

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
      "risk_level": "LOW" | "MODERATE" | "HIGH"
    }
  ],
  "macro_risks": [
    "Risk 1: Dominant market, interest rate, or cyclical headwind affecting the basket",
    "Risk 2: Technical dispersion or valuation headwind"
  ],
  "disclaimer": "AI-generated watchlist overview for educational and informational purposes only. Not personalized financial advice. Past range performance does not guarantee future results."
}
"""


def analyze_watchlist_with_gemini(watchlist_items: List[Dict[str, Any]]) -> Dict[str, Any]:
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
        sig = m.get("signal_review", {}).get("verdict") or m.get("signal") or "UNRATED"
        diff_low = m.get("diff_from_latest_low_pct")
        diff_high = m.get("diff_from_latest_high_pct")
        move_yr = m.get("best_move_year_pct")
        upside = m.get("signal_review", {}).get("upside_pct")

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

    basket_text = "\n".join(ticker_summaries)
    prompt = f"""
Evaluate the following portfolio watchlist basket of {len(ticker_summaries)} assets and generate an executive-level market sentiment briefing and top focus ideas for today's session:

WATCHLIST BASKET:
{basket_text}

Select 2 to 4 of the most compelling or distinct focus candidates across the basket (balance between high-conviction setups and notable risk alerts).
Format your entire output strictly as JSON according to your system prompt instructions.
"""

    return _call_gemini_api(prompt, WATCHLIST_BRIEFING_SYSTEM_PROMPT, temperature=0.2)
