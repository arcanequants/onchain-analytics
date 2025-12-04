/**
 * Analysis Store - Supabase Persistence Layer
 *
 * Phase 4: Chaos Engineering - Persistent Analysis Records
 *
 * Critical change: Replaces in-memory Map with Supabase persistence
 * to ensure analysis records survive server restarts.
 *
 * Features:
 * - Full Supabase persistence for all analysis records
 * - In-memory cache for active analyses (SSE performance)
 * - Automatic cache invalidation
 * - Fallback to direct DB queries
 */

import { z } from 'zod';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ================================================================
// TYPES
// ================================================================

const AnalyzeOptionsSchema = z.object({
  providers: z.array(z.enum(['openai', 'anthropic'])).default(['openai', 'anthropic']),
  queryBudget: z.number().int().min(5).max(50).default(20),
  includeCompetitors: z.boolean().default(true),
});

export type AnalyzeOptions = z.infer<typeof AnalyzeOptionsSchema>;

export interface AnalysisRecord {
  id: string;
  url: string;
  options: AnalyzeOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  resultId?: string;
  error?: string;
}

// Database row type (matches Supabase analyses table)
interface AnalysisRow {
  id: string;
  url: string;
  brand_name: string;
  status: string;
  providers_queried: string[];
  overall_score: number | null;
  score_breakdown: Record<string, number> | null;
  share_token: string | null;
  created_at: string;
  completed_at: string | null;
  processing_time_ms: number | null;
  // We store options and error in metadata columns or we adapt
}

// ================================================================
// SUPABASE CLIENT
// ================================================================

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('[AnalysisStore] Supabase not configured, falling back to in-memory store');
    return null;
  }

  supabaseClient = createClient(url, key);
  return supabaseClient;
}

// ================================================================
// IN-MEMORY CACHE (for active SSE connections)
// ================================================================

// Short-lived cache for active analyses (5 minute TTL)
const activeAnalysisCache = new Map<string, { record: AnalysisRecord; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedAnalysis(id: string): AnalysisRecord | undefined {
  const cached = activeAnalysisCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.record;
  }
  if (cached) {
    activeAnalysisCache.delete(id);
  }
  return undefined;
}

function setCachedAnalysis(id: string, record: AnalysisRecord): void {
  activeAnalysisCache.set(id, {
    record,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function invalidateCache(id: string): void {
  activeAnalysisCache.delete(id);
}

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [id, cached] of activeAnalysisCache.entries()) {
    if (cached.expiresAt < now) {
      activeAnalysisCache.delete(id);
    }
  }
}, 60 * 1000); // Cleanup every minute

// ================================================================
// FALLBACK IN-MEMORY STORE (when Supabase unavailable)
// ================================================================

const fallbackStore = new Map<string, AnalysisRecord>();

// ================================================================
// STORE FUNCTIONS
// ================================================================

/**
 * Get analysis by ID
 * Priority: Cache -> Supabase -> Fallback
 */
export async function getAnalysis(id: string): Promise<AnalysisRecord | undefined> {
  // 1. Check cache first (fast path for SSE)
  const cached = getCachedAnalysis(id);
  if (cached) {
    return cached;
  }

  // 2. Try Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // Not "not found"
          console.error('[AnalysisStore] Supabase error:', error);
        }
      } else if (data) {
        const record = dbRowToRecord(data);
        setCachedAnalysis(id, record);
        return record;
      }
    } catch (err) {
      console.error('[AnalysisStore] Failed to fetch from Supabase:', err);
    }
  }

  // 3. Fallback to in-memory
  return fallbackStore.get(id);
}

/**
 * Create or update analysis record
 */
export async function setAnalysis(id: string, record: AnalysisRecord): Promise<void> {
  // Always update cache
  setCachedAnalysis(id, record);

  // Try to persist to Supabase
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const row = recordToDbRow(record);
      const { error } = await supabase
        .from('analyses')
        .upsert(row, { onConflict: 'id' });

      if (error) {
        console.error('[AnalysisStore] Failed to persist to Supabase:', error);
        // Fallback to in-memory
        fallbackStore.set(id, record);
      }
    } catch (err) {
      console.error('[AnalysisStore] Supabase upsert error:', err);
      fallbackStore.set(id, record);
    }
  } else {
    // No Supabase, use fallback
    fallbackStore.set(id, record);
  }
}

/**
 * Update existing analysis record
 */
export async function updateAnalysis(id: string, updates: Partial<AnalysisRecord>): Promise<void> {
  const existing = await getAnalysis(id);
  if (!existing) {
    console.warn(`[AnalysisStore] Cannot update non-existent analysis: ${id}`);
    return;
  }

  const updated: AnalysisRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await setAnalysis(id, updated);
}

/**
 * List analyses with pagination
 */
