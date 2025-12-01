/**
 * Response Caching Layer
 *
 * Phase 2, Week 3, Day 1 (Enhanced Phase 3, Week 9)
 * Redis-based caching for AI responses with TTL and invalidation.
 *
 * Features:
 * - Upstash Redis for serverless-friendly caching
 * - TTL-based expiration by content type
 * - Cache key generation with industry/country/prompt hashing
 * - Manual invalidation support
 * - Cache statistics tracking
 * - Fallback to in-memory cache when Redis unavailable
 */

import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

// ================================================================
// TYPES
// ================================================================

/**
 * Cache entry metadata
 */
export interface CacheMetadata {
  createdAt: number;
  expiresAt: number;
  hitCount: number;
  lastAccessedAt: number;
  source: 'redis' | 'memory';
}

/**
 * Cached AI response
 */
export interface CachedAIResponse<T = unknown> {
  data: T;
  metadata: CacheMetadata;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Redis URL (Upstash) */
  redisUrl?: string;
  /** Redis token (Upstash) */
  redisToken?: string;
  /** Default TTL in seconds */
  defaultTTL?: number;
  /** Enable in-memory fallback */
  enableMemoryFallback?: boolean;
  /** Max memory cache entries */
  maxMemoryEntries?: number;
  /** Key prefix for namespacing */
  keyPrefix?: string;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  memoryEntries: number;
  redisConnected: boolean;
}

/**
 * Cache key options for AI responses
 */
export interface AIResponseCacheKeyOptions {
  industry?: string;
  country?: string;
  provider?: string;
  prompt: string;
  version?: string;
}

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Cache TTL by content type (in seconds)
 */
export const CACHE_TTL = {
  /** AI analysis response - 24 hours */
  aiResponse: 24 * 60 * 60,
  /** URL metadata - 7 days */
  urlMetadata: 7 * 24 * 60 * 60,
  /** Industry mapping - 30 days */
  industryMapping: 30 * 24 * 60 * 60,
  /** Score calculation - 1 hour */
  scoreCalculation: 60 * 60,
  /** Provider health check - 5 minutes */
  healthCheck: 5 * 60,
  /** Rate limit data - 1 minute */
  rateLimit: 60,
} as const;

/**
 * Cache key prefixes
 */
export const CACHE_PREFIXES = {
  aiResponse: 'ai:response',
  urlMetadata: 'url:meta',
  industryMapping: 'industry:map',
  score: 'score',
  health: 'health',
  rate: 'rate',
} as const;

// ================================================================
// CACHE IMPLEMENTATION
// ================================================================

/**
 * Response Cache Service
 */
