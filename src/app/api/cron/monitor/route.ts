/**
 * Monitoring CRON Endpoint
 *
 * Processes scheduled monitoring jobs
 * Called by Vercel CRON or external scheduler
 *
 * Phase 2, Week 6, Day 1
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  type CronResult,
  type MonitoringResult,
  DEFAULT_CRON_CONFIG,
} from '@/lib/monitoring/types';
import {
  getPendingJobs,
  markProcessing,
  markCompleted,
  markFailed,
  getQueueStats,
  cleanupOldJobs,
} from '@/lib/monitoring/queue';
import {
  recordScore,
  getPreviousScore,
  calculateScoreChange,
  detectAlerts,
} from '@/lib/monitoring/score-tracker';
import { dispatchAlert, storeAlert } from '@/lib/monitoring/alerts';

// ================================================================
// AUTHORIZATION
// ================================================================

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request: NextRequest): boolean {
  // Check for Vercel CRON header
  const cronHeader = request.headers.get('x-vercel-cron-signature');
  if (cronHeader) {
    // In production, verify the signature
    return true;
  }

  // Check for API key authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && CRON_SECRET) {
    const token = authHeader.replace('Bearer ', '');
    return token === CRON_SECRET;
  }

  // Allow in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
}

// ================================================================
// MAIN CRON HANDLER
// ================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Authorization check
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result: CronResult = {
    success: true,
    jobsProcessed: 0,
    jobsFailed: 0,
    alertsSent: 0,
    duration: 0,
    errors: [],
  };

  try {
    // Get pending jobs
    const pendingJobs = getPendingJobs(DEFAULT_CRON_CONFIG.batchSize);

    for (const queuedJob of pendingJobs) {
      try {
        // Mark as processing
        markProcessing(queuedJob.id);

        // Process based on job type
        if (queuedJob.type === 'monitoring') {
          const monitoringResult = await processMonitoringJob(queuedJob.payload);

          // Track alerts sent
          if (monitoringResult.alertTriggered) {
            result.alertsSent++;
          }
        }

        // Mark as completed
        markCompleted(queuedJob.id);
        result.jobsProcessed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        markFailed(queuedJob.id, errorMessage);
        result.jobsFailed++;
        result.errors.push(`Job ${queuedJob.id}: ${errorMessage}`);
      }
    }

    // Cleanup old jobs
    cleanupOldJobs();

    result.duration = Date.now() - startTime;

    return NextResponse.json({
      ...result,
      queueStats: getQueueStats(),
    });
  } catch (error) {
    result.success = false;
    result.duration = Date.now() - startTime;
    result.errors.push(
      error instanceof Error ? error.message : 'Unknown error'
    );

    return NextResponse.json(result, { status: 500 });
  }
}

// ================================================================
// MONITORING JOB PROCESSOR
// ================================================================

async function processMonitoringJob(
  payload: Record<string, unknown>
): Promise<MonitoringResult> {
  const userId = payload.userId as string;
  const brandUrl = payload.brandUrl as string;
  const brandName = payload.brandName as string;

  // Get previous score
  const previousScore = getPreviousScore(userId, brandUrl);

  // Run analysis (mock for now - would call actual analysis service)
  const analysisResult = await runAnalysis(brandUrl, brandName);
  const currentScore = analysisResult.score;

  // Record the new score
  recordScore(userId, brandUrl, currentScore, analysisResult.analysisId);

  // Calculate change
  const scoreChange = calculateScoreChange(currentScore, previousScore);

  // Create monitoring result
  const monitoringResult: MonitoringResult = {
    jobId: payload.monitoringJobId as string,
    userId,
    brandUrl,
    previousScore,
    currentScore,
    scoreChange,
    timestamp: new Date(),
    analysisId: analysisResult.analysisId,
    alertTriggered: false,
  };

  // Detect and dispatch alerts
  const alerts = detectAlerts(monitoringResult);

  if (alerts.length > 0) {
    monitoringResult.alertTriggered = true;

    for (const alert of alerts) {
      // Store in-app alert
      storeAlert(alert);

      // Dispatch to other channels (would fetch user preferences from DB)
      // await dispatchAlert(alert, ['email', 'in_app'], userPreferences);
    }
  }

  return monitoringResult;
}

// ================================================================
// ANALYSIS RUNNER
// ================================================================

/**
 * SRE AUDIT FIX: SRE-010
 * Connected to real analysis service instead of mock data.
 * Uses internal API call to /api/analyze and polls for completion.
 */

interface AnalysisResult {
  analysisId: string;
  score: number;
}

async function runAnalysis(
  brandUrl: string,
  brandName: string
): Promise<AnalysisResult> {
  // Get the base URL for internal API calls
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  // Use service role key for internal authentication
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // 1. Start the analysis via internal API
    const startResponse = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use CRON secret as API key for internal calls
        ...(process.env.CRON_SECRET && {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        }),
      },
      body: JSON.stringify({
        url: brandUrl,
        options: {
          providers: ['openai', 'anthropic'],
          queryBudget: 10, // Lower budget for monitoring (faster)
          includeCompetitors: false,
        },
      }),
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      throw new Error(`Failed to start analysis: ${startResponse.status} - ${errorText}`);
    }

    const startData = await startResponse.json();

    if (!startData.success || !startData.analysisId) {
      throw new Error(`Invalid analysis response: ${JSON.stringify(startData)}`);
    }

    const analysisId = startData.analysisId;

    // 2. Poll for completion (max 5 minutes)
    const maxWaitMs = 5 * 60 * 1000;
    const pollIntervalMs = 5000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      const progressResponse = await fetch(`${baseUrl}${startData.progressUrl}`, {
        method: 'GET',
        headers: {
          ...(process.env.CRON_SECRET && {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`,
          }),
        },
      });

      if (!progressResponse.ok) {
        continue; // Retry on error
      }

      const progressData = await progressResponse.json();

      if (progressData.status === 'completed') {
        // Extract score from completed analysis
        const score = progressData.result?.overallScore ??
                     progressData.result?.score ??
                     progressData.overallScore ??
                     0;

        return {
          analysisId,
          score: Math.round(score),
        };
      }

      if (progressData.status === 'failed') {
        throw new Error(`Analysis failed: ${progressData.error || 'Unknown error'}`);
      }
    }

    // Timeout - analysis took too long
    throw new Error('Analysis timeout - exceeded 5 minutes');

  } catch (error) {
    // Log error and return a fallback score based on previous data or 0
    console.error('[CRON Monitor] Analysis error:', error);

    // Return a failure result with score 0 to trigger alerts
    return {
      analysisId: `failed_${Date.now()}`,
      score: 0,
    };
  }
}

// ================================================================
// MANUAL TRIGGER ENDPOINT
// ================================================================

export async function POST(request: NextRequest) {
  // Authorization check
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, brandUrl, brandName } = body;

    if (!userId || !brandUrl || !brandName) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, brandUrl, brandName' },
        { status: 400 }
      );
    }

    // Process immediately
    const result = await processMonitoringJob({
      monitoringJobId: `manual_${Date.now()}`,
      userId,
      brandUrl,
      brandName,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
