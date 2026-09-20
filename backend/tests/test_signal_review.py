"""
Tests for Signal Review module: LSEG Refinitiv, Yahoo Finance Analyst Consensus,
and Morningstar Fair Value / Star Rating normalization.
"""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, patch

from signal_review import _calculate_star_rating, _score_to_verdict, fetch_signal_review


class TestSignalReview(unittest.TestCase):
    def test_score_to_verdict_numerical(self):
        # 1.0 to 1.5 -> BUY (STRONG BUY)
        v, vd = _score_to_verdict(1.2, None)
        self.assertEqual(v, "BUY")
        self.assertEqual(vd, "STRONG BUY")

        # 1.51 to 2.5 -> BUY (BUY)
        v, vd = _score_to_verdict(2.1, None)
        self.assertEqual(v, "BUY")
        self.assertEqual(vd, "BUY")

        # 2.51 to 3.5 -> HOLD (HOLD)
        v, vd = _score_to_verdict(3.0, None)
        self.assertEqual(v, "HOLD")
        self.assertEqual(vd, "HOLD")

        # 3.51 to 4.5 -> SELL (UNDERPERFORM)
        v, vd = _score_to_verdict(3.8, None)
        self.assertEqual(v, "SELL")
        self.assertEqual(vd, "UNDERPERFORM")

        # > 4.5 -> SELL (STRONG SELL)
        v, vd = _score_to_verdict(4.8, None)
        self.assertEqual(v, "SELL")
        self.assertEqual(vd, "STRONG SELL")

    def test_score_to_verdict_string_key(self):
        self.assertEqual(_score_to_verdict(None, "strong_buy"), ("BUY", "STRONG BUY"))
        self.assertEqual(_score_to_verdict(None, "buy"), ("BUY", "BUY"))
        self.assertEqual(_score_to_verdict(None, "outperform"), ("BUY", "BUY"))
        self.assertEqual(_score_to_verdict(None, "hold"), ("HOLD", "HOLD"))
        self.assertEqual(_score_to_verdict(None, "neutral"), ("HOLD", "HOLD"))
        self.assertEqual(_score_to_verdict(None, "underperform"), ("SELL", "UNDERPERFORM"))
        self.assertEqual(_score_to_verdict(None, "sell"), ("SELL", "STRONG SELL"))
        self.assertEqual(_score_to_verdict(None, None), ("UNRATED", "UNRATED"))

    def test_star_rating_and_valuation(self):
        # 25% discount -> 5 Stars (Strongly Undervalued)
        stars, status, disc = _calculate_star_rating(75.0, 100.0)
        self.assertEqual(stars, 5)
        self.assertEqual(status, "Strongly Undervalued")
        self.assertEqual(disc, 25.0)

        # 12% discount -> 4 Stars (Undervalued)
        stars, status, disc = _calculate_star_rating(88.0, 100.0)
        self.assertEqual(stars, 4)
        self.assertEqual(status, "Undervalued")
        self.assertEqual(disc, 12.0)

        # 2% discount -> 3 Stars (Fairly Valued)
        stars, status, disc = _calculate_star_rating(98.0, 100.0)
        self.assertEqual(stars, 3)
        self.assertEqual(status, "Fairly Valued")
        self.assertEqual(disc, 2.0)

        # 12% premium (-12% discount) -> 2 Stars (Overvalued)
        stars, status, disc = _calculate_star_rating(112.0, 100.0)
        self.assertEqual(stars, 2)
        self.assertEqual(status, "Overvalued")
        self.assertEqual(disc, -12.0)

        # 25% premium (-25% discount) -> 1 Star (Strongly Overvalued)
        stars, status, disc = _calculate_star_rating(125.0, 100.0)
        self.assertEqual(stars, 1)
        self.assertEqual(status, "Strongly Overvalued")
        self.assertEqual(disc, -25.0)

        # Missing or invalid
        stars, status, disc = _calculate_star_rating(None, 100.0)
        self.assertIsNone(stars)
        self.assertEqual(status, "Unrated")

    def test_fetch_signal_review_covered_stock(self):
        mock_info = {
            "symbol": "MOCK",
            "recommendationMean": 2.15,
            "recommendationKey": "buy",
            "numberOfAnalystOpinions": 30,
            "targetMeanPrice": 250.0,
            "targetMedianPrice": 260.0,
            "targetHighPrice": 300.0,
            "targetLowPrice": 180.0,
            "currentPrice": 220.0,
        }

        mock_ticker = MagicMock()
        mock_ticker.info = mock_info
        mock_ticker.recommendations = None
        mock_ticker.analyst_price_targets = {
            "current": 220.0,
            "mean": 250.0,
            "median": 260.0,
            "high": 300.0,
            "low": 180.0,
        }
        mock_ticker.upgrades_downgrades = None

        review = fetch_signal_review("MOCK", info=mock_info, ticker_obj=mock_ticker)
        self.assertEqual(review["ticker"], "MOCK")
        self.assertEqual(review["verdict"], "BUY")
        self.assertEqual(review["verdict_display"], "BUY")
        self.assertEqual(review["score"], 2.15)
        self.assertEqual(review["confidence"], "HIGH")
        self.assertEqual(review["analyst_count"], 30)
        self.assertEqual(review["price_targets"]["current"], 220.0)
        self.assertEqual(review["price_targets"]["mean"], 250.0)
        self.assertEqual(review["price_targets"]["implied_upside_pct"], 13.64)
        self.assertEqual(review["valuation"]["star_rating"], 4)
        self.assertEqual(review["valuation"]["status"], "Undervalued")

    def test_fetch_signal_review_unrated_asset(self):
        mock_info = {
            "symbol": "SPY",
            "regularMarketPrice": 550.0,
            "shortName": "SPDR S&P 500 ETF Trust",
        }
        mock_ticker = MagicMock()
        mock_ticker.info = mock_info
        mock_ticker.recommendations = None
        mock_ticker.analyst_price_targets = {}
        mock_ticker.upgrades_downgrades = None

        review = fetch_signal_review("SPY", info=mock_info, ticker_obj=mock_ticker)
        self.assertEqual(review["ticker"], "SPY")
        self.assertEqual(review["verdict"], "UNRATED")
        self.assertEqual(review["confidence"], "NONE")
        self.assertEqual(review["analyst_count"], 0)
        self.assertIsNone(review["score"])
        self.assertIsNone(review["valuation"]["star_rating"])
        self.assertEqual(review["valuation"]["status"], "Unrated")

    def test_fetch_signal_review_nonexistent_ticker_raises(self):
        from data_source import DataFetchError
        mock_info = {}
        mock_ticker = MagicMock()
        mock_ticker.info = mock_info
        with self.assertRaises(DataFetchError):
            fetch_signal_review("NONEXISTENT_XYZ", info=mock_info, ticker_obj=mock_ticker)


if __name__ == "__main__":
    unittest.main()