export class ResponseCache {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    memoryEntries: 0,
    redisConnected: false,
  };
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      redisUrl: config.redisUrl || process.env.UPSTASH_REDIS_REST_URL || '',
      redisToken: config.redisToken || process.env.UPSTASH_REDIS_REST_TOKEN || '',
      defaultTTL: config.defaultTTL || CACHE_TTL.aiResponse,
      enableMemoryFallback: config.enableMemoryFallback ?? true,
      maxMemoryEntries: config.maxMemoryEntries || 1000,
      keyPrefix: config.keyPrefix || 'aip',
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   */
  private initializeRedis(): void {
    if (this.config.redisUrl && this.config.redisToken) {
      try {
        this.redis = new Redis({
          url: this.config.redisUrl,
          token: this.config.redisToken,
        });
        this.stats.redisConnected = true;
      } catch (error) {
        console.warn('Failed to initialize Redis, using memory fallback:', error);
        this.redis = null;
        this.stats.redisConnected = false;
      }
    }
  }

  /**
   * Generate a full cache key
   */
  private getFullKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  /**
   * Hash a string for cache key
   */
  private hashString(str: string): string {
    return createHash('sha256').update(str).digest('hex').substring(0, 16);
  }

  /**
   * Generate cache key for AI response
   */
  generateAIResponseKey(options: AIResponseCacheKeyOptions): string {
    const parts = [
      CACHE_PREFIXES.aiResponse,
      options.industry || 'general',
      options.country || 'global',
      options.provider || 'default',
      options.version || 'v1',
      this.hashString(options.prompt),
    ];
    return parts.join(':');
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<CachedAIResponse<T> | null> {
    const fullKey = this.getFullKey(key);

    try {
      // Try Redis first
      if (this.redis) {
        const data = await this.redis.get<string>(fullKey);
        if (data) {
          this.stats.hits++;
          this.updateHitRate();
          const parsed = JSON.parse(data) as CachedAIResponse<T>;

          // Update hit count and last accessed
          parsed.metadata.hitCount++;
          parsed.metadata.lastAccessedAt = Date.now();

          // Update in Redis (fire and forget)
          this.redis.set(fullKey, JSON.stringify(parsed), {
            ex: Math.floor((parsed.metadata.expiresAt - Date.now()) / 1000),
          }).catch(() => {});

          return parsed;
        }
      }

      // Fall back to memory cache
      if (this.config.enableMemoryFallback) {
        const memEntry = this.memoryCache.get(fullKey);
        if (memEntry && memEntry.expiresAt > Date.now()) {
          this.stats.hits++;
          this.updateHitRate();
          const parsed = JSON.parse(memEntry.value) as CachedAIResponse<T>;
          parsed.metadata.source = 'memory';
          parsed.metadata.hitCount++;
          parsed.metadata.lastAccessedAt = Date.now();
          return parsed;
        } else if (memEntry) {
          // Expired, remove it
          this.memoryCache.delete(fullKey);
        }
      }

      this.stats.misses++;
      this.updateHitRate();
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const fullKey = this.getFullKey(key);
    const ttl = ttlSeconds || this.config.defaultTTL;
    const now = Date.now();

    const cacheEntry: CachedAIResponse<T> = {
      data: value,
      metadata: {
        createdAt: now,
        expiresAt: now + ttl * 1000,
        hitCount: 0,
        lastAccessedAt: now,
        source: this.redis ? 'redis' : 'memory',
      },
    };

    const serialized = JSON.stringify(cacheEntry);

    try {
      // Store in Redis
      if (this.redis) {
        await this.redis.set(fullKey, serialized, { ex: ttl });
      }

      // Also store in memory for fast access
      if (this.config.enableMemoryFallback) {
        // Evict old entries if at capacity
        if (this.memoryCache.size >= this.config.maxMemoryEntries) {
          this.evictOldestMemoryEntries(Math.floor(this.config.maxMemoryEntries * 0.2));
        }

        this.memoryCache.set(fullKey, {
          value: serialized,
          expiresAt: now + ttl * 1000,
        });
        this.stats.memoryEntries = this.memoryCache.size;
      }

      this.stats.sets++;
    } catch (error) {
      console.error('Cache set error:', error);

      // Fall back to memory only
      if (this.config.enableMemoryFallback) {
        this.memoryCache.set(fullKey, {
          value: serialized,
          expiresAt: now + ttl * 1000,
        });
        this.stats.memoryEntries = this.memoryCache.size;
      }
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);

    try {
      if (this.redis) {
        await this.redis.del(fullKey);
      }
      this.memoryCache.delete(fullKey);
      this.stats.memoryEntries = this.memoryCache.size;
      this.stats.deletes++;
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const fullPattern = this.getFullKey(pattern);
    let deleted = 0;

    try {
      // Delete from Redis using SCAN (Upstash compatible)
      if (this.redis) {
        let cursor = 0;
        do {
          const result = await this.redis.scan(cursor, {
            match: fullPattern.replace('*', '*'),
            count: 100,
          });
          cursor = result[0];
          const keys = result[1];

          if (keys.length > 0) {
            await this.redis.del(...keys);
            deleted += keys.length;
          }
        } while (cursor !== 0);
      }

      // Delete from memory cache
      for (const key of this.memoryCache.keys()) {
        if (this.matchPattern(key, fullPattern)) {
          this.memoryCache.delete(key);
          deleted++;
        }
      }

      this.stats.memoryEntries = this.memoryCache.size;
      this.stats.deletes += deleted;
      return deleted;
    } catch (error) {
      console.error('Cache deletePattern error:', error);
      return deleted;
    }
  }

  /**
   * Invalidate AI response cache for specific criteria
   */
  async invalidateAIResponses(options: Partial<AIResponseCacheKeyOptions>): Promise<number> {
    const parts = [
      CACHE_PREFIXES.aiResponse,
      options.industry || '*',
      options.country || '*',
      options.provider || '*',
      options.version || '*',
      '*',
    ];
    const pattern = parts.join(':');
    return this.deletePattern(pattern);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        // Use pattern delete for our prefix
        await this.deletePattern('*');
      }
      this.memoryCache.clear();
      this.stats.memoryEntries = 0;
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      memoryEntries: this.memoryCache.size,
      redisConnected: this.redis !== null,
    };
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.redis !== null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();

    try {
      if (this.redis) {
        await this.redis.ping();
      }
      return {
        healthy: true,
        latencyMs: Date.now() - start,
      };
    } catch {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
      };
    }
  }

  // ================================================================
  // PRIVATE HELPERS
  // ================================================================

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private evictOldestMemoryEntries(count: number): void {
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => {
        try {
          const aData = JSON.parse(a[1].value) as CachedAIResponse<unknown>;
          const bData = JSON.parse(b[1].value) as CachedAIResponse<unknown>;
          return aData.metadata.lastAccessedAt - bData.metadata.lastAccessedAt;
        } catch {
          return 0;
        }
      })
      .slice(0, count);

    for (const [key] of entries) {
      this.memoryCache.delete(key);
    }
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`).test(key);
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let cacheInstance: ResponseCache | null = null;

/**
 * Get the global cache instance
 */
export function getCache(): ResponseCache {
  if (!cacheInstance) {
    cacheInstance = new ResponseCache();
  }
  return cacheInstance;
}

/**
 * Create a new cache instance (for testing)
 */
export function createCache(config?: CacheConfig): ResponseCache {
  return new ResponseCache(config);
}

/**
 * Reset the global cache instance (for testing)
 */
export function resetCache(): void {
  if (cacheInstance) {
    cacheInstance.clear();
  }
  cacheInstance = null;
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Cached function wrapper
 */
export function withCache<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  keyGenerator: (...args: Args) => string,
  ttlSeconds?: number
): (...args: Args) => Promise<T> {
  const cache = getCache();

  return async (...args: Args): Promise<T> => {
    const key = keyGenerator(...args);

    // Try to get from cache
    const cached = await cache.get<T>(key);
    if (cached) {
      return cached.data;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await cache.set(key, result, ttlSeconds);

    return result;
  };
}

/**
 * Cache decorator for class methods
 */
export function Cached(keyPrefix: string, ttlSeconds?: number) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]): Promise<unknown> {
      const cache = getCache();
      const key = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`;

      const cached = await cache.get(key);
      if (cached) {
        return cached.data;
      }

      const result = await originalMethod.apply(this, args);
      await cache.set(key, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}

