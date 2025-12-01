/**
 * Cache Decorators and Utilities
 *
 * Higher-order functions and utilities for caching
 *
 * Phase 3, Week 9, Day 1
 */

import { getCache, MemoryCache } from './memory-cache';
import { type CacheMetadata, CACHE_TTL, CACHE_TAGS } from './types';

// ================================================================
// CACHED FUNCTION WRAPPER
// ================================================================

export interface CachedOptions extends CacheMetadata {
  /** Custom key generator */
  keyGenerator?: (...args: unknown[]) => string;
  /** Cache instance to use */
  cache?: MemoryCache;
  /** Whether to refresh in background on stale */
  refreshOnStale?: boolean;
}

/**
 * Wrap a function with caching
 *
 * @example
 * ```ts
 * const getUser = cached(
 *   async (userId: string) => fetchUser(userId),
 *   { ttl: CACHE_TTL.MEDIUM, tags: ['users'] }
 * );
 * ```
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: CachedOptions = {}
): T {
  const {
    keyGenerator,
    cache: customCache,
    refreshOnStale = false,
    ...metadata
  } = options;

  const cache = customCache || getCache();

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Generate cache key
    const key = keyGenerator
      ? keyGenerator(...args)
      : `fn:${fn.name || 'anonymous'}:${JSON.stringify(args)}`;

    // Try to get from cache
    const cached = cache.get<ReturnType<T>>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const result = await fn(...args);

    // Store in cache
    cache.set(key, result, metadata);

    return result as ReturnType<T>;
  }) as T;
}

/**
 * Wrap a function with cache-aside pattern and SWR
 */
export function cachedWithSWR<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: CachedOptions = {}
): T {
  const {
    keyGenerator,
    cache: customCache,
    swr = 60,
    ...metadata
  } = options;

  const cache = customCache || getCache();

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : `fn:${fn.name || 'anonymous'}:${JSON.stringify(args)}`;

    // Use getOrSet with SWR
    const result = await cache.getOrSet(
      key,
      async () => fn(...args),
      { ...metadata, swr }
    );

    return result as ReturnType<T>;
  }) as T;
}

// ================================================================
// MEMOIZATION
// ================================================================

export interface MemoizeOptions {
  /** Maximum cache size */
  maxSize?: number;
  /** TTL in seconds */
  ttl?: number;
  /** Custom key generator */
  keyGenerator?: (...args: unknown[]) => string;
}

/**
 * Memoize a function with LRU cache
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): T {
  const { maxSize = 100, ttl = CACHE_TTL.MEDIUM, keyGenerator } = options;

  const cache = new MemoryCache({ maxSize, defaultTtl: ttl, namespace: 'memo' });

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    const cached = cache.get<ReturnType<T>>(key);
    if (cached !== null) {
      return cached;
    }

    const result = fn(...args);

    // Handle promises
    if (result instanceof Promise) {
      return result.then((value) => {
        cache.set(key, value);
        return value;
      }) as ReturnType<T>;
    }

    cache.set(key, result);
    return result as ReturnType<T>;
  }) as T;
}

// ================================================================
// CACHE INVALIDATION HELPERS
// ================================================================

/**
 * Invalidate cache entries for a resource
 */
export function invalidateResource(resource: string): number {
  const cache = getCache();
  return cache.invalidateByPattern(`^aip:${resource}`);
}

/**
 * Invalidate cache entries for a specific entity
 */
export function invalidateEntity(resource: string, id: string): number {
  const cache = getCache();
  return cache.invalidateByPattern(`^aip:${resource}:.*${id}`);
}

/**
 * Invalidate all cache entries for a user
 */
export function invalidateUser(userId: string): number {
  const cache = getCache();
  return cache.invalidateByUser(userId);
}

/**
 * Invalidate by tag
 */
export function invalidateTag(tag: string): number {
  const cache = getCache();
  return cache.invalidateByTag(tag);
}

// ================================================================
// CACHE KEY BUILDERS
// ================================================================

/**
 * Build cache key for API response
 */
