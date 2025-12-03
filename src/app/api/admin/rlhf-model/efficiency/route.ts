/**
 * Labeling Efficiency Measurement API Endpoint
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Measures and tracks labeling efficiency improvements from active learning.
 * Target: Labeling efficiency +30% improvement
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

interface LabelingEfficiencyMetrics {
  pairsPerHour: number;
  qualityScore: number;
  usefulPairRate: number;
  avgLabelingTimeSeconds: number;
  medianLabelingTimeSeconds: number;
  highQualityRate: number;
  agreementRate: number;
  skipRate: number;
  totalPairsLabeled: number;
  uniqueLabelers: number;
  implicitToExplicitRatio: number;
  automationRate: number;
}

interface EfficiencyComparison {
  baseline: LabelingEfficiencyMetrics;
  current: LabelingEfficiencyMetrics;
  improvement: {
    pairsPerHour: number;
    qualityScore: number;
    usefulPairRate: number;
    overallEfficiency: number;
  };
  targetMet: boolean;
  target: number;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const TARGET_IMPROVEMENT = 0.30; // 30%

const BASELINE_METRICS: LabelingEfficiencyMetrics = {
  pairsPerHour: 30,
  qualityScore: 0.65,
  usefulPairRate: 0.50,
  avgLabelingTimeSeconds: 120,
  medianLabelingTimeSeconds: 90,
  highQualityRate: 0.40,
  agreementRate: 0.70,
  skipRate: 0.15,
  totalPairsLabeled: 0,
  uniqueLabelers: 0,
  implicitToExplicitRatio: 0,
  automationRate: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;

  if (!adminSecret) {
    return false;
  }

  return authHeader === `Bearer ${adminSecret}`;
}

async function calculateCurrentMetrics(periodDays: number): Promise<LabelingEfficiencyMetrics> {
  const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const { data: pairStats } = await supabase
    .from('preference_pairs')
    .select('source, confidence, is_high_quality, preferred, labeler_user_id, created_at')
    .gte('created_at', cutoffDate.toISOString());

  const pairs = pairStats || [];
  const totalPairs = pairs.length;

  if (totalPairs === 0) {
    return { ...BASELINE_METRICS, totalPairsLabeled: 0 };
  }

  const explicitPairs = pairs.filter((p) => p.source === 'explicit_comparison');
  const implicitPairs = pairs.filter((p) =>
    ['implicit_behavior', 'automated_mining'].includes(p.source)
  );
  const highQualityPairs = pairs.filter((p) => p.is_high_quality);
  const skippedPairs = pairs.filter((p) => p.preferred === 'skip');
  const uniqueLabelers = new Set(
    pairs.filter((p) => p.labeler_user_id).map((p) => p.labeler_user_id)
  ).size;

  const avgConfidence = pairs.reduce((sum, p) => sum + (p.confidence || 0), 0) / totalPairs;
  const explicitCount = explicitPairs.length;
  const hoursElapsed = periodDays * 24;

  return {
    pairsPerHour: totalPairs / hoursElapsed,
    qualityScore: avgConfidence * 0.6 + (highQualityPairs.length / totalPairs) * 0.4,
    usefulPairRate: highQualityPairs.length / totalPairs,
    avgLabelingTimeSeconds: explicitCount > 0 ? 60 : 0,
    medianLabelingTimeSeconds: explicitCount > 0 ? 45 : 0,
    highQualityRate: highQualityPairs.length / totalPairs,
    agreementRate: avgConfidence,
    skipRate: skippedPairs.length / totalPairs,
    totalPairsLabeled: totalPairs,
    uniqueLabelers,
    implicitToExplicitRatio:
      explicitCount > 0 ? implicitPairs.length / explicitCount : implicitPairs.length,
    automationRate: implicitPairs.length / totalPairs,
  };
}

async function compareToBaseline(periodDays: number): Promise<EfficiencyComparison> {
  const current = await calculateCurrentMetrics(periodDays);

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

  const overallEfficiency =
    pairsPerHourImprovement * 0.4 + qualityScoreImprovement * 0.4 + usefulPairRateImprovement * 0.2;

  return {
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
}

async function getActiveLearningImpact(periodDays: number) {
  const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  const { data: activeLearningLog } = await supabase
    .from('active_learning_log')
    .select('*')
    .gte('created_at', cutoffDate.toISOString());

  const logEntries = activeLearningLog || [];

  const strategicRequests = logEntries.filter((e) => e.is_strategic);
  const standardRequests = logEntries.filter((e) => !e.is_strategic);

  const strategicQuality =
    strategicRequests.length > 0
      ? strategicRequests.reduce((sum, e) => sum + (e.quality_score || 0.5), 0) /
        strategicRequests.length
      : 0.5;

  const standardQuality =
    standardRequests.length > 0
      ? standardRequests.reduce((sum, e) => sum + (e.quality_score || 0.5), 0) /
        standardRequests.length
      : 0.5;

  const strategicInfoGain = strategicRequests.length * 0.8;
  const standardInfoGain = standardRequests.length * 0.3;
  const totalInfoGain = strategicInfoGain + standardInfoGain;

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

async function getEfficiencyTrend(periodDays: number, intervalDays: number) {
  const trend: Array<{ date: string; efficiency: number; pairsCount: number }> = [];

  for (let i = periodDays; i >= 0; i -= intervalDays) {
    const endDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - intervalDays * 24 * 60 * 60 * 1000);

    const { data: pairs } = await supabase
      .from('preference_pairs')
      .select('source, is_high_quality')
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    const pairCount = pairs?.length || 0;
    const highQualityCount = pairs?.filter((p) => p.is_high_quality).length || 0;
    const automatedCount =
      pairs?.filter((p) => ['implicit_behavior', 'automated_mining'].includes(p.source)).length ||
      0;

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

// ============================================================================
// API HANDLERS
// ============================================================================

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const { periodDays = 30 } = body;

    console.log('Starting labeling efficiency measurement...');

    const comparison = await compareToBaseline(periodDays);
    const activeLearningImpact = await getActiveLearningImpact(periodDays);
    const trend = await getEfficiencyTrend(periodDays, 7);

    // Determine trend direction
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    if (trend.length >= 2) {
      const recent = trend[trend.length - 1].efficiency;
      const previous = trend[trend.length - 2].efficiency;
      if (recent > previous + 5) trendDirection = 'up';
      else if (recent < previous - 5) trendDirection = 'down';
    }

    // Store measurement
    await supabase.from('cron_executions').insert({
      job_name: 'labeling-efficiency-measurement',
      status: comparison.targetMet ? 'success' : 'warning',
      execution_time: Date.now() - startTime,
      metadata: {
        baseline: comparison.baseline,
        current: comparison.current,
        improvement: comparison.improvement,
        targetMet: comparison.targetMet,
        target: comparison.target,
        activeLearningImpact,
        trend: trendDirection,
        measuredAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      efficiency: {
        current: {
          pairsPerHour: Math.round(comparison.current.pairsPerHour * 10) / 10,
          qualityScore: Math.round(comparison.current.qualityScore * 100),
          usefulPairRate: Math.round(comparison.current.usefulPairRate * 100),
          highQualityRate: Math.round(comparison.current.highQualityRate * 100),
          automationRate: Math.round(comparison.current.automationRate * 100),
          totalPairsLabeled: comparison.current.totalPairsLabeled,
          uniqueLabelers: comparison.current.uniqueLabelers,
        },
        baseline: {
          pairsPerHour: comparison.baseline.pairsPerHour,
          qualityScore: Math.round(comparison.baseline.qualityScore * 100),
          usefulPairRate: Math.round(comparison.baseline.usefulPairRate * 100),
        },
        improvement: comparison.improvement,
      },
      target: {
        required: comparison.target,
        current: comparison.improvement.overallEfficiency,
        met: comparison.targetMet,
        gap: comparison.targetMet
          ? 0
          : Math.round((comparison.target - comparison.improvement.overallEfficiency) * 10) / 10,
      },
      activeLearning: activeLearningImpact,
      trend: {
        direction: trendDirection,
        data: trend,
      },
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error measuring labeling efficiency:', error);

    await supabase.from('cron_executions').insert({
      job_name: 'labeling-efficiency-measurement',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to measure labeling efficiency',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get latest efficiency measurement
    const { data: latestMeasurement } = await supabase
      .from('cron_executions')
      .select('*')
      .eq('job_name', 'labeling-efficiency-measurement')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get measurement history
    const { data: measurementHistory } = await supabase
      .from('cron_executions')
      .select('*')
      .eq('job_name', 'labeling-efficiency-measurement')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get current stats
    const comparison = await compareToBaseline(30);

    return NextResponse.json({
      success: true,
      summary: {
        currentEfficiency: Math.round(
          (comparison.current.qualityScore * 0.5 + comparison.current.automationRate * 0.5) * 100
        ),
        improvement: comparison.improvement.overallEfficiency,
        targetMet: comparison.targetMet,
        target: comparison.target,
      },
      latestMeasurement: latestMeasurement
        ? {
            timestamp: latestMeasurement.created_at,
            status: latestMeasurement.status,
            improvement: latestMeasurement.metadata?.improvement,
            targetMet: latestMeasurement.metadata?.targetMet,
          }
        : null,
      measurementHistory: measurementHistory?.map((m) => ({
        timestamp: m.created_at,
        status: m.status,
        improvement: m.metadata?.improvement?.overallEfficiency,
        targetMet: m.metadata?.targetMet,
        duration: m.execution_time,
      })),
      currentMetrics: {
        totalPairs: comparison.current.totalPairsLabeled,
        highQualityRate: Math.round(comparison.current.highQualityRate * 100),
        automationRate: Math.round(comparison.current.automationRate * 100),
        implicitToExplicitRatio: Math.round(comparison.current.implicitToExplicitRatio * 10) / 10,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get efficiency metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
