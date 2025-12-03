/**
 * Preference Pairs Mining CRON Endpoint
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Automatically mines preference pairs from implicit user behavior signals.
 * Scheduled to run every 6 hours to collect behavioral data.
 *
 * Target: 1,000+ preference pairs for reward model training
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPairConstructor } from '@/lib/rlhf/pair-constructor';
import { supabase } from '@/lib/supabase';

// Verify CRON secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Parse optional configuration from body
    const body = await request.json().catch(() => ({}));
    const {
      minConfidenceThreshold = 0.6,
      maxEventAgeHours = 168, // 1 week
      batchSize = 200,
      debug = false,
    } = body;

    console.log('Starting preference pairs mining...');
    console.log(`Config: minConfidence=${minConfidenceThreshold}, maxAge=${maxEventAgeHours}h, batch=${batchSize}`);

    // Create the pair constructor
    const constructor = createPairConstructor({
      minConfidenceThreshold,
      maxEventAgeHours,
      batchSize,
      debug,
    });

    // Mine preference pairs from implicit signals
    const result = await constructor.minePreferencePairs();

    // Get current stats
    const stats = await constructor.getStats();

    // Log execution to cron_executions table
    await supabase.from('cron_executions').insert({
      job_name: 'mine-preference-pairs',
      status: result.errors.length === 0 ? 'success' : 'partial_success',
      execution_time: Date.now() - startTime,
      metadata: {
        pairsCreated: result.pairsCreated,
        pairsSkipped: result.pairsSkipped,
        sessionsProcessed: result.sessionsProcessed,
        errorsCount: result.errors.length,
        totalPairsInDb: stats.total,
        highQualityPairs: stats.highQuality,
        unusedForTraining: stats.total - stats.usedInTraining,
        avgConfidence: stats.avgConfidence,
        errors: result.errors.slice(0, 5), // First 5 errors only
      },
    });

    console.log(`Mining complete: ${result.pairsCreated} pairs created, ${result.sessionsProcessed} sessions processed`);
    console.log(`Total pairs in DB: ${stats.total} (${stats.highQuality} high quality)`);

    // Check if we've hit the 1000+ target
    const targetMet = stats.total >= 1000;
    if (targetMet) {
      console.log('TARGET MET: 1,000+ preference pairs collected!');
    }

    return NextResponse.json({
      success: true,
      mining: {
        pairsCreated: result.pairsCreated,
        pairsSkipped: result.pairsSkipped,
        sessionsProcessed: result.sessionsProcessed,
        duration: result.duration,
        errors: result.errors.length,
      },
      stats: {
        totalPairs: stats.total,
        bySource: stats.bySource,
        byPreferred: stats.byPreferred,
        highQuality: stats.highQuality,
        usedInTraining: stats.usedInTraining,
        avgConfidence: Math.round(stats.avgConfidence * 100) / 100,
      },
      target: {
        required: 1000,
        current: stats.total,
        met: targetMet,
        progress: Math.min(100, Math.round((stats.total / 1000) * 100)),
      },
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error mining preference pairs:', error);

    // Log failure
    await supabase.from('cron_executions').insert({
      job_name: 'mine-preference-pairs',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to mine preference pairs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current preference pairs statistics
    const constructor = createPairConstructor();
    const stats = await constructor.getStats();

    // Get recent mining history
    const { data: recentExecutions } = await supabase
      .from('cron_executions')
      .select('*')
      .eq('job_name', 'mine-preference-pairs')
      .order('created_at', { ascending: false })
      .limit(10);

    const targetMet = stats.total >= 1000;

    return NextResponse.json({
      success: true,
      stats: {
        totalPairs: stats.total,
        bySource: stats.bySource,
        byPreferred: stats.byPreferred,
        highQuality: stats.highQuality,
        usedInTraining: stats.usedInTraining,
        avgConfidence: Math.round(stats.avgConfidence * 100) / 100,
      },
      target: {
        required: 1000,
        current: stats.total,
        met: targetMet,
        progress: Math.min(100, Math.round((stats.total / 1000) * 100)),
      },
      recentMiningRuns: recentExecutions?.map((exec) => ({
        timestamp: exec.created_at,
        status: exec.status,
        pairsCreated: exec.metadata?.pairsCreated || 0,
        duration: exec.execution_time,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get preference pairs stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export config for Vercel CRON
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
