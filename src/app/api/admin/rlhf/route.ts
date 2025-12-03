/**
 * Admin RLHF API
 * Phase 4, Week 9 - Admin API Endpoints
 *
 * Returns RLHF (Reinforcement Learning from Human Feedback) metrics
 * from actual database tables.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// TYPES
// ============================================================================

interface CalibrationStats {
  totalIndustries: number;
  wellCalibrated: number;
  needsAttention: number;
  totalSamples: number;
  avgMae: number;
}

interface CorrectionStats {
  totalCorrections: number;
  pendingReview: number;
  applied: number;
  rejected: number;
}

interface FeedbackOverview {
  totalFeedback: number;
  thumbsUp: number;
  thumbsDown: number;
  avgRating: number;
  correctionsSubmitted: number;
}

// ============================================================================
// DATA FETCHERS
// ============================================================================

async function getCalibrationData(supabase: ReturnType<typeof getSupabaseClient>) {
  // Get calibration data by industry
  const { data: calibrationData, error: calibrationError } = await supabase
    .from('calibration_data')
    .select('*')
    .order('updated_at', { ascending: false });

  if (calibrationError) {
    console.error('Error fetching calibration data:', calibrationError);
  }

  // Get recent adjustments
  const { data: adjustments, error: adjustmentsError } = await supabase
    .from('calibration_adjustments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (adjustmentsError) {
    console.error('Error fetching adjustments:', adjustmentsError);
  }

  // Calculate stats
  const industries = calibrationData || [];
  const uniqueIndustries = [...new Set(industries.map((i) => i.industry))];

  const stats: CalibrationStats = {
    totalIndustries: uniqueIndustries.length,
    wellCalibrated: industries.filter((i) => (i.mae || 0) < 5).length,
    needsAttention: industries.filter((i) => (i.mae || 0) >= 10).length,
    totalSamples: industries.reduce((sum, i) => sum + (i.sample_count || 0), 0),
    avgMae: industries.length > 0
      ? industries.reduce((sum, i) => sum + (i.mae || 0), 0) / industries.length
      : 0,
  };

  // Group by industry for display
  const industryMap = new Map<string, {
    industry: string;
    mae: number;
    samples: number;
    adjustmentFactor: number;
    lastUpdated: string;
  }>();

  for (const item of industries) {
    const existing = industryMap.get(item.industry);
    if (!existing || new Date(item.updated_at) > new Date(existing.lastUpdated)) {
      industryMap.set(item.industry, {
        industry: item.industry,
        mae: item.mae || 0,
        samples: item.sample_count || 0,
        adjustmentFactor: item.adjustment_factor || 1.0,
        lastUpdated: item.updated_at,
      });
    }
  }

  return {
    industries: Array.from(industryMap.values()),
    stats,
    adjustments: adjustments || [],
    hasData: industries.length > 0,
  };
}

async function getCorrectionsData(supabase: ReturnType<typeof getSupabaseClient>) {
  // Get all corrections with stats
  const { data: corrections, error: correctionsError } = await supabase
    .from('score_corrections')
    .select('*')
    .order('created_at', { ascending: false });

  if (correctionsError) {
    console.error('Error fetching corrections:', correctionsError);
  }

  const items = corrections || [];

  // Calculate stats
  const stats: CorrectionStats = {
    totalCorrections: items.length,
    pendingReview: items.filter((c) => c.status === 'pending' || c.status === 'under_review').length,
    applied: items.filter((c) => c.status === 'applied').length,
    rejected: items.filter((c) => c.status === 'rejected').length,
  };

  // Get recent activity (last 20 items)
  const recentActivity = items.slice(0, 20).map((c) => ({
    id: c.id,
    brandName: c.brand_name,
    brandDomain: c.brand_domain,
    originalScore: c.original_score,
    correctedScore: c.corrected_score,
    correctionType: c.correction_type,
    status: c.status,
    priority: c.priority,
    createdAt: c.created_at,
    reason: c.correction_reason,
  }));

  return {
    items: recentActivity,
    stats,
    recentActivity,
    hasData: items.length > 0,
  };
}

async function getMetricsData(supabase: ReturnType<typeof getSupabaseClient>) {
  // Get all feedback
  const { data: feedback, error: feedbackError } = await supabase
    .from('user_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (feedbackError) {
    console.error('Error fetching feedback:', feedbackError);
  }

  const items = feedback || [];

  // Get preference pairs count
  const { count: pairsCount, error: pairsError } = await supabase
    .from('preference_pairs')
    .select('*', { count: 'exact', head: true });

  if (pairsError) {
    console.error('Error fetching preference pairs:', pairsError);
  }

  // Get training runs
  const { data: trainingRuns, error: trainingError } = await supabase
    .from('rlhf_training_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (trainingError) {
    console.error('Error fetching training runs:', trainingError);
  }

  // Calculate overview stats
  const thumbsUp = items.filter((f) => f.feedback_type === 'thumbs_up').length;
  const thumbsDown = items.filter((f) => f.feedback_type === 'thumbs_down').length;
  const ratings = items.filter((f) => f.rating !== null);
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, f) => sum + (f.rating || 0), 0) / ratings.length
    : 0;

  const overview: FeedbackOverview = {
    totalFeedback: items.length,
    thumbsUp,
    thumbsDown,
    avgRating: Math.round(avgRating * 100) / 100,
    correctionsSubmitted: items.filter((f) => f.feedback_type === 'correction').length,
  };

  // Calculate trends (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentItems = items.filter((f) => new Date(f.created_at) >= sevenDaysAgo);
  const dailyTrends: { date: string; positive: number; negative: number; total: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayItems = recentItems.filter((f) => f.created_at.startsWith(dateStr));
    dailyTrends.push({
      date: dateStr,
      positive: dayItems.filter((f) => f.feedback_type === 'thumbs_up' || (f.rating && f.rating >= 4)).length,
      negative: dayItems.filter((f) => f.feedback_type === 'thumbs_down' || (f.rating && f.rating <= 2)).length,
      total: dayItems.length,
    });
  }

  // Calculate by category/page context
  const byCategory: { category: string; count: number; avgRating: number }[] = [];
  const categoryMap = new Map<string, { count: number; totalRating: number; ratingCount: number }>();

  for (const item of items) {
    const category = item.page_context || 'unknown';
    const existing = categoryMap.get(category) || { count: 0, totalRating: 0, ratingCount: 0 };
    existing.count++;
    if (item.rating) {
      existing.totalRating += item.rating;
      existing.ratingCount++;
    }
    categoryMap.set(category, existing);
  }

  for (const [category, data] of categoryMap.entries()) {
    byCategory.push({
      category,
      count: data.count,
      avgRating: data.ratingCount > 0 ? Math.round((data.totalRating / data.ratingCount) * 100) / 100 : 0,
    });
  }

  // Get latest training run info
  const latestRun = trainingRuns?.[0] || null;

  return {
    overview,
    trends: dailyTrends,
    byCategory: byCategory.sort((a, b) => b.count - a.count),
    preferencePairs: pairsCount || 0,
    trainingRuns: trainingRuns || [],
    latestTraining: latestRun ? {
      id: latestRun.id,
      modelVersion: latestRun.model_version,
      status: latestRun.status,
      accuracyBefore: latestRun.accuracy_before,
      accuracyAfter: latestRun.accuracy_after,
      completedAt: latestRun.completed_at,
    } : null,
    hasData: items.length > 0,
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Return based on type parameter
    if (type === 'calibration') {
      const calibrations = await getCalibrationData(supabase);
      return NextResponse.json(calibrations);
    }

    if (type === 'corrections') {
      const corrections = await getCorrectionsData(supabase);
      return NextResponse.json(corrections);
    }

    if (type === 'metrics') {
      const metrics = await getMetricsData(supabase);
      return NextResponse.json(metrics);
    }

    // Return all data
    const [calibrations, corrections, metrics] = await Promise.all([
      getCalibrationData(supabase),
      getCorrectionsData(supabase),
      getMetricsData(supabase),
    ]);

    const hasAnyData = calibrations.hasData || corrections.hasData || metrics.hasData;

    return NextResponse.json({
      calibrations,
      corrections,
      metrics,
      status: hasAnyData ? 'ok' : 'no_data',
      message: hasAnyData
        ? 'RLHF data loaded successfully'
        : 'No RLHF data yet. Feedback will appear here once users submit it.',
      timestamp: now,
    });

  } catch (err) {
    console.error('Admin RLHF API error:', err);

    // Return empty state on error
    return NextResponse.json({
      calibrations: { industries: [], stats: { totalIndustries: 0, wellCalibrated: 0, needsAttention: 0, totalSamples: 0, avgMae: 0 }, adjustments: [], hasData: false },
      corrections: { items: [], stats: { totalCorrections: 0, pendingReview: 0, applied: 0, rejected: 0 }, recentActivity: [], hasData: false },
      metrics: { overview: { totalFeedback: 0, thumbsUp: 0, thumbsDown: 0, avgRating: 0, correctionsSubmitted: 0 }, trends: [], byCategory: [], preferencePairs: 0, trainingRuns: [], latestTraining: null, hasData: false },
      error: err instanceof Error ? err.message : 'Failed to fetch RLHF data',
      status: 'error',
    }, { status: 500 });
  }
}
