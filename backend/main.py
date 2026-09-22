"""
FastAPI backend for SignalLedger.

Endpoints
---------
GET  /api/analyze            live Yahoo Finance fetch + full analysis
POST /api/analyze/upload     same analysis, from an uploaded history CSV
GET  /api/health             liveness check

Everything under /  (besides /api/*) serves the static frontend.
"""

from __future__ import annotations

import os
import time
import urllib.parse

import pandas as pd
from fastapi import Body, FastAPI, File, HTTPException, Query, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from analysis import monthly_analysis, sequential_max_gain, yearly_analysis
from cache_manager import CacheTier, cache_manager
from data_source import (
    DataFetchError,
    fetch_from_yahoo,
    fetch_live_quote,
    fetch_similar_stocks,
    fetch_ticker_metadata_bundle,
    fetch_ticker_quote_details,
    parse_uploaded_csv,
)
from export import build_pdf, build_xlsx
from session_manager import session_manager
from signal_review import fetch_signal_review
from gemini_service import (
    DEFAULT_GEMINI_MODEL,
    analyze_ticker_with_gemini,
    analyze_watchlist_with_gemini,
    is_gemini_configured,
)

app = FastAPI(title="SignalLedger API")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalysisResponse(BaseModel):
    ticker: str
    source: str
    range_start: str
    range_end: str
    trading_days: int
    latest_close: float
    latest_low: float | None = None
    latest_low_date: str | None = None
    diff_from_latest_low: float | None = None
    diff_from_latest_low_pct: float | None = None
    latest_high: float | None = None
    latest_high_date: str | None = None
    diff_from_latest_high: float | None = None
    diff_from_latest_high_pct: float | None = None
    all_time_low: float | None = None
    diff_from_all_time_low: float | None = None
    diff_from_all_time_low_pct: float | None = None
    all_time_high: float | None = None
    diff_from_all_time_high: float | None = None
    diff_from_all_time_high_pct: float | None = None
    yearly: list[dict]
    monthly: list[dict]
    best_move_overall: dict | None
    best_move_current_year: dict | None
    price_history: list[dict]
    quote_details: dict[str, str] | None = None
    similar_stocks: list[str] = []
    company_name: str | None = None
    signal_review: dict | None = None



