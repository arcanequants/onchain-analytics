/**
 * Query Optimizer
 *
 * Utilities for optimizing database queries with indexing hints,
 * query patterns, and performance monitoring
 *
 * Phase 3, Week 9, Day 1
 */

import type {
  Database,
  Analysis,
  AIResponse,
  UserProfile,
  Recommendation,
  Competitor,
} from './types';

// ================================================================
// TYPES
// ================================================================

export type TableName = keyof Database['public']['Tables'];

export interface IndexDefinition {
  name: string;
  table: TableName;
  columns: string[];
  unique?: boolean;
  partial?: string; // WHERE clause for partial indexes
  using?: 'btree' | 'hash' | 'gin' | 'gist' | 'brin';
}

export interface QueryPlan {
  operation: string;
  table: TableName;
  index?: string;
  cost: number;
  rows: number;
  width: number;
}

export interface QueryMetrics {
  queryId: string;
  table: TableName;
  operation: 'select' | 'insert' | 'update' | 'delete';
  duration: number;
  rowsAffected: number;
  cacheHit: boolean;
  timestamp: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  cursor?: string;
}

export interface SortOptions<T> {
  column: keyof T;
  direction: 'asc' | 'desc';
}

export interface FilterOptions<T> {
  column: keyof T;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
  value: unknown;
}

export interface QueryOptions<T> {
  select?: (keyof T)[];
  filters?: FilterOptions<T>[];
  sort?: SortOptions<T>[];
  pagination?: PaginationOptions;
  includes?: string[];
}

// ================================================================
// RECOMMENDED INDEXES
// ================================================================

/**
 * Recommended indexes for optimal query performance
 * These should be applied to the database via migrations
 */
export const RECOMMENDED_INDEXES: IndexDefinition[] = [
  // User Profiles
  {
    name: 'idx_user_profiles_email',
    table: 'user_profiles',
    columns: ['email'],
    unique: true,
  },
  {
    name: 'idx_user_profiles_subscription',
    table: 'user_profiles',
    columns: ['subscription_tier', 'subscription_status'],
  },
  {
    name: 'idx_user_profiles_stripe',
    table: 'user_profiles',
    columns: ['stripe_customer_id'],
    partial: 'stripe_customer_id IS NOT NULL',
  },

  // Analyses
  {
    name: 'idx_analyses_user_created',
    table: 'analyses',
    columns: ['user_id', 'created_at'],
  },
  {
    name: 'idx_analyses_status',
    table: 'analyses',
    columns: ['status'],
    partial: "status IN ('pending', 'processing')",
  },
  {
    name: 'idx_analyses_brand_name',
    table: 'analyses',
    columns: ['brand_name'],
    using: 'gin',
  },
  {
    name: 'idx_analyses_score',
    table: 'analyses',
    columns: ['overall_score'],
    partial: 'overall_score IS NOT NULL',
  },
  {
    name: 'idx_analyses_share_token',
    table: 'analyses',
    columns: ['share_token'],
    unique: true,
    partial: 'share_token IS NOT NULL',
  },
  {
    name: 'idx_analyses_public',
    table: 'analyses',
    columns: ['is_public', 'created_at'],
    partial: 'is_public = true',
  },

  // AI Responses
  {
    name: 'idx_ai_responses_analysis',
    table: 'ai_responses',
    columns: ['analysis_id'],
  },
  {
    name: 'idx_ai_responses_provider',
    table: 'ai_responses',
    columns: ['provider', 'created_at'],
  },
  {
    name: 'idx_ai_responses_cache_key',
    table: 'ai_responses',
    columns: ['cache_key'],
    partial: 'cache_key IS NOT NULL',
  },

  // Competitors
  {
    name: 'idx_competitors_analysis',
    table: 'competitors',
    columns: ['analysis_id'],
  },
  {
    name: 'idx_competitors_name',
    table: 'competitors',
    columns: ['name'],
  },

  // Recommendations
  {
    name: 'idx_recommendations_analysis',
    table: 'recommendations',
    columns: ['analysis_id'],
  },
  {
    name: 'idx_recommendations_priority',
    table: 'recommendations',
    columns: ['priority', 'is_dismissed', 'is_completed'],
  },

  // Subscriptions
  {
    name: 'idx_ai_subscriptions_user',
    table: 'ai_subscriptions',
    columns: ['user_id'],
  },
  {
    name: 'idx_ai_subscriptions_stripe',
    table: 'ai_subscriptions',
    columns: ['stripe_subscription_id'],
    unique: true,
  },

  // Usage Tracking
  {
    name: 'idx_usage_tracking_user_period',
    table: 'usage_tracking',
    columns: ['user_id', 'period_start', 'period_end'],
  },

  // API Cost Tracking
  {
    name: 'idx_api_cost_tracking_date_provider',
    table: 'api_cost_tracking',
    columns: ['date', 'provider'],
    unique: true,
  },
];

