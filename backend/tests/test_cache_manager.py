import unittest
import time
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from cache_manager import IntelligentCacheManager


class TestCacheManager(unittest.TestCase):
    def setUp(self):
        IntelligentCacheManager._instance = None
        self.cache = IntelligentCacheManager(max_entries=5)

    def tearDown(self):
        IntelligentCacheManager._instance = None

    def test_cache_set_and_get(self):
        self.cache.set("test_key", {"data": 123}, ttl_seconds=10.0)
        val = self.cache.get("test_key")
        self.assertIsNotNone(val)
        self.assertEqual(val.get("data"), 123)

    def test_cache_miss(self):
        val = self.cache.get("nonexistent")
        self.assertIsNone(val)

    def test_cache_expiration(self):
        self.cache.set("expire_key", "hello", ttl_seconds=0.05)
        time.sleep(0.08)
        val = self.cache.get("expire_key")
        self.assertIsNone(val)

    def test_cache_invalidate(self):
        self.cache.set("prefix:1", "a", ttl_seconds=100)
        self.cache.set("prefix:2", "b", ttl_seconds=100)
        self.cache.set("other:1", "c", ttl_seconds=100)
        
        count = self.cache.invalidate("prefix:")
        self.assertEqual(count, 2)
        self.assertIsNone(self.cache.get("prefix:1"))
        self.assertIsNone(self.cache.get("prefix:2"))
        self.assertIsNotNone(self.cache.get("other:1"))

    def test_cache_telemetry(self):
        self.cache.set("k1", "v1", ttl_seconds=100)
        self.cache.get("k1")  # hit
        self.cache.get("k2")  # miss
        stats = self.cache.get_stats()
        self.assertGreaterEqual(stats["hits"], 1)
        self.assertGreaterEqual(stats["misses"], 1)


if __name__ == "__main__":
    unittest.main()
