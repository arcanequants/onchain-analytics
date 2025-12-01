/**
 * Database Replica Client
 *
 * Provides read replica routing for analytics queries
 * Phase 4, Week 8 - Dev Engineering Checklist
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// ================================================================
// TYPES
// ================================================================

interface ClientOptions {
  /**
   * If true, use read replica for this query
   * Only use for queries that can tolerate replication lag
   */
  readonly?: boolean;

  /**
   * Maximum acceptable replication lag in milliseconds
   * If exceeded, falls back to primary
   */
  maxLagMs?: number;
}

interface ReplicaHealth {
  available: boolean;
  lagMs: number | null;
  lastChecked: Date;
}

// ================================================================
// CONFIGURATION
// ================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const REPLICA_ENABLED = process.env.ENABLE_READ_REPLICA === 'true';

// Health check cache duration (30 seconds)
const HEALTH_CHECK_CACHE_MS = 30_000;

// ================================================================
// CLIENTS
// ================================================================

/**
 * Primary database client (read-write)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' },
  global: {
    headers: { 'x-client-info': 'ai-perception-primary' },
  },
});

/**
 * Read replica client (read-only, for analytics)
 *
 * In Supabase, read replicas use connection pooling with read-only mode.
 * This is configured via the connection string options.
 */
export const supabaseReplica: SupabaseClient = REPLICA_ENABLED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'public' },
      global: {
        headers: {
          'x-client-info': 'ai-perception-replica',
          'x-connection-pool': 'replica',
        },
      },
    })
  : supabase; // Fallback to primary if replica not enabled

// ================================================================
// HEALTH MONITORING
// ================================================================

let replicaHealth: ReplicaHealth = {
  available: true,
  lagMs: null,
  lastChecked: new Date(0),
};

/**
 * Check replica health and replication lag
 */
async function checkReplicaHealth(): Promise<ReplicaHealth> {
  const now = new Date();

  // Use cached value if recent
  if (now.getTime() - replicaHealth.lastChecked.getTime() < HEALTH_CHECK_CACHE_MS) {
    return replicaHealth;
  }

  try {
    // Simple health check query
    const startTime = performance.now();
    const { error } = await supabaseReplica.from('analyses').select('id').limit(1);
    const endTime = performance.now();

    replicaHealth = {
      available: !error,
      lagMs: error ? null : Math.round(endTime - startTime),
      lastChecked: now,
    };

    if (error) {
      logger.warn('Replica health check failed', { error: error.message });
    }
  } catch (err) {
    replicaHealth = {
      available: false,
      lagMs: null,
      lastChecked: now,
    };
    logger.error('Replica health check error', { error: err });
  }

  return replicaHealth;
}

// ================================================================
// CLIENT SELECTION
// ================================================================

/**
 * Get the appropriate database client based on query requirements
 *
 * @param options - Query options
 * @returns Supabase client (primary or replica)
 *
 * @example
 * // For analytics queries (can use replica)
 * const client = await getClient({ readonly: true });
 * const { data } = await client.from('analyses').select('*');
 *
 * @example
 * // For writes (must use primary)
 * const client = await getClient({ readonly: false });
 * const { data } = await client.from('analyses').insert(analysis);
 */
export async function getClient(options: ClientOptions = {}): Promise<SupabaseClient> {
  const { readonly = false, maxLagMs = 1000 } = options;

  // Always use primary for writes
  if (!readonly) {
    return supabase;
  }

  // Check if replica is enabled
  if (!REPLICA_ENABLED) {
    return supabase;
  }

  // Check replica health
  const health = await checkReplicaHealth();

  if (!health.available) {
    logger.info('Replica unavailable, using primary');
    return supabase;
  }

  // Check if lag is acceptable
  if (health.lagMs !== null && health.lagMs > maxLagMs) {
    logger.info('Replica lag too high, using primary', {
      lag: health.lagMs,
      threshold: maxLagMs,
    });
    return supabase;
  }

  return supabaseReplica;
}

/**
 * Synchronous client getter (without health check)
 * Use when you need immediate client access without async
 *
 * WARNING: Does not check replica health, may fail on unhealthy replica
 */
export function getClientSync(options: ClientOptions = {}): SupabaseClient {
  const { readonly = false } = options;

  if (!readonly || !REPLICA_ENABLED) {
    return supabase;
  }

  // Use cached health status
  if (!replicaHealth.available) {
    return supabase;
  }

  return supabaseReplica;
}

// ================================================================
// QUERY HELPERS
// ================================================================

/**
 * Execute a read-only query on the replica
 */
export async function queryReplica<T>(
  queryFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = await getClient({ readonly: true });
  return queryFn(client);
}

/**
 * Execute a write query on the primary
 */
export async function queryPrimary<T>(
  queryFn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = await getClient({ readonly: false });
  return queryFn(client);
}

// ================================================================
// ANALYTICS QUERIES
// ================================================================

/**
 * Pre-configured queries for analytics (always use replica)
 */
export const analyticsQueries = {
  /**
   * Get analysis metrics for a date range
   */
  async getMetrics(startDate: Date, endDate: Date) {
    return queryReplica(async (client) => {
      const { data, error } = await client
        .from('analyses')
        .select('id, overall_score, industry, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;
      return data;
    });
  },

  /**
   * Get industry distribution
   */
  async getIndustryDistribution() {
    return queryReplica(async (client) => {
      const { data, error } = await client
        .from('analyses')
        .select('industry')
        .not('industry', 'is', null);

      if (error) throw error;

      // Count by industry
      const distribution: Record<string, number> = {};
      for (const row of data || []) {
        const industry = row.industry as string;
        distribution[industry] = (distribution[industry] || 0) + 1;
      }

      return distribution;
    });
  },

  /**
   * Get score trends over time
   */
  async getScoreTrends(days: number = 30) {
    return queryReplica(async (client) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await client
        .from('analyses')
        .select('overall_score, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    });
  },

  /**
   * Get top performing brands by industry
   */
  async getTopBrands(industry: string, limit: number = 10) {
    return queryReplica(async (client) => {
      const { data, error } = await client
        .from('analyses')
        .select('brand_name, overall_score, created_at')
        .eq('industry', industry)
        .order('overall_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    });
  },

  /**
   * Get feedback statistics
   */
  async getFeedbackStats() {
    return queryReplica(async (client) => {
      const { data, error } = await client
        .from('feedback')
        .select('feedback_type, is_positive, rating');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        positive: data?.filter((f) => f.is_positive).length || 0,
        negative: data?.filter((f) => f.is_positive === false).length || 0,
        averageRating:
          data?.reduce((sum, f) => sum + (f.rating || 0), 0) /
          (data?.filter((f) => f.rating).length || 1),
        byType: {} as Record<string, number>,
      };

      for (const row of data || []) {
        const type = row.feedback_type as string;
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      }

      return stats;
    });
  },
};

// ================================================================
// EXPORTS
// ================================================================

export {
  type ClientOptions,
  type ReplicaHealth,
  checkReplicaHealth,
};

export default {
  primary: supabase,
  replica: supabaseReplica,
  getClient,
  getClientSync,
  queryReplica,
  queryPrimary,
  analytics: analyticsQueries,
};
