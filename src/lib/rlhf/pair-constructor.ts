/**
 * RLHF Preference Pair Constructor
 *
 * Automatically generates preference pairs from implicit user behavior signals.
 * These pairs are used for training reward models in RLHF pipelines.
 *
 * Mining strategies:
 * 1. Dwell time comparison: Longer engagement = preferred
 * 2. Click-through: Clicked vs. skipped content
 * 3. Scroll depth: More scrolling = more engagement
 * 4. Return visits: Revisited content is valuable
 * 5. Copy/share actions: Shared content is preferred
 *
 * @module lib/rlhf/pair-constructor
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Source of the preference pair
 */
export type PreferenceSource =
  | 'explicit_comparison'
  | 'implicit_behavior'
  | 'expert_labeling'
  | 'automated_mining';

/**
 * Preference outcome
 */
export type PreferenceOutcome = 'a' | 'b' | 'tie' | 'skip';

/**
 * Configuration for pair mining
 */
export interface PairMiningConfig {
  /** Minimum dwell time difference (ms) to infer preference */
  minDwellTimeDifferenceMs: number;
  /** Minimum scroll depth difference (%) to infer preference */
  minScrollDepthDifference: number;
  /** Weight for dwell time signal (0-1) */
  dwellTimeWeight: number;
  /** Weight for scroll depth signal (0-1) */
  scrollDepthWeight: number;
  /** Weight for click signal (0-1) */
  clickWeight: number;
  /** Weight for copy/share signal (0-1) */
  copyShareWeight: number;
  /** Minimum confidence threshold to create pair */
  minConfidenceThreshold: number;
  /** Maximum age of events to consider (hours) */
  maxEventAgeHours: number;
  /** Batch size for processing */
  batchSize: number;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Aggregated signals for an analysis
 */
export interface AnalysisSignals {
  analysisId: string;
  sessionId: string;
  userId?: string;
  industryId?: string;
  dwellTimeMs: number;
  maxScrollDepth: number;
  clickCount: number;
  copyCount: number;
  shareCount: number;
  expandCount: number;
  pageViews: number;
  firstSeen: Date;
  lastSeen: Date;
}

/**
 * A constructed preference pair
 */
export interface PreferencePair {
  analysisAId: string;
  analysisBId: string;
  preferred: PreferenceOutcome;
  confidence: number;
  source: PreferenceSource;
  labelerUserId?: string;
  labelerType: 'user' | 'system';
  signals: {
    aDwellTimeMs: number;
    bDwellTimeMs: number;
    aScrollDepth: number;
    bScrollDepth: number;
    aClicks: number;
    bClicks: number;
    aCopies: number;
    bCopies: number;
  };
  industryId?: string;
  isHighQuality: boolean;
}

/**
 * Mining session result
 */
export interface MiningResult {
  pairsCreated: number;
  pairsSkipped: number;
  sessionsProcessed: number;
  errors: string[];
  duration: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_MINING_CONFIG: PairMiningConfig = {
  minDwellTimeDifferenceMs: 10000, // 10 seconds difference
  minScrollDepthDifference: 20, // 20% scroll difference
  dwellTimeWeight: 0.4,
  scrollDepthWeight: 0.25,
  clickWeight: 0.2,
  copyShareWeight: 0.15,
  minConfidenceThreshold: 0.6,
  maxEventAgeHours: 24 * 7, // 1 week
  batchSize: 100,
  debug: false,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate confidence based on signal differences
 */
export function calculateConfidence(
  signalsA: AnalysisSignals,
  signalsB: AnalysisSignals,
  config: PairMiningConfig
): { confidence: number; preferred: PreferenceOutcome } {
  let aScore = 0;
  let bScore = 0;
  let totalWeight = 0;

  // Dwell time comparison
  const dwellDiff = Math.abs(signalsA.dwellTimeMs - signalsB.dwellTimeMs);
  if (dwellDiff >= config.minDwellTimeDifferenceMs) {
    totalWeight += config.dwellTimeWeight;
    if (signalsA.dwellTimeMs > signalsB.dwellTimeMs) {
      aScore += config.dwellTimeWeight;
    } else {
      bScore += config.dwellTimeWeight;
    }
  }

  // Scroll depth comparison
  const scrollDiff = Math.abs(signalsA.maxScrollDepth - signalsB.maxScrollDepth);
  if (scrollDiff >= config.minScrollDepthDifference) {
    totalWeight += config.scrollDepthWeight;
    if (signalsA.maxScrollDepth > signalsB.maxScrollDepth) {
      aScore += config.scrollDepthWeight;
    } else {
      bScore += config.scrollDepthWeight;
    }
  }

  // Click comparison
  if (signalsA.clickCount !== signalsB.clickCount) {
    totalWeight += config.clickWeight;
    if (signalsA.clickCount > signalsB.clickCount) {
      aScore += config.clickWeight;
    } else {
      bScore += config.clickWeight;
    }
  }

  // Copy/Share comparison
  const aCopyShare = signalsA.copyCount + signalsA.shareCount;
  const bCopyShare = signalsB.copyCount + signalsB.shareCount;
  if (aCopyShare !== bCopyShare) {
    totalWeight += config.copyShareWeight;
    if (aCopyShare > bCopyShare) {
      aScore += config.copyShareWeight;
    } else {
      bScore += config.copyShareWeight;
    }
  }

  // Calculate confidence
  if (totalWeight === 0) {
    return { confidence: 0, preferred: 'skip' };
  }

  const normalizedAScore = aScore / totalWeight;
  const normalizedBScore = bScore / totalWeight;
  const diff = Math.abs(normalizedAScore - normalizedBScore);

  // Determine preference
  let preferred: PreferenceOutcome;
  if (diff < 0.1) {
    preferred = 'tie';
  } else if (normalizedAScore > normalizedBScore) {
    preferred = 'a';
  } else {
    preferred = 'b';
  }

  // Confidence is based on how different the scores are
  const confidence = Math.min(1, diff + 0.5);

  return { confidence, preferred };
}

/**
 * Determine if a pair is high quality based on signals
 */
export function isHighQualityPair(
  signalsA: AnalysisSignals,
  signalsB: AnalysisSignals,
  confidence: number
): boolean {
  // High quality if:
  // 1. Both analyses have significant engagement
  // 2. High confidence
  // 3. User is logged in
  // 4. Clear winner (not a tie)

  const minEngagementTime = 15000; // 15 seconds
  const minScrollDepth = 25;

  const aHasEngagement =
    signalsA.dwellTimeMs >= minEngagementTime || signalsA.maxScrollDepth >= minScrollDepth;
  const bHasEngagement =
    signalsB.dwellTimeMs >= minEngagementTime || signalsB.maxScrollDepth >= minScrollDepth;
  const hasUser = !!signalsA.userId || !!signalsB.userId;

  return aHasEngagement && bHasEngagement && confidence >= 0.7 && hasUser;
}

// ============================================================================
// PAIR CONSTRUCTOR CLASS
// ============================================================================

/**
 * Main class for constructing preference pairs from implicit signals
 */
export class PreferencePairConstructor {
  private supabase: SupabaseClient;
  private config: PairMiningConfig;

  constructor(supabaseUrl: string, supabaseKey: string, config: Partial<PairMiningConfig> = {}) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.config = { ...DEFAULT_MINING_CONFIG, ...config };
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<PairMiningConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Mine preference pairs from recent implicit signals
   */
  public async minePreferencePairs(): Promise<MiningResult> {
    const startTime = Date.now();
    const result: MiningResult = {
      pairsCreated: 0,
      pairsSkipped: 0,
      sessionsProcessed: 0,
      errors: [],
      duration: 0,
    };

    try {
      // Get sessions with multiple analysis views in the time window
      const sessions = await this.getSessionsWithMultipleAnalyses();
      this.log(`Found ${sessions.length} sessions to process`);

      for (const sessionId of sessions) {
        try {
          const pairsFromSession = await this.processSession(sessionId);
          result.pairsCreated += pairsFromSession.created;
          result.pairsSkipped += pairsFromSession.skipped;
          result.sessionsProcessed++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Session ${sessionId}: ${errorMessage}`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Mining error: ${errorMessage}`);
    }

    result.duration = Date.now() - startTime;
    this.log(`Mining complete: ${result.pairsCreated} pairs created in ${result.duration}ms`);

    return result;
  }

  /**
   * Process a single session and create pairs
   */
  private async processSession(
    sessionId: string
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    // Get aggregated signals for each analysis viewed in this session
    const signals = await this.getSessionAnalysisSignals(sessionId);

    if (signals.length < 2) {
      return { created: 0, skipped: 0 };
    }

    this.log(`Session ${sessionId}: ${signals.length} analyses viewed`);

    // Create pairs for each combination
    for (let i = 0; i < signals.length - 1; i++) {
      for (let j = i + 1; j < signals.length; j++) {
        const signalsA = signals[i];
        const signalsB = signals[j];

        // Check if pair already exists
        const exists = await this.pairExists(signalsA.analysisId, signalsB.analysisId);
        if (exists) {
          skipped++;
          continue;
        }

        // Calculate preference
        const { confidence, preferred } = calculateConfidence(signalsA, signalsB, this.config);

        if (confidence < this.config.minConfidenceThreshold || preferred === 'skip') {
          skipped++;
          continue;
        }

        // Create the pair
        const pair: PreferencePair = {
          analysisAId: signalsA.analysisId,
          analysisBId: signalsB.analysisId,
          preferred,
          confidence,
          source: 'implicit_behavior',
          labelerUserId: signalsA.userId || signalsB.userId,
          labelerType: 'system',
          signals: {
            aDwellTimeMs: signalsA.dwellTimeMs,
            bDwellTimeMs: signalsB.dwellTimeMs,
            aScrollDepth: signalsA.maxScrollDepth,
            bScrollDepth: signalsB.maxScrollDepth,
            aClicks: signalsA.clickCount,
            bClicks: signalsB.clickCount,
            aCopies: signalsA.copyCount,
            bCopies: signalsB.copyCount,
          },
          industryId: signalsA.industryId || signalsB.industryId,
          isHighQuality: isHighQualityPair(signalsA, signalsB, confidence),
        };

        try {
          await this.savePair(pair);
          created++;
        } catch (error) {
          this.log('Failed to save pair:', error);
          skipped++;
        }
      }
    }

    return { created, skipped };
  }

  /**
   * Get sessions that viewed multiple analyses in the time window
   */
  private async getSessionsWithMultipleAnalyses(): Promise<string[]> {
    const cutoffTime = new Date(Date.now() - this.config.maxEventAgeHours * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('implicit_feedback_events')
      .select('session_id, analysis_id')
      .gte('created_at', cutoffTime.toISOString())
      .not('analysis_id', 'is', null)
      .order('session_id');

    if (error) {
      throw new Error(`Failed to get sessions: ${error.message}`);
    }

    // Group by session and filter those with 2+ analyses
    const sessionAnalyses = new Map<string, Set<string>>();
    for (const row of data || []) {
      if (!sessionAnalyses.has(row.session_id)) {
        sessionAnalyses.set(row.session_id, new Set());
      }
      sessionAnalyses.get(row.session_id)!.add(row.analysis_id);
    }

    return Array.from(sessionAnalyses.entries())
      .filter(([, analyses]) => analyses.size >= 2)
      .map(([sessionId]) => sessionId)
      .slice(0, this.config.batchSize);
  }

  /**
   * Get aggregated signals for each analysis in a session
   */
  private async getSessionAnalysisSignals(sessionId: string): Promise<AnalysisSignals[]> {
    const cutoffTime = new Date(Date.now() - this.config.maxEventAgeHours * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('implicit_feedback_events')
      .select('*')
      .eq('session_id', sessionId)
      .gte('created_at', cutoffTime.toISOString())
      .not('analysis_id', 'is', null);

    if (error) {
      throw new Error(`Failed to get session signals: ${error.message}`);
    }

    // Aggregate by analysis
    const analysisMap = new Map<string, AnalysisSignals>();

    for (const event of data || []) {
      const analysisId = event.analysis_id;
      if (!analysisId) continue;

      if (!analysisMap.has(analysisId)) {
        analysisMap.set(analysisId, {
          analysisId,
          sessionId,
          userId: event.user_id || undefined,
          dwellTimeMs: 0,
          maxScrollDepth: 0,
          clickCount: 0,
          copyCount: 0,
          shareCount: 0,
          expandCount: 0,
          pageViews: 0,
          firstSeen: new Date(event.created_at),
          lastSeen: new Date(event.created_at),
        });
      }

      const signals = analysisMap.get(analysisId)!;

      // Update timestamps
      const eventTime = new Date(event.created_at);
      if (eventTime < signals.firstSeen) signals.firstSeen = eventTime;
      if (eventTime > signals.lastSeen) signals.lastSeen = eventTime;

      // Aggregate by event type
      switch (event.event_type) {
        case 'dwell_time':
          signals.dwellTimeMs = Math.max(signals.dwellTimeMs, event.value || 0);
          break;
        case 'scroll_depth':
          signals.maxScrollDepth = Math.max(signals.maxScrollDepth, event.value || 0);
          break;
        case 'click':
          signals.clickCount++;
          break;
        case 'copy':
          signals.copyCount++;
          break;
        case 'share':
          signals.shareCount++;
          break;
        case 'expand':
          signals.expandCount++;
          break;
        case 'page_view':
          signals.pageViews++;
          break;
      }
    }

    return Array.from(analysisMap.values());
  }

  /**
   * Check if a pair already exists (in either order)
   */
  private async pairExists(analysisAId: string, analysisBId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('preference_pairs')
      .select('id')
      .or(
        `and(analysis_a_id.eq.${analysisAId},analysis_b_id.eq.${analysisBId}),and(analysis_a_id.eq.${analysisBId},analysis_b_id.eq.${analysisAId})`
      )
      .limit(1);

    if (error) {
      this.log('Error checking pair existence:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  }

  /**
   * Save a preference pair to the database
   */
  private async savePair(pair: PreferencePair): Promise<void> {
    const { error } = await this.supabase.from('preference_pairs').insert({
      analysis_a_id: pair.analysisAId,
      analysis_b_id: pair.analysisBId,
      preferred: pair.preferred,
      confidence: pair.confidence,
      source: pair.source,
      labeler_user_id: pair.labelerUserId || null,
      labeler_type: pair.labelerType,
      signals: pair.signals,
      industry_id: pair.industryId || null,
      is_high_quality: pair.isHighQuality,
      quality_score: pair.isHighQuality ? 0.8 : 0.5,
    });

    if (error) {
      throw new Error(`Failed to save pair: ${error.message}`);
    }
  }

  /**
   * Create an explicit comparison pair (from user choice)
   */
  public async createExplicitPair(
    analysisAId: string,
    analysisBId: string,
    preferred: 'a' | 'b' | 'tie',
    userId: string,
    context?: Record<string, unknown>
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('preference_pairs')
      .insert({
        analysis_a_id: analysisAId,
        analysis_b_id: analysisBId,
        preferred,
        confidence: 0.9, // High confidence for explicit comparisons
        source: 'explicit_comparison',
        labeler_user_id: userId,
        labeler_type: 'user',
        comparison_context: context || {},
        signals: {},
        is_high_quality: true,
        quality_score: 0.9,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create explicit pair: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Get preference pairs for training export
   */
  public async getTrainingPairs(options: {
    minQualityScore?: number;
    limit?: number;
    onlyUnused?: boolean;
    industryId?: string;
  }): Promise<PreferencePair[]> {
    let query = this.supabase
      .from('preference_pairs')
      .select('*')
      .neq('preferred', 'skip')
      .order('created_at', { ascending: false });

    if (options.minQualityScore) {
      query = query.gte('quality_score', options.minQualityScore);
    }

    if (options.onlyUnused) {
      query = query.eq('is_used_in_training', false);
    }

    if (options.industryId) {
      query = query.eq('industry_id', options.industryId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get training pairs: ${error.message}`);
    }

    return (data || []).map((row) => ({
      analysisAId: row.analysis_a_id,
      analysisBId: row.analysis_b_id,
      preferred: row.preferred,
      confidence: row.confidence,
      source: row.source,
      labelerUserId: row.labeler_user_id,
      labelerType: row.labeler_type,
      signals: row.signals || {},
      industryId: row.industry_id,
      isHighQuality: row.is_high_quality,
    }));
  }

  /**
   * Mark pairs as used in training
   */
  public async markPairsAsUsed(pairIds: string[], batchId: string): Promise<void> {
    const { error } = await this.supabase
      .from('preference_pairs')
      .update({
        is_used_in_training: true,
        training_batch_id: batchId,
      })
      .in('id', pairIds);

    if (error) {
      throw new Error(`Failed to mark pairs as used: ${error.message}`);
    }
  }

  /**
   * Get statistics about preference pairs
   */
  public async getStats(): Promise<{
    total: number;
    bySource: Record<PreferenceSource, number>;
    byPreferred: Record<PreferenceOutcome, number>;
    highQuality: number;
    usedInTraining: number;
    avgConfidence: number;
  }> {
    const { data, error } = await this.supabase.from('vw_preference_stats').select('*');

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const stats = {
      total: 0,
      bySource: {} as Record<PreferenceSource, number>,
      byPreferred: { a: 0, b: 0, tie: 0, skip: 0 } as Record<PreferenceOutcome, number>,
      highQuality: 0,
      usedInTraining: 0,
      avgConfidence: 0,
    };

    for (const row of data || []) {
      const source = row.source as PreferenceSource;
      stats.bySource[source] = row.total_pairs;
      stats.total += row.total_pairs;
      stats.byPreferred.a += row.preferred_a;
      stats.byPreferred.b += row.preferred_b;
      stats.byPreferred.tie += row.ties;
      stats.byPreferred.skip += row.skips;
      stats.highQuality += row.high_quality_count;
      stats.usedInTraining += row.used_in_training;
      stats.avgConfidence += row.avg_confidence * row.total_pairs;
    }

    if (stats.total > 0) {
      stats.avgConfidence /= stats.total;
    }

    return stats;
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[PairConstructor] ${message}`, ...args);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a preference pair constructor instance
 */
export function createPairConstructor(
  config?: Partial<PairMiningConfig>
): PreferencePairConstructor {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return new PreferencePairConstructor(supabaseUrl, supabaseKey, config);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PreferencePairConstructor;
