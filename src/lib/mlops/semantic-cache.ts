/**
 * Semantic Cache
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Embedding-based cache lookup
 * - Similarity threshold configuration
 * - TTL and eviction policies
 * - Cache statistics and monitoring
 * - Namespace isolation
 */

import {
  createEmbeddingStore,
  type EmbeddingStore,
  type StoreConfig,
  type SearchResult,
} from './embedding-store';

// ============================================================================
// TYPES
// ============================================================================

export interface CacheEntry<T = unknown> {
  id: string;
  key: string;
  keyEmbedding: number[];
  value: T;
  metadata: CacheMetadata;
  createdAt: Date;
  expiresAt: Date | null;
  accessCount: number;
  lastAccessedAt: Date;
}

export interface CacheMetadata {
  model?: string;
  tokens?: number;
  latencyMs?: number;
  cost?: number;
  tags?: string[];
  [key: string]: unknown;
}

export interface CacheConfig {
  dimensions: number;
  similarityThreshold: number;  // 0-1, higher = more strict
  defaultTTLSeconds?: number;
  maxEntries?: number;
  evictionPolicy?: 'lru' | 'lfu' | 'fifo' | 'ttl';
  namespace?: string;
}

export interface CacheStats {
  totalEntries: number;
  hits: number;
  misses: number;
  hitRate: number;
  avgSimilarity: number;
  totalTokensSaved: number;
  totalCostSaved: number;
  avgLatencySaved: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

export interface CacheHit<T = unknown> {
  hit: true;
  entry: CacheEntry<T>;
  similarity: number;
  timeSavedMs: number;
}

export interface CacheMiss {
  hit: false;
  nearestSimilarity?: number;
  reason: 'no_match' | 'below_threshold' | 'expired' | 'empty_cache';
}

export type CacheLookupResult<T = unknown> = CacheHit<T> | CacheMiss;

// ============================================================================
// SEMANTIC CACHE IMPLEMENTATION
// ============================================================================

export class SemanticCache<T = unknown> {
  private store: EmbeddingStore;
  private entries: Map<string, CacheEntry<T>> = new Map();
  private config: Required<CacheConfig>;
  private stats: {
    hits: number;
    misses: number;
    totalSimilarity: number;
    tokensSaved: number;
    costSaved: number;
    latencySaved: number;
  };

  constructor(config: CacheConfig) {
    this.config = {
      dimensions: config.dimensions,
      similarityThreshold: config.similarityThreshold,
      defaultTTLSeconds: config.defaultTTLSeconds ?? 3600, // 1 hour
      maxEntries: config.maxEntries ?? 10000,
      evictionPolicy: config.evictionPolicy ?? 'lru',
      namespace: config.namespace ?? 'default',
    };

    const storeConfig: StoreConfig = {
      dimensions: config.dimensions,
      metric: 'cosine',
      indexType: 'none', // In-memory
    };

    this.store = createEmbeddingStore(storeConfig);

    this.stats = {
      hits: 0,
      misses: 0,
      totalSimilarity: 0,
      tokensSaved: 0,
      costSaved: 0,
      latencySaved: 0,
    };
  }