export async function listAnalyses(options: {
  status?: AnalysisRecord['status'];
  limit?: number;
  offset?: number;
} = {}): Promise<AnalysisRecord[]> {
  const { status, limit = 50, offset = 0 } = options;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[AnalysisStore] Failed to list analyses:', error);
        return [];
      }

      return (data || []).map(dbRowToRecord);
    } catch (err) {
      console.error('[AnalysisStore] List error:', err);
      return [];
    }
  }

  // Fallback: return from in-memory store
  const records = Array.from(fallbackStore.values());
  return records
    .filter(r => !status || r.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit);
}

/**
 * Delete analysis by ID
 */
export async function deleteAnalysis(id: string): Promise<boolean> {
  invalidateCache(id);
  fallbackStore.delete(id);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[AnalysisStore] Failed to delete:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[AnalysisStore] Delete error:', err);
      return false;
    }
  }

  return true;
}

/**
 * Get analysis count by status
 */
export async function getAnalysisStats(): Promise<Record<AnalysisRecord['status'], number>> {
  const supabase = getSupabaseClient();
  const stats: Record<AnalysisRecord['status'], number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('status')
        .limit(10000);

      if (!error && data) {
        for (const row of data) {
          const status = row.status as AnalysisRecord['status'];
          if (status in stats) {
            stats[status]++;
          }
        }
      }
    } catch (err) {
      console.error('[AnalysisStore] Stats error:', err);
    }
  } else {
    // Fallback stats
    for (const record of fallbackStore.values()) {
      stats[record.status]++;
    }
  }

  return stats;
}

// ================================================================
// CONVERSION HELPERS
// ================================================================

/**
 * Convert database row to AnalysisRecord
 */
function dbRowToRecord(row: Record<string, unknown>): AnalysisRecord {
  return {
    id: String(row.id),
    url: String(row.url || ''),
    options: {
      providers: (row.providers_queried as string[]) || ['openai', 'anthropic'],
      queryBudget: 20,
      includeCompetitors: true,
    },
    status: (row.status as AnalysisRecord['status']) || 'pending',
    createdAt: String(row.created_at || new Date().toISOString()),
    updatedAt: String(row.completed_at || row.created_at || new Date().toISOString()),
    resultId: row.share_token ? String(row.share_token) : undefined,
    error: undefined, // DB doesn't store error in main table
  };
}

/**
 * Convert AnalysisRecord to database row for upsert
 */
function recordToDbRow(record: AnalysisRecord): Record<string, unknown> {
  // Extract brand name from URL
  let brandName = 'Unknown';
  try {
    const url = new URL(record.url);
    brandName = url.hostname.replace(/^www\./, '').split('.')[0];
    brandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  } catch {
    // Keep default
  }

  return {
    id: record.id,
    url: record.url,
    brand_name: brandName,
    status: record.status,
    providers_queried: record.options.providers,
    share_token: record.resultId || null,
    created_at: record.createdAt,
    completed_at: record.status === 'completed' ? record.updatedAt : null,
  };
}

// ================================================================
// SYNCHRONOUS WRAPPERS (for backward compatibility)
// ================================================================

/**
 * @deprecated Use async getAnalysis() instead
 * Synchronous wrapper - only checks cache and fallback store
 */
export function getAnalysisSync(id: string): AnalysisRecord | undefined {
  // Check cache first
  const cached = getCachedAnalysis(id);
  if (cached) return cached;

  // Check fallback store
  return fallbackStore.get(id);
}

/**
 * @deprecated Use async setAnalysis() instead
 * Synchronous wrapper - updates cache and fallback, queues Supabase write
 */
export function setAnalysisSync(id: string, record: AnalysisRecord): void {
  setCachedAnalysis(id, record);
  fallbackStore.set(id, record);

  // Queue async persistence (fire and forget)
  setAnalysis(id, record).catch(err => {
    console.error('[AnalysisStore] Background persist failed:', err);
  });
}

/**
 * @deprecated Use async updateAnalysis() instead
 * Synchronous wrapper - updates cache and fallback, queues Supabase write
 */
export function updateAnalysisSync(id: string, updates: Partial<AnalysisRecord>): void {
  const existing = getAnalysisSync(id);
  if (!existing) {
    console.warn(`[AnalysisStore] Cannot update non-existent analysis: ${id}`);
    return;
  }

  const updated: AnalysisRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  setAnalysisSync(id, updated);
}

// ================================================================
// EXPORTS
// ================================================================

export { AnalyzeOptionsSchema };

// Re-export sync versions as default for backward compatibility
// Code should migrate to async versions over time
export {
  getAnalysisSync as getAnalysisFast,
  setAnalysisSync as setAnalysisFast,
  updateAnalysisSync as updateAnalysisFast,
};
