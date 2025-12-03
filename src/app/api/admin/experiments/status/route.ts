/**
 * Experiments Status API Endpoint
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Returns status of all A/B experiments and validates 3+ completion target.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ABTesting } from '@/lib/experiments/ab-testing';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TARGET_EXPERIMENTS = 3;

// ============================================================================
// TYPES
// ============================================================================

interface ExperimentSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  variants: {
    name: string;
    isControl: boolean;
    impressions: number;
    conversions: number;
    conversionRate: number;
  }[];
  results: {
    relativeLift: number | null;
    pValue: number | null;
    isSignificant: boolean;
    winner: string | null;
    recommendation: string;
  } | null;
}

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

async function getExperimentSummaries(): Promise<ExperimentSummary[]> {
  const summaries: ExperimentSummary[] = [];

  // Get all experiments
  const { data: experiments } = await supabase
    .from('prompt_experiments')
    .select('*')
    .order('created_at', { ascending: false });

  if (!experiments) return summaries;

  for (const exp of experiments) {
    // Get variants for this experiment
    const { data: variants } = await supabase
      .from('prompt_variants')
      .select('*')
      .eq('experiment_id', exp.id)
      .order('is_control', { ascending: false });

    const variantSummaries =
      variants?.map((v) => ({
        name: v.name,
        isControl: v.is_control,
        impressions: v.impressions || 0,
        conversions: v.conversions || 0,
        conversionRate: v.impressions > 0 ? v.conversions / v.impressions : 0,
      })) || [];

    // Calculate results if we have control and treatment
    let results = null;
    if (variantSummaries.length >= 2) {
      const control = variantSummaries.find((v) => v.isControl);
      const treatment = variantSummaries.find((v) => !v.isControl);

      if (control && treatment && control.impressions > 0 && treatment.impressions > 0) {
        const { pValue } = ABTesting.proportionZTest(
          control.conversions,
          control.impressions,
          treatment.conversions,
          treatment.impressions
        );

        const relativeLift =
          control.conversionRate > 0
            ? (treatment.conversionRate - control.conversionRate) / control.conversionRate
            : 0;

        const isSignificant = pValue < (exp.significance_level || 0.05);

        results = {
          relativeLift: Math.round(relativeLift * 1000) / 10,
          pValue: Math.round(pValue * 10000) / 10000,
          isSignificant,
          winner: isSignificant && relativeLift > 0 ? treatment.name : null,
          recommendation:
            isSignificant && relativeLift > 0
              ? 'Implement treatment variant'
              : isSignificant && relativeLift < 0
                ? 'Keep control variant'
                : 'Continue testing or inconclusive',
        };
      }
    }

    summaries.push({
      id: exp.id,
      name: exp.name,
      type: exp.experiment_type,
      status: exp.status,
      startedAt: exp.started_at,
      endedAt: exp.ended_at,
      variants: variantSummaries,
      results,
    });
  }

  return summaries;
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summaries = await getExperimentSummaries();

    // Count completed experiments
    const completedExperiments = summaries.filter(
      (s) => s.status === 'completed' && s.results?.isSignificant
    );

    // Count running experiments
    const runningExperiments = summaries.filter((s) => s.status === 'running');

    // Target validation
    const targetMet = completedExperiments.length >= TARGET_EXPERIMENTS;

    // Calculate overall stats
    const totalImpressions = summaries.reduce(
      (sum, s) => sum + s.variants.reduce((vSum, v) => vSum + v.impressions, 0),
      0
    );

    const totalConversions = summaries.reduce(
      (sum, s) => sum + s.variants.reduce((vSum, v) => vSum + v.conversions, 0),
      0
    );

    // Log to cron_executions
    await supabase.from('cron_executions').insert({
      job_name: 'experiments-status-check',
      status: targetMet ? 'success' : 'warning',
      execution_time: 0,
      metadata: {
        totalExperiments: summaries.length,
        completedWithSignificance: completedExperiments.length,
        running: runningExperiments.length,
        targetMet,
        target: TARGET_EXPERIMENTS,
        totalImpressions,
        totalConversions,
        checkedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      target: {
        required: TARGET_EXPERIMENTS,
        completed: completedExperiments.length,
        met: targetMet,
        gap: targetMet ? 0 : TARGET_EXPERIMENTS - completedExperiments.length,
      },
      summary: {
        total: summaries.length,
        byStatus: {
          draft: summaries.filter((s) => s.status === 'draft').length,
          running: runningExperiments.length,
          completed: summaries.filter((s) => s.status === 'completed').length,
          paused: summaries.filter((s) => s.status === 'paused').length,
          archived: summaries.filter((s) => s.status === 'archived').length,
        },
        totalImpressions,
        totalConversions,
        overallConversionRate:
          totalImpressions > 0
            ? Math.round((totalConversions / totalImpressions) * 1000) / 10
            : 0,
      },
      experiments: summaries.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        status: s.status,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        variantCount: s.variants.length,
        totalImpressions: s.variants.reduce((sum, v) => sum + v.impressions, 0),
        results: s.results
          ? {
              relativeLift: `${s.results.relativeLift}%`,
              pValue: s.results.pValue,
              isSignificant: s.results.isSignificant,
              winner: s.results.winner,
              recommendation: s.results.recommendation,
            }
          : null,
      })),
      completedExperiments: completedExperiments.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.type,
        lift: `${s.results?.relativeLift}%`,
        pValue: s.results?.pValue,
        winner: s.results?.winner,
        endedAt: s.endedAt,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get experiment status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Trigger experiment seeding or analysis
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === 'analyze') {
      // Re-analyze all completed experiments
      const summaries = await getExperimentSummaries();
      const analysisResults = [];

      for (const summary of summaries.filter((s) => s.status === 'completed')) {
        if (summary.variants.length >= 2) {
          const control = summary.variants.find((v) => v.isControl);
          const treatment = summary.variants.find((v) => !v.isControl);

          if (control && treatment) {
            const bayesianProb = ABTesting.bayesianProbabilityOfImprovement(
              control.conversions,
              control.impressions,
              treatment.conversions,
              treatment.impressions,
              5000
            );

            analysisResults.push({
              experimentId: summary.id,
              name: summary.name,
              bayesianProbability: Math.round(bayesianProb * 1000) / 10,
              frequentistPValue: summary.results?.pValue,
              recommendation:
                bayesianProb > 0.95
                  ? 'Strong evidence for treatment'
                  : bayesianProb > 0.8
                    ? 'Moderate evidence for treatment'
                    : bayesianProb < 0.2
                      ? 'Evidence against treatment'
                      : 'Inconclusive',
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        action: 'analyze',
        results: analysisResults,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action. Use "analyze" to re-analyze experiments.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