def _build_response(
    df: pd.DataFrame,
    ticker: str,
    source: str,
    years: int,
    months: int,
    quote_details: dict[str, str] | None = None,
    similar_stocks: list[str] | None = None,
    company_name: str | None = None,
    all_time_high: float | None = None,
    all_time_low: float | None = None,
    signal_review: dict | None = None,
) -> AnalysisResponse:
    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="Historical dataset is empty.")
    if "Date" not in df.columns or "Close" not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required columns ('Date', 'Close') in dataset.")
    df = df.sort_values("Date").reset_index(drop=True)
    current_year = int(df["Date"].max().year)
    current_year_df = df[df["Date"].dt.year == current_year]

    latest_close = float(df.iloc[-1]["Close"])
    yearly = yearly_analysis(df, num_years=years)

    # Calculate difference from the current year's lowest and highest values
    current_year_stats = yearly[-1] if yearly else None
    if current_year_stats and "low" in current_year_stats:
        latest_low = float(current_year_stats["low"]["price"])
        latest_low_date = current_year_stats["low"]["date"]
    else:
        latest_low = float(df.iloc[-1]["Low"]) if "Low" in df.columns else latest_close
        latest_low_date = df.iloc[-1]["Date"].isoformat()

    diff_from_low = latest_close - latest_low
    diff_from_low_pct = (diff_from_low / latest_low * 100.0) if latest_low > 0 else 0.0

    if current_year_stats and "high" in current_year_stats:
        latest_high = float(current_year_stats["high"]["price"])
        latest_high_date = current_year_stats["high"]["date"]
    else:
        latest_high = float(df.iloc[-1]["High"]) if "High" in df.columns else latest_close
        latest_high_date = df.iloc[-1]["Date"].isoformat()

    diff_from_high = latest_close - latest_high
    diff_from_high_pct = (diff_from_high / latest_high * 100.0) if latest_high > 0 else 0.0

    # Calculate All-Time High and Low
    df_max_high = float(df["High"].max()) if "High" in df.columns and not df["High"].empty else latest_close
    df_min_low = float(df["Low"].min()) if "Low" in df.columns and not df["Low"].empty else latest_close

    if all_time_high is not None and not pd.isna(all_time_high) and float(all_time_high) > 0:
        ath = max(float(all_time_high), df_max_high)
    else:
        ath = df_max_high

    if all_time_low is not None and not pd.isna(all_time_low) and float(all_time_low) > 0:
        atl = min(float(all_time_low), df_min_low)
    else:
        atl = df_min_low

    diff_from_atl = latest_close - atl
    diff_from_atl_pct = (diff_from_atl / atl * 100.0) if atl > 0 else 0.0

    diff_from_ath = latest_close - ath
    diff_from_ath_pct = (diff_from_ath / ath * 100.0) if ath > 0 else 0.0

    price_history = [
        {
            "date": row["Date"].isoformat(),
            "close": float(row["Close"]),
            "high": float(row["High"]),
            "low": float(row["Low"]),
            "volume": float(row["Volume"]) if "Volume" in row and pd.notna(row["Volume"]) else 0.0,
        }
        for _, row in df.iterrows()
    ]

    return AnalysisResponse(
        ticker=ticker.upper(),
        source=source,
        range_start=df["Date"].min().isoformat(),
        range_end=df["Date"].max().isoformat(),
        trading_days=len(df),
        latest_close=latest_close,
        latest_low=latest_low,
        latest_low_date=latest_low_date,
        diff_from_latest_low=round(diff_from_low, 2),
        diff_from_latest_low_pct=round(diff_from_low_pct, 2),
        latest_high=latest_high,
        latest_high_date=latest_high_date,
        diff_from_latest_high=round(diff_from_high, 2),
        diff_from_latest_high_pct=round(diff_from_high_pct, 2),
        all_time_low=round(atl, 2) if atl >= 1 else round(atl, 4),
        diff_from_all_time_low=round(diff_from_atl, 2),
        diff_from_all_time_low_pct=round(diff_from_atl_pct, 2),
        all_time_high=round(ath, 2) if ath >= 1 else round(ath, 4),
        diff_from_all_time_high=round(diff_from_ath, 2),
        diff_from_all_time_high_pct=round(diff_from_ath_pct, 2),
        yearly=yearly,
        monthly=monthly_analysis(df, num_months=months),
        best_move_overall=sequential_max_gain(df),
        best_move_current_year=sequential_max_gain(current_year_df),
        price_history=price_history,
        quote_details=quote_details,
        similar_stocks=similar_stocks or [],
        company_name=company_name,
        signal_review=signal_review,
    )


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/cache/stats")
@app.get("/api/session/stats")
def cache_stats():
    """Returns telemetry diagnostics from the intelligent cache and persistent session manager."""
    return {
        "cache": cache_manager.get_stats(),
        "session": session_manager.get_stats(),
    }


@app.post("/api/cache/clear")
def cache_clear():
    """Clears all in-memory cached responses."""
    count = cache_manager.invalidate()
    return {"status": "cleared", "evicted_entries": count}


@app.get("/api/search")
def search_ticker(response: Response, q: str = Query("", min_length=1, max_length=20)):
    """
    Proxies Yahoo Finance's autocomplete API using persistent connection pooling
    and tiered caching. Fast, sub-millisecond on cache hit.
    """
    clean_q = q.strip().lower()
    if not clean_q:
        return {"suggestions": []}

    cache_key = f"search:{clean_q}"
    cached_data = cache_manager.get(cache_key)
    if cached_data is not None:
        if response:
            response.headers["X-Cache"] = "HIT"
        return cached_data

    url = (
        f"https://query2.finance.yahoo.com/v1/finance/search"
        f"?q={urllib.parse.quote(clean_q)}&quotesCount=8&newsCount=0"
        f"&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query"
    )
    try:
        resp = session_manager.get(url, timeout=3.0)
        if resp.ok:
            data = resp.json()
            quotes = data.get("quotes", [])
            suggestions = [
                {
                    "symbol": item.get("symbol", ""),
                    "name": item.get("longname") or item.get("shortname") or "",
                    "type": item.get("quoteType", ""),
                }
                for item in quotes
                if item.get("symbol")
            ]
            result = {"suggestions": suggestions[:8]}
            cache_manager.set(cache_key, result, ttl_seconds=CacheTier.SEARCH)
            if response:
                response.headers["X-Cache"] = "MISS"
            return result
    except Exception:
        pass

    if response:
        response.headers["X-Cache"] = "MISS"
    return {"suggestions": []}


