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

if __name__ == "__main__":
    unittest.main()
