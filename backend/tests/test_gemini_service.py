"""
Unit tests for Gemini AI service and endpoints in SignalLedger.
"""

from __future__ import annotations

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from gemini_service import (
    analyze_ticker_with_gemini,
    analyze_watchlist_with_gemini,
    is_gemini_configured,
    get_gemini_api_key,
)
from main import (
    gemini_status,
    gemini_ticker_suggestion,
    gemini_watchlist_briefing,
)
from fastapi import HTTPException


class TestGeminiService(unittest.TestCase):
    def test_gemini_status_unconfigured(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            self.assertFalse(is_gemini_configured())
            data = gemini_status()
            self.assertFalse(data["configured"])

    def test_gemini_status_configured(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKey12345"}):
            self.assertTrue(is_gemini_configured())
            self.assertEqual(get_gemini_api_key(), "AIzaSyFakeKey12345")
            data = gemini_status()
            self.assertTrue(data["configured"])

    def test_ticker_suggestion_unconfigured_response(self):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            res = gemini_ticker_suggestion(payload={"ticker": "AAPL"}, refresh=True)
            self.assertFalse(res.get("configured"))
            self.assertFalse(res.get("success"))
            self.assertIn("not configured", res.get("error", ""))

    def test_ticker_suggestion_missing_ticker_raises_400(self):
        with self.assertRaises(HTTPException) as ctx:
            gemini_ticker_suggestion(payload={}, refresh=True)
        self.assertEqual(ctx.exception.status_code, 400)

    @patch("gemini_service._call_gemini_api")
    def test_ticker_suggestion_success_mock(self, mock_call):
        mock_ai_output = {
            "signal": "BUY",
            "confidence": "HIGH",
            "posture": "Scale-In on Dips",
            "timing_rationale": "Trading near strong 52-week support with positive institutional revisions.",
            "action_perspective": "Staggering entries in smaller tranches allows observing support levels without overcommitting.",
            "key_drivers": ["Earnings growth", "Support consolidation"],
            "risk_catalysts": ["Macro rate sensitivity"],
            "disclaimer": "AI-generated observational market perspective for educational purposes only. Not personalized financial, investment, or legal advice. Capital is at risk.",
        }
        mock_call.return_value = {
            "success": True,
            "configured": True,
            "data": mock_ai_output,
            "model": "gemini-2.5-flash",
        }

        payload = {
            "ticker": "AAPL",
            "company_name": "Apple Inc.",
            "latest_close": 220.0,
            "latest_low": 165.0,
            "latest_high": 235.0,
            "diff_from_latest_low_pct": 33.3,
            "diff_from_latest_high_pct": -6.38,
            "signal_review": {
                "verdict": "BUY",
                "score": 1.8,
                "analyst_count": 38,
                "price_target_mean": 245.0,
                "upside_pct": 11.36,
            },
        }

        with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKey12345"}):
            res = gemini_ticker_suggestion(payload=payload, refresh=True)
            self.assertTrue(res["success"])
            self.assertEqual(res["data"]["signal"], "BUY")
            self.assertIn("Scale-In", res["data"]["posture"])
            self.assertIn("Not personalized financial", res["data"]["disclaimer"])

    def test_watchlist_briefing_empty_raises_400(self):
        with self.assertRaises(HTTPException) as ctx:
            gemini_watchlist_briefing(payload={"watchlist": []}, refresh=True)
        self.assertEqual(ctx.exception.status_code, 400)

    @patch("gemini_service._call_gemini_api")
    def test_watchlist_briefing_success_mock(self, mock_call):
        mock_briefing_output = {
            "overall_sentiment": "BULLISH",
            "sentiment_score": 4.2,
            "market_briefing": "Broad positive momentum across tech holdings with resilient range support.",
            "focus_trades": [
                {
                    "ticker": "AAPL",
                    "rating": "BUY",
                    "setup_type": "Favorable Support Rebound",
                    "rationale": "Holding solid 52W support with 11% consensus upside.",
                    "timing_note": "Near consolidation boundary",
                    "risk_level": "LOW",
                }
            ],
            "macro_risks": ["Upcoming FOMC interest rate decision"],
            "disclaimer": "AI-generated watchlist overview for educational and informational purposes only. Not personalized financial advice.",
        }
        mock_call.return_value = {
            "success": True,
            "configured": True,
            "data": mock_briefing_output,
            "model": "gemini-2.5-flash",
        }

        payload = {
            "watchlist": [
                {
                    "ticker": "AAPL",
                    "companyName": "Apple Inc.",
                    "metrics": {
                        "latest_close": 220.0,
                        "diff_from_latest_low_pct": 33.3,
                        "diff_from_latest_high_pct": -6.38,
                        "signal": "BUY",
                    },
                }
            ]
        }

        with patch.dict(os.environ, {"GEMINI_API_KEY": "AIzaSyFakeKey12345"}):
            res = gemini_watchlist_briefing(payload=payload, refresh=True)
            self.assertTrue(res["success"])
            self.assertEqual(res["data"]["overall_sentiment"], "BULLISH")
            self.assertEqual(len(res["data"]["focus_trades"]), 1)
            self.assertEqual(res["data"]["focus_trades"][0]["ticker"], "AAPL")


if __name__ == "__main__":
    unittest.main()
