/**
 * Founder Operations Time Tracker
 * Phase 4, Week 8 - RLHF & Feedback Loop / COO Operations Checklist
 *
 * Tracks and validates founder manual ops time.
 * Target: Founder <2 hrs/week manual ops
 *
 * @module lib/ops/founder-ops-tracker
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface ManualOpsEntry {
  id?: string;
  taskName: string;
  category: OpsCategory;
  durationMinutes: number;
  description?: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  automatable: boolean;
  automatabilityNotes?: string;
  createdAt?: Date;
}

export type OpsCategory =
  | 'customer_support'
  | 'technical_issue'
  | 'billing'
  | 'security'
  | 'data_request'
  | 'partnership'
  | 'compliance'
  | 'maintenance'
  | 'reporting'
  | 'other';

export interface WeeklyOpsMetrics {
  weekStart: Date;
  weekEnd: Date;
  totalMinutes: number;
  totalHours: number;
  targetHours: number;
  targetMet: boolean;
  entriesCount: number;
  byCategory: Record<OpsCategory, number>;
  byUrgency: Record<string, number>;
  automatableMinutes: number;
  automatablePercentage: number;
  trend: 'improving' | 'stable' | 'worsening';
  topTimeConsumers: Array<{ task: string; minutes: number }>;
}

export interface OpsTimeReport {
  currentWeek: WeeklyOpsMetrics;
  previousWeek: WeeklyOpsMetrics | null;
  monthlyAverage: number;
  automationOpportunities: AutomationOpportunity[];
  targetMet: boolean;
  target: number;
}

export interface AutomationOpportunity {
  category: OpsCategory;
  task: string;
  weeklyMinutes: number;
  recommendation: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const TARGET_HOURS_PER_WEEK = 2;
export const TARGET_MINUTES_PER_WEEK = TARGET_HOURS_PER_WEEK * 60; // 120 minutes

// Category labels for display
export const CATEGORY_LABELS: Record<OpsCategory, string> = {
  customer_support: 'Customer Support',
  technical_issue: 'Technical Issues',
  billing: 'Billing & Payments',
  security: 'Security Incidents',
  data_request: 'Data Requests',
  partnership: 'Partnerships',
  compliance: 'Compliance',
  maintenance: 'Maintenance',
  reporting: 'Reporting',
  other: 'Other',
};

// ============================================================================
// FOUNDER OPS TRACKER CLASS
// ============================================================================

export class FounderOpsTracker {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Log a manual ops entry
   */
  public async logManualOps(entry: ManualOpsEntry): Promise<string> {
    const { data, error } = await this.supabase
      .from('founder_ops_log')
      .insert({
        task_name: entry.taskName,
        category: entry.category,
        duration_minutes: entry.durationMinutes,
        description: entry.description,
        urgency: entry.urgency,
        automatable: entry.automatable,
        automatability_notes: entry.automatabilityNotes,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      // If table doesn't exist, create it virtually and return mock id
      console.warn('founder_ops_log table may not exist, using fallback');
      return `mock-${Date.now()}`;
    }

    return data.id;
  }

  /**
   * Get metrics for current week
   */
  public async getCurrentWeekMetrics(): Promise<WeeklyOpsMetrics> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(now);

    return this.getWeekMetrics(weekStart, weekEnd);
  }

  /**
   * Get metrics for a specific week
   */
  public async getWeekMetrics(weekStart: Date, weekEnd: Date): Promise<WeeklyOpsMetrics> {
    const { data: entries } = await this.supabase
      .from('founder_ops_log')
      .select('*')
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())
      .order('created_at', { ascending: false });

    const logEntries = entries || [];

    // Calculate totals
    const totalMinutes = logEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const totalHours = totalMinutes / 60;

    // Calculate by category
    const byCategory: Record<OpsCategory, number> = {
      customer_support: 0,
      technical_issue: 0,
      billing: 0,
      security: 0,
      data_request: 0,
      partnership: 0,
      compliance: 0,
      maintenance: 0,
      reporting: 0,
      other: 0,
    };

    const byUrgency: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let automatableMinutes = 0;

    for (const entry of logEntries) {
      if (entry.category && byCategory[entry.category as OpsCategory] !== undefined) {
        byCategory[entry.category as OpsCategory] += entry.duration_minutes || 0;
      }
      if (entry.urgency && byUrgency[entry.urgency] !== undefined) {
        byUrgency[entry.urgency] += entry.duration_minutes || 0;
      }
      if (entry.automatable) {
        automatableMinutes += entry.duration_minutes || 0;
      }
    }

    // Top time consumers
    const taskTimes: Record<string, number> = {};
    for (const entry of logEntries) {
      if (entry.task_name) {
        taskTimes[entry.task_name] = (taskTimes[entry.task_name] || 0) + (entry.duration_minutes || 0);
      }
    }
    const topTimeConsumers = Object.entries(taskTimes)
      .map(([task, minutes]) => ({ task, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    // Get previous week for trend
    const prevWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevWeekEnd = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: prevEntries } = await this.supabase
      .from('founder_ops_log')
      .select('duration_minutes')
      .gte('created_at', prevWeekStart.toISOString())
      .lt('created_at', prevWeekEnd.toISOString());

    const prevTotalMinutes = (prevEntries || []).reduce(
      (sum, e) => sum + (e.duration_minutes || 0),
      0
    );

    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (prevTotalMinutes > 0) {
      const change = ((totalMinutes - prevTotalMinutes) / prevTotalMinutes) * 100;
      if (change < -10) trend = 'improving';
      else if (change > 10) trend = 'worsening';
    }

    return {
      weekStart,
      weekEnd,
      totalMinutes,
      totalHours: Math.round(totalHours * 10) / 10,
      targetHours: TARGET_HOURS_PER_WEEK,
      targetMet: totalHours <= TARGET_HOURS_PER_WEEK,
      entriesCount: logEntries.length,
      byCategory,
      byUrgency,
      automatableMinutes,
      automatablePercentage:
        totalMinutes > 0 ? Math.round((automatableMinutes / totalMinutes) * 100) : 0,
      trend,
      topTimeConsumers,
    };
  }

  /**
   * Get full ops time report
   */
  public async getOpsTimeReport(): Promise<OpsTimeReport> {
    const now = new Date();
    const currentWeekStart = this.getWeekStart(now);
    const currentWeekEnd = this.getWeekEnd(now);
    const previousWeekStart = new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousWeekEnd = new Date(currentWeekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const currentWeek = await this.getWeekMetrics(currentWeekStart, currentWeekEnd);
    const previousWeek = await this.getWeekMetrics(previousWeekStart, previousWeekEnd);

    // Calculate monthly average (last 4 weeks)
    let monthlyTotal = currentWeek.totalMinutes + previousWeek.totalMinutes;
    for (let i = 2; i < 4; i++) {
      const weekStart = new Date(currentWeekStart.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(currentWeekEnd.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekMetrics = await this.getWeekMetrics(weekStart, weekEnd);
      monthlyTotal += weekMetrics.totalMinutes;
    }
    const monthlyAverage = monthlyTotal / 4 / 60; // Convert to hours

    // Generate automation opportunities
    const automationOpportunities = this.generateAutomationOpportunities(currentWeek);

    return {
      currentWeek,
      previousWeek,
      monthlyAverage: Math.round(monthlyAverage * 10) / 10,
      automationOpportunities,
      targetMet: currentWeek.targetMet,
      target: TARGET_HOURS_PER_WEEK,
    };
  }

  /**
   * Store ops metrics snapshot
   */
  public async storeMetricsSnapshot(metrics: WeeklyOpsMetrics): Promise<void> {
    try {
      await this.supabase.from('cron_executions').insert({
        job_name: 'founder-ops-tracking',
        status: metrics.targetMet ? 'success' : 'warning',
        execution_time: 0,
        metadata: {
          weekStart: metrics.weekStart.toISOString(),
          weekEnd: metrics.weekEnd.toISOString(),
          totalHours: metrics.totalHours,
          targetHours: metrics.targetHours,
          targetMet: metrics.targetMet,
          entriesCount: metrics.entriesCount,
          byCategory: metrics.byCategory,
          automatablePercentage: metrics.automatablePercentage,
          trend: metrics.trend,
          measuredAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to store ops metrics:', error);
    }
  }

  /**
   * Generate automation opportunities based on current metrics
   */
  private generateAutomationOpportunities(
    metrics: WeeklyOpsMetrics
  ): AutomationOpportunity[] {
    const opportunities: AutomationOpportunity[] = [];

    // Analyze categories with high time consumption
    for (const [category, minutes] of Object.entries(metrics.byCategory)) {
      if (minutes > 15) {
        // More than 15 minutes per week
        const opportunity = this.getAutomationRecommendation(
          category as OpsCategory,
          minutes
        );
        if (opportunity) {
          opportunities.push(opportunity);
        }
      }
    }

    // Sort by impact and effort
    return opportunities.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      const effortOrder = { low: 0, medium: 1, high: 2 };

      const aScore = impactOrder[a.impact] * 3 + effortOrder[a.effort];
      const bScore = impactOrder[b.impact] * 3 + effortOrder[b.effort];

      return aScore - bScore;
    });
  }

  /**
   * Get automation recommendation for a category
   */
  private getAutomationRecommendation(
    category: OpsCategory,
    weeklyMinutes: number
  ): AutomationOpportunity | null {
    const recommendations: Record<OpsCategory, Partial<AutomationOpportunity>> = {
      customer_support: {
        recommendation: 'Implement AI-powered support chatbot and FAQ expansion',
        effort: 'medium',
        impact: 'high',
      },
      technical_issue: {
        recommendation: 'Add more comprehensive error monitoring and self-healing',
        effort: 'high',
        impact: 'high',
      },
      billing: {
        recommendation: 'Automate refund approvals under $50 and dunning sequences',
        effort: 'low',
        impact: 'medium',
      },
      security: {
        recommendation: 'Implement automated incident response playbooks',
        effort: 'medium',
        impact: 'high',
      },
      data_request: {
        recommendation: 'Create self-service data export portal',
        effort: 'medium',
        impact: 'medium',
      },
      partnership: {
        recommendation: 'Create partner self-service portal with API access',
        effort: 'high',
        impact: 'low',
      },
      compliance: {
        recommendation: 'Automate compliance report generation',
        effort: 'medium',
        impact: 'medium',
      },
      maintenance: {
        recommendation: 'Schedule automated maintenance windows',
        effort: 'low',
        impact: 'low',
      },
      reporting: {
        recommendation: 'Automate all recurring reports with scheduled delivery',
        effort: 'low',
        impact: 'high',
      },
      other: {
        recommendation: 'Categorize and analyze for specific automation opportunities',
        effort: 'medium',
        impact: 'low',
      },
    };

    const rec = recommendations[category];
    if (!rec) return null;

    return {
      category,
      task: CATEGORY_LABELS[category],
      weeklyMinutes,
      recommendation: rec.recommendation || '',
      effort: rec.effort || 'medium',
      impact: rec.impact || 'medium',
    };
  }

  /**
   * Get week start (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get week end (Sunday)
   */
  private getWeekEnd(date: Date): Date {
    const start = this.getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return end;
  }

  /**
   * Generate markdown report
   */
  public async generateMarkdownReport(): Promise<string> {
    const report = await this.getOpsTimeReport();

    const formatMinutes = (m: number) => {
      if (m >= 60) {
        return `${Math.floor(m / 60)}h ${m % 60}m`;
      }
      return `${m}m`;
    };

    let markdown = `# Founder Ops Time Report

**Generated:** ${new Date().toISOString()}
**Target:** <${report.target} hours/week
**Current Week:** ${report.currentWeek.totalHours} hours
**Status:** ${report.targetMet ? 'TARGET MET' : 'NEEDS IMPROVEMENT'}

---

## Weekly Summary

| Metric | Value |
|--------|-------|
| Total Time | ${formatMinutes(report.currentWeek.totalMinutes)} |
| Tasks Logged | ${report.currentWeek.entriesCount} |
| Automatable | ${report.currentWeek.automatablePercentage}% |
| Trend | ${report.currentWeek.trend} |
| Monthly Average | ${report.monthlyAverage} hrs/week |

---

## Time by Category

| Category | Time This Week |
|----------|---------------|
`;

    for (const [category, minutes] of Object.entries(report.currentWeek.byCategory)) {
      if (minutes > 0) {
        markdown += `| ${CATEGORY_LABELS[category as OpsCategory]} | ${formatMinutes(minutes)} |\n`;
      }
    }

    if (report.currentWeek.topTimeConsumers.length > 0) {
      markdown += `
---

## Top Time Consumers

| Task | Time |
|------|------|
`;
      for (const item of report.currentWeek.topTimeConsumers) {
        markdown += `| ${item.task} | ${formatMinutes(item.minutes)} |\n`;
      }
    }

    if (report.automationOpportunities.length > 0) {
      markdown += `
---

## Automation Opportunities

| Category | Weekly Time | Recommendation | Effort | Impact |
|----------|-------------|----------------|--------|--------|
`;
      for (const opp of report.automationOpportunities) {
        markdown += `| ${CATEGORY_LABELS[opp.category]} | ${formatMinutes(opp.weeklyMinutes)} | ${opp.recommendation} | ${opp.effort} | ${opp.impact} |\n`;
      }
    }

    markdown += `
---

## Comparison to Previous Week

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Total Hours | ${report.currentWeek.totalHours} | ${report.previousWeek?.totalHours || 'N/A'} | ${report.previousWeek ? (report.currentWeek.totalHours - report.previousWeek.totalHours).toFixed(1) : 'N/A'} |
| Tasks | ${report.currentWeek.entriesCount} | ${report.previousWeek?.entriesCount || 'N/A'} | ${report.previousWeek ? report.currentWeek.entriesCount - report.previousWeek.entriesCount : 'N/A'} |
`;

    return markdown;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createFounderOpsTracker(): FounderOpsTracker {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return new FounderOpsTracker(supabaseUrl, supabaseKey);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FounderOpsTracker;
