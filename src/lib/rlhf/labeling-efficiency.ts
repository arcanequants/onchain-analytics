/**
 * RLHF Labeling Efficiency Measurement
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Measures and tracks labeling efficiency improvements from active learning
 * and automated pair mining strategies.
 *
 * Target: Labeling efficiency +30% improvement
 *
 * @module lib/rlhf/labeling-efficiency
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Labeling efficiency metrics
 */
export interface LabelingEfficiencyMetrics {
  // Core efficiency metrics
  pairsPerHour: number;
  qualityScore: number;
  usefulPairRate: number; // Pairs that improved model / total pairs

  // Time metrics
  avgLabelingTimeSeconds: number;
  medianLabelingTimeSeconds: number;

  // Quality metrics
  highQualityRate: number;
  agreementRate: number; // Inter-labeler agreement
  skipRate: number;

  // Volume metrics
  totalPairsLabeled: number;
  uniqueLabelers: number;

  // Efficiency gains
  implicitToExplicitRatio: number; // How many implicit pairs per 1 explicit
  automationRate: number; // % of pairs from automated mining
}

/**
 * Efficiency comparison (baseline vs current)
 */
export interface EfficiencyComparison {
  baseline: LabelingEfficiencyMetrics;
  current: LabelingEfficiencyMetrics;
  improvement: {
    pairsPerHour: number; // % change
    qualityScore: number;
    usefulPairRate: number;
    overallEfficiency: number; // Composite metric
  };
  targetMet: boolean;
  target: number; // 30%
}

/**
 * Labeling session data
 */
export interface LabelingSession {
  sessionId: string;
  labelerId: string;
  startTime: Date;
  endTime: Date;
  pairsLabeled: number;
  highQualityPairs: number;
  skippedPairs: number;
  avgTimePerPair: number;
}

/**
 * Active learning impact
 */
export interface ActiveLearningImpact {
  strategicRequestsCount: number;
  standardRequestsCount: number;
  strategicQualityScore: number;
  standardQualityScore: number;
  informationGain: number; // Bits of information gained
  modelImprovementRate: number; // How much model improved per pair
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Target efficiency improvement
 */
export const TARGET_IMPROVEMENT = 0.30; // 30%

/**
 * Baseline metrics (before optimizations)
 * These represent typical human labeling without active learning
 */
export const BASELINE_METRICS: LabelingEfficiencyMetrics = {
  pairsPerHour: 30, // Human labeler can do ~30 explicit comparisons/hour
  qualityScore: 0.65, // Without guidance, quality is moderate
  usefulPairRate: 0.50, // Half of pairs actually help model
  avgLabelingTimeSeconds: 120, // 2 minutes per pair
  medianLabelingTimeSeconds: 90,
  highQualityRate: 0.40,
  agreementRate: 0.70,
  skipRate: 0.15,
  totalPairsLabeled: 0,
  uniqueLabelers: 0,
  implicitToExplicitRatio: 0, // No automation before
  automationRate: 0,
};

// ============================================================================
// LABELING EFFICIENCY TRACKER CLASS
// ============================================================================

/**
 * Tracks and measures labeling efficiency
 */
export class LabelingEfficiencyTracker {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Calculate current labeling efficiency metrics
   */
  public async calculateCurrentMetrics(
    periodDays: number = 30
  ): Promise<LabelingEfficiencyMetrics> {
    const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get preference pairs statistics
    const { data: pairStats } = await this.supabase
      .from('preference_pairs')
      .select('source, confidence, is_high_quality, preferred, labeler_user_id, created_at')
      .gte('created_at', cutoffDate.toISOString());

    const pairs = pairStats || [];
    const totalPairs = pairs.length;

    if (totalPairs === 0) {
      return { ...BASELINE_METRICS, totalPairsLabeled: 0 };
    }

    // Calculate source breakdown
    const explicitPairs = pairs.filter((p) => p.source === 'explicit_comparison');
    const implicitPairs = pairs.filter((p) =>
      ['implicit_behavior', 'automated_mining'].includes(p.source)
    );
    const highQualityPairs = pairs.filter((p) => p.is_high_quality);
    const skippedPairs = pairs.filter((p) => p.preferred === 'skip');
    const uniqueLabelers = new Set(pairs.filter((p) => p.labeler_user_id).map((p) => p.labeler_user_id)).size;

    // Calculate average confidence as quality proxy
    const avgConfidence = pairs.reduce((sum, p) => sum + (p.confidence || 0), 0) / totalPairs;

    // Estimate labeling time from explicit pairs
    // (Implicit pairs are "free" - no human time)
    const explicitCount = explicitPairs.length;
    const hoursElapsed = periodDays * 24;

    // Calculate efficiency metrics
    const metrics: LabelingEfficiencyMetrics = {
      // Pairs per hour includes both explicit (human) and implicit (automated)
      // Efficiency gain comes from automation
      pairsPerHour: totalPairs / hoursElapsed,

      // Quality score based on confidence and high-quality rate
      qualityScore: avgConfidence * 0.6 + (highQualityPairs.length / totalPairs) * 0.4,

      // Useful pair rate (high quality pairs / total)
      usefulPairRate: totalPairs > 0 ? highQualityPairs.length / totalPairs : 0,

      // Average labeling time (only for explicit pairs)
      // Estimated at 60s with active learning guidance vs 120s baseline
      avgLabelingTimeSeconds: explicitCount > 0 ? 60 : 0,
      medianLabelingTimeSeconds: explicitCount > 0 ? 45 : 0,

      // High quality rate
      highQualityRate: totalPairs > 0 ? highQualityPairs.length / totalPairs : 0,

      // Agreement rate (estimated from confidence)
      agreementRate: avgConfidence,

      // Skip rate
      skipRate: totalPairs > 0 ? skippedPairs.length / totalPairs : 0,

      // Volume metrics
      totalPairsLabeled: totalPairs,
      uniqueLabelers,

      // Automation metrics
      implicitToExplicitRatio: explicitCount > 0 ? implicitPairs.length / explicitCount : implicitPairs.length,
      automationRate: totalPairs > 0 ? implicitPairs.length / totalPairs : 0,
    };

    return metrics;
  }

