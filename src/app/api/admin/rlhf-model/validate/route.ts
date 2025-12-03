/**
 * Reward Model Validation API Endpoint
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Validates reward model accuracy against test set.
 * Target: Model accuracy >75%
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRewardModel, TARGET_ACCURACY } from '@/lib/rlhf/reward-model';
import { supabase } from '@/lib/supabase';

// Verify admin authentication
async function verifyAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET || process.env.CRON_SECRET;

  if (!adminSecret) {
    return false;
  }

  return authHeader === `Bearer ${adminSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Parse optional configuration
    const body = await request.json().catch(() => ({}));
    const { testSetRatio = 0.2 } = body;

    console.log('Starting reward model validation...');

    // Create reward model
    const model = createRewardModel();

    // Run validation
    const result = await model.validateModel(testSetRatio);

    // Log to cron executions for tracking
    await supabase.from('cron_executions').insert({
      job_name: 'reward-model-validation',
      status: result.targetMet ? 'success' : 'warning',
      execution_time: Date.now() - startTime,
      metadata: {
        accuracy: result.accuracy,
        precision: result.precision,
        recall: result.recall,
        f1Score: result.f1Score,
        testSetSize: result.testSetSize,
        targetMet: result.targetMet,
        target: TARGET_ACCURACY,
      },
    });

    return NextResponse.json({
      success: true,
      validation: {
        accuracy: Math.round(result.accuracy * 1000) / 10, // Percentage with 1 decimal
        precision: Math.round(result.precision * 1000) / 10,
        recall: Math.round(result.recall * 1000) / 10,
        f1Score: Math.round(result.f1Score * 1000) / 10,
        auc: Math.round(result.auc * 1000) / 10,
        testSetSize: result.testSetSize,
      },
      target: {
        required: TARGET_ACCURACY * 100,
        current: Math.round(result.accuracy * 1000) / 10,
        met: result.targetMet,
        gap: result.targetMet ? 0 : Math.round((TARGET_ACCURACY - result.accuracy) * 1000) / 10,
      },
      confusionMatrix: result.confusionMatrix,
      details: {
        bySource: result.details.bySource,
        byConfidenceLevel: {
          high: Math.round(result.details.byConfidenceLevel.high * 1000) / 10,
          medium: Math.round(result.details.byConfidenceLevel.medium * 1000) / 10,
          low: Math.round(result.details.byConfidenceLevel.low * 1000) / 10,
        },
      },
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error validating reward model:', error);

    await supabase.from('cron_executions').insert({
      job_name: 'reward-model-validation',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to validate reward model',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current model metrics
    const model = createRewardModel();
    const metrics = await model.getModelMetrics();

    // Get validation history
    const { data: validationHistory } = await supabase
      .from('cron_executions')
      .select('*')
      .eq('job_name', 'reward-model-validation')
      .order('created_at', { ascending: false })
      .limit(10);

    // Get model versions
    const { data: modelVersions } = await supabase
      .from('reward_model_versions')
      .select('*')
      .order('trained_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      currentModel: metrics
        ? {
            version: metrics.version,
            accuracy: Math.round(metrics.accuracy * 1000) / 10,
            precision: Math.round(metrics.precision * 1000) / 10,
            recall: Math.round(metrics.recall * 1000) / 10,
            f1Score: Math.round(metrics.f1Score * 1000) / 10,
            trainedAt: metrics.trainedAt,
            isActive: metrics.isActive,
          }
        : null,
      target: {
        required: TARGET_ACCURACY * 100,
        met: metrics ? metrics.accuracy >= TARGET_ACCURACY : false,
      },
      validationHistory: validationHistory?.map((v) => ({
        timestamp: v.created_at,
        status: v.status,
        accuracy: v.metadata?.accuracy
          ? Math.round(v.metadata.accuracy * 1000) / 10
          : null,
        targetMet: v.metadata?.targetMet,
        duration: v.execution_time,
      })),
      modelVersions: modelVersions?.map((v) => ({
        id: v.id,
        version: v.version,
        accuracy: Math.round(v.accuracy * 1000) / 10,
        isActive: v.is_active,
        trainedAt: v.trained_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get model metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
