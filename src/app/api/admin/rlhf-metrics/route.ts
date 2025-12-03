/**
 * RLHF Metrics API Route
 *
 * Provides aggregated metrics for the RLHF dashboard.
 * Admin-only endpoint.
 *
 * @module api/admin/rlhf-metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

interface MetricsResponse {
  feedback: {
    totalFeedback: number;
    positiveFeedback: number;
    negativeFeedback: number;
    thumbsUpRate: number;
    avgRating: number;
    feedbackByType: Record<string, number>;
    feedbackTrend: { date: string; value: number }[];
  };
  pairs: {
    totalPairs: number;
    highQualityPairs: number;
    avgConfidence: number;
    pairsBySource: Record<string, number>;
    pairsByOutcome: Record<string, number>;
    conversionToTraining: number;
  };
  experiments: {
    activeExperiments: number;
    completedExperiments: number;
    avgLift: number;
    successRate: number;
    experimentsByType: Record<string, number>;
    recentResults: {
      id: string;
      name: string;
      promptType: string;
      winner: string | null;
      lift: number;
      confidence: number;
      concludedAt: string;
    }[];
  };
  learning: {
    pendingBatches: number;
    totalLabels: number;
    avgLabelingTime: number;
    topLabelers: {
      userId: string;
      email: string;
      totalLabels: number;
      accuracy: number;
      level: string;
    }[];
    labelQualityDistribution: Record<string, number>;
    trainingRuns: {
      id: string;
      modelName: string;
      samples: number;
      improvement: number;
      completedAt: string;
    }[];
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getDateRangeFilter(range: TimeRange): string | null {
  const now = new Date();

  switch (range) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    case 'all':
    default:
      return null;
  }
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Get time range from query
    const searchParams = request.nextUrl.searchParams;
    const range = (searchParams.get('range') || '7d') as TimeRange;
    const dateFilter = getDateRangeFilter(range);

    // Initialize Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all metrics in parallel
    const [
      feedbackMetrics,
      pairMetrics,
      experimentMetrics,
      learningMetrics,
    ] = await Promise.all([
      getFeedbackMetrics(supabase, dateFilter),
      getPairMetrics(supabase, dateFilter),
      getExperimentMetrics(supabase, dateFilter),
      getActiveLearningMetrics(supabase, dateFilter),
    ]);

    const response: MetricsResponse = {
      feedback: feedbackMetrics,
      pairs: pairMetrics,
      experiments: experimentMetrics,
      learning: learningMetrics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching RLHF metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

// ============================================================================
// METRIC FETCHERS
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFeedbackMetrics(
  supabase: any,
  dateFilter: string | null
) {
  // Build query
  let query = supabase.from('user_feedback').select('*');

  if (dateFilter) {
    query = query.gte('created_at', dateFilter);
  }

  const { data: feedback, error } = await query;

  if (error) {
    console.error('Error fetching feedback:', error);
    return getDefaultFeedbackMetrics();
  }

  const feedbackData = feedback || [];

  // Calculate metrics
  const totalFeedback = feedbackData.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const positiveFeedback = feedbackData.filter((f: any) => f.is_positive).length;
  const negativeFeedback = totalFeedback - positiveFeedback;
  const thumbsUpRate = totalFeedback > 0 ? positiveFeedback / totalFeedback : 0;

  // Average rating
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ratingsWithValue = feedbackData.filter((f: any) => f.rating !== null);
  const avgRating =
    ratingsWithValue.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ratingsWithValue.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) /
        ratingsWithValue.length
      : 0;

  // By type
  const feedbackByType: Record<string, number> = {};
  for (const f of feedbackData) {
    const type = f.feedback_type || 'other';
    feedbackByType[type] = (feedbackByType[type] || 0) + 1;
  }

  // Trend (daily counts)
  const trendMap = new Map<string, number>();
  for (const f of feedbackData) {
    const date = new Date(f.created_at).toISOString().split('T')[0];
    trendMap.set(date, (trendMap.get(date) || 0) + 1);
  }

  const feedbackTrend = Array.from(trendMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);

  return {
    totalFeedback,
    positiveFeedback,
    negativeFeedback,
    thumbsUpRate,
    avgRating,
    feedbackByType,
    feedbackTrend,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPairMetrics(
  supabase: any,
  dateFilter: string | null
) {
  let query = supabase.from('preference_pairs').select('*');

  if (dateFilter) {
    query = query.gte('created_at', dateFilter);
  }

  const { data: pairs, error } = await query;

  if (error) {
    console.error('Error fetching pairs:', error);
    return getDefaultPairMetrics();
  }

  const pairsData = pairs || [];

  const totalPairs = pairsData.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const highQualityPairs = pairsData.filter(
    (p: any) => (p.confidence || 0) >= 0.8
  ).length;

  const avgConfidence =
    totalPairs > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? pairsData.reduce((sum: number, p: any) => sum + (p.confidence || 0), 0) / totalPairs
      : 0;

  // By source
  const pairsBySource: Record<string, number> = {};
  for (const p of pairsData) {
    const source = p.source || 'unknown';
    pairsBySource[source] = (pairsBySource[source] || 0) + 1;
  }

  // By outcome
  const pairsByOutcome: Record<string, number> = {};
  for (const p of pairsData) {
    const outcome = p.outcome || 'unknown';
    pairsByOutcome[outcome] = (pairsByOutcome[outcome] || 0) + 1;
  }

  // Training conversion (placeholder - would need actual training data)
  const conversionToTraining = 0.75;

  return {
    totalPairs,
    highQualityPairs,
    avgConfidence,
    pairsBySource,
    pairsByOutcome,
    conversionToTraining,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getExperimentMetrics(
  supabase: any,
  dateFilter: string | null
) {
  const { data: experiments, error } = await supabase
    .from('prompt_experiments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching experiments:', error);
    return getDefaultExperimentMetrics();
  }

  const experimentsData = experiments || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeExperiments = experimentsData.filter(
    (e: any) => e.status === 'running'
  ).length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const completedExperiments = experimentsData.filter(
    (e: any) => e.status === 'concluded'
  ).length;

  // Calculate success metrics from concluded experiments
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const concluded = experimentsData.filter((e: any) => e.status === 'concluded');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withWinner = concluded.filter((e: any) => e.result?.winner);
  const successRate =
    concluded.length > 0 ? withWinner.length / concluded.length : 0;

  const avgLift =
    withWinner.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? withWinner.reduce((sum: number, e: any) => sum + (e.result?.lift || 0), 0) /
        withWinner.length
      : 0;

  // By type
  const experimentsByType: Record<string, number> = {};
  for (const e of experimentsData) {
    const type = e.prompt_type || 'other';
    experimentsByType[type] = (experimentsByType[type] || 0) + 1;
  }

  // Recent results
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentResults = concluded.slice(0, 10).map((e: any) => ({
    id: e.id,
    name: e.name,
    promptType: e.prompt_type,
    winner: e.result?.winner || null,
    lift: e.result?.lift || 0,
    confidence: e.result?.confidence || 0,
    concludedAt: e.concluded_at,
  }));

  return {
    activeExperiments,
    completedExperiments,
    avgLift,
    successRate,
    experimentsByType,
    recentResults,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getActiveLearningMetrics(
  supabase: any,
  dateFilter: string | null
) {
  // Get batches
  const { data: batches } = await supabase
    .from('active_learning_batches')
    .select('*');

  const batchesData = batches || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingBatches = batchesData.filter(
    (b: any) => b.status === 'pending' || b.status === 'in_progress'
  ).length;

  // Get labels
  let labelsQuery = supabase.from('active_learning_labels').select('*');

  if (dateFilter) {
    labelsQuery = labelsQuery.gte('created_at', dateFilter);
  }

  const { data: labels } = await labelsQuery;
  const labelsData = labels || [];

  const totalLabels = labelsData.length;
  const avgLabelingTime =
    totalLabels > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? labelsData.reduce((sum: number, l: any) => sum + (l.labeling_duration_ms || 0), 0) /
        totalLabels
      : 0;

  // Quality distribution
  const labelQualityDistribution: Record<string, number> = {};
  for (const l of labelsData) {
    const quality = l.label_quality || 'unverified';
    labelQualityDistribution[quality] =
      (labelQualityDistribution[quality] || 0) + 1;
  }

  // Top labelers
  const { data: labelerStats } = await supabase
    .from('vw_labeler_leaderboard')
    .select('*')
    .limit(10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topLabelers = (labelerStats || []).map((s: any) => ({
    userId: s.user_id,
    email: s.email,
    totalLabels: s.total_labels,
    accuracy: s.accuracy_score || 0,
    level: s.current_level || 'bronze',
  }));

  // Training runs
  const { data: trainingRuns } = await supabase
    .from('model_training_runs')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(5);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trainingRunsFormatted = (trainingRuns || []).map((r: any) => ({
    id: r.id,
    modelName: r.model_name,
    samples: r.training_samples,
    improvement: r.improvement?.accuracy_delta || 0,
    completedAt: r.completed_at,
  }));

  return {
    pendingBatches,
    totalLabels,
    avgLabelingTime,
    topLabelers,
    labelQualityDistribution,
    trainingRuns: trainingRunsFormatted,
  };
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

function getDefaultFeedbackMetrics() {
  return {
    totalFeedback: 0,
    positiveFeedback: 0,
    negativeFeedback: 0,
    thumbsUpRate: 0,
    avgRating: 0,
    feedbackByType: {},
    feedbackTrend: [],
  };
}

function getDefaultPairMetrics() {
  return {
    totalPairs: 0,
    highQualityPairs: 0,
    avgConfidence: 0,
    pairsBySource: {},
    pairsByOutcome: {},
    conversionToTraining: 0,
  };
}

function getDefaultExperimentMetrics() {
  return {
    activeExperiments: 0,
    completedExperiments: 0,
    avgLift: 0,
    successRate: 0,
    experimentsByType: {},
    recentResults: [],
  };
}