// ================================================================
// QUERY BUILDER
// ================================================================

export class QueryBuilder<T extends Record<string, unknown>> {
  private _select: string[] = ['*'];
  private _filters: string[] = [];
  private _params: unknown[] = [];
  private _orderBy: string[] = [];
  private _limit?: number;
  private _offset?: number;
  private _paramIndex = 1;

  constructor(private table: string) {}

  /**
   * Select specific columns
   */
  select(...columns: (keyof T)[]): this {
    this._select = columns.length > 0 ? (columns as string[]) : ['*'];
    return this;
  }

  /**
   * Add WHERE condition
   */
  where(column: keyof T, operator: string, value: unknown): this {
    this._filters.push(`${String(column)} ${operator} $${this._paramIndex++}`);
    this._params.push(value);
    return this;
  }

  /**
   * Add WHERE IN condition
   */
  whereIn(column: keyof T, values: unknown[]): this {
    const placeholders = values.map(() => `$${this._paramIndex++}`).join(', ');
    this._filters.push(`${String(column)} IN (${placeholders})`);
    this._params.push(...values);
    return this;
  }

  /**
   * Add WHERE IS NULL condition
   */
  whereNull(column: keyof T): this {
    this._filters.push(`${String(column)} IS NULL`);
    return this;
  }

  /**
   * Add WHERE IS NOT NULL condition
   */
  whereNotNull(column: keyof T): this {
    this._filters.push(`${String(column)} IS NOT NULL`);
    return this;
  }

  /**
   * Add WHERE LIKE condition (case-insensitive)
   */
  whereLike(column: keyof T, pattern: string): this {
    this._filters.push(`${String(column)} ILIKE $${this._paramIndex++}`);
    this._params.push(`%${pattern}%`);
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column: keyof T, direction: 'asc' | 'desc' = 'asc'): this {
    this._orderBy.push(`${String(column)} ${direction.toUpperCase()}`);
    return this;
  }

  /**
   * Add LIMIT clause
   */
  limit(count: number): this {
    this._limit = count;
    return this;
  }

  /**
   * Add OFFSET clause
   */
  offset(count: number): this {
    this._offset = count;
    return this;
  }

  /**
   * Add pagination
   */
  paginate(page: number, perPage: number): this {
    this._limit = perPage;
    this._offset = (page - 1) * perPage;
    return this;
  }

  /**
   * Build the SQL query
   */
  build(): { sql: string; params: unknown[] } {
    let sql = `SELECT ${this._select.join(', ')} FROM ${this.table}`;

    if (this._filters.length > 0) {
      sql += ` WHERE ${this._filters.join(' AND ')}`;
    }

    if (this._orderBy.length > 0) {
      sql += ` ORDER BY ${this._orderBy.join(', ')}`;
    }

    if (this._limit !== undefined) {
      sql += ` LIMIT ${this._limit}`;
    }

    if (this._offset !== undefined) {
      sql += ` OFFSET ${this._offset}`;
    }

    return { sql, params: this._params };
  }

  /**
   * Build count query
   */
  buildCount(): { sql: string; params: unknown[] } {
    let sql = `SELECT COUNT(*) as count FROM ${this.table}`;

    if (this._filters.length > 0) {
      sql += ` WHERE ${this._filters.join(' AND ')}`;
    }

    return { sql, params: this._params };
  }
}

// ================================================================
// OPTIMIZED QUERY PATTERNS
// ================================================================

/**
 * Optimized query patterns for common operations
 */
