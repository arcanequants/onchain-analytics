/**
 * RLHF Monthly Improvement Report Generator
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Generates automated monthly reports on model performance improvements,
 * feedback analysis, and recommendation accuracy.
 */

import { supabase } from '@/lib/supabase';

// ================================================================
// Types
// ================================================================

export interface RLHFMetrics {
  period: {
    start: Date;
    end: Date;
  };
  feedbackSummary: {
    totalFeedback: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    positiveRate: number;
  };
  accuracyMetrics: {
    scoreAccuracy: number;
    recommendationAccuracy: number;
    halluccinationRate: number;
    confidenceCalibration: number;
  };
  userEngagement: {
    activeUsers: number;
    feedbackParticipationRate: number;
    averageSessionDuration: number;
    returnUserRate: number;
  };
  modelPerformance: {
    averageLatency: number;
    p95Latency: number;
    errorRate: number;
    tokenEfficiency: number;
  };
  improvementTrends: {
    scoreAccuracyDelta: number;
    satisfactionDelta: number;
    latencyDelta: number;
    errorRateDelta: number;
  };
  topIssues: Array<{
    category: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
    resolution: string;
  }>;
  recommendations: string[];
}

export interface MonthlyReport {
  id: string;
  generatedAt: Date;
  metrics: RLHFMetrics;
  summary: string;
  highlights: string[];
  actionItems: Array<{
    priority: 'high' | 'medium' | 'low';
    description: string;
    owner: string;
    dueDate: Date;
  }>;
}

// ================================================================
// Data Collection
// ================================================================

async function collectFeedbackData(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('rlhf_feedback')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error('Error fetching feedback data:', error);
    return [];
  }

  return data || [];
}

async function collectAccuracyData(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('recommendation_outcomes')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error('Error fetching accuracy data:', error);
    return [];
  }

  return data || [];
}

async function collectEngagementData(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error('Error fetching engagement data:', error);
    return [];
  }

  return data || [];
}

async function collectPerformanceData(startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('ai_request_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) {
    console.error('Error fetching performance data:', error);
    return [];
  }

  return data || [];
}

// ================================================================
// Metrics Calculation
// ================================================================

function calculateFeedbackSummary(feedback: any[]): RLHFMetrics['feedbackSummary'] {
  const total = feedback.length;
  const positive = feedback.filter((f) => f.sentiment === 'positive' || f.rating >= 4).length;
  const negative = feedback.filter((f) => f.sentiment === 'negative' || f.rating <= 2).length;
  const neutral = total - positive - negative;

  return {
    totalFeedback: total,
    positiveCount: positive,
    negativeCount: negative,
    neutralCount: neutral,
    positiveRate: total > 0 ? (positive / total) * 100 : 0,
  };
}

function calculateAccuracyMetrics(outcomes: any[]): RLHFMetrics['accuracyMetrics'] {
  if (outcomes.length === 0) {
    return {
      scoreAccuracy: 0,
      recommendationAccuracy: 0,
      halluccinationRate: 0,
      confidenceCalibration: 0,
    };
  }

  const accurateScores = outcomes.filter((o) => o.score_accurate).length;
  const accurateRecs = outcomes.filter((o) => o.recommendation_helpful).length;
  const hallucinations = outcomes.filter((o) => o.hallucination_detected).length;

  // Calculate calibration (how well confidence matches actual accuracy)
  const calibrationGroups = outcomes.reduce(
    (acc, o) => {
      const bucket = Math.floor(o.confidence * 10) / 10;
      if (!acc[bucket]) acc[bucket] = { total: 0, accurate: 0 };
      acc[bucket].total++;
      if (o.score_accurate) acc[bucket].accurate++;
      return acc;
    },
    {} as Record<number, { total: number; accurate: number }>
  );

  let calibrationError = 0;
  let calibrationCount = 0;
  (Object.entries(calibrationGroups) as [string, { total: number; accurate: number }][]).forEach(([bucket, stats]) => {
    const expectedAccuracy = parseFloat(bucket);
    const actualAccuracy = stats.accurate / stats.total;
    calibrationError += Math.abs(expectedAccuracy - actualAccuracy);
    calibrationCount++;
  });

  return {
    scoreAccuracy: (accurateScores / outcomes.length) * 100,
    recommendationAccuracy: (accurateRecs / outcomes.length) * 100,
    halluccinationRate: (hallucinations / outcomes.length) * 100,
    confidenceCalibration: calibrationCount > 0 ? 100 - (calibrationError / calibrationCount) * 100 : 0,
  };
}