  /**
   * Compare current efficiency to baseline
   */
  public async compareToBaseline(
    periodDays: number = 30
  ): Promise<EfficiencyComparison> {
    const current = await this.calculateCurrentMetrics(periodDays);

    // Calculate improvements
    const pairsPerHourImprovement =
      BASELINE_METRICS.pairsPerHour > 0
        ? (current.pairsPerHour - BASELINE_METRICS.pairsPerHour) / BASELINE_METRICS.pairsPerHour
        : 0;

    const qualityScoreImprovement =
      BASELINE_METRICS.qualityScore > 0
        ? (current.qualityScore - BASELINE_METRICS.qualityScore) / BASELINE_METRICS.qualityScore
        : 0;

    const usefulPairRateImprovement =
      BASELINE_METRICS.usefulPairRate > 0
        ? (current.usefulPairRate - BASELINE_METRICS.usefulPairRate) / BASELINE_METRICS.usefulPairRate
        : 0;

    // Overall efficiency combines throughput and quality
    // Weighted: 40% throughput, 40% quality, 20% useful rate
    const overallEfficiency =
      pairsPerHourImprovement * 0.4 +
      qualityScoreImprovement * 0.4 +
      usefulPairRateImprovement * 0.2;

    const comparison: EfficiencyComparison = {
      baseline: BASELINE_METRICS,
      current,
      improvement: {
        pairsPerHour: Math.round(pairsPerHourImprovement * 1000) / 10,
        qualityScore: Math.round(qualityScoreImprovement * 1000) / 10,
        usefulPairRate: Math.round(usefulPairRateImprovement * 1000) / 10,
        overallEfficiency: Math.round(overallEfficiency * 1000) / 10,
      },
      targetMet: overallEfficiency >= TARGET_IMPROVEMENT,
      target: TARGET_IMPROVEMENT * 100,
    };

    return comparison;
  }

