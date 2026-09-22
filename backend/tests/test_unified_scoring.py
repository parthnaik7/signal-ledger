import unittest
from unittest.mock import patch
import os

import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from signal_review import compute_unified_rating
from gemini_service import analyze_ticker_with_gemini, analyze_watchlist_with_gemini


class TestUnifiedScoring(unittest.TestCase):
    def test_strong_bullish_alignment(self):
        """
        When Refinitiv consensus is Strong Buy, price target upside > 20%,
        and Morningstar is 5 Stars Undervalued:
        Should produce BUY, HIGH confidence, and LOW risk.
        """
        review = {
            "score": 1.3,
            "analyst_count": 28,
            "distribution": {"strong_buy": 20, "buy": 8, "hold": 0, "sell": 0, "strong_sell": 0},
            "price_targets": {"current": 100.0, "mean": 130.0, "implied_upside_pct": 30.0},
            "valuation": {"star_rating": 5, "discount_pct": 25.0},
        }
        res = compute_unified_rating(review, technical_metrics={"diff_from_latest_high_pct": -20.0})
        self.assertEqual(res["signal"], "BUY")
        self.assertEqual(res["confidence"], "HIGH")
        self.assertEqual(res["risk_level"], "LOW")
        self.assertGreater(res["composite_score"], 1.0)

    def test_conflicting_signals_lowers_confidence(self):
        """
        When Wall St consensus says Buy (1.6), but current price already trades
        above analyst price targets (-12% upside) and Morningstar is 1 Star:
        Disagreement between pillars must lower confidence to LOW.
        """
        review = {
            "score": 1.6,
            "analyst_count": 20,
            "distribution": {"strong_buy": 12, "buy": 6, "hold": 2},
            "price_targets": {"current": 200.0, "mean": 176.0, "implied_upside_pct": -12.0},
            "valuation": {"star_rating": 1, "discount_pct": -22.0},
        }
        res = compute_unified_rating(review)
        self.assertEqual(res["confidence"], "LOW")
        self.assertEqual(res["risk_level"], "HIGH")

    def test_extended_near_52w_high_guardrail(self):
        """
        When a stock is near its 52-week high (within 4%) and target upside is limited (<8%),
        such as JPM:
        Must result in HOLD signal, MODERATE risk, and prevent aggressive BUY entry.
        """
        review = {
            "score": 2.12,
            "analyst_count": 24,
            "distribution": {"strong_buy": 4, "buy": 9, "hold": 10, "sell": 0, "strong_sell": 1},
            "price_targets": {"current": 352.0, "mean": 375.0, "implied_upside_pct": 6.5},
            "valuation": {"star_rating": 3, "discount_pct": 5.0},
        }
        res = compute_unified_rating(review, technical_metrics={"diff_from_latest_high_pct": -3.95})
        self.assertEqual(res["signal"], "HOLD")
        self.assertEqual(res["risk_level"], "MODERATE")

    def test_sparse_coverage_lowers_confidence(self):
        """
        When only 2 analysts cover the stock:
        Confidence must be LOW regardless of score.
        """
        review = {
            "score": 1.5,
            "analyst_count": 2,
            "distribution": {"strong_buy": 2},
            "price_targets": {"current": 50.0, "mean": 65.0, "implied_upside_pct": 30.0},
            "valuation": {"star_rating": 4},
        }
        res = compute_unified_rating(review)
        self.assertEqual(res["confidence"], "LOW")

    @patch("gemini_service._call_gemini_api")
    def test_cross_section_consistency_jpm(self, mock_gemini_call):
        """
        Verifies that JPM has identical Signal, Risk Level, and Confidence
        across single-ticker AI perspective and watchlist briefing.
        """
        jpm_review = {
            "score": 2.12,
            "analyst_count": 24,
            "distribution": {"strong_buy": 4, "buy": 9, "hold": 10, "sell": 0, "strong_sell": 1},
            "price_targets": {"current": 352.04, "mean": 375.38, "median": 372.0, "implied_upside_pct": 6.63},
            "valuation": {"star_rating": 3, "fair_value": 372.0, "discount_pct": 5.37},
            "verdict": "BUY",
        }
        jpm_tech = {
            "latest_close": 352.04,
            "diff_from_latest_high_pct": -3.95,
            "diff_from_latest_low_pct": 26.1,
        }
        unified = compute_unified_rating(jpm_review, technical_metrics=jpm_tech)

        # 1. Single Ticker Call
        mock_gemini_call.return_value = {
            "success": True,
            "configured": True,
            "data": {
                "signal": "BUY",  # Mock AI tries to guess BUY
                "risk_level": "LOW",  # Mock AI tries to guess LOW risk
                "confidence": "HIGH",
                "posture": "Hold position",
                "timing_rationale": "Trading near highs.",
            },
            "model": "gemini-2.5-flash",
        }
        ticker_payload = {
            "ticker": "JPM",
            "company_name": "JPMorgan Chase",
            "latest_close": 352.04,
            "diff_from_latest_high_pct": -0.0395,
            "diff_from_latest_low_pct": 0.261,
            "signal_review": jpm_review,
        }
        with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKey12345"}):
            single_res = analyze_ticker_with_gemini(ticker_payload)

        # Single ticker MUST be locked to unified ground truth:
        self.assertEqual(single_res["data"]["signal"], unified["signal"])
        self.assertEqual(single_res["data"]["risk_level"], unified["risk_level"])
        self.assertEqual(single_res["data"]["confidence"], unified["confidence"])

        # 2. Watchlist Briefing Call
        mock_briefing_data = {
            "overall_sentiment": "BULLISH",
            "sentiment_score": 4.0,
            "market_briefing": "Broad bank sector momentum.",
            "focus_trades": [
                {
                    "ticker": "JPM",
                    "rating": "BUY",  # Mock AI tries to output BUY
                    "risk_level": "LOW",  # Mock AI tries to output LOW risk
                    "confidence": "HIGH",
                    "setup_type": "Leader consolidation",
                    "rationale": "High quality balance sheet.",
                    "timing_note": "Near 52W high",
                }
            ],
            "macro_risks": ["Credit spreads"],
            "market_opportunities": [],
            "disclaimer": "Informational only.",
        }
        mock_gemini_call.return_value = {
            "success": True,
            "configured": True,
            "data": mock_briefing_data,
            "model": "gemini-2.5-flash",
        }
        wl_items = [
            {
                "ticker": "JPM",
                "companyName": "JPMorgan Chase",
                "metrics": {
                    "latest_close": 352.04,
                    "diff_from_latest_high_pct": -0.0395,
                    "diff_from_latest_low_pct": 0.261,
                    "signal_review": jpm_review,
                },
            }
        ]
        with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKey12345"}):
            wl_res = analyze_watchlist_with_gemini(wl_items)

        # Watchlist focus trade MUST be locked to unified ground truth:
        trade = wl_res["data"]["focus_trades"][0]
        self.assertEqual(trade["rating"], unified["signal"])
        self.assertEqual(trade["risk_level"], unified["risk_level"])
        self.assertEqual(trade["confidence"], unified["confidence"])

        # Both sections MUST match 100%:
        self.assertEqual(single_res["data"]["signal"], trade["rating"])
        self.assertEqual(single_res["data"]["risk_level"], trade["risk_level"])
        self.assertEqual(single_res["data"]["confidence"], trade["confidence"])


if __name__ == "__main__":
    unittest.main()