function calculateEngagementMetrics(sessions: any[]): RLHFMetrics['userEngagement'] {
  if (sessions.length === 0) {
    return {
      activeUsers: 0,
      feedbackParticipationRate: 0,
      averageSessionDuration: 0,
      returnUserRate: 0,
    };
  }

  const uniqueUsers = new Set(sessions.map((s) => s.user_id)).size;
  const sessionsWithFeedback = sessions.filter((s) => s.feedback_submitted).length;
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);

  // Calculate return users (users with more than one session)
  const userSessions = sessions.reduce(
    (acc, s) => {
      acc[s.user_id] = (acc[s.user_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const returnUsers = (Object.values(userSessions) as number[]).filter((count) => count > 1).length;

  return {
    activeUsers: uniqueUsers,
    feedbackParticipationRate: (sessionsWithFeedback / sessions.length) * 100,
    averageSessionDuration: totalDuration / sessions.length,
    returnUserRate: uniqueUsers > 0 ? (returnUsers / uniqueUsers) * 100 : 0,
  };
}

function calculatePerformanceMetrics(requests: any[]): RLHFMetrics['modelPerformance'] {
  if (requests.length === 0) {
    return {
      averageLatency: 0,
      p95Latency: 0,
      errorRate: 0,
      tokenEfficiency: 0,
    };
  }

  const latencies = requests.map((r) => r.latency_ms).sort((a, b) => a - b);
  const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  const p95Index = Math.floor(latencies.length * 0.95);
  const errors = requests.filter((r) => r.error).length;
  const totalTokens = requests.reduce((sum, r) => sum + (r.tokens_used || 0), 0);
  const totalResults = requests.reduce((sum, r) => sum + (r.results_count || 1), 0);

  return {
    averageLatency: avgLatency,
    p95Latency: latencies[p95Index] || avgLatency,
    errorRate: (errors / requests.length) * 100,
    tokenEfficiency: totalResults > 0 ? totalTokens / totalResults : 0,
  };
}

async function calculateImprovementTrends(
  currentMetrics: Partial<RLHFMetrics>,
  startDate: Date
): Promise<RLHFMetrics['improvementTrends']> {
  // Get previous period data
  const previousStart = new Date(startDate);
  previousStart.setMonth(previousStart.getMonth() - 1);
  const previousEnd = new Date(startDate);
  previousEnd.setDate(previousEnd.getDate() - 1);

  // Fetch previous period metrics
  const { data: previousReport } = await supabase
    .from('rlhf_monthly_reports')
    .select('metrics')
    .gte('generated_at', previousStart.toISOString())
    .lte('generated_at', previousEnd.toISOString())
    .single();

  if (!previousReport?.metrics) {
    return {
      scoreAccuracyDelta: 0,
      satisfactionDelta: 0,
      latencyDelta: 0,
      errorRateDelta: 0,
    };
  }

  const prev = previousReport.metrics as RLHFMetrics;

  return {
    scoreAccuracyDelta:
      (currentMetrics.accuracyMetrics?.scoreAccuracy || 0) -
      (prev.accuracyMetrics?.scoreAccuracy || 0),
    satisfactionDelta:
      (currentMetrics.feedbackSummary?.positiveRate || 0) -
      (prev.feedbackSummary?.positiveRate || 0),
    latencyDelta:
      (currentMetrics.modelPerformance?.averageLatency || 0) -
      (prev.modelPerformance?.averageLatency || 0),
    errorRateDelta:
      (currentMetrics.modelPerformance?.errorRate || 0) - (prev.modelPerformance?.errorRate || 0),
  };
}

function identifyTopIssues(feedback: any[]): RLHFMetrics['topIssues'] {
  // Group feedback by issue category
  const issueGroups = feedback
    .filter((f) => f.issue_category)
    .reduce(
      (acc, f) => {
        const category = f.issue_category;
        if (!acc[category]) {
          acc[category] = { count: 0, resolved: 0 };
        }
        acc[category].count++;
        if (f.resolved) acc[category].resolved++;
        return acc;
      },
      {} as Record<string, { count: number; resolved: number }>
    );

  // Sort by count and take top 5
  return (Object.entries(issueGroups) as [string, { count: number; resolved: number }][])
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([category, stats]) => ({
      category,
      count: stats.count,
      trend: 'stable' as const, // Would compare with previous period
      resolution: `${((stats.resolved / stats.count) * 100).toFixed(1)}% resolved`,
    }));
}

function generateRecommendations(metrics: Partial<RLHFMetrics>): string[] {
  const recommendations: string[] = [];

  // Score accuracy recommendations
  if ((metrics.accuracyMetrics?.scoreAccuracy || 0) < 80) {
    recommendations.push(
      'Consider retraining the model with recent feedback data to improve score accuracy.'
    );
  }

  // Hallucination recommendations
  if ((metrics.accuracyMetrics?.halluccinationRate || 0) > 5) {
    recommendations.push(
      'Implement additional fact-checking in the pipeline to reduce hallucination rate.'
    );
  }

  // Latency recommendations
  if ((metrics.modelPerformance?.averageLatency || 0) > 3000) {
    recommendations.push(
      'Optimize model inference or implement caching to reduce average latency below 3s.'
    );
  }

  // Engagement recommendations
  if ((metrics.userEngagement?.feedbackParticipationRate || 0) < 20) {
    recommendations.push(
      'Consider adding incentives or simplifying the feedback process to increase participation.'
    );
  }

  // Error rate recommendations
  if ((metrics.modelPerformance?.errorRate || 0) > 2) {
    recommendations.push('Investigate error causes and implement additional error handling.');
  }

  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push('Continue monitoring metrics and gathering user feedback.');
  }

  return recommendations;
}

// ================================================================
// Report Generation
// ================================================================

export async function generateMonthlyReport(
  month?: number,
  year?: number
): Promise<MonthlyReport> {
  const now = new Date();
  const targetMonth = month ?? now.getMonth();
  const targetYear = year ?? now.getFullYear();

  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  console.log(`Generating RLHF report for ${startDate.toISOString()} - ${endDate.toISOString()}`);

  // Collect data in parallel
  const [feedback, outcomes, sessions, requests] = await Promise.all([
    collectFeedbackData(startDate, endDate),
    collectAccuracyData(startDate, endDate),
    collectEngagementData(startDate, endDate),
    collectPerformanceData(startDate, endDate),
  ]);

  // Calculate metrics
  const feedbackSummary = calculateFeedbackSummary(feedback);
  const accuracyMetrics = calculateAccuracyMetrics(outcomes);
  const userEngagement = calculateEngagementMetrics(sessions);
  const modelPerformance = calculatePerformanceMetrics(requests);

  const partialMetrics = {
    feedbackSummary,
    accuracyMetrics,
    userEngagement,
    modelPerformance,
  };

  const improvementTrends = await calculateImprovementTrends(partialMetrics, startDate);
  const topIssues = identifyTopIssues(feedback);
  const recommendations = generateRecommendations(partialMetrics);

  const metrics: RLHFMetrics = {
    period: { start: startDate, end: endDate },
    feedbackSummary,
    accuracyMetrics,
    userEngagement,
    modelPerformance,
    improvementTrends,
    topIssues,
    recommendations,
  };

  // Generate summary
  const summary = generateSummary(metrics);
  const highlights = generateHighlights(metrics);
  const actionItems = generateActionItems(metrics);

  const report: MonthlyReport = {
    id: `rlhf-report-${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`,
    generatedAt: new Date(),
    metrics,
    summary,
    highlights,
    actionItems,
  };

  // Store report
  await storeReport(report);

  return report;
}

function generateSummary(metrics: RLHFMetrics): string {
  const { feedbackSummary, accuracyMetrics, improvementTrends } = metrics;

  return `
RLHF Monthly Performance Report

Overall Performance:
- Processed ${feedbackSummary.totalFeedback} feedback items with ${feedbackSummary.positiveRate.toFixed(1)}% positive sentiment.
- Score accuracy: ${accuracyMetrics.scoreAccuracy.toFixed(1)}% (${improvementTrends.scoreAccuracyDelta >= 0 ? '+' : ''}${improvementTrends.scoreAccuracyDelta.toFixed(1)}% vs previous month).
- Hallucination rate: ${accuracyMetrics.halluccinationRate.toFixed(2)}%.
- Model confidence calibration: ${accuracyMetrics.confidenceCalibration.toFixed(1)}%.

Key Trends:
- User satisfaction ${improvementTrends.satisfactionDelta >= 0 ? 'improved' : 'declined'} by ${Math.abs(improvementTrends.satisfactionDelta).toFixed(1)}%.
- Latency ${improvementTrends.latencyDelta <= 0 ? 'improved' : 'increased'} by ${Math.abs(improvementTrends.latencyDelta).toFixed(0)}ms.
- Error rate ${improvementTrends.errorRateDelta <= 0 ? 'decreased' : 'increased'} by ${Math.abs(improvementTrends.errorRateDelta).toFixed(2)}%.
`.trim();
}

function generateHighlights(metrics: RLHFMetrics): string[] {
  const highlights: string[] = [];

  if (metrics.feedbackSummary.positiveRate > 80) {
    highlights.push(`Strong user satisfaction with ${metrics.feedbackSummary.positiveRate.toFixed(1)}% positive feedback.`);
  }

  if (metrics.accuracyMetrics.scoreAccuracy > 85) {
    highlights.push(`High score accuracy at ${metrics.accuracyMetrics.scoreAccuracy.toFixed(1)}%.`);
  }

  if (metrics.improvementTrends.scoreAccuracyDelta > 2) {
    highlights.push(`Score accuracy improved by ${metrics.improvementTrends.scoreAccuracyDelta.toFixed(1)}% this month.`);
  }

  if (metrics.modelPerformance.errorRate < 1) {
    highlights.push(`Excellent reliability with only ${metrics.modelPerformance.errorRate.toFixed(2)}% error rate.`);
  }

  if (metrics.userEngagement.returnUserRate > 40) {
    highlights.push(`High user retention with ${metrics.userEngagement.returnUserRate.toFixed(1)}% return rate.`);
  }

  return highlights.slice(0, 5);
}

function generateActionItems(
  metrics: RLHFMetrics
): MonthlyReport['actionItems'] {
  const items: MonthlyReport['actionItems'] = [];
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);

  if (metrics.accuracyMetrics.halluccinationRate > 3) {
    items.push({
      priority: 'high',
      description: 'Implement additional hallucination detection checks in response validation.',
      owner: 'ML Engineering',
      dueDate: nextMonth,
    });
  }

  if (metrics.feedbackSummary.positiveRate < 70) {
    items.push({
      priority: 'high',
      description: 'Analyze negative feedback patterns and identify root causes.',
      owner: 'Product Team',
      dueDate: nextMonth,
    });
  }

  if (metrics.modelPerformance.averageLatency > 2500) {
    items.push({
      priority: 'medium',
      description: 'Optimize inference pipeline to reduce average latency.',
      owner: 'Backend Engineering',
      dueDate: nextMonth,
    });
  }

  if (metrics.userEngagement.feedbackParticipationRate < 15) {
    items.push({
      priority: 'medium',
      description: 'Improve feedback UX to increase participation rate.',
      owner: 'UX Team',
      dueDate: nextMonth,
    });
  }

  metrics.topIssues.slice(0, 2).forEach((issue) => {
    items.push({
      priority: 'medium',
      description: `Address top issue category: "${issue.category}" (${issue.count} reports).`,
      owner: 'Engineering',
      dueDate: nextMonth,
    });
  });

  return items;
}