export const QueryPatterns = {
  /**
   * Get user's analyses with pagination (uses composite index)
   */
  userAnalysesPaginated(userId: string, page: number, limit: number) {
    return new QueryBuilder<Analysis>('analyses')
      .select('id', 'brand_name', 'url', 'status', 'overall_score', 'created_at')
      .where('user_id', '=', userId)
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
      .build();
  },

  /**
   * Get pending analyses for processing (uses partial index)
   */
  pendingAnalyses(limit: number = 10) {
    return new QueryBuilder<Analysis>('analyses')
      .select('id', 'brand_name', 'url', 'industry_id', 'created_at')
      .where('status', '=', 'pending')
      .orderBy('created_at', 'asc')
      .limit(limit)
      .build();
  },

  /**
   * Get analysis by share token (uses unique index)
   */
  analysisByShareToken(token: string) {
    return new QueryBuilder<Analysis>('analyses')
      .where('share_token', '=', token)
      .whereNotNull('share_token')
      .limit(1)
      .build();
  },

  /**
   * Get public leaderboard (uses partial index on is_public)
   */
  publicLeaderboard(limit: number = 100) {
    return new QueryBuilder<Analysis>('analyses')
      .select('id', 'brand_name', 'overall_score', 'industry_id', 'created_at')
      .where('is_public', '=', true)
      .whereNotNull('overall_score')
      .orderBy('overall_score', 'desc')
      .limit(limit)
      .build();
  },

  /**
   * Get AI responses for analysis (uses foreign key index)
   */
  analysisResponses(analysisId: string) {
    return new QueryBuilder<AIResponse>('ai_responses')
      .where('analysis_id', '=', analysisId)
      .orderBy('created_at', 'asc')
      .build();
  },

  /**
   * Get competitors for analysis
   */
  analysisCompetitors(analysisId: string) {
    return new QueryBuilder<Competitor>('competitors')
      .where('analysis_id', '=', analysisId)
      .orderBy('mention_count', 'desc')
      .build();
  },

  /**
   * Get active recommendations (not dismissed/completed)
   */
  activeRecommendations(analysisId: string) {
    return new QueryBuilder<Recommendation>('recommendations')
      .where('analysis_id', '=', analysisId)
      .where('is_dismissed', '=', false)
      .where('is_completed', '=', false)
      .orderBy('priority', 'asc')
      .build();
  },

  /**
   * Search brands by name (uses GIN index)
   */
  searchBrands(query: string, limit: number = 20) {
    return new QueryBuilder<Analysis>('analyses')
      .select('id', 'brand_name', 'url', 'overall_score')
      .whereLike('brand_name', query)
      .orderBy('overall_score', 'desc')
      .limit(limit)
      .build();
  },

  /**
   * Get user by email (uses unique index)
   */
  userByEmail(email: string) {
    return new QueryBuilder<UserProfile>('user_profiles')
      .where('email', '=', email)
      .limit(1)
      .build();
  },

  /**
   * Get active subscribers
   */
  activeSubscribers(tier?: string) {
    const query = new QueryBuilder<UserProfile>('user_profiles')
      .where('subscription_status', '=', 'active');

    if (tier) {
      query.where('subscription_tier', '=', tier);
    }

    return query.build();
  },
};

// ================================================================
// QUERY METRICS COLLECTOR
// ================================================================

export class QueryMetricsCollector {
  private metrics: QueryMetrics[] = [];
  private maxMetrics = 1000;