@app.get("/api/signal-review")
def get_signal_review(
    response: Response,
    ticker: str = Query(..., min_length=1, max_length=12, description="Stock ticker symbol"),
    refresh: bool = Query(False, description="Bypass cache and force fresh data fetch"),
):
    """
    Fetches the unified institutional Signal Review object from LSEG Refinitiv,
    Yahoo Finance, and Morningstar Fair Value framework.
    Cached for fast sub-millisecond response.
    """
    start_time = time.time()
    clean_ticker = ticker.strip().upper()
    cache_key = f"signal_review:{clean_ticker}"

    if not refresh:
        cached = cache_manager.get(cache_key)
        if cached is not None:
            if response:
                response.headers["X-Cache"] = "HIT"
                response.headers["X-Response-Time-Ms"] = str(round((time.time() - start_time) * 1000, 2))
            return cached

    try:
        review = fetch_signal_review(clean_ticker)
    except DataFetchError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    cache_manager.set(cache_key, review, ttl_seconds=CacheTier.SIGNAL_REVIEW)
    if response:
        response.headers["X-Cache"] = "MISS"
        response.headers["X-Response-Time-Ms"] = str(round((time.time() - start_time) * 1000, 2))
    return review


@app.get("/api/gemini/status")
def gemini_status():
    """Returns whether GEMINI_API_KEY is configured in the environment and active model name."""
    return {
        "configured": is_gemini_configured(),
        "model": DEFAULT_GEMINI_MODEL,
    }


@app.post("/api/gemini/ticker-suggestion")
def gemini_ticker_suggestion(
    payload: dict = Body(...),
    refresh: bool = Query(False, description="Bypass cache and force fresh AI analysis"),
):
    """
    Generates a safe Gemini-AI research perspective for a single ticker.
    Adheres to strict compliance guardrails (no personalized advice, no share counts).
    Cached for fast sub-millisecond response.
    """
    ticker = payload.get("ticker", "").strip().upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Missing required 'ticker' field in payload.")

    cache_key = f"gemini:ticker:{ticker}"
    if not refresh:
        cached = cache_manager.get(cache_key)
        if cached is not None:
            return cached

    result = analyze_ticker_with_gemini(payload)
    if result.get("success"):
        cache_manager.set(cache_key, result, ttl_seconds=CacheTier.GEMINI)

    return result


@app.post("/api/gemini/watchlist-briefing")
def gemini_watchlist_briefing(
    payload: dict = Body(...),
    refresh: bool = Query(False, description="Bypass cache and force fresh AI briefing"),
):
    """
    Generates a high-level watchlist sentiment briefing, sector risk analysis,
    and highlighted focus candidates for the session.
    """
    watchlist_items = payload.get("watchlist", [])
    if not isinstance(watchlist_items, list) or not watchlist_items:
        raise HTTPException(status_code=400, detail="Payload must contain a non-empty 'watchlist' array.")

    tickers_key = ",".join(sorted([item.get("ticker", "").upper() for item in watchlist_items if item.get("ticker")]))
    cache_key = f"gemini:watchlist:{hash(tickers_key)}"

    if not refresh:
        cached = cache_manager.get(cache_key)
        if cached is not None:
            return cached

    result = analyze_watchlist_with_gemini(watchlist_items)
    if result.get("success"):
        cache_manager.set(cache_key, result, ttl_seconds=CacheTier.GEMINI)

    return result


