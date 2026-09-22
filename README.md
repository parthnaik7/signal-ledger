# SignalLedger — Sequential Range Intelligence & Trade Signals

SignalLedger is a quantitative equity research terminal that turns raw daily price history and Wall Street institutional data into sequence-validated range ledgers, multi-timeframe technical indicators, and deterministic trade signals grounded in real analyst consensus — not AI guesses.

---

## Key Features

### 1. Sequence-Validated Yearly & Monthly Ledgers
- Computes calendar year and trailing monthly price ranges with exact High/Low dates.
- **Sequencing Flag (`⚑`)**: Detects decline years where the annual Low occurred *after* the High. Automatically computes a corrected recovery metric using the subsequent year's high against the flagged low — preventing naive % differences from misrepresenting achievable gains.
- **Best Sequential Move**: Scans history chronologically to identify the single largest capturable low→high rally in both the current year and full asset history.

### 2. Deterministic Unified Signal Engine
All BUY/HOLD/SELL signals and confidence levels are derived from a **single, transparent mathematical formula** — not independently generated AI guesses. Four real data pillars are weighted and composited:

| Pillar | Weight | Source |
|---|---|---|
| Wall Street Consensus Score (LSEG Refinitiv 1.0–5.0) | 35% | Yahoo Finance / LSEG |
| Analyst Opinion Distribution (Strong Buy / Buy / Hold / Sell counts) | 15% | Yahoo Finance |
| Price Target Implied Upside (Mean PT vs. current price) | 30% | Yahoo Finance Analyst PTs |
| Analyst Consensus Valuation Model (star rating vs. median PT) | 20% | Yahoo Finance Analyst PTs |

The composite score $S \in [-2, +2]$ maps to: **BUY** ($S \geq +0.50$), **HOLD** ($-0.50 < S < +0.50$), **SELL** ($S \leq -0.50$). An extension guardrail locks to HOLD when price is within ~6% of its 52-week high with <8% implied target upside.

Confidence and risk levels are computed from inter-source agreement (standard deviation across pillars), analyst coverage depth, and proximity to 52-week highs — not heuristics.

### 3. Watchlist & Portfolio Dispersion Screening
- Client-persisted watchlist with multi-column sorting: Proximity to 52W Low, 52W High, All-Time Low, All-Time High, Best Move.
- **AI Watchlist Briefing**: Gemini-powered executive market sentiment overview, macro risk alerts, and focus trade ideas. All signals in the briefing are reconciled against the deterministic unified engine — the AI generates narrative context, never the rating.
- **Market Opportunities** (Not In Your Watchlist): AI suggests external candidates; filters by Risk / Confidence / Rating with live refresh.

### 4. Technical Indicator Engine (Client-Side, Real-Time)
- Moving Average Overlays: **20-EMA**, **50-SMA**, **200-SMA** with series warm-up.
- **Volume Histogram**: Visualizes institutional accumulation vs. distribution.
- **RSI (14-period)**: Momentum oscillator with Overbought (70) / Oversold (30) bands.
- **Market Regime**: Real-time Bullish/Bearish posture against institutional moving averages.

### 5. Institutional Export Engine
- **Excel (`.xlsx`)**: Multi-tab workbook with styled yearly ledger, monthly table, best moves, and full daily price history.
- **PDF**: Publication-ready report with flagged sequence rows and real-time quote snapshot.

---

## Architecture

```
signal-ledger/
├── backend/
│   ├── main.py              # FastAPI endpoints, CORS, concurrent data fetching
│   ├── analysis.py          # Yearly/monthly ledgers, sequential max-gain algorithm
│   ├── data_source.py       # Yahoo Finance (yfinance, auto-adjusted OHLCV), 16 quote stats, CSV parsing
│   ├── signal_review.py     # Unified signal engine: LSEG consensus + valuation + compute_unified_rating()
│   ├── gemini_service.py    # Gemini AI narrative (signals hardlocked to unified engine output)
│   ├── cache_manager.py     # Tiered in-memory TTL cache (LRU, 500 entry cap, telemetry)
│   ├── session_manager.py   # Persistent connection pool, curl_cffi Chrome TLS impersonation
│   ├── export.py            # XLSX (openpyxl) and PDF (reportlab) generators
│   ├── requirements.txt     # Python dependencies
│   └── tests/               # 37 unit & regression tests
├── frontend/
│   ├── index.html           # Main terminal dashboard
│   ├── app.js               # App logic, technical indicators, watchlist, safeFetchJson with AbortController
│   ├── style.css            # Design system (dark & light themes, CSS custom properties)
│   ├── insights.html        # Financial methodology & operational guide
│   ├── terms.html           # Terms of service & disclaimers
│   └── privacy.html         # Privacy policy & local storage disclosure
├── render.yaml              # Render cloud deployment blueprint
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
git clone https://github.com/parthnaik7/signal-ledger.git
cd signal-ledger

python3 -m venv venv3
source venv3/bin/activate      # Windows: venv3\Scripts\activate

pip install -r backend/requirements.txt
```