  /**
   * Record a query metric
   */
  record(metric: Omit<QueryMetrics, 'queryId' | 'timestamp'>): void {
    const fullMetric: QueryMetrics = {
      ...metric,
      queryId: this.generateId(),
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get slow queries (above threshold)
   */
  getSlowQueries(thresholdMs: number = 100): QueryMetrics[] {
    return this.metrics.filter((m) => m.duration > thresholdMs);
  }

  /**
   * Get query statistics by table
   */
  getStatsByTable(): Record<string, { count: number; avgDuration: number; totalDuration: number }> {
    const stats: Record<string, { count: number; avgDuration: number; totalDuration: number }> = {};

    for (const metric of this.metrics) {
      if (!stats[metric.table]) {
        stats[metric.table] = { count: 0, avgDuration: 0, totalDuration: 0 };
      }
      stats[metric.table].count++;
      stats[metric.table].totalDuration += metric.duration;
    }

    // Calculate averages
    for (const table of Object.keys(stats)) {
      stats[table].avgDuration = stats[table].totalDuration / stats[table].count;
    }

    return stats;
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const hits = this.metrics.filter((m) => m.cacheHit).length;
    return (hits / this.metrics.length) * 100;
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(count: number = 100): QueryMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  private generateId(): string {
    return `qm_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }
}

// ================================================================
// INDEX GENERATOR
// ================================================================

/**
 * Generate SQL for creating indexes
 */
export function generateIndexSQL(indexes: IndexDefinition[]): string[] {
  return indexes.map((idx) => {
    const unique = idx.unique ? 'UNIQUE ' : '';
    const using = idx.using ? ` USING ${idx.using}` : '';
    const columns = idx.columns.join(', ');
    const partial = idx.partial ? ` WHERE ${idx.partial}` : '';

    return `CREATE ${unique}INDEX IF NOT EXISTS ${idx.name} ON ${idx.table}${using} (${columns})${partial};`;
  });
}

/**
 * Generate SQL for dropping indexes
 */
export function generateDropIndexSQL(indexes: IndexDefinition[]): string[] {
  return indexes.map((idx) => `DROP INDEX IF EXISTS ${idx.name};`);
}

// ================================================================
// CONNECTION POOL CONFIGURATION
// ================================================================

export interface PoolConfig {
  min: number;
  max: number;
  idleTimeout: number;
  connectionTimeout: number;
  statementTimeout: number;
}

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  min: 2,
  max: 10,
  idleTimeout: 30000, // 30 seconds
  connectionTimeout: 10000, // 10 seconds
  statementTimeout: 30000, // 30 seconds
};

export const PRODUCTION_POOL_CONFIG: PoolConfig = {
  min: 5,
  max: 20,
  idleTimeout: 60000, // 1 minute
  connectionTimeout: 5000, // 5 seconds
  statementTimeout: 60000, // 1 minute
};

// ================================================================
// QUERY ANALYZER
// ================================================================

export interface QueryAnalysis {
  hasIndex: boolean;
  estimatedCost: 'low' | 'medium' | 'high';
  suggestions: string[];
  usedIndexes: string[];
}

/**
 * Analyze a query for optimization opportunities
 * Note: This is a static analysis; actual EXPLAIN would require DB connection
 */
export function analyzeQuery(
  table: TableName,
  columns: string[],
  filters: Array<{ column: string; operator: string }>
): QueryAnalysis {
  const suggestions: string[] = [];
  const usedIndexes: string[] = [];
  let hasIndex = false;

  // Check if any recommended index covers the query
  for (const idx of RECOMMENDED_INDEXES) {
    if (idx.table !== table) continue;

    const filterColumns = filters.map((f) => f.column);
    const indexCovers = idx.columns.every(
      (col) => filterColumns.includes(col) || columns.includes(col)
    );

    if (indexCovers) {
      hasIndex = true;
      usedIndexes.push(idx.name);
    }
  }

  // Generate suggestions
  if (!hasIndex) {
    suggestions.push(
      `Consider adding an index on (${filters.map((f) => f.column).join(', ')}) for table ${table}`
    );
  }

  // Check for expensive operations
  const hasLike = filters.some((f) => f.operator === 'LIKE' || f.operator === 'ILIKE');
  if (hasLike) {
    suggestions.push('LIKE/ILIKE queries may be slow; consider using full-text search or GIN index');
  }

  const hasOr = filters.some((f) => f.operator === 'OR');
  if (hasOr) {
    suggestions.push('OR conditions can prevent index usage; consider using UNION instead');
  }

  // Estimate cost
  let estimatedCost: 'low' | 'medium' | 'high' = 'low';
  if (!hasIndex) {
    estimatedCost = 'high';
  } else if (hasLike || hasOr) {
    estimatedCost = 'medium';
  }

  return {
    hasIndex,
    estimatedCost,
    suggestions,
    usedIndexes,
  };
}

// ================================================================
// BATCH OPERATIONS
// ================================================================

export interface BatchInsertOptions {
  chunkSize: number;
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Generate batch insert SQL
 */
export function generateBatchInsertSQL<T extends Record<string, unknown>>(
  table: string,
  records: T[],
  options: BatchInsertOptions = { chunkSize: 100 }
): Array<{ sql: string; params: unknown[] }> {
  const batches: Array<{ sql: string; params: unknown[] }> = [];

  if (records.length === 0) return batches;

  const columns = Object.keys(records[0]);

  for (let i = 0; i < records.length; i += options.chunkSize) {
    const chunk = records.slice(i, i + options.chunkSize);
    const params: unknown[] = [];
    const valueRows: string[] = [];

    for (const record of chunk) {
      const placeholders = columns.map((_, idx) => `$${params.length + idx + 1}`);
      valueRows.push(`(${placeholders.join(', ')})`);
      params.push(...columns.map((col) => record[col]));
    }

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valueRows.join(', ')}`;
    batches.push({ sql, params });

    if (options.onProgress) {
      options.onProgress(Math.min(i + options.chunkSize, records.length), records.length);
    }
  }

  return batches;
}

// ================================================================
// SINGLETON METRICS COLLECTOR
// ================================================================

let metricsCollector: QueryMetricsCollector | null = null;

export function getMetricsCollector(): QueryMetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new QueryMetricsCollector();
  }
  return metricsCollector;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  QueryBuilder,
  QueryPatterns,
  QueryMetricsCollector,
  RECOMMENDED_INDEXES,
  DEFAULT_POOL_CONFIG,
  PRODUCTION_POOL_CONFIG,
  generateIndexSQL,
  generateDropIndexSQL,
  analyzeQuery,
  generateBatchInsertSQL,
  getMetricsCollector,
};