export function apiCacheKey(
  method: string,
  path: string,
  params?: Record<string, unknown>
): string {
  const parts = ['api', method.toLowerCase(), path.replace(/\//g, ':')];

  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    if (sortedParams) {
      parts.push(sortedParams);
    }
  }

  return parts.join(':');
}

/**
 * Build cache key for score data
 */
export function scoreCacheKey(
  brandId: string,
  userId?: string,
  version?: string
): string {
  const parts = ['score', brandId];
  if (userId) parts.push(`user:${userId}`);
  if (version) parts.push(`v${version}`);
  return parts.join(':');
}

/**
 * Build cache key for brand data
 */
export function brandCacheKey(brandId: string, userId?: string): string {
  const parts = ['brand', brandId];
  if (userId) parts.push(`user:${userId}`);
  return parts.join(':');
}

/**
 * Build cache key for leaderboard
 */
export function leaderboardCacheKey(
  industry?: string,
  timeframe?: string,
  limit?: number
): string {
  const parts = ['leaderboard'];
  if (industry) parts.push(industry);
  if (timeframe) parts.push(timeframe);
  if (limit) parts.push(`limit:${limit}`);
  return parts.join(':');
}

/**
 * Build cache key for analytics data
 */
export function analyticsCacheKey(
  userId: string,
  metric: string,
  period: string
): string {
  return `analytics:user:${userId}:${metric}:${period}`;
}

// ================================================================
// CACHE MIDDLEWARE
// ================================================================

export interface CacheMiddlewareOptions {
  /** TTL in seconds */
  ttl?: number;
  /** Cache tags */
  tags?: string[];
  /** Custom key generator */
  keyGenerator?: (req: Request) => string;
  /** Conditions to skip cache */
  skipIf?: (req: Request) => boolean;
  /** Methods to cache (default: GET) */
  methods?: string[];
}

/**
 * Create cache middleware for API routes
 */
export function createCacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = CACHE_TTL.MEDIUM,
    tags = [CACHE_TAGS.API],
    keyGenerator,
    skipIf,
    methods = ['GET'],
  } = options;

  const cache = getCache();

  return async function cacheMiddleware<T>(
    req: Request,
    handler: () => Promise<T>
  ): Promise<{ data: T; cached: boolean; headers: Record<string, string> }> {
    // Skip cache for non-cacheable methods
    if (!methods.includes(req.method)) {
      return { data: await handler(), cached: false, headers: {} };
    }

    // Skip if condition met
    if (skipIf && skipIf(req)) {
      return { data: await handler(), cached: false, headers: {} };
    }

    // Generate cache key
    const url = new URL(req.url);
    const key = keyGenerator
      ? keyGenerator(req)
      : apiCacheKey(req.method, url.pathname, Object.fromEntries(url.searchParams));

    // Try to get from cache
    const cached = cache.get<T>(key);
    if (cached !== null) {
      return {
        data: cached,
        cached: true,
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`,
        },
      };
    }

    // Execute handler
    const data = await handler();

    // Store in cache
    cache.set(key, data, { ttl, tags });

    return {
      data,
      cached: false,
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': `public, max-age=${ttl}`,
      },
    };
  };
}

// ================================================================
// BATCH CACHE OPERATIONS
// ================================================================

/**
 * Get multiple values from cache
 */
export function multiGet<T>(keys: string[]): Map<string, T | null> {
  const cache = getCache();
  const results = new Map<string, T | null>();

  for (const key of keys) {
    results.set(key, cache.get<T>(key));
  }

  return results;
}

/**
 * Set multiple values in cache
 */
export function multiSet<T>(
  entries: Array<{ key: string; value: T; metadata?: CacheMetadata }>
): void {
  const cache = getCache();

  for (const { key, value, metadata } of entries) {
    cache.set(key, value, metadata);
  }
}

/**
 * Delete multiple keys from cache
 */
export function multiDelete(keys: string[]): number {
  const cache = getCache();
  let deleted = 0;

  for (const key of keys) {
    if (cache.delete(key)) {
      deleted++;
    }
  }

  return deleted;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  cached,
  cachedWithSWR,
  memoize,
  invalidateResource,
  invalidateEntity,
  invalidateUser,
  invalidateTag,
  apiCacheKey,
  scoreCacheKey,
  brandCacheKey,
  leaderboardCacheKey,
  analyticsCacheKey,
  createCacheMiddleware,
  multiGet,
  multiSet,
  multiDelete,
};
