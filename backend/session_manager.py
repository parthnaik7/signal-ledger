"""
Unified Session Manager for Stock Range Ledger.

Provides a thread-safe singleton persistent session manager with connection pooling (TCP/TLS reuse),
browser TLS fingerprint impersonation (curl_cffi), automatic Yahoo Finance cookie seeding (fc.yahoo.com),
and automatic recovery on session/crumb invalidation.

Compatible with yfinance (yf.Ticker, yf.download) and direct REST API calls.
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Any

# Try importing curl_cffi for browser TLS impersonation to bypass Yahoo crumb 429 rate limits
try:
    from curl_cffi import requests as cffi_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger("stock_ledger.session")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


class UnifiedSessionManager:
    """Thread-safe persistent session manager with connection pooling, TLS impersonation, and token reuse."""

    _instance: UnifiedSessionManager | None = None
    _lock = threading.Lock()

    def __new__(cls) -> UnifiedSessionManager:
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self) -> None:
        if getattr(self, "_initialized", False):
            return
        self._session_lock = threading.Lock()
        self._session: Any = None
        self._is_cffi: bool = False
        self._created_at: float = 0.0
        self._request_count: int = 0
        self._reset_count: int = 0
        self._init_session()
        self._initialized = True

    def _seed_yahoo_cookies(self, session: Any) -> None:
        """Hits fc.yahoo.com to pre-seed the essential 'A3' cookie required by Yahoo Finance."""
        try:
            resp = session.get("https://fc.yahoo.com", timeout=5.0)
            logger.info(f"Yahoo session cookie seeded (status: {resp.status_code}, cookies: {len(session.cookies)}).")
        except Exception as exc:
            logger.warning(f"Could not pre-seed Yahoo cookies via fc.yahoo.com: {exc}")

    def _init_session(self) -> None:
        """Configures a new persistent session with optimized connection pools, headers, and cookies."""
        if HAS_CURL_CFFI:
            try:
                s = cffi_requests.Session(impersonate="chrome")
                self._seed_yahoo_cookies(s)
                self._session = s
                self._is_cffi = True
                self._created_at = time.time()
                logger.info("Unified persistent session initialized using curl_cffi (Chrome impersonation).")
                return
            except Exception as exc:
                logger.warning(f"curl_cffi initialization failed ({exc}), falling back to requests.Session.")

        # Fallback to standard requests.Session
        s = requests.Session()
        retries = Retry(
            total=3,
            backoff_factor=0.3,
            status_forcelist=(500, 502, 503, 504),
            raise_on_status=False,
        )
        adapter = HTTPAdapter(
            pool_connections=15,
            pool_maxsize=30,
            max_retries=retries,
            pool_block=False,
        )
        s.mount("https://", adapter)
        s.mount("http://", adapter)
        s.headers.update(
            {
                "User-Agent": (
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/128.0.0.0 Safari/537.36"
                ),
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",
            }
        )
        self._seed_yahoo_cookies(s)
        self._session = s
        self._is_cffi = False
        self._created_at = time.time()
        logger.info("Unified persistent session initialized using requests.Session fallback.")

    def get_session(self) -> Any:
        """Returns the underlying pooled persistent session (compatible with yfinance)."""
        with self._session_lock:
            # Recreate session if older than 12 hours to prevent stale socket leaks
            if time.time() - self._created_at > 43200:
                self.reset_session(reason="scheduled_rotation")
            return self._session

    def reset_session(self, reason: str = "manual") -> None:
        """Closes the current session and creates a fresh connection pool and cookie jar."""
        with self._session_lock:
            now = time.time()
            # Enforce 5-second cooldown debounce on automated reset triggers to prevent thrashing
            if reason not in ("manual", "scheduled_rotation") and (now - self._created_at < 5.0):
                return
            self._reset_count += 1
            if self._session is not None:
                try:
                    self._session.close()
                except Exception:
                    pass
            self._init_session()
            logger.warning(f"Session reset triggered (reason: {reason}, total resets: {self._reset_count}).")

    def get(
        self,
        url: str,
        params: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
        timeout: float = 5.0,
        **kwargs: Any,
    ) -> Any:
        """
        Executes an HTTP GET using the shared connection pool.
        Automatically detects session/token expiration (401/403/429) and recovers.
        """
        session = self.get_session()
        self._request_count += 1

        try:
            resp = session.get(url, params=params, headers=headers, timeout=timeout, **kwargs)
            # If Yahoo returns 401/403/429 due to expired cookie/token, re-authenticate and retry once
            if resp.status_code in (401, 403, 429):
                logger.warning(f"Received HTTP {resp.status_code} on {url}. Renewing session cookies and retrying...")
                self.reset_session(reason=f"http_{resp.status_code}")
                session = self.get_session()
                resp = session.get(url, params=params, headers=headers, timeout=timeout, **kwargs)
            return resp
        except Exception as exc:
            logger.warning(f"Request error on {url}: {exc}. Retrying with fresh session...")
            self.reset_session(reason="exception_retry")
            session = self.get_session()
            return session.get(url, params=params, headers=headers, timeout=timeout, **kwargs)

    def get_stats(self) -> dict[str, Any]:
        """Telemetry diagnostics for the session manager."""
        with self._session_lock:
            cookie_count = len(self._session.cookies) if self._session else 0
            age_seconds = round(time.time() - self._created_at, 1) if self._created_at else 0
            return {
                "active": self._session is not None,
                "engine": "curl_cffi (Chrome impersonate)" if self._is_cffi else "requests.Session",
                "uptime_seconds": age_seconds,
                "request_count": self._request_count,
                "reset_count": self._reset_count,
                "cookies_held": cookie_count,
            }


# Singleton export
session_manager = UnifiedSessionManager()