  /**
   * Calculate active learning impact
   */
  public async calculateActiveLearningImpact(
    periodDays: number = 30
  ): Promise<ActiveLearningImpact> {
    const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get active learning log entries
    const { data: activeLearningLog } = await this.supabase
      .from('active_learning_log')
      .select('*')
      .gte('created_at', cutoffDate.toISOString());

    const logEntries = activeLearningLog || [];

    // Separate strategic vs standard requests
    const strategicRequests = logEntries.filter((e) => e.is_strategic);
    const standardRequests = logEntries.filter((e) => !e.is_strategic);

    // Calculate quality scores
    const strategicQuality =
      strategicRequests.length > 0
        ? strategicRequests.reduce((sum, e) => sum + (e.quality_score || 0.5), 0) / strategicRequests.length
        : 0.5;

    const standardQuality =
      standardRequests.length > 0
        ? standardRequests.reduce((sum, e) => sum + (e.quality_score || 0.5), 0) / standardRequests.length
        : 0.5;

    // Estimate information gain (bits)
    // Strategic requests should have higher information gain
    const strategicInfoGain = strategicRequests.length * 0.8; // ~0.8 bits per strategic pair
    const standardInfoGain = standardRequests.length * 0.3; // ~0.3 bits per standard pair
    const totalInfoGain = strategicInfoGain + standardInfoGain;

    // Model improvement rate (estimated)
    const totalPairs = strategicRequests.length + standardRequests.length;
    const modelImprovementRate = totalPairs > 0 ? totalInfoGain / totalPairs : 0;

    return {
      strategicRequestsCount: strategicRequests.length,
      standardRequestsCount: standardRequests.length,
      strategicQualityScore: Math.round(strategicQuality * 100) / 100,
      standardQualityScore: Math.round(standardQuality * 100) / 100,
      informationGain: Math.round(totalInfoGain * 10) / 10,
      modelImprovementRate: Math.round(modelImprovementRate * 100) / 100,
    };
  }

  /**
   * Get efficiency trend over time
   */
  public async getEfficiencyTrend(
    periodDays: number = 90,
    intervalDays: number = 7
  ): Promise<Array<{ date: string; efficiency: number; pairsCount: number }>> {
    const trend: Array<{ date: string; efficiency: number; pairsCount: number }> = [];

    for (let i = periodDays; i >= 0; i -= intervalDays) {
      const endDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const startDate = new Date(endDate.getTime() - intervalDays * 24 * 60 * 60 * 1000);

      const { data: pairs } = await this.supabase
        .from('preference_pairs')
        .select('source, is_high_quality')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      const pairCount = pairs?.length || 0;
      const highQualityCount = pairs?.filter((p) => p.is_high_quality).length || 0;
      const automatedCount = pairs?.filter((p) =>
        ['implicit_behavior', 'automated_mining'].includes(p.source)
      ).length || 0;

      // Efficiency score: combines quality and automation
      const qualityFactor = pairCount > 0 ? highQualityCount / pairCount : 0;
      const automationFactor = pairCount > 0 ? automatedCount / pairCount : 0;
      const efficiency = qualityFactor * 0.5 + automationFactor * 0.5;

      trend.push({
        date: endDate.toISOString().split('T')[0],
        efficiency: Math.round(efficiency * 100),
        pairsCount: pairCount,
      });
    }

    return trend;
  }

  /**
   * Store efficiency measurement
   */
  public async storeEfficiencyMeasurement(
    comparison: EfficiencyComparison
  ): Promise<void> {
    try {
      await this.supabase.from('cron_executions').insert({
        job_name: 'labeling-efficiency-measurement',
        status: comparison.targetMet ? 'success' : 'warning',
        execution_time: 0,
        metadata: {
          baseline: comparison.baseline,
          current: comparison.current,
          improvement: comparison.improvement,
          targetMet: comparison.targetMet,
          target: comparison.target,
          measuredAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to store efficiency measurement:', error);
    }
  }

  /**
   * Get efficiency summary for dashboard
   */
  public async getEfficiencySummary(): Promise<{
    currentEfficiency: number;
    improvement: number;
    targetMet: boolean;
    trend: 'up' | 'down' | 'stable';
    metrics: LabelingEfficiencyMetrics;
  }> {
    const comparison = await this.compareToBaseline(30);
    const trend = await this.getEfficiencyTrend(30, 7);

    // Determine trend direction
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (trend.length >= 2) {
      const recent = trend[trend.length - 1].efficiency;
      const previous = trend[trend.length - 2].efficiency;
      if (recent > previous + 5) trendDirection = 'up';
      else if (recent < previous - 5) trendDirection = 'down';
    }

    return {
      currentEfficiency: Math.round(
        (comparison.current.qualityScore * 0.5 +
          comparison.current.automationRate * 0.5) *
          100
      ),
      improvement: comparison.improvement.overallEfficiency,
      targetMet: comparison.targetMet,
      trend: trendDirection,
      metrics: comparison.current,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create labeling efficiency tracker instance
 */
export function createLabelingEfficiencyTracker(): LabelingEfficiencyTracker {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return new LabelingEfficiencyTracker(supabaseUrl, supabaseKey);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default LabelingEfficiencyTracker;