@app.get("/api/analyze", response_model=AnalysisResponse)
def analyze(
    response: Response,
    ticker: str = Query(..., min_length=1, max_length=12, description="e.g. PLTR, IREN, MARA"),
    years: int = Query(5, ge=1, le=15, description="Number of most recent calendar years to include"),
    months: int = Query(12, ge=1, le=60, description="Trailing months for the monthly table"),
    refresh: bool = Query(False, description="Bypass cache and force fresh data fetch"),
):
    start_time = time.time()
    clean_ticker = ticker.strip().upper()
    cache_key = f"analyze:{clean_ticker}:{years}:{months}"

    if not refresh:
        cached_val = cache_manager.get(cache_key)
        if cached_val is not None:
            if response:
                response.headers["X-Cache"] = "HIT"
                response.headers["X-Response-Time-Ms"] = str(round((time.time() - start_time) * 1000, 2))
            return cached_val

    fetch_years = max(years, (months // 12) + 2)
    try:
        df = fetch_from_yahoo(clean_ticker, years_back=fetch_years)
    except DataFetchError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # Consolidated metadata bundle: single info query for quote details, similar stocks, ATH, ATL, name, signal_review
    meta = fetch_ticker_metadata_bundle(clean_ticker)

    result = _build_response(
        df,
        clean_ticker,
        source="yahoo",
        years=years,
        months=months,
        quote_details=meta["quote_details"],
        similar_stocks=meta["similar_stocks"],
        company_name=meta["company_name"],
        all_time_high=meta["all_time_high"],
        all_time_low=meta["all_time_low"],
        signal_review=meta.get("signal_review"),
    )

    cache_manager.set(cache_key, result, ttl_seconds=CacheTier.ANALYSIS)
    if response:
        response.headers["X-Cache"] = "MISS"
        response.headers["X-Response-Time-Ms"] = str(round((time.time() - start_time) * 1000, 2))

    return result



MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


@app.post("/api/analyze/upload", response_model=AnalysisResponse)
async def analyze_upload(
    file: UploadFile = File(...),
    ticker: str = Query("UPLOAD", max_length=15),
    years: int = Query(5, ge=1, le=15),
    months: int = Query(12, ge=1, le=60),
):
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (maximum 10MB).")
    try:
        df = parse_uploaded_csv(content)
    except DataFetchError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    inferred_ticker = ticker
    if ticker == "UPLOAD" and file.filename:
        inferred_ticker = file.filename.split("-")[0].split(".")[0]
    inferred_ticker = inferred_ticker.strip().upper()[:12] or "UPLOAD"

    signal_review = fetch_signal_review(inferred_ticker) if inferred_ticker != "UPLOAD" else None

    return _build_response(
        df,
        inferred_ticker,
        source="upload",
        years=years,
        months=months,
        signal_review=signal_review,
    )


def _get_live_quote_safe(ticker: str) -> dict:
    """Never raises — export endpoints should still succeed if the live quote fails."""
    try:
        return fetch_live_quote(ticker)
    except DataFetchError as exc:
        return {"price": None, "error": str(exc)}


@app.post("/api/export/xlsx")
def export_xlsx(payload: dict = Body(...)):
    if not isinstance(payload, dict) or not payload.get("ticker"):
        raise HTTPException(status_code=400, detail="Invalid payload: missing 'ticker'.")
    if "yearly" not in payload or "monthly" not in payload:
        raise HTTPException(status_code=400, detail="Invalid payload: missing analysis data.")
    live_quote = _get_live_quote_safe(payload.get("ticker", ""))
    content = build_xlsx(payload, live_quote)
    filename = f"{payload.get('ticker', 'stock')}_range_ledger.xlsx"
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/export/pdf")
def export_pdf(payload: dict = Body(...)):
    if not isinstance(payload, dict) or not payload.get("ticker"):
        raise HTTPException(status_code=400, detail="Invalid payload: missing 'ticker'.")
    if "yearly" not in payload or "monthly" not in payload:
        raise HTTPException(status_code=400, detail="Invalid payload: missing analysis data.")
    live_quote = _get_live_quote_safe(payload.get("ticker", ""))
    content = build_pdf(payload, live_quote)
    filename = f"{payload.get('ticker', 'stock')}_range_ledger.pdf"
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# --- Static frontend -------------------------------------------------------
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.isdir(FRONTEND_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
