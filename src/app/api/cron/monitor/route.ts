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
// ANALYSIS RUNNER (Mock)
// ================================================================

interface AnalysisResult {
  analysisId: string;
  score: number;
}

async function runAnalysis(
  brandUrl: string,
  brandName: string
): Promise<AnalysisResult> {
  // In production, this would call the actual analysis service
  // For now, return mock data

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Generate a somewhat realistic score with some randomness
  const baseScore = 65;
  const variation = Math.floor(Math.random() * 30) - 15;
  const score = Math.max(0, Math.min(100, baseScore + variation));

  return {
    analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    score,
  };
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