### Running Locally

```bash
uvicorn backend.main:app --reload --port 8000
```

Open **http://127.0.0.1:8000**. The backend serves the static frontend directly — no Node.js or build step required.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | *(optional)* | Google Generative Language API key. Activates AI Market Briefings and single-ticker research narratives. All signals remain deterministic regardless. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model. Cascades through `gemini-3.6-flash` → `gemini-flash-latest` on failure. |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins for external API access. |

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/analyze` | GET | Live Yahoo Finance fetch + sequence-validated range analysis. Params: `ticker`, `years` (1–15), `months` (1–60), `refresh`. |
| `/api/analyze/upload` | POST | Same analysis from an uploaded Yahoo-format history CSV (multipart). |
| `/api/search` | GET | Autocomplete ticker search via Yahoo Finance with tiered caching. Param: `q`. |
| `/api/signal-review` | GET | LSEG Refinitiv consensus, broker upgrades/downgrades, and unified deterministic rating. Params: `ticker`, `refresh`. |
| `/api/gemini/status` | GET | Gemini API configuration state and active model. |
| `/api/gemini/ticker-suggestion` | POST | AI observational research perspective for a single ticker (signal hardlocked to unified engine). |
| `/api/gemini/watchlist-briefing` | POST | Portfolio sentiment briefing, macro risks, focus trades, and market opportunities (with filter support). Param: `refresh`. |
| `/api/export/xlsx` | POST | Styled Excel workbook from analysis payload. |
| `/api/export/pdf` | POST | Publication-ready PDF from analysis payload. |
| `/api/cache/stats` | GET | Real-time telemetry: cache hit rate, entries, session pool stats. Also available at `/api/session/stats`. |
| `/api/cache/clear` | POST | Invalidates all in-memory cached responses. |
| `/api/health` | GET | Liveness check. |

---

## Automated Tests

```bash
# Run from project root
/path/to/venv3/bin/python3 -m pytest backend/tests/ -v
```

**37 tests** across 6 modules:

| Module | Coverage |
|---|---|
| `test_analysis.py` | Yearly/monthly ledgers, sequential max-gain edge cases |
| `test_unified_scoring.py` | Composite score formula, guardrails, cross-section parity |
| `test_signal_review.py` | LSEG score bounds, star rating model, unrated assets |
| `test_gemini_service.py` | API parsing, mock briefing reconciliation, filter logic |
| `test_cache_manager.py` | TTL expiration, LRU eviction, telemetry |
| `test_audit_regressions.py` | Dividend yield scaling, filename sanitization, timezone stripping |

---

## Design Decisions & Known Methodology

- **Split-adjusted prices**: `yfinance` is configured with `auto_adjust=True` — all historical OHLCV is adjusted for stock splits and dividends, ensuring pre- and post-split prices are comparable (critical for stocks like NVDA, TSLA, AAPL that have split in recent years).
- **Consensus Valuation Model**: The 5-star rating is computed as discount/premium to the analyst **median** price target (falling back to mean if median is unavailable, with a log warning). This is an analyst-consensus-based valuation proxy — not a DCF. It is labeled accordingly in the UI.
- **AI signals are hardlocked**: Gemini generates only narrative text. Every `rating`, `confidence`, and `risk_level` field in every section (AI Modal, Focus Trades, Market Opportunities) is overwritten by `compute_unified_rating()` after the API call returns. If signal review data is unavailable for a market opportunity stock, the fallback is `HOLD / MODERATE / MEDIUM` — never an unverified AI guess.
- **Timeouts**: Single-ticker AI calls time out at 45s; watchlist briefings at 45s. The frontend uses `AbortController` on all AI fetches with a human-readable timeout message.

---

## Legal & Regulatory Disclaimers

SignalLedger is an observational, algorithmic financial research tool for educational and analytical purposes only. It does not provide personalized investment, legal, or tax advice, nor does it issue individualized recommendations to buy, hold, or sell any security. Past range performance does not guarantee future results. All data is sourced from publicly available third-party providers (Yahoo Finance / LSEG Refinitiv) and may be delayed or inaccurate.
