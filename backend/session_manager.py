"""
Unified Session Manager for Stock Range Ledger.

Provides a thread-safe singleton persistent session manager with:
1. Client-side Token Bucket / Leaky Rate Limiter to throttle outbound bursts.
2. Connection pooling (TCP/TLS reuse) with browser TLS fingerprint impersonation (curl_cffi).
3. Exponential backoff with random full jitter for 429 / rate-limit recovery.
4. Active session rotation and crumb re-seeding on repeated throttles.
5. Telemetry diagnostics.

Compatible with yfinance (yf.Ticker, yf.download) and direct REST API calls.
"""

from __future__ import annotations

import logging
import random
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

USER_AGENTS = [
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/128.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/127.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
        "Version/17.5 Safari/605.1.15"
    ),
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) "
        "Gecko/20100101 Firefox/129.0"
    ),
]


class ClientRateLimiter:
    """
    Thread-safe client-side Token Bucket rate limiter.
    Enforces a minimum interval between outbound requests and smooths out bursts
    to prevent triggering Yahoo Finance edge gateway throttles.
    """

    def __init__(self, min_interval: float = 0.35, max_burst: int = 4):
        self.min_interval = min_interval
        self.max_burst = max_burst
        self._tokens = float(max_burst)
        self._last_time = time.time()
        self._lock = threading.Lock()

    def acquire(self) -> None:
        """Blocks until a token is available to make an outbound call."""
        while True:
            with self._lock:
                now = time.time()
                elapsed = now - self._last_time
                self._last_time = now
                self._tokens = min(float(self.max_burst), self._tokens + elapsed / self.min_interval)
                if self._tokens >= 1.0:
                    self._tokens -= 1.0
                    return
                sleep_needed = (1.0 - self._tokens) * self.min_interval
            time.sleep(sleep_needed)


