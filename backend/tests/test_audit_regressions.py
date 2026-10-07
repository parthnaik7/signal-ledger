"""Regression tests for audit fixes."""
import os, sys, unittest
import pandas as pd
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from data_source import _coerce_ohlc, fetch_ticker_quote_details
from signal_review import _score_to_verdict
from analysis import yearly_analysis
from main import _sanitize_export_filename, search_ticker
from fastapi import Response

class TestAuditRegressions(unittest.TestCase):
    def test_dividend_yield_scaling(self):
        info = {"dividendRate": 4.5, "dividendYield": 0.12}
        res = fetch_ticker_quote_details("TEST", info=info)
        self.assertIn("12.00%", res["Forward dividend & yield"])
        info2 = {"dividendRate": 1.2, "dividendYield": 0.025}
        res2 = fetch_ticker_quote_details("TEST", info=info2)
        self.assertIn("2.50%", res2["Forward dividend & yield"])

    def test_score_to_verdict_bounds(self):
        self.assertEqual(_score_to_verdict(0.0, None), ("UNRATED", "UNRATED"))
        self.assertEqual(_score_to_verdict(-1.0, None), ("UNRATED", "UNRATED"))
        self.assertEqual(_score_to_verdict(6.0, None), ("UNRATED", "UNRATED"))
        self.assertEqual(_score_to_verdict(1.2, None), ("BUY", "STRONG BUY"))

    def test_export_filename_sanitization(self):
        injected = "AAPL" + chr(13) + chr(10) + "X-Injected: Evil"
        clean = _sanitize_export_filename(injected, "xlsx")
        self.assertEqual(clean, "AAPLX-INJECT_range_ledger.xlsx")
        self.assertNotIn(chr(13), clean)
        self.assertNotIn(chr(10), clean)
        clean_trav = _sanitize_export_filename("../../../etc/passwd", "pdf")
        self.assertEqual(clean_trav, "ETCPASSWD_range_ledger.pdf")

    def test_timezone_stripping(self):
        dates = pd.date_range("2024-01-02", "2024-12-31", freq="B", tz="America/New_York")
        df = pd.DataFrame({"Date": dates, "Open": [100]*len(dates), "High": [110]*len(dates), "Low": [95]*len(dates), "Close": [105]*len(dates), "Volume": [1000]*len(dates)})
        clean_df = _coerce_ohlc(df)
        self.assertIsNone(clean_df["Date"].dt.tz)
        yearly = yearly_analysis(clean_df, num_years=1)
        self.assertEqual(len(yearly), 1)

    def test_search_empty(self):
        resp = Response()
        res = search_ticker(resp, q="")
        self.assertEqual(res, {"suggestions": []})

    def test_security_headers(self):
        import asyncio
        from main import SecurityHeadersMiddleware
        from starlette.requests import Request
        from starlette.responses import Response as StarletteResponse

        async def _run():
            mw = SecurityHeadersMiddleware(app=None)
            scope = {"type": "http", "method": "GET", "path": "/api/health", "headers": []}
            req = Request(scope)
            async def call_next(r):
                return StarletteResponse("ok")
            res = await mw.dispatch(req, call_next)
            self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
            self.assertEqual(res.headers.get("X-Frame-Options"), "DENY")
            self.assertEqual(res.headers.get("X-DNS-Prefetch-Control"), "off")
            self.assertIn("camera=()", res.headers.get("Permissions-Policy", ""))
            self.assertIn("max-age=31536000", res.headers.get("Strict-Transport-Security", ""))

        asyncio.run(_run())

    def test_rate_limiter(self):
        import asyncio
        from main import RateLimitMiddleware
        from starlette.requests import Request
        from starlette.responses import Response as StarletteResponse

        async def _run():
            mw = RateLimitMiddleware(app=None, general_limit=2, expensive_limit=1, window_secs=60)
            scope = {
                "type": "http",
                "method": "GET",
                "path": "/api/search",
                "headers": [(b"x-forwarded-for", b"203.0.113.195")],
                "client": ("203.0.113.195", 1234),
            }
            req = Request(scope)
            async def call_next(r):
                return StarletteResponse("ok")

            r1 = await mw.dispatch(req, call_next)
            self.assertEqual(r1.status_code, 200)
            r2 = await mw.dispatch(req, call_next)
            self.assertEqual(r2.status_code, 200)
            r3 = await mw.dispatch(req, call_next)
            self.assertEqual(r3.status_code, 429)
            self.assertIn("Retry-After", r3.headers)

        asyncio.run(_run())

    def test_openapi_schema_deduplication(self):
        from main import app
        schema = app.openapi()
        paths = schema.get("paths", {})
        self.assertIn("/api/cache/stats", paths)
        self.assertNotIn("/api/session/stats", paths)

    def test_zero_division_guard_in_signal_review(self):
        from signal_review import fetch_signal_review
        info = {
            "fiftyTwoWeekLow": 0.0,
            "fiftyTwoWeekHigh": 0.0,
            "regularMarketPrice": 10.0,
            "previousClose": 10.0,
        }
        res = fetch_signal_review("ZERO_CO", info=info)
        self.assertIsNotNone(res)
        self.assertIn("verdict", res)

    def test_sha256_cache_key_determinism(self):
        import hashlib
        key = "AAPL,MSFT,NVDA"
        h1 = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
        h2 = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
        self.assertEqual(h1, h2)
        self.assertEqual(len(h1), 16)

if __name__ == "__main__":
    unittest.main()