// ================================================================
// EXPORTS
// ================================================================

// ================================================================
// LRU MEMORY CACHE (Enhanced Phase 3)
// ================================================================

/**
 * LRU Cache Entry with full metadata
 */
export interface LRUCacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
  accessedAt: number;
  accessCount: number;
  size: number;
  tags: string[];
  isRevalidating: boolean;
}

/**
 * LRU Memory Cache with advanced features
 */
export class LRUMemoryCache {
  private cache: Map<string, LRUCacheEntry<unknown>> = new Map();
  private accessOrder: string[] = [];
  private maxSize: number;
  private defaultTtl: number;
  private namespace: string;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    staleHits: 0,
  };

  constructor(options: {
    maxSize?: number;
    defaultTtl?: number;
    namespace?: string;
  } = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTtl = options.defaultTtl || 300;
    this.namespace = options.namespace || 'lru';
  }

  private prefixKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  get<T>(key: string): T | null {
    const prefixedKey = this.prefixKey(key);
    const entry = this.cache.get(prefixedKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (entry.expiresAt < now) {
      this.cache.delete(prefixedKey);
      this.accessOrder = this.accessOrder.filter(k => k !== prefixedKey);
      this.stats.misses++;
      return null;
    }

    // Update access info
    entry.accessedAt = now;
    entry.accessCount++;

    // Move to end of access order (most recently used)
    this.accessOrder = this.accessOrder.filter(k => k !== prefixedKey);
    this.accessOrder.push(prefixedKey);

    this.stats.hits++;
    return entry.value as T;
  }

  set<T>(key: string, value: T, options: { ttl?: number; tags?: string[] } = {}): void {
    const prefixedKey = this.prefixKey(key);
    const now = Date.now();
    const ttl = options.ttl ?? this.defaultTtl;

    // Evict if at capacity
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    const entry: LRUCacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: now + (ttl * 1000),
      accessedAt: now,
      accessCount: 1,
      size: JSON.stringify(value).length * 2,
      tags: options.tags || [],
      isRevalidating: false,
    };

    // Remove from access order if exists
    this.accessOrder = this.accessOrder.filter(k => k !== prefixedKey);
    this.accessOrder.push(prefixedKey);

    this.cache.set(prefixedKey, entry as LRUCacheEntry<unknown>);
  }

  delete(key: string): boolean {
    const prefixedKey = this.prefixKey(key);
    this.accessOrder = this.accessOrder.filter(k => k !== prefixedKey);
    return this.cache.delete(prefixedKey);
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
        count++;
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    return count;
  }

  invalidateByPattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
        count++;
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }

    return count;
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, options);
    return value;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  static buildKey(options: {
    resource: string;
    id?: string;
    userId?: string;
    params?: Record<string, string | number | boolean>;
  }): string {
    const parts: string[] = [options.resource];
    if (options.userId) parts.push(`user:${options.userId}`);
    if (options.id) parts.push(options.id);
    if (options.params) {
      const sortedParams = Object.entries(options.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (sortedParams) parts.push(sortedParams);
    }
    return parts.join(':');
  }
}