class YahooRateLimitError(Exception):
    """Raised when Yahoo Finance rate limits persist across all retry attempts."""
    pass


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
        self._rate_limits_hit: int = 0
        self._retries_performed: int = 0
        self._crumb: str | None = None
        self._ua_index: int = 0
        self.rate_limiter = ClientRateLimiter(min_interval=0.35, max_burst=4)
        self._init_session()
        self._initialized = True

    def _get_user_agent(self) -> str:
        ua = USER_AGENTS[self._ua_index % len(USER_AGENTS)]
        self._ua_index += 1
        return ua

    def _seed_yahoo_cookies(self, session: Any) -> None:
        """Hits fc.yahoo.com and finance.yahoo.com to pre-seed cookies and obtains an authenticated crumb."""
        try:
            resp = session.get("https://fc.yahoo.com", timeout=5.0)
            logger.info(f"Yahoo session cookie seeded (status: {resp.status_code}, cookies: {len(session.cookies)}).")
        except Exception as exc:
            logger.warning(f"Could not pre-seed Yahoo cookies via fc.yahoo.com: {exc}")

        # Also hit main quote page if cookies are still empty
        if not len(session.cookies):
            try:
                session.get("https://finance.yahoo.com", timeout=5.0)
            except Exception:
                pass

        # Pre-seed crumb to bypass yfinance client-side rate-limits on cloud hosts
        for crumb_url in (
            "https://query1.finance.yahoo.com/v1/test/getcrumb",
            "https://query2.finance.yahoo.com/v1/test/getcrumb",
        ):
            try:
                c_resp = session.get(crumb_url, timeout=5.0)
                if c_resp.status_code == 200 and c_resp.text and "<html>" not in c_resp.text and "Too Many" not in c_resp.text:
                    self._crumb = c_resp.text.strip()
                    logger.info(f"Yahoo session crumb pre-seeded ({self._crumb[:4]}***).")
                    break
            except Exception as c_exc:
                logger.debug(f"Crumb fetch attempt failed on {crumb_url}: {c_exc}")

    def _init_session(self) -> None:
        """Configures a new persistent session with optimized connection pools, headers, and cookies."""
        ua = self._get_user_agent()
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
                "User-Agent": ua,
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
                "Connection": "keep-alive",
            }
        )
        self._seed_yahoo_cookies(s)
        self._session = s
        self._is_cffi = False
        self._created_at = time.time()
        logger.info(f"Unified persistent session initialized using requests.Session fallback (UA: {ua[:35]}...).")

    def get_crumb(self) -> str | None:
        """Returns the pre-seeded Yahoo Finance crumb if available."""
        with self._session_lock:
            if not self._crumb and self._session:
                for crumb_url in (
                    "https://query1.finance.yahoo.com/v1/test/getcrumb",
                    "https://query2.finance.yahoo.com/v1/test/getcrumb",
                ):
                    try:
                        c_resp = self._session.get(crumb_url, timeout=5.0)
                        if c_resp.status_code == 200 and c_resp.text and "<html>" not in c_resp.text and "Too Many" not in c_resp.text:
                            self._crumb = c_resp.text.strip()
                            break
                    except Exception:
                        pass
            return self._crumb

    def create_ticker(self, ticker: str) -> Any:
        """Creates a yf.Ticker instance configured with pooled session and pre-seeded crumb."""
        clean_sym = ticker.strip().upper()
        try:
            import yfinance as yf
            t = yf.Ticker(clean_sym, session=self.get_session())
            crumb = self.get_crumb()
            if crumb and hasattr(t, "_data") and t._data is not None:
                t._data._crumb = crumb
            return t
        except Exception as exc:
            logger.debug(f"create_ticker failed for {clean_sym}: {exc}")
            return None

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
            # Enforce 3-second cooldown debounce on automated reset triggers to prevent thrashing
            if reason not in ("manual", "scheduled_rotation") and (now - self._created_at < 3.0):
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
        timeout: float = 6.0,
        max_retries: int = 3,
        **kwargs: Any,
    ) -> Any:
        """
        Executes an HTTP GET using the shared connection pool with:
        1. Token-bucket rate limiting before each call.
        2. Exponential backoff and full jitter on HTTP 429/401/403.
        3. Dynamic session rotation and cookie renewal on consecutive failures.
        """
        last_resp = None
        base_backoff = 1.0
        max_backoff = 8.0

        for attempt in range(max_retries):
            # Throttle client-side request rate
            self.rate_limiter.acquire()

            session = self.get_session()
            with self._session_lock:
                self._request_count += 1

            try:
                resp = session.get(url, params=params, headers=headers, timeout=timeout, **kwargs)
                last_resp = resp

                # Check if rate-limited or crumb expired
                is_rate_limited = resp.status_code in (401, 403, 429)
                if not is_rate_limited and resp.status_code == 200:
                    text_sample = resp.text[:300] if hasattr(resp, "text") else ""
                    if "Too Many Requests" in text_sample or "Rate Limit" in text_sample:
                        is_rate_limited = True

                if not is_rate_limited:
                    return resp

                with self._session_lock:
                    self._rate_limits_hit += 1
                    self._retries_performed += 1

                # Parse Retry-After header if provided by Yahoo
                retry_after_hdr = resp.headers.get("Retry-After") if hasattr(resp, "headers") else None
                retry_after_val = None
                if retry_after_hdr:
                    try:
                        retry_after_val = float(retry_after_hdr)
                    except (ValueError, TypeError):
                        pass

                # Calculate exponential backoff with full jitter
                if retry_after_val is not None and retry_after_val > 0:
                    sleep_time = retry_after_val + random.uniform(0.1, 0.5)
                else:
                    backoff = min(max_backoff, base_backoff * (2 ** attempt))
                    sleep_time = random.uniform(backoff * 0.5, backoff)

                logger.warning(
                    f"Yahoo rate-limit / auth issue (HTTP {resp.status_code}) on {url}. "
                    f"Attempt {attempt + 1}/{max_retries}. Refreshing session and waiting {sleep_time:.2f}s..."
                )
                self.reset_session(reason=f"http_{resp.status_code}_attempt_{attempt + 1}")
                time.sleep(sleep_time)

            except Exception as exc:
                with self._session_lock:
                    self._retries_performed += 1

                backoff = min(max_backoff, base_backoff * (2 ** attempt))
                sleep_time = random.uniform(backoff * 0.5, backoff)
                logger.warning(
                    f"Request exception on {url}: {exc}. "
                    f"Attempt {attempt + 1}/{max_retries}. Waiting {sleep_time:.2f}s..."
                )
                self.reset_session(reason="network_exception")
                time.sleep(sleep_time)

        return last_resp

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
                "rate_limits_hit": self._rate_limits_hit,
                "retries_performed": self._retries_performed,
                "cookies_held": cookie_count,
                "crumb_present": bool(self._crumb),
            }


# Singleton export
session_manager = UnifiedSessionManager()
