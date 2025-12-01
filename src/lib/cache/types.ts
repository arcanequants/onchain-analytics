/**
 * Cache Types
 *
 * Type definitions for the caching layer
 *
 * Phase 3, Week 9, Day 1
 */

// ================================================================
// CACHE CONFIGURATION
// ================================================================

export interface CacheConfig {
  /** Default TTL in seconds */
  defaultTtl: number;
  /** Maximum items in memory cache */
  maxSize: number;
  /** Enable cache statistics */
  enableStats: boolean;
  /** Namespace prefix for keys */
  namespace: string;
  /** Stale-while-revalidate window in seconds */
  staleWhileRevalidate: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  defaultTtl: 300, // 5 minutes
  maxSize: 1000,
  enableStats: true,
  namespace: 'aip',
  staleWhileRevalidate: 60,
};

// ================================================================
// CACHE ENTRY
// ================================================================

export interface CacheEntry<T> {
  /** Cached value */
  value: T;
  /** Creation timestamp */
  createdAt: number;
  /** Expiration timestamp */
  expiresAt: number;
  /** Last access timestamp */
  accessedAt: number;
  /** Access count */
  accessCount: number;
  /** Entry size in bytes (approximate) */
  size: number;
  /** Cache tags for invalidation */
  tags: string[];
  /** Whether entry is currently being revalidated */
  isRevalidating: boolean;
}

export interface CacheMetadata {
  /** Time to live in seconds */
  ttl?: number;
  /** Cache tags for grouped invalidation */
  tags?: string[];
  /** Stale-while-revalidate window */
  swr?: number;
}

// ================================================================
// CACHE STATISTICS
// ================================================================

export interface CacheStats {
  /** Total number of cache hits */
  hits: number;
  /** Total number of cache misses */
  misses: number;
  /** Hit rate percentage */
  hitRate: number;
  /** Current number of items in cache */
  size: number;
  /** Total memory usage in bytes (approximate) */
  memoryUsage: number;
  /** Number of evictions */
  evictions: number;
  /** Number of expirations */
  expirations: number;
  /** Average entry age in seconds */
  avgAge: number;
  /** Cache uptime in seconds */
  uptime: number;
  /** Stale hits (served stale while revalidating) */
  staleHits: number;
}

// ================================================================
// CACHE OPERATIONS
// ================================================================

export type CacheOperation = 'get' | 'set' | 'delete' | 'clear' | 'invalidate';

export interface CacheEvent {
  operation: CacheOperation;
  key: string;
  success: boolean;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ================================================================
// CACHE KEY BUILDER
// ================================================================

export interface CacheKeyOptions {
  /** Resource type (e.g., 'score', 'brand') */
  resource: string;
  /** Resource ID */
  id?: string;
  /** User ID for user-scoped cache */
  userId?: string;
  /** Additional parameters */
  params?: Record<string, string | number | boolean>;
  /** Version for cache busting */
  version?: string;
}

// ================================================================
// CACHE PATTERNS
// ================================================================

export type CachePattern =
  | 'cache-aside'      // Read from cache, fetch on miss
  | 'write-through'    // Write to cache and source
  | 'write-behind'     // Write to cache, async write to source
  | 'refresh-ahead';   // Proactively refresh before expiry

export interface CacheStrategy {
  pattern: CachePattern;
  ttl: number;
  swr: number;
  tags: string[];
}

// ================================================================
// PREDEFINED TTLs
// ================================================================

export const CACHE_TTL = {
  /** Very short-lived data (30 seconds) */
  REALTIME: 30,
  /** Short-lived data (2 minutes) */
  SHORT: 120,
  /** Medium-lived data (5 minutes) */
  MEDIUM: 300,
  /** Long-lived data (15 minutes) */
  LONG: 900,
  /** Very long-lived data (1 hour) */
  EXTENDED: 3600,
  /** Static data (24 hours) */
  STATIC: 86400,
} as const;

// ================================================================
// CACHE TAGS
// ================================================================

export const CACHE_TAGS = {
  /** All scores */
  SCORES: 'scores',
  /** All brands */
  BRANDS: 'brands',
  /** All leaderboards */
  LEADERBOARDS: 'leaderboards',
  /** All analytics */
  ANALYTICS: 'analytics',
  /** User-specific data */
  USER: 'user',
  /** Public/shared data */
  PUBLIC: 'public',
  /** API responses */
  API: 'api',
} as const;

// ================================================================
// EXPORTS
// ================================================================

export default {
  DEFAULT_CACHE_CONFIG,
  CACHE_TTL,
  CACHE_TAGS,
};
