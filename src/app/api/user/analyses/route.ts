/**
 * User Analyses API
 * GET /api/user/analyses - Get user's analysis history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Create authenticated Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch user's analyses
    const { data: analyses, error: analysesError, count } = await supabase
      .from('analyses')
      .select(`
        id,
        url,
        brand_name,
        status,
        overall_score,
        score_breakdown,
        providers_queried,
        created_at,
        completed_at
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (analysesError) {
      console.error('Error fetching analyses:', analysesError);
      return NextResponse.json(
        { error: 'Failed to fetch analyses', code: 'FETCH_ERROR' },
        { status: 500 }
      );
    }

    // Fetch user profile for usage data
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, analyses_used_this_month, analyses_limit')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Fetch usage tracking for current period
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    const { data: usage, error: usageError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .gte('period_start', periodStart.toISOString().split('T')[0])
      .single();

    // Transform analyses to match frontend expectations
    const transformedAnalyses = (analyses || []).map((a) => ({
      id: a.id,
      url: a.url,
      domain: new URL(a.url).hostname.replace('www.', ''),
      score: a.overall_score || 0,
      status: a.status,
      createdAt: new Date(a.created_at),
      providers: a.score_breakdown || {},
    }));

    // Calculate stats
    const completedAnalyses = transformedAnalyses.filter(a => a.status === 'completed');
    const avgScore = completedAnalyses.length > 0
      ? Math.round(completedAnalyses.reduce((sum, a) => sum + a.score, 0) / completedAnalyses.length)
      : 0;

    // Calculate score trend from historical data (current month vs previous month)
    const previousMonthStart = new Date(periodStart);
    previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);
    const previousMonthEnd = new Date(periodStart);
    previousMonthEnd.setDate(previousMonthEnd.getDate() - 1);

    // Fetch previous month's analyses for trend calculation
    const { data: previousMonthAnalyses } = await supabase
      .from('analyses')
      .select('overall_score')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', previousMonthStart.toISOString())
      .lt('created_at', periodStart.toISOString());

    // Fetch current month's analyses
    const { data: currentMonthAnalyses } = await supabase
      .from('analyses')
      .select('overall_score')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', periodStart.toISOString());

    // Calculate averages for trend
    const prevMonthScores = previousMonthAnalyses || [];
    const currMonthScores = currentMonthAnalyses || [];

    const prevAvg = prevMonthScores.length > 0
      ? prevMonthScores.reduce((sum, a) => sum + (a.overall_score || 0), 0) / prevMonthScores.length
      : 0;

    const currAvg = currMonthScores.length > 0
      ? currMonthScores.reduce((sum, a) => sum + (a.overall_score || 0), 0) / currMonthScores.length
      : 0;

    // Score trend: positive = improvement, negative = decline
    const scoreTrend = prevAvg > 0 ? Math.round(currAvg - prevAvg) : 0;

    // Get distinct URLs for URL monitoring count
    const { data: distinctUrls } = await supabase
      .from('analyses')
      .select('url')
      .eq('user_id', user.id);

    const uniqueUrls = new Set((distinctUrls || []).map(u => u.url));

    return NextResponse.json({
      success: true,
      data: {
        analyses: transformedAnalyses,
        totalCount: count || 0,
        avgScore,
        scoreTrend,
        usage: {
          periodStart: periodStart.toISOString(),
          periodEnd: new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0).toISOString(),
          analysesUsed: profile?.analyses_used_this_month || 0,
          lastAnalysisAt: transformedAnalyses[0]?.createdAt || null,
          monitoredUrls: uniqueUrls.size,
          apiCallsUsed: usage?.ai_calls_count || 0,
        },
        plan: profile?.subscription_tier || 'free',
        limit: profile?.analyses_limit || 3,
      },
    });
  } catch (error) {
    console.error('User analyses API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
