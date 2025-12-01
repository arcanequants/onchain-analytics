/**
 * Memory Cache Implementation
 *
 * In-memory LRU cache with TTL support, statistics, and tag-based invalidation
 *
 * Phase 3, Week 9, Day 1
 */

import {
  type CacheConfig,
  type CacheEntry,
  type CacheMetadata,
  type CacheStats,
  type CacheKeyOptions,
  DEFAULT_CACHE_CONFIG,
  CACHE_TTL,
} from './types';

// ================================================================
// LRU CACHE IMPLEMENTATION
// ================================================================

class LRUNode<T> {
  key: string;
  entry: CacheEntry<T>;
  prev: LRUNode<T> | null = null;
  next: LRUNode<T> | null = null;

  constructor(key: string, entry: CacheEntry<T>) {
    this.key = key;
    this.entry = entry;
  }
}

export class MemoryCache {
  private cache: Map<string, LRUNode<unknown>> = new Map();
  private head: LRUNode<unknown> | null = null;
  private tail: LRUNode<unknown> | null = null;
  private config: CacheConfig;
  private stats: CacheStats;
  private startTime: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.startTime = Date.now();
    this.stats = this.initStats();

    // Start periodic cleanup
    this.startCleanup();
  }

  private initStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      size: 0,
      memoryUsage: 0,
      evictions: 0,
      expirations: 0,
      avgAge: 0,
      uptime: 0,
      staleHits: 0,
    };
  }

  // ================================================================
  // CORE OPERATIONS
  // ================================================================

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const prefixedKey = this.prefixKey(key);
    const node = this.cache.get(prefixedKey);

    if (!node) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    const entry = node.entry as CacheEntry<T>;

    // Check if expired
    if (entry.expiresAt < now) {
      // Check for stale-while-revalidate
      const staleWindow = entry.expiresAt + (this.config.staleWhileRevalidate * 1000);
      if (now < staleWindow && !entry.isRevalidating) {
        // Serve stale data
        this.stats.staleHits++;
        entry.isRevalidating = true;
      } else {
        // Truly expired
        this.delete(key);
        this.stats.misses++;
        this.stats.expirations++;
        this.updateHitRate();
        return null;
      }
    }

    // Update access info
    entry.accessedAt = now;
    entry.accessCount++;

    // Move to front (most recently used)
    this.moveToFront(node);

    this.stats.hits++;
    this.updateHitRate();

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, metadata: CacheMetadata = {}): void {
    const prefixedKey = this.prefixKey(key);
    const now = Date.now();
    const ttl = metadata.ttl ?? this.config.defaultTtl;

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: now + (ttl * 1000),
      accessedAt: now,
      accessCount: 1,
      size: this.estimateSize(value),
      tags: metadata.tags || [],
      isRevalidating: false,
    };

    // Check if key exists
    const existingNode = this.cache.get(prefixedKey);
    if (existingNode) {
      // Update existing entry
      this.stats.memoryUsage -= existingNode.entry.size;
      existingNode.entry = entry as CacheEntry<unknown>;
      this.stats.memoryUsage += entry.size;
      this.moveToFront(existingNode);
      return;
    }

    // Evict if at capacity
    while (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    // Create new node
    const node = new LRUNode(prefixedKey, entry as CacheEntry<unknown>);
    this.cache.set(prefixedKey, node);
    this.addToFront(node);

    this.stats.size = this.cache.size;
    this.stats.memoryUsage += entry.size;
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): boolean {
    const prefixedKey = this.prefixKey(key);
    const node = this.cache.get(prefixedKey);

    if (!node) {
      return false;
    }

    this.removeNode(node);
    this.cache.delete(prefixedKey);
    this.stats.size = this.cache.size;
    this.stats.memoryUsage -= node.entry.size;

    return true;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const prefixedKey = this.prefixKey(key);
    const node = this.cache.get(prefixedKey);

    if (!node) return false;

    // Check if expired
    if (node.entry.expiresAt < Date.now()) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats = this.initStats();
  }

  // ================================================================
  // TAG-BASED INVALIDATION
  // ================================================================

  /**
   * Invalidate all entries with a specific tag
   */
  invalidateByTag(tag: string): number {
    let count = 0;
    const keysToDelete: string[] = [];

    for (const [key, node] of this.cache.entries()) {
      if (node.entry.tags.includes(tag)) {
        keysToDelete.push(key);
        count++;
      }
    }

    for (const key of keysToDelete) {
      // Remove prefix for delete
      const unprefixedKey = key.replace(`${this.config.namespace}:`, '');
      this.delete(unprefixedKey);
    }

    return count;
  }

  /**
   * Invalidate all entries matching a pattern
   */
  invalidateByPattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key);
        count++;
      }
    }

    for (const key of keysToDelete) {
      const unprefixedKey = key.replace(`${this.config.namespace}:`, '');
      this.delete(unprefixedKey);
    }

    return count;
  }

  /**
   * Invalidate entries for a specific user
   */
  invalidateByUser(userId: string): number {
    return this.invalidateByPattern(`user:${userId}`);
  }

  // ================================================================
  // CACHE-ASIDE PATTERN
  // ================================================================

  /**
   * Get or set with factory function (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    metadata: CacheMetadata = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await factory();

    // Store in cache
    this.set(key, value, metadata);

    return value;
  }

  /**
   * Refresh a cache entry in background
   */
  async refresh<T>(
    key: string,
    factory: () => Promise<T>,
    metadata: CacheMetadata = {}
  ): Promise<void> {
    try {
      const value = await factory();
      this.set(key, value, metadata);
    } catch (error) {
      // Keep existing entry on refresh failure
      console.error(`Cache refresh failed for key ${key}:`, error);
    }
  }

  // ================================================================
  // STATISTICS
  // ================================================================

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const now = Date.now();
    let totalAge = 0;

    for (const node of this.cache.values()) {
      totalAge += (now - node.entry.createdAt) / 1000;
    }

    return {
      ...this.stats,
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      uptime: (now - this.startTime) / 1000,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = this.initStats();
    this.startTime = Date.now();
  }

  // ================================================================
  // KEY HELPERS
  // ================================================================

  /**
   * Build a cache key from options
   */
  static buildKey(options: CacheKeyOptions): string {
    const parts: string[] = [options.resource];

    if (options.userId) {
      parts.push(`user:${options.userId}`);
    }

    if (options.id) {
      parts.push(options.id);
    }

    if (options.params) {
      const sortedParams = Object.entries(options.params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (sortedParams) {
        parts.push(sortedParams);
      }
    }

    if (options.version) {
      parts.push(`v${options.version}`);
    }

    return parts.join(':');
  }

  // ================================================================
  // INTERNAL HELPERS
  // ================================================================

  private prefixKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate in bytes
    } catch {
      return 1024; // Default estimate
    }
  }

  // ================================================================
  // LRU LINKED LIST OPERATIONS
  // ================================================================

  private addToFront(node: LRUNode<unknown>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private removeNode(node: LRUNode<unknown>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private moveToFront(node: LRUNode<unknown>): void {
    if (node === this.head) return;
    this.removeNode(node);
    this.addToFront(node);
  }

  private evictLRU(): void {
    if (!this.tail) return;

    const key = this.tail.key;
    this.stats.memoryUsage -= this.tail.entry.size;
    this.removeNode(this.tail);
    this.cache.delete(key);
    this.stats.evictions++;
  }

  // ================================================================
  // CLEANUP
  // ================================================================

  private startCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, node] of this.cache.entries()) {
      // Check if truly expired (past SWR window)
      const staleWindow = node.entry.expiresAt + (this.config.staleWhileRevalidate * 1000);
      if (now > staleWindow) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      const unprefixedKey = key.replace(`${this.config.namespace}:`, '');
      this.delete(unprefixedKey);
      this.stats.expirations++;
    }
  }

  /**
   * Stop cleanup interval (for testing)
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Destroy cache instance
   */
  destroy(): void {
    this.stopCleanup();
    this.clear();
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let defaultCache: MemoryCache | null = null;

/**
 * Get the default cache instance
 */
export function getCache(): MemoryCache {
  if (!defaultCache) {
    defaultCache = new MemoryCache();
  }
  return defaultCache;
}

/**
 * Create a new cache instance
 */
export function createCache(config: Partial<CacheConfig> = {}): MemoryCache {
  return new MemoryCache(config);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  MemoryCache,
  getCache,
  createCache,
};
