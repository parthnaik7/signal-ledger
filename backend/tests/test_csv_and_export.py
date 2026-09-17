import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from data_source import parse_uploaded_csv, DataFetchError
from export import build_xlsx, build_pdf


class TestCsvAndExport(unittest.TestCase):
    def test_parse_uploaded_csv_valid(self):
        csv_data = (
            'Date,Open,High,Low,Close,Volume\n'
            '"Jan 02, 2024",100.0,105.0,99.0,104.0,"1,000,000"\n'
            '"Jan 03, 2024",104.0,108.0,103.0,107.5,"1,500,000"\n'
        ).encode("utf-8")
        df = parse_uploaded_csv(csv_data)
        self.assertEqual(len(df), 2)
        self.assertIn("Close", df.columns)
        self.assertIn("Date", df.columns)
        self.assertEqual(float(df.iloc[0]["Close"]), 104.0)

    def test_parse_uploaded_csv_missing_column(self):
        bad_csv = "Date,Open,Volume\nJan 02, 2024,100,1000\n".encode("utf-8")
        with self.assertRaises(DataFetchError):
            parse_uploaded_csv(bad_csv)

    def test_export_xlsx_and_pdf(self):
        sample_payload = {
            "ticker": "AAPL",
            "source": "yahoo",
            "range_start": "2024-01-01",
            "range_end": "2024-12-31",
            "trading_days": 252,
            "latest_close": 230.5,
            "yearly": [
                {
                    "label": "2024",
                    "start": "2024-01-01",
                    "end": "2024-12-31",
                    "trading_days": 252,
                    "is_complete": True,
                    "high": {"price": 235.0, "date": "2024-12-15"},
                    "low": {"price": 170.0, "date": "2024-04-15"},
                    "pct_diff": 38.2,
                    "sequence_ok": True,
                    "revised_high": None,
                    "revised_pct_diff": None,
                    "revised_note": None,
                }
            ],
            "monthly": [
                {
                    "label": "Dec 2024",
                    "start": "2024-12-01",
                    "end": "2024-12-31",
                    "trading_days": 21,
                    "is_complete": True,
                    "high": {"price": 235.0, "date": "2024-12-15"},
                    "low": {"price": 220.0, "date": "2024-12-02"},
                    "pct_diff": 6.8,
                    "sequence_ok": True,
                }
            ],
            "best_move_current_year": {
                "low": {"price": 170.0, "date": "2024-04-15"},
                "high": {"price": 235.0, "date": "2024-12-15"},
                "pct_diff": 38.2,
            },
            "best_move_overall": {
                "low": {"price": 120.0, "date": "2023-01-05"},
                "high": {"price": 235.0, "date": "2024-12-15"},
                "pct_diff": 95.8,
            },
            "price_history": [
                {"date": "2024-12-31", "close": 230.5, "high": 232.0, "low": 229.0}
            ],
        }

        xlsx_bytes = build_xlsx(sample_payload, {"price": 231.0, "note": "live quote"})
        self.assertIsInstance(xlsx_bytes, bytes)
        self.assertGreater(len(xlsx_bytes), 1000)

        pdf_bytes = build_pdf(sample_payload, {"price": 231.0, "note": "live quote"})
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertGreater(len(pdf_bytes), 1000)


if __name__ == "__main__":
    unittest.main()
