"""
Unit tests for resilient Yahoo Finance rate limiting, session management,
exponential backoff with jitter, and stale-cache fallback.
"""

import os
import sys
import time
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from cache_manager import IntelligentCacheManager
from session_manager import ClientRateLimiter, UnifiedSessionManager
from data_source import fetch_live_quote, DataFetchError


class TestRateLimiterAndResilience(unittest.TestCase):
    def test_client_rate_limiter_tokens(self):
        limiter = ClientRateLimiter(min_interval=0.05, max_burst=2)
        # First 2 should be immediate
        t0 = time.time()
        limiter.acquire()
        limiter.acquire()
        t1 = time.time()
        self.assertLess(t1 - t0, 0.05)

        # 3rd token must wait ~0.05s
        limiter.acquire()
        t2 = time.time()
        self.assertGreaterEqual(t2 - t1, 0.03)

    def test_stale_cache_fallback(self):
        cache = IntelligentCacheManager()
        cache.set("test_stale_key", {"price": 150.0}, ttl_seconds=0.05)

        # Fresh hit
        self.assertEqual(cache.get("test_stale_key")["price"], 150.0)

        # Wait for expiration
        time.sleep(0.08)

        # Fresh get should miss (expired)
        self.assertIsNone(cache.get("test_stale_key"))

        # Stale get should hit (graceful fallback)
        stale_val = cache.get_stale("test_stale_key")
        self.assertIsNotNone(stale_val)
        self.assertEqual(stale_val["price"], 150.0)

    def test_session_manager_backoff_and_retry_on_429(self):
        sm = UnifiedSessionManager()
        mock_429 = MagicMock()
        mock_429.status_code = 429
        mock_429.headers = {"Retry-After": "0.1"}
        mock_429.text = "Too Many Requests"

        mock_200 = MagicMock()
        mock_200.status_code = 200
        mock_200.headers = {}
        mock_200.text = "OK"

        # Mock session to return 429 then 200
        mock_session = MagicMock()
        mock_session.get.side_effect = [mock_429, mock_200]

        with patch.object(sm, "get_session", return_value=mock_session),              patch.object(sm, "reset_session") as mock_reset:
            resp = sm.get("https://example.com/api", max_retries=2)
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(mock_session.get.call_count, 2)
            self.assertTrue(mock_reset.called)


if __name__ == "__main__":
    unittest.main()
