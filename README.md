# SignalLedger

A high-precision equity analysis platform that turns daily stock history into sequence-aware ranges and actionable trade signals:

1. **Yearly ranges** — high, low, the dates they happened, and the % difference between them — with a flag for years where the low happened *after* the high (meaning the raw % diff overstates an "achievable" rally), plus a corrected % diff using the following year's actual high.
2. **Trailing monthly ranges** — same idea, month by month, over however many months you ask for.
3. **Best sequential move** — the largest gain you could actually have captured by buying at a low and selling at a *later* high, computed properly in chronological order.

Data can come from **live Yahoo Finance** (the same data backing `finance.yahoo.com/quote/{TICKER}/history`) or from an **uploaded CSV** exported from that same Yahoo history page — both paths produce identical tables.

## Project layout

```
stock-analyzer/
├── backend/
│   ├── main.py          FastAPI app + routes, also serves the frontend
│   ├── analysis.py       yearly/monthly/sequential-move computation (pure functions, unit-testable)
│   ├── data_source.py    Yahoo Finance fetch (yfinance) + CSV upload parsing
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── style.css
    └── app.js            vanilla JS — no build step needed
```

## Running it

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then open **http://localhost:8000** — the backend serves the frontend directly, so there's nothing else to start.

## Using it

- Type a ticker (e.g. `PLTR`, `IREN`, `MARA`), set **Years** and **Trailing months**, and click **Fetch from Yahoo**.
- If live fetching is blocked (corporate network, rate limiting, or a sandboxed environment with no outbound internet — Yahoo Finance access needs to be reachable from wherever this server runs), click **Upload CSV** instead and pick a Yahoo-exported history CSV. Both paths render the same dashboard.
- The yearly chart has a **log scale** toggle — useful for tickers whose price has moved by orders of magnitude (e.g. penny stocks or early-stage names).

## Notes on the data and logic

- **"Complete" years/months** are flagged in the table (`partial` tag) when the window is clipped at the start or end of the data — e.g. the current year-to-date, or a ticker's first partial year after its IPO.
- **The sequencing flag** (`⚑` styling, coral left border) fires whenever a year's low date comes after its high date. In that case the year's own % diff describes a *decline*, not a rally, so a revised figure is shown using next year's actual high against this year's low — a real, chronologically valid recovery number. If there's no next-year data yet (e.g. current YTD), it's marked "no data to revise against."
- **Live Yahoo fetching** uses the `yfinance` library, which talks to the same backend Yahoo's own history page uses. This requires outbound internet access to Yahoo's `query1`/`query2.finance.yahoo.com` from the server process — some restricted or sandboxed hosting environments block this, which is what the CSV upload path is for.
- All computation lives in `analysis.py` as plain functions over a pandas DataFrame, independent of where the data came from, so it's straightforward to unit test or reuse elsewhere.

## Price history chart

Below the ticker header, a full daily-close line chart covers the entire loaded range, with **1M / 3M / 6M / 1Y / 2Y / 5Y / Max** buttons to zoom — these filter the already-loaded data client-side, so switching ranges is instant and doesn't re-fetch or re-hit the server. The full daily series is also included in the XLSX export as a "Daily Prices" sheet.

## Exporting

Once a ticker is loaded, **Download XLSX** and **Download PDF** appear next to the summary figures. Both:

- Re-use whatever is currently on screen (same years/months window, same yearly/monthly/best-move tables), so what you export matches what you see.
- Attempt a fresh **live price snapshot** at export time (via `yfinance`'s quote endpoint, separate from the historical daily close) and stamp the report with **when it was generated** (server's current date/time). If a live quote isn't reachable (no internet to Yahoo, market data gap, etc.), the export still succeeds — it just labels that line "unavailable" instead of guessing.
- The XLSX has four sheets: Summary, Yearly, Monthly, Best Sequential Move. Flagged (out-of-sequence) rows are highlighted.
- The PDF is a single formatted report with the same sections, flagged rows shaded the same way.

## API reference

| Endpoint | Method | Params | Description |
|---|---|---|---|
| `/api/analyze` | GET | `ticker`, `years` (1–15), `months` (1–60) | Live Yahoo Finance fetch + full analysis |
| `/api/analyze/upload` | POST (multipart) | `file`, `ticker`, `years`, `months` | Same analysis, from an uploaded CSV |
| `/api/export/xlsx` | POST (JSON body) | the analysis payload from either endpoint above | Downloadable XLSX report |
| `/api/export/pdf` | POST (JSON body) | the analysis payload from either endpoint above | Downloadable PDF report |
| `/api/health` | GET | — | Liveness check |

Both analysis endpoints return the same JSON shape: `ticker`, `source`, `range_start`, `range_end`, `trading_days`, `latest_close`, `yearly[]`, `monthly[]`, `best_move_overall`, `best_move_current_year`. That exact object is what the export endpoints expect as their request body — the frontend just forwards whatever it last received.
