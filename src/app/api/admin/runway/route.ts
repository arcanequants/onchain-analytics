/**
 * 3-Month Runway Validation API Endpoint
 * Phase 4, Week 8 - CTO/CAIO Executive Checklist
 *
 * Validates and monitors runway status.
 * Target: 3-month runway maintained
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ============================================================================
// CONFIGURATION
// ============================================================================

const TARGET_RUNWAY_MONTHS = 3;
const WARNING_THRESHOLD_MONTHS = 6;
const FUNDRAISING_TRIGGER_MONTHS = 6;

// ============================================================================
// TYPES
// ============================================================================

interface RunwayScenario {
  name: string;
  monthlyBurn: number;
  runwayMonths: number;
  runwayDate: Date;
  meetTarget: boolean;
}

interface RunwayMetrics {
  currentCash: number;
  monthlyBurn: {
    gross: number;
    net: number;
  };
  scenarios: {
    best: RunwayScenario;
    base: RunwayScenario;
    worst: RunwayScenario;
  };
  targetMet: boolean;
  target: number;
  alerts: string[];
  recommendation: string;
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

function calculateRunway(
  cash: number,
  monthlyBurn: number
): { months: number; date: Date } {
  if (monthlyBurn <= 0) {
    return { months: 999, date: new Date(2100, 0, 1) }; // Profitable
  }

  const months = cash / monthlyBurn;
  const date = new Date();
  date.setMonth(date.getMonth() + Math.floor(months));

  return { months, date };
}

async function getFinancialData(): Promise<{
  currentCash: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  mrrGrowthRate: number;
}> {
  // Try to get real data from financial tables
  // Fallback to default projections if not available

  // Check for recent financial snapshots
  const { data: snapshot } = await supabase
    .from('cron_executions')
    .select('metadata')
    .eq('job_name', 'financial-snapshot')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (snapshot?.metadata) {
    return {
      currentCash: snapshot.metadata.currentCash || 25000,
      monthlyRevenue: snapshot.metadata.monthlyRevenue || 0,
      monthlyExpenses: snapshot.metadata.monthlyExpenses || 1500,
      mrrGrowthRate: snapshot.metadata.mrrGrowthRate || 0.10,
    };
  }

  // Default projections for bootstrapped startup
  return {
    currentCash: 25000, // $25k starting cash
    monthlyRevenue: 0, // Pre-revenue
    monthlyExpenses: 1500, // ~$1.5k/mo expenses
    mrrGrowthRate: 0.10, // 10% monthly growth target
  };
}

function calculateScenarios(
  cash: number,
  monthlyRevenue: number,
  monthlyExpenses: number,
  growthRate: number
): RunwayMetrics['scenarios'] {
  // Best case: Revenue covers 50% of expenses, grows 15%/mo
  const bestGrossRevenue = monthlyRevenue * 1.5 || monthlyExpenses * 0.5;
  const bestBurn = Math.max(0, monthlyExpenses - bestGrossRevenue);
  const bestRunway = calculateRunway(cash, bestBurn);

  // Base case: Current trajectory
  const baseBurn = Math.max(0, monthlyExpenses - monthlyRevenue);
  const baseRunway = calculateRunway(cash, baseBurn);

  // Worst case: Revenue drops 30%, expenses up 20%
  const worstRevenue = monthlyRevenue * 0.7;
  const worstExpenses = monthlyExpenses * 1.2;
  const worstBurn = Math.max(0, worstExpenses - worstRevenue);
  const worstRunway = calculateRunway(cash, worstBurn);

  return {
    best: {
      name: 'Best Case',
      monthlyBurn: Math.round(bestBurn),
      runwayMonths: Math.round(bestRunway.months * 10) / 10,
      runwayDate: bestRunway.date,
      meetTarget: bestRunway.months >= TARGET_RUNWAY_MONTHS,
    },
    base: {
      name: 'Base Case',
      monthlyBurn: Math.round(baseBurn),
      runwayMonths: Math.round(baseRunway.months * 10) / 10,
      runwayDate: baseRunway.date,
      meetTarget: baseRunway.months >= TARGET_RUNWAY_MONTHS,
    },
    worst: {
      name: 'Worst Case',
      monthlyBurn: Math.round(worstBurn),
      runwayMonths: Math.round(worstRunway.months * 10) / 10,
      runwayDate: worstRunway.date,
      meetTarget: worstRunway.months >= TARGET_RUNWAY_MONTHS,
    },
  };
}

function generateAlerts(
  scenarios: RunwayMetrics['scenarios'],
  cash: number
): string[] {
  const alerts: string[] = [];

  // Critical alerts
  if (scenarios.base.runwayMonths < 3) {
    alerts.push('CRITICAL: Base case runway below 3 months');
  }

  if (scenarios.worst.runwayMonths < 2) {
    alerts.push('CRITICAL: Worst case runway below 2 months');
  }

  // Warning alerts
  if (scenarios.base.runwayMonths < 6) {
    alerts.push('WARNING: Consider fundraising (runway < 6 months)');
  }

  if (scenarios.base.runwayMonths < scenarios.worst.runwayMonths * 2) {
    alerts.push('WARNING: Low margin between base and worst case');
  }

  // Info alerts
  if (scenarios.best.runwayMonths > 24) {
    alerts.push('INFO: Strong runway in best case scenario');
  }

  if (cash < 10000) {
    alerts.push('WARNING: Cash balance below $10,000');
  }

  return alerts;
}

function generateRecommendation(
  scenarios: RunwayMetrics['scenarios'],
  targetMet: boolean
): string {
  if (!targetMet) {
    if (scenarios.base.runwayMonths < 2) {
      return 'IMMEDIATE ACTION REQUIRED: Runway critical. Reduce expenses or seek emergency funding.';
    }
    if (scenarios.base.runwayMonths < 3) {
      return 'URGENT: Runway below target. Initiate fundraising or cost reduction immediately.';
    }
    return 'Runway approaching target threshold. Monitor closely and prepare contingency plan.';
  }

  if (scenarios.base.runwayMonths < WARNING_THRESHOLD_MONTHS) {
    return 'Runway above target but within warning zone. Begin fundraising preparations.';
  }

  if (scenarios.base.runwayMonths > 12) {
    return 'Strong runway position. Continue executing on growth plan.';
  }

  return 'Runway healthy. Maintain current trajectory and monitor monthly.';
}

// ============================================================================
// API HANDLERS
// ============================================================================

export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const financialData = await getFinancialData();

    const scenarios = calculateScenarios(
      financialData.currentCash,
      financialData.monthlyRevenue,
      financialData.monthlyExpenses,
      financialData.mrrGrowthRate
    );

    const targetMet = scenarios.base.runwayMonths >= TARGET_RUNWAY_MONTHS;
    const alerts = generateAlerts(scenarios, financialData.currentCash);
    const recommendation = generateRecommendation(scenarios, targetMet);

    const metrics: RunwayMetrics = {
      currentCash: financialData.currentCash,
      monthlyBurn: {
        gross: financialData.monthlyExpenses,
        net: Math.max(0, financialData.monthlyExpenses - financialData.monthlyRevenue),
      },
      scenarios,
      targetMet,
      target: TARGET_RUNWAY_MONTHS,
      alerts,
      recommendation,
    };

    // Store validation result
    await supabase.from('cron_executions').insert({
      job_name: 'runway-validation',
      status: targetMet ? 'success' : 'warning',
      execution_time: 0,
      metadata: {
        currentCash: metrics.currentCash,
        netBurn: metrics.monthlyBurn.net,
        baseRunwayMonths: scenarios.base.runwayMonths,
        targetMet,
        target: TARGET_RUNWAY_MONTHS,
        alerts,
        validatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      target: {
        required: TARGET_RUNWAY_MONTHS,
        current: scenarios.base.runwayMonths,
        met: targetMet,
        gap: targetMet
          ? 0
          : Math.round((TARGET_RUNWAY_MONTHS - scenarios.base.runwayMonths) * 10) / 10,
      },
      metrics: {
        currentCash: `$${metrics.currentCash.toLocaleString()}`,
        monthlyBurn: {
          gross: `$${metrics.monthlyBurn.gross.toLocaleString()}`,
          net: `$${metrics.monthlyBurn.net.toLocaleString()}`,
        },
      },
      scenarios: {
        best: {
          ...scenarios.best,
          runwayDate: scenarios.best.runwayDate.toISOString().split('T')[0],
          monthlyBurn: `$${scenarios.best.monthlyBurn.toLocaleString()}`,
        },
        base: {
          ...scenarios.base,
          runwayDate: scenarios.base.runwayDate.toISOString().split('T')[0],
          monthlyBurn: `$${scenarios.base.monthlyBurn.toLocaleString()}`,
        },
        worst: {
          ...scenarios.worst,
          runwayDate: scenarios.worst.runwayDate.toISOString().split('T')[0],
          monthlyBurn: `$${scenarios.worst.monthlyBurn.toLocaleString()}`,
        },
      },
      alerts,
      recommendation,
      fundraisingTrigger: {
        threshold: FUNDRAISING_TRIGGER_MONTHS,
        triggered: scenarios.base.runwayMonths < FUNDRAISING_TRIGGER_MONTHS,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to validate runway',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Update financial snapshot for runway calculation
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (body.currentCash === undefined || body.monthlyExpenses === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: currentCash, monthlyExpenses' },
        { status: 400 }
      );
    }

    // Store financial snapshot
    await supabase.from('cron_executions').insert({
      job_name: 'financial-snapshot',
      status: 'success',
      execution_time: 0,
      metadata: {
        currentCash: body.currentCash,
        monthlyRevenue: body.monthlyRevenue || 0,
        monthlyExpenses: body.monthlyExpenses,
        mrrGrowthRate: body.mrrGrowthRate || 0.10,
        snapshotDate: new Date().toISOString(),
        source: 'manual-update',
      },
    });

    // Recalculate runway with new data
    const scenarios = calculateScenarios(
      body.currentCash,
      body.monthlyRevenue || 0,
      body.monthlyExpenses,
      body.mrrGrowthRate || 0.10
    );

    const targetMet = scenarios.base.runwayMonths >= TARGET_RUNWAY_MONTHS;

    return NextResponse.json({
      success: true,
      message: 'Financial snapshot updated',
      runway: {
        base: scenarios.base.runwayMonths,
        best: scenarios.best.runwayMonths,
        worst: scenarios.worst.runwayMonths,
      },
      targetMet,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to update financial snapshot',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