async function storeReport(report: MonthlyReport): Promise<void> {
  const { error } = await supabase.from('rlhf_monthly_reports').upsert({
    id: report.id,
    generated_at: report.generatedAt.toISOString(),
    metrics: report.metrics,
    summary: report.summary,
    highlights: report.highlights,
    action_items: report.actionItems,
  });

  if (error) {
    console.error('Error storing report:', error);
    throw new Error('Failed to store RLHF monthly report');
  }
}

// ================================================================
// Report Formatting
// ================================================================

export function formatReportAsMarkdown(report: MonthlyReport): string {
  const { metrics, highlights, actionItems } = report;

  return `
# RLHF Monthly Improvement Report

**Generated:** ${report.generatedAt.toISOString()}
**Period:** ${metrics.period.start.toLocaleDateString()} - ${metrics.period.end.toLocaleDateString()}

---

## Executive Summary

${report.summary}

---

## Key Highlights

${highlights.map((h) => `- ${h}`).join('\n')}

---

## Detailed Metrics

### Feedback Analysis

| Metric | Value |
|--------|-------|
| Total Feedback | ${metrics.feedbackSummary.totalFeedback} |
| Positive Rate | ${metrics.feedbackSummary.positiveRate.toFixed(1)}% |
| Positive Count | ${metrics.feedbackSummary.positiveCount} |
| Negative Count | ${metrics.feedbackSummary.negativeCount} |
| Neutral Count | ${metrics.feedbackSummary.neutralCount} |

### Accuracy Metrics

| Metric | Value |
|--------|-------|
| Score Accuracy | ${metrics.accuracyMetrics.scoreAccuracy.toFixed(1)}% |
| Recommendation Accuracy | ${metrics.accuracyMetrics.recommendationAccuracy.toFixed(1)}% |
| Hallucination Rate | ${metrics.accuracyMetrics.halluccinationRate.toFixed(2)}% |
| Confidence Calibration | ${metrics.accuracyMetrics.confidenceCalibration.toFixed(1)}% |

### User Engagement

| Metric | Value |
|--------|-------|
| Active Users | ${metrics.userEngagement.activeUsers} |
| Feedback Participation | ${metrics.userEngagement.feedbackParticipationRate.toFixed(1)}% |
| Avg Session Duration | ${(metrics.userEngagement.averageSessionDuration / 60).toFixed(1)} min |
| Return User Rate | ${metrics.userEngagement.returnUserRate.toFixed(1)}% |

### Model Performance

| Metric | Value |
|--------|-------|
| Average Latency | ${metrics.modelPerformance.averageLatency.toFixed(0)}ms |
| P95 Latency | ${metrics.modelPerformance.p95Latency.toFixed(0)}ms |
| Error Rate | ${metrics.modelPerformance.errorRate.toFixed(2)}% |
| Token Efficiency | ${metrics.modelPerformance.tokenEfficiency.toFixed(1)} tokens/result |

---

## Month-over-Month Trends

| Metric | Change |
|--------|--------|
| Score Accuracy | ${metrics.improvementTrends.scoreAccuracyDelta >= 0 ? '↑' : '↓'} ${Math.abs(metrics.improvementTrends.scoreAccuracyDelta).toFixed(1)}% |
| User Satisfaction | ${metrics.improvementTrends.satisfactionDelta >= 0 ? '↑' : '↓'} ${Math.abs(metrics.improvementTrends.satisfactionDelta).toFixed(1)}% |
| Latency | ${metrics.improvementTrends.latencyDelta <= 0 ? '↓' : '↑'} ${Math.abs(metrics.improvementTrends.latencyDelta).toFixed(0)}ms |
| Error Rate | ${metrics.improvementTrends.errorRateDelta <= 0 ? '↓' : '↑'} ${Math.abs(metrics.improvementTrends.errorRateDelta).toFixed(2)}% |

---

## Top Issues

| Category | Reports | Status |
|----------|---------|--------|
${metrics.topIssues.map((i) => `| ${i.category} | ${i.count} | ${i.resolution} |`).join('\n')}

---

## Recommendations

${metrics.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

## Action Items

| Priority | Description | Owner | Due Date |
|----------|-------------|-------|----------|
${actionItems.map((a) => `| ${a.priority.toUpperCase()} | ${a.description} | ${a.owner} | ${a.dueDate.toLocaleDateString()} |`).join('\n')}

---

*This report was automatically generated by the RLHF monitoring system.*
`.trim();
}

export function formatReportAsJSON(report: MonthlyReport): string {
  return JSON.stringify(report, null, 2);
}