  /**
   * Generate cache entry ID
   */
  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.expiresAt) return false;
    return new Date() > entry.expiresAt;
  }

  /**
   * Evict entries if needed
   */
  private async evictIfNeeded(): Promise<void> {
    if (this.entries.size < this.config.maxEntries) return;

    const entriesToEvict = Math.ceil(this.entries.size * 0.1); // Evict 10%
    const sortedEntries = [...this.entries.values()];

    switch (this.config.evictionPolicy) {
      case 'lru':
        sortedEntries.sort((a, b) =>
          a.lastAccessedAt.getTime() - b.lastAccessedAt.getTime()
        );
        break;

      case 'lfu':
        sortedEntries.sort((a, b) => a.accessCount - b.accessCount);
        break;

      case 'fifo':
        sortedEntries.sort((a, b) =>
          a.createdAt.getTime() - b.createdAt.getTime()
        );
        break;

      case 'ttl':
        sortedEntries.sort((a, b) => {
          const aExpiry = a.expiresAt?.getTime() ?? Infinity;
          const bExpiry = b.expiresAt?.getTime() ?? Infinity;
          return aExpiry - bExpiry;
        });
        break;
    }

    for (let i = 0; i < entriesToEvict; i++) {
      const entry = sortedEntries[i];
      await this.delete(entry.id);
    }
  }

  /**
   * Look up cache by semantic similarity
   */
  async lookup(keyEmbedding: number[]): Promise<CacheLookupResult<T>> {
    // Check for empty cache
    if (this.entries.size === 0) {
      this.stats.misses++;
      return { hit: false, reason: 'empty_cache' };
    }

    // Search for similar embeddings
    const results = await this.store.search(keyEmbedding, {
      topK: 1,
      namespace: this.config.namespace,
      includeVectors: false,
    });

    if (results.length === 0) {
      this.stats.misses++;
      return { hit: false, reason: 'no_match' };
    }

    const bestMatch = results[0];
    const similarity = bestMatch.score;

    // Check similarity threshold
    if (similarity < this.config.similarityThreshold) {
      this.stats.misses++;
      return {
        hit: false,
        reason: 'below_threshold',
        nearestSimilarity: similarity,
      };
    }

    // Get cache entry
    const entry = this.entries.get(bestMatch.id);
    if (!entry) {
      this.stats.misses++;
      return { hit: false, reason: 'no_match' };
    }

    // Check expiration
    if (this.isExpired(entry)) {
      await this.delete(entry.id);
      this.stats.misses++;
      return { hit: false, reason: 'expired' };
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessedAt = new Date();

    // Update global stats
    this.stats.hits++;
    this.stats.totalSimilarity += similarity;
    this.stats.tokensSaved += entry.metadata.tokens ?? 0;
    this.stats.costSaved += entry.metadata.cost ?? 0;
    this.stats.latencySaved += entry.metadata.latencyMs ?? 0;

    return {
      hit: true,
      entry,
      similarity,
      timeSavedMs: entry.metadata.latencyMs ?? 0,
    };
  }

  /**
   * Set cache entry
   */
  async set(
    key: string,
    keyEmbedding: number[],
    value: T,
    options?: {
      ttlSeconds?: number;
      metadata?: CacheMetadata;
    }
  ): Promise<CacheEntry<T>> {
    await this.evictIfNeeded();

    const id = this.generateId();
    const now = new Date();
    const ttl = options?.ttlSeconds ?? this.config.defaultTTLSeconds;

    const entry: CacheEntry<T> = {
      id,
      key,
      keyEmbedding,
      value,
      metadata: options?.metadata ?? {},
      createdAt: now,
      expiresAt: ttl > 0 ? new Date(now.getTime() + ttl * 1000) : null,
      accessCount: 0,
      lastAccessedAt: now,
    };

    // Store embedding
    await this.store.upsert({
      id,
      vector: keyEmbedding,
      metadata: { key },
      namespace: this.config.namespace,
    });

    // Store entry
    this.entries.set(id, entry);

    return entry;
  }

  /**
   * Get entry by ID
   */
  async get(id: string): Promise<CacheEntry<T> | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      await this.delete(id);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessedAt = new Date();
    return entry;
  }

  /**
   * Delete entry by ID
   */
  async delete(id: string): Promise<boolean> {
    const deleted = this.entries.delete(id);
    if (deleted) {
      await this.store.delete(id);
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    this.entries.clear();
    await this.store.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalSimilarity: 0,
      tokensSaved: 0,
      costSaved: 0,
      latencySaved: 0,
    };
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<number> {
    let count = 0;
    for (const [id, entry] of this.entries.entries()) {
      if (this.isExpired(entry)) {
        await this.delete(id);
        count++;
      }
    }
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let oldestEntry: Date | null = null;
    let newestEntry: Date | null = null;

    for (const entry of this.entries.values()) {
      if (!oldestEntry || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (!newestEntry || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    }

    const totalLookups = this.stats.hits + this.stats.misses;

    return {
      totalEntries: this.entries.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalLookups > 0 ? this.stats.hits / totalLookups : 0,
      avgSimilarity: this.stats.hits > 0
        ? this.stats.totalSimilarity / this.stats.hits
        : 0,
      totalTokensSaved: this.stats.tokensSaved,
      totalCostSaved: this.stats.costSaved,
      avgLatencySaved: this.stats.hits > 0
        ? this.stats.latencySaved / this.stats.hits
        : 0,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * Get all entries (for debugging/export)
   */
  getAllEntries(): CacheEntry<T>[] {
    return [...this.entries.values()];
  }

  /**
   * Export cache to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      config: this.config,
      stats: this.getStats(),
      entries: [...this.entries.values()].map(e => ({
        ...e,
        keyEmbedding: undefined, // Exclude embeddings for size
      })),
    }, null, 2);
  }
}

// ============================================================================
// PROMPT CACHE (Specialized for LLM prompts)
// ============================================================================

export interface PromptCacheEntry {
  prompt: string;
  response: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  latencyMs: number;
}

export class PromptCache extends SemanticCache<PromptCacheEntry> {
  constructor(config: Omit<CacheConfig, 'dimensions'> & { dimensions?: number }) {
    super({
      ...config,
      dimensions: config.dimensions ?? 1536, // OpenAI ada-002 default
    });
  }

  /**
   * Cache a prompt-response pair
   */
  async cacheResponse(
    prompt: string,
    promptEmbedding: number[],
    response: string,
    model: string,
    stats: { promptTokens: number; completionTokens: number; latencyMs: number; cost: number }
  ): Promise<CacheEntry<PromptCacheEntry>> {
    const value: PromptCacheEntry = {
      prompt,
      response,
      model,
      tokens: {
        prompt: stats.promptTokens,
        completion: stats.completionTokens,
        total: stats.promptTokens + stats.completionTokens,
      },
      cost: stats.cost,
      latencyMs: stats.latencyMs,
    };

    return this.set(prompt, promptEmbedding, value, {
      metadata: {
        model,
        tokens: value.tokens.total,
        cost: stats.cost,
        latencyMs: stats.latencyMs,
      },
    });
  }

  /**
   * Look up cached response
   */
  async findResponse(promptEmbedding: number[]): Promise<{
    found: boolean;
    response?: string;
    similarity?: number;
    tokensSaved?: number;
    costSaved?: number;
  }> {
    const result = await this.lookup(promptEmbedding);

    if (!result.hit) {
      return { found: false };
    }

    return {
      found: true,
      response: result.entry.value.response,
      similarity: result.similarity,
      tokensSaved: result.entry.value.tokens.total,
      costSaved: result.entry.value.cost,
    };
  }
}

// ============================================================================
// CACHING DECORATOR
// ============================================================================

export interface CachedFunction<TArgs extends unknown[], TResult> {
  (...args: TArgs): Promise<TResult>;
  cache: SemanticCache<TResult>;
  invalidate: () => Promise<void>;
  stats: () => CacheStats;
}

/**
 * Create a cached version of an async function
 */
export function createCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  embedder: (...args: TArgs) => Promise<number[]>,
  config: CacheConfig
): CachedFunction<TArgs, TResult> {
  const cache = new SemanticCache<TResult>(config);

  const cachedFn = async (...args: TArgs): Promise<TResult> => {
    const embedding = await embedder(...args);
    const lookup = await cache.lookup(embedding);

    if (lookup.hit) {
      return lookup.entry.value;
    }

    const result = await fn(...args);
    const key = JSON.stringify(args);
    await cache.set(key, embedding, result);

    return result;
  };

  (cachedFn as CachedFunction<TArgs, TResult>).cache = cache;
  (cachedFn as CachedFunction<TArgs, TResult>).invalidate = () => cache.clear();
  (cachedFn as CachedFunction<TArgs, TResult>).stats = () => cache.getStats();

  return cachedFn as CachedFunction<TArgs, TResult>;
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultCache: SemanticCache | null = null;
let defaultPromptCache: PromptCache | null = null;

/**
 * Get or create default semantic cache
 */
export function getDefaultCache(dimensions: number = 1536): SemanticCache {
  if (!defaultCache) {
    defaultCache = new SemanticCache({
      dimensions,
      similarityThreshold: 0.95,
      defaultTTLSeconds: 3600,
      maxEntries: 10000,
      evictionPolicy: 'lru',
    });
  }
  return defaultCache;
}

/**
 * Get or create default prompt cache
 */
export function getDefaultPromptCache(): PromptCache {
  if (!defaultPromptCache) {
    defaultPromptCache = new PromptCache({
      similarityThreshold: 0.95,
      defaultTTLSeconds: 86400, // 24 hours
      maxEntries: 50000,
      evictionPolicy: 'lru',
    });
  }
  return defaultPromptCache;
}

/**
 * Reset caches (for testing)
 */
export function resetCaches(): void {
  defaultCache = null;
  defaultPromptCache = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SemanticCache,
  PromptCache,
  createCachedFunction,
  getDefaultCache,
  getDefaultPromptCache,
  resetCaches,
};
