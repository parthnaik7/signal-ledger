import unittest
import pandas as pd
from datetime import datetime
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from analysis import sequential_max_gain, yearly_analysis, monthly_analysis


class TestAnalysis(unittest.TestCase):
    def setUp(self):
        # Sample daily data for 2 years
        dates = pd.date_range(start="2024-01-01", end="2025-12-31", freq="B")
        prices = [100.0 + (i * 0.5) for i in range(len(dates))]
        self.df_uptrend = pd.DataFrame({
            "Date": dates,
            "Open": prices,
            "High": [p + 2.0 for p in prices],
            "Low": [p - 2.0 for p in prices],
            "Close": prices,
            "Volume": [1000000] * len(dates),
        })

    def test_sequential_max_gain_uptrend(self):
        result = sequential_max_gain(self.df_uptrend)
        self.assertIsNotNone(result)
        self.assertIn("low", result)
        self.assertIn("high", result)
        self.assertIn("pct_diff", result)
        # Low date must precede high date
        self.assertLessEqual(result["low"]["date"], result["high"]["date"])
        self.assertGreater(result["pct_diff"], 0)

    def test_sequential_max_gain_downtrend(self):
        dates = pd.date_range(start="2025-01-01", periods=10, freq="B")
        prices = [100.0 - i * 5 for i in range(10)]
        df_downtrend = pd.DataFrame({
            "Date": dates,
            "Open": prices,
            "High": prices,
            "Low": [p - 1.0 for p in prices],
            "Close": prices,
            "Volume": [1000000] * 10,
        })
        result = sequential_max_gain(df_downtrend)
        # Even in downtrend, if any subsequent session has High >= Low, it evaluates, but low date must precede high date
        if result is not None:
            self.assertLessEqual(result["low"]["date"], result["high"]["date"])

    def test_sequential_max_gain_empty(self):
        df_empty = pd.DataFrame(columns=["Date", "Open", "High", "Low", "Close", "Volume"])
        self.assertIsNone(sequential_max_gain(df_empty))

    def test_yearly_analysis_structure(self):
        results = yearly_analysis(self.df_uptrend, num_years=2)
        self.assertEqual(len(results), 2)
        for r in results:
            self.assertIn("label", r)
            self.assertIn("high", r)
            self.assertIn("low", r)
            self.assertIn("pct_diff", r)
            self.assertIn("sequence_ok", r)
            self.assertTrue(r["sequence_ok"])

    def test_monthly_analysis_trailing(self):
        results = monthly_analysis(self.df_uptrend, num_months=6)
        self.assertGreaterEqual(len(results), 1)
        self.assertLessEqual(len(results), 7)
        for r in results:
            self.assertIn("label", r)
            self.assertIn("trading_days", r)
            self.assertGreater(r["trading_days"], 0)


if __name__ == "__main__":
    unittest.main()
