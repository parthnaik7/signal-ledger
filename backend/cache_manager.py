"""
Intelligent Tiered In-Memory Caching Layer for Stock Range Ledger.

Features:
- Thread-safe storage with TTL expiration per entry.
- Tiered default TTLs based on data volatility (search, quotes, analysis, metadata).
- Automatic eviction of expired entries and LRU bounds to avoid unbounded memory growth.
- Force-refresh support (bypasses cache and updates fresh value).
- Telemetry: hits, misses, hit rate, latency saved.
"""

from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass
from typing import Any, Callable

logger = logging.getLogger("stock_ledger.cache")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)


@dataclass
class CacheEntry:
    value: Any
    expires_at: float
    created_at: float
    hit_count: int = 0


class CacheTier:
    SEARCH = 300.0       # 5 minutes for autocomplete suggestions
    QUOTE = 60.0         # 1 minute for live quotes and intraday bid/ask
    ANALYSIS = 180.0     # 3 minutes for historical daily range ledgers
    METADATA = 3600.0    # 1 hour for company name, ATH, ATL, similar stocks
    SIGNAL_REVIEW = 1800.0  # 30 minutes for institutional ratings & price targets
    GEMINI = 1800.0         # 30 minutes for AI research perspectives & briefings


class IntelligentCacheManager:
    """Thread-safe in-memory cache with tiered TTL and LRU bounds."""

    _instance: IntelligentCacheManager | None = None
    _lock = threading.Lock()

    def __new__(cls, *args: Any, **kwargs: Any) -> IntelligentCacheManager:
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, max_entries: int = 500) -> None:
        if getattr(self, "_initialized", False):
            return
        self._max_entries = max_entries
        self._store: dict[str, CacheEntry] = {}
        self._store_lock = threading.Lock()

        # Telemetry stats
        self._hits: int = 0
        self._misses: int = 0
        self._evictions: int = 0
        self._initialized = True

    def _purge_expired_locked(self) -> None:
        now = time.time()
        expired_keys = [k for k, v in self._store.items() if v.expires_at <= now]
        for k in expired_keys:
            del self._store[k]

    def _enforce_max_size_locked(self) -> None:
        if len(self._store) <= self._max_entries:
            return
        self._purge_expired_locked()
        if len(self._store) <= self._max_entries:
            return
        # Evict least frequently used or oldest created
        sorted_keys = sorted(self._store.keys(), key=lambda k: (self._store[k].hit_count, self._store[k].created_at))
        to_evict = len(self._store) - self._max_entries
        for k in sorted_keys[:to_evict]:
            del self._store[k]
            self._evictions += 1

    def get(self, key: str) -> Any | None:
        """Retrieves a cached item if present and unexpired. Increments telemetry."""
        now = time.time()
        with self._store_lock:
            entry = self._store.get(key)
            if entry is None:
                self._misses += 1
                return None
            if entry.expires_at <= now:
                del self._store[key]
                self._misses += 1
                return None

            entry.hit_count += 1
            self._hits += 1
            return entry.value

    def set(self, key: str, value: Any, ttl_seconds: float = CacheTier.ANALYSIS) -> None:
        """Stores an item with specified TTL."""
        now = time.time()
        with self._store_lock:
            self._store[key] = CacheEntry(
                value=value,
                expires_at=now + ttl_seconds,
                created_at=now,
            )
            self._enforce_max_size_locked()

    def invalidate(self, prefix: str = "") -> int:
        """Invalidates all keys matching a prefix (or everything if prefix is empty)."""
        with self._store_lock:
            if not prefix:
                count = len(self._store)
                self._store.clear()
                return count
            keys_to_del = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_del:
                del self._store[k]
            return len(keys_to_del)

    def get_or_compute(
        self,
        key: str,
        compute_fn: Callable[[], Any],
        ttl_seconds: float = CacheTier.ANALYSIS,
        force_refresh: bool = False,
    ) -> tuple[Any, bool]:
        """
        Retrieves cached value if present and not forced.
        Otherwise computes fresh value, caches it, and returns (value, is_cache_hit).
        """
        if not force_refresh:
            cached_val = self.get(key)
            if cached_val is not None:
                return cached_val, True

        # Compute fresh value
        fresh_val = compute_fn()
        self.set(key, fresh_val, ttl_seconds=ttl_seconds)
        return fresh_val, False

    def get_stats(self) -> dict[str, Any]:
        """Returns cache telemetry summary."""
        now = time.time()
        with self._store_lock:
            active_count = sum(1 for v in self._store.values() if v.expires_at > now)
            total_requests = self._hits + self._misses
            hit_rate = (self._hits / total_requests * 100.0) if total_requests > 0 else 0.0
            return {
                "active_entries": active_count,
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate_pct": round(hit_rate, 2),
                "evictions": self._evictions,
                "max_entries": self._max_entries,
            }


# Singleton export
cache_manager = IntelligentCacheManager()
