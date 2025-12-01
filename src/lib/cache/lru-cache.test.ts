/**
 * LRU Memory Cache Tests
 *
 * Phase 3, Week 9, Day 1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  LRUMemoryCache,
  createLRUCache,
  getLRUCache,
  scoreCacheKey,
  brandCacheKey,
  leaderboardCacheKey,
  analyticsCacheKey,
} from './index';

describe('LRUMemoryCache', () => {
  let cache: LRUMemoryCache;

  beforeEach(() => {
    cache = createLRUCache({ maxSize: 10, defaultTtl: 60, namespace: 'test' });
  });

  // ================================================================
  // BASIC OPERATIONS
  // ================================================================

  describe('basic operations', () => {
    it('should set and get a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for missing key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete a key', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return false when deleting nonexistent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });

    it('should store different types of values', () => {
      cache.set('string', 'hello');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { name: 'test' });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('hello');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ name: 'test' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });
  });

  // ================================================================
  // TTL AND EXPIRATION
  // ================================================================

  describe('TTL and expiration', () => {
    it('should use default TTL', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should respect custom TTL', () => {
      cache.set('key1', 'value1', { ttl: 1 }); // 1 second TTL
      expect(cache.get('key1')).toBe('value1');
    });

    it('should expire entries after TTL', async () => {
      vi.useFakeTimers();

      cache.set('key1', 'value1', { ttl: 1 }); // 1 second TTL
      expect(cache.get('key1')).toBe('value1');

      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000);

      expect(cache.get('key1')).toBeNull();

      vi.useRealTimers();
    });

    it('should not expire entry before TTL', async () => {
      vi.useFakeTimers();

      cache.set('key1', 'value1', { ttl: 10 }); // 10 seconds TTL

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);

      expect(cache.get('key1')).toBe('value1');

      vi.useRealTimers();
    });
  });

  // ================================================================
  // LRU EVICTION
  // ================================================================

  describe('LRU eviction', () => {
    it('should evict least recently used when at capacity', () => {
      const smallCache = createLRUCache({ maxSize: 3 });

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      // Access key1 to make it recently used
      smallCache.get('key1');

      // Add new entry, should evict key2 (least recently used)
      smallCache.set('key4', 'value4');

      expect(smallCache.get('key1')).toBe('value1'); // Still exists
      expect(smallCache.get('key2')).toBeNull(); // Evicted
      expect(smallCache.get('key3')).not.toBeNull(); // Still exists
      expect(smallCache.get('key4')).toBe('value4'); // New entry
    });

    it('should track eviction in stats', () => {
      const smallCache = createLRUCache({ maxSize: 2 });

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Should evict key1

      const stats = smallCache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it('should update access order on get', () => {
      const smallCache = createLRUCache({ maxSize: 3 });

      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3');

      // Access key1 multiple times
      smallCache.get('key1');
      smallCache.get('key1');

      // Add new entries
      smallCache.set('key4', 'value4');
      smallCache.set('key5', 'value5');

      // key1 should still exist (recently accessed)
      expect(smallCache.get('key1')).toBe('value1');
    });
  });

  // ================================================================
  // TAG-BASED INVALIDATION
  // ================================================================

  describe('tag-based invalidation', () => {
    it('should set entries with tags', () => {
      cache.set('key1', 'value1', { tags: ['user', 'profile'] });
      cache.set('key2', 'value2', { tags: ['user', 'settings'] });
      cache.set('key3', 'value3', { tags: ['admin'] });

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('should invalidate by tag', () => {
      cache.set('key1', 'value1', { tags: ['user'] });
      cache.set('key2', 'value2', { tags: ['user'] });
      cache.set('key3', 'value3', { tags: ['admin'] });

      const count = cache.invalidateByTag('user');

      expect(count).toBe(2);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBe('value3');
    });

    it('should return 0 for non-matching tag', () => {
      cache.set('key1', 'value1', { tags: ['user'] });

      const count = cache.invalidateByTag('nonexistent');

      expect(count).toBe(0);
    });
  });

  // ================================================================
  // PATTERN-BASED INVALIDATION
  // ================================================================

  describe('pattern-based invalidation', () => {
    it('should invalidate by pattern', () => {
      cache.set('user:1:profile', 'profile1');
      cache.set('user:1:settings', 'settings1');
      cache.set('user:2:profile', 'profile2');
      cache.set('admin:config', 'config');

      const count = cache.invalidateByPattern('user:1');

      expect(count).toBe(2);
      expect(cache.get('user:1:profile')).toBeNull();
      expect(cache.get('user:1:settings')).toBeNull();
      expect(cache.get('user:2:profile')).not.toBeNull();
      expect(cache.get('admin:config')).not.toBeNull();
    });

    it('should handle regex patterns', () => {
      cache.set('score:brand1', 'score1');
      cache.set('score:brand2', 'score2');
      cache.set('brand:brand1', 'brand1');

      const count = cache.invalidateByPattern('^test:score');

      expect(count).toBe(2);
    });
  });

  // ================================================================
  // GET OR SET
  // ================================================================

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      cache.set('key1', 'cached');

      const factory = vi.fn().mockResolvedValue('fresh');
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('cached');
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory if not cached', async () => {
      const factory = vi.fn().mockResolvedValue('fresh');
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('fresh');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should cache the factory result', async () => {
      const factory = vi.fn().mockResolvedValue('fresh');

      await cache.getOrSet('key1', factory);
      const result = await cache.getOrSet('key1', factory);

      expect(result).toBe('fresh');
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('should pass options to set', async () => {
      const factory = vi.fn().mockResolvedValue('value');

      await cache.getOrSet('key1', factory, { ttl: 10, tags: ['test'] });

      // Verify the entry was stored with tags
      cache.set('key2', 'value2', { tags: ['test'] });
      const count = cache.invalidateByTag('test');
      expect(count).toBe(2);
    });
  });

  // ================================================================
  // STATISTICS
  // ================================================================

  describe('statistics', () => {
    it('should track hits', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key1');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track misses', () => {
      cache.get('nonexistent1');
      cache.get('nonexistent2');

      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should calculate hit rate', () => {
      cache.set('key1', 'value1');
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('key1'); // Hit
      cache.get('nonexistent'); // Miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBe(75);
    });

    it('should track cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const stats = cache.getStats();
      expect(stats.size).toBe(3);
    });

    it('should return 0 hit rate for empty cache', () => {
      const stats = cache.getStats();
      expect(stats.hitRate).toBe(0);
    });
  });

  // ================================================================
  // KEY BUILDER
  // ================================================================

  describe('buildKey', () => {
    it('should build key with resource only', () => {
      const key = LRUMemoryCache.buildKey({ resource: 'scores' });
      expect(key).toBe('scores');
    });

    it('should build key with resource and id', () => {
      const key = LRUMemoryCache.buildKey({ resource: 'score', id: 'brand123' });
      expect(key).toBe('score:brand123');
    });

    it('should build key with userId', () => {
      const key = LRUMemoryCache.buildKey({
        resource: 'score',
        id: 'brand123',
        userId: 'user456',
      });
      expect(key).toBe('score:user:user456:brand123');
    });

    it('should build key with sorted params', () => {
      const key = LRUMemoryCache.buildKey({
        resource: 'leaderboard',
        params: { limit: 10, industry: 'saas', sort: 'desc' },
      });
      expect(key).toBe('leaderboard:industry=saas&limit=10&sort=desc');
    });

    it('should handle empty params', () => {
      const key = LRUMemoryCache.buildKey({
        resource: 'test',
        params: {},
      });
      expect(key).toBe('test');
    });
  });
});

// ================================================================
// CACHE KEY HELPERS
// ================================================================

describe('Cache Key Helpers', () => {
  describe('scoreCacheKey', () => {
    it('should build score cache key', () => {
      const key = scoreCacheKey('brand123');
      expect(key).toBe('score:brand123');
    });

    it('should include userId if provided', () => {
      const key = scoreCacheKey('brand123', 'user456');
      expect(key).toBe('score:user:user456:brand123');
    });
  });

  describe('brandCacheKey', () => {
    it('should build brand cache key', () => {
      const key = brandCacheKey('brand123');
      expect(key).toBe('brand:brand123');
    });

    it('should include userId if provided', () => {
      const key = brandCacheKey('brand123', 'user456');
      expect(key).toBe('brand:user:user456:brand123');
    });
  });

  describe('leaderboardCacheKey', () => {
    it('should build leaderboard cache key', () => {
      const key = leaderboardCacheKey();
      expect(key).toBe('leaderboard');
    });

    it('should include industry if provided', () => {
      const key = leaderboardCacheKey('saas');
      expect(key).toBe('leaderboard:industry=saas');
    });

    it('should include timeframe if provided', () => {
      const key = leaderboardCacheKey(undefined, '30d');
      expect(key).toBe('leaderboard:timeframe=30d');
    });

    it('should include both industry and timeframe', () => {
      const key = leaderboardCacheKey('saas', '30d');
      expect(key).toBe('leaderboard:industry=saas&timeframe=30d');
    });
  });

  describe('analyticsCacheKey', () => {
    it('should build analytics cache key', () => {
      const key = analyticsCacheKey('user123', 'pageviews', '7d');
      expect(key).toBe('analytics:user:user123:pageviews:7d');
    });
  });
});

// ================================================================
// SINGLETON
// ================================================================

describe('getLRUCache', () => {
  it('should return same instance', () => {
    const cache1 = getLRUCache();
    const cache2 = getLRUCache();
    expect(cache1).toBe(cache2);
  });
});