// Singleton for LRU cache
let lruCacheInstance: LRUMemoryCache | null = null;

export function getLRUCache(): LRUMemoryCache {
  if (!lruCacheInstance) {
    lruCacheInstance = new LRUMemoryCache();
  }
  return lruCacheInstance;
}

export function createLRUCache(options?: {
  maxSize?: number;
  defaultTtl?: number;
  namespace?: string;
}): LRUMemoryCache {
  return new LRUMemoryCache(options);
}

// ================================================================
// CACHE KEY BUILDERS
// ================================================================

export function scoreCacheKey(brandId: string, userId?: string): string {
  return LRUMemoryCache.buildKey({ resource: 'score', id: brandId, userId });
}

export function brandCacheKey(brandId: string, userId?: string): string {
  return LRUMemoryCache.buildKey({ resource: 'brand', id: brandId, userId });
}

export function leaderboardCacheKey(industry?: string, timeframe?: string): string {
  const params: Record<string, string> = {};
  if (industry) params.industry = industry;
  if (timeframe) params.timeframe = timeframe;
  return LRUMemoryCache.buildKey({ resource: 'leaderboard', params });
}

export function analyticsCacheKey(userId: string, metric: string, period: string): string {
  return `analytics:user:${userId}:${metric}:${period}`;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  ResponseCache,
  getCache,
  createCache,
  resetCache,
  withCache,
  Cached,
  CACHE_TTL,
  CACHE_PREFIXES,
  LRUMemoryCache,
  getLRUCache,
  createLRUCache,
  scoreCacheKey,
  brandCacheKey,
  leaderboardCacheKey,
  analyticsCacheKey,
};
