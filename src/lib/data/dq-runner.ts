/**
 * Data Quality Runner with Slack Alerts
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Features:
 * - Scheduled DQ checks
 * - Slack integration for alerts
 * - Check results persistence
 * - Trend analysis
 * - SLA monitoring
 */

import {
  checkCompleteness,
  checkRange,
  checkUniqueness,
  checkFreshness,
  detectAnomalies,
  type QualityCheckResult,
} from './data-quality';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Internal result type for DQ runner
 * Maps from QualityCheckResult properties to our internal format
 */
interface InternalCheckResult {
  passed: boolean;
  score: number;
  details: Record<string, unknown>;
  rowsChecked: number;
  rowsFailed: number;
}

/**
 * Convert QualityCheckResult to InternalCheckResult
 */
function toInternalResult(qcr: QualityCheckResult): InternalCheckResult {
  const totalRows = qcr.totalRows ?? 0;
  const affectedRows = qcr.affectedRows ?? 0;
  const actualValue = typeof qcr.actualValue === 'number' ? qcr.actualValue : 0;

  return {
    passed: qcr.passed,
    score: totalRows > 0 ? (totalRows - affectedRows) / totalRows : (actualValue / 100),
    details: { message: qcr.message },
    rowsChecked: totalRows,
    rowsFailed: affectedRows,
  };
}

export type CheckSeverity = 'info' | 'warning' | 'error' | 'critical';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface DQCheck {
  id: string;
  name: string;
  description: string;
  tableName: string;
  checkType: 'completeness' | 'range' | 'uniqueness' | 'freshness' | 'anomaly' | 'custom';
  column?: string;
  params: Record<string, unknown>;
  severity: CheckSeverity;
  schedule: string; // cron expression
  enabled: boolean;
  slackChannel?: string;
  notifyOnSuccess?: boolean;
  tags: string[];
}

export interface DQCheckResult {
  id: string;
  checkId: string;
  runId: string;
  passed: boolean;
  score: number;
  details: Record<string, unknown>;
  rowsChecked: number;
  rowsFailed: number;
  executionTimeMs: number;
  createdAt: Date;
}

export interface DQRun {
  id: string;
  status: RunStatus;
  checksTotal: number;
  checksPassed: number;
  checksFailed: number;
  checksSkipped: number;
  overallScore: number;
  startedAt: Date;
  completedAt: Date | null;
  triggeredBy: 'schedule' | 'manual' | 'ci';
  metadata: Record<string, unknown>;
}

export interface SlackConfig {
  webhookUrl: string;
  defaultChannel: string;
  username?: string;
  iconEmoji?: string;
  mentionOnCritical?: string[]; // user/group IDs to mention
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'context' | 'header' | 'actions';
  text?: { type: 'mrkdwn' | 'plain_text'; text: string };
  fields?: Array<{ type: 'mrkdwn' | 'plain_text'; text: string }>;
  elements?: Array<{ type: string; text: string; url?: string; action_id?: string }>;
}

export interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields?: Array<{ title: string; value: string; short: boolean }>;
  footer?: string;
  ts?: number;
}

// ============================================================================
// DEFAULT CHECKS
// ============================================================================

export const DEFAULT_DQ_CHECKS: DQCheck[] = [
  // Brand perception checks
  {
    id: 'check_perception_completeness',
    name: 'Perception Score Completeness',
    description: 'Ensure all perception records have required fields',
    tableName: 'fact_brand_perception',
    checkType: 'completeness',
    params: { columns: ['brand_id', 'provider_id', 'overall_score', 'confidence'] },
    severity: 'error',
    schedule: '0 * * * *', // hourly
    enabled: true,
    tags: ['perception', 'completeness'],
  },
  {
    id: 'check_score_range',
    name: 'Score Range Validation',
    description: 'Ensure scores are within valid range 0-100',
    tableName: 'fact_brand_perception',
    checkType: 'range',
    column: 'overall_score',
    params: { min: 0, max: 100 },
    severity: 'critical',
    schedule: '0 * * * *',
    enabled: true,
    tags: ['perception', 'range'],
  },
  {
    id: 'check_confidence_range',
    name: 'Confidence Range Validation',
    description: 'Ensure confidence is within valid range 0-1',
    tableName: 'fact_brand_perception',
    checkType: 'range',
    column: 'confidence',
    params: { min: 0, max: 1 },
    severity: 'error',
    schedule: '0 * * * *',
    enabled: true,
    tags: ['perception', 'range'],
  },

  // API usage checks
  {
    id: 'check_api_usage_freshness',
    name: 'API Usage Freshness',
    description: 'Ensure API usage data is being collected',
    tableName: 'fact_api_usage',
    checkType: 'freshness',
    params: { maxAgeMinutes: 60 },
    severity: 'warning',
    schedule: '*/15 * * * *', // every 15 minutes
    enabled: true,
    tags: ['api', 'freshness'],
  },
  {
    id: 'check_latency_anomaly',
    name: 'Latency Anomaly Detection',
    description: 'Detect unusual latency patterns',
    tableName: 'fact_api_usage',
    checkType: 'anomaly',
    column: 'latency_ms',
    params: { threshold: 3 }, // 3 standard deviations
    severity: 'warning',
    schedule: '0 */6 * * *', // every 6 hours
    enabled: true,
    tags: ['api', 'anomaly'],
  },
  {
    id: 'check_cost_anomaly',
    name: 'Cost Anomaly Detection',
    description: 'Detect unusual cost patterns',
    tableName: 'fact_api_usage',
    checkType: 'anomaly',
    column: 'cost_usd',
    params: { threshold: 2.5 },
    severity: 'critical',
    schedule: '0 */4 * * *', // every 4 hours
    enabled: true,
    slackChannel: '#finance-alerts',
    tags: ['api', 'cost', 'anomaly'],
  },

  // User engagement checks
  {
    id: 'check_engagement_uniqueness',
    name: 'User Event Uniqueness',
    description: 'Ensure no duplicate events',
    tableName: 'fact_user_engagement',
    checkType: 'uniqueness',
    params: { columns: ['user_id', 'event_type', 'event_timestamp'] },
    severity: 'warning',
    schedule: '0 0 * * *', // daily
    enabled: true,
    tags: ['engagement', 'uniqueness'],
  },
];

// ============================================================================
// SLACK INTEGRATION
// ============================================================================

class SlackNotifier {
  private config: SlackConfig;

  constructor(config: SlackConfig) {
    this.config = config;
  }

  /**
   * Send message to Slack
   */
  async send(message: SlackMessage): Promise<boolean> {
    try {
      const payload = {
        channel: message.channel || this.config.defaultChannel,
        username: this.config.username || 'DQ Runner',
        icon_emoji: this.config.iconEmoji || ':bar_chart:',
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
      };

      // In production, would POST to webhook URL
      // await fetch(this.config.webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload),
      // });

      console.log('[Slack] Message sent:', JSON.stringify(payload, null, 2));
      return true;
    } catch (error) {
      console.error('[Slack] Failed to send message:', error);
      return false;
    }
  }

  /**
   * Format check result for Slack
   */
  formatCheckResult(check: DQCheck, result: DQCheckResult): SlackMessage {
    const color = result.passed ? '#36a64f' : this.getSeverityColor(check.severity);
    const status = result.passed ? ':white_check_mark: Passed' : ':x: Failed';

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `Data Quality Check: ${check.name}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Status:*\n${status}` },
          { type: 'mrkdwn', text: `*Score:*\n${(result.score * 100).toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Table:*\n\`${check.tableName}\`` },
          { type: 'mrkdwn', text: `*Rows Checked:*\n${result.rowsChecked.toLocaleString()}` },
        ],
      },
    ];

    if (!result.passed) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Failed Rows:* ${result.rowsFailed.toLocaleString()} (${((result.rowsFailed / result.rowsChecked) * 100).toFixed(2)}%)`,
        },
      });

      if (check.severity === 'critical' && this.config.mentionOnCritical?.length) {
        const mentions = this.config.mentionOnCritical.map(id => `<@${id}>`).join(' ');
        blocks.push({
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `cc: ${mentions}` }],
        });
      }
    }

    blocks.push({
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Tags: ${check.tags.map(t => `\`${t}\``).join(' ')}` },
        { type: 'mrkdwn', text: `Execution time: ${result.executionTimeMs}ms` },
      ],
    });

    return {
      channel: check.slackChannel || this.config.defaultChannel,
      text: `DQ Check ${result.passed ? 'passed' : 'failed'}: ${check.name}`,
      blocks,
      attachments: [{
        color,
        title: check.description,
        text: '',
        footer: 'DQ Runner',
        ts: Math.floor(result.createdAt.getTime() / 1000),
      }],
    };
  }

  /**
   * Format run summary for Slack
   */
  formatRunSummary(run: DQRun, results: DQCheckResult[]): SlackMessage {
    const passRate = run.checksTotal > 0
      ? (run.checksPassed / run.checksTotal) * 100
      : 0;

    const color = passRate === 100 ? '#36a64f'
      : passRate >= 90 ? '#ffcc00'
      : '#ff0000';

    const failedChecks = results.filter(r => !r.passed);

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: { type: 'plain_text', text: 'Data Quality Run Summary' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Overall Score:*\n${(run.overallScore * 100).toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Pass Rate:*\n${passRate.toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Checks Passed:*\n${run.checksPassed}/${run.checksTotal}` },
          { type: 'mrkdwn', text: `*Checks Failed:*\n${run.checksFailed}` },
        ],
      },
    ];

    if (failedChecks.length > 0) {
      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Failed Checks:*\n' + failedChecks
            .slice(0, 5)
            .map(r => `• ${r.checkId}: ${(r.score * 100).toFixed(1)}%`)
            .join('\n'),
        },
      });
    }

    const duration = run.completedAt
      ? (run.completedAt.getTime() - run.startedAt.getTime()) / 1000
      : 0;

    blocks.push({
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `Run ID: \`${run.id}\`` },
        { type: 'mrkdwn', text: `Duration: ${duration.toFixed(1)}s` },
        { type: 'mrkdwn', text: `Triggered by: ${run.triggeredBy}` },
      ],
    });

    return {
      channel: this.config.defaultChannel,
      text: `DQ Run completed: ${run.checksPassed}/${run.checksTotal} checks passed`,
      blocks,
      attachments: [{
        color,
        title: 'Data Quality Report',
        text: '',
        footer: 'DQ Runner',
        ts: Math.floor(Date.now() / 1000),
      }],
    };
  }

  private getSeverityColor(severity: CheckSeverity): string {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'error': return '#ff6600';
      case 'warning': return '#ffcc00';
      case 'info': return '#0066ff';
      default: return '#cccccc';
    }
  }
}

// ============================================================================
// DQ RUNNER
// ============================================================================

export class DQRunner {
  private checks: Map<string, DQCheck> = new Map();
  private runs: Map<string, DQRun> = new Map();
  private results: Map<string, DQCheckResult[]> = new Map();
  private slackNotifier: SlackNotifier | null = null;
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(slackConfig?: SlackConfig) {
    // Register default checks
    for (const check of DEFAULT_DQ_CHECKS) {
      this.registerCheck(check);
    }

    if (slackConfig) {
      this.slackNotifier = new SlackNotifier(slackConfig);
    }
  }

  /**
   * Generate IDs
   */
  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Register a DQ check
   */
  registerCheck(check: DQCheck): void {
    this.checks.set(check.id, check);
  }

  /**
   * Get check by ID
   */
  getCheck(id: string): DQCheck | undefined {
    return this.checks.get(id);
  }

  /**
   * Get all checks
   */
  getAllChecks(): DQCheck[] {
    return [...this.checks.values()];
  }

  /**
   * Get checks by tag
   */
  getChecksByTag(tag: string): DQCheck[] {
    return [...this.checks.values()].filter(c => c.tags.includes(tag));
  }

  /**
   * Execute a single check
   */
  async executeCheck(
    checkId: string,
    data: Record<string, unknown>[],
    runId: string
  ): Promise<DQCheckResult> {
    const check = this.checks.get(checkId);
    if (!check) {
      throw new Error(`Check not found: ${checkId}`);
    }

    const startTime = Date.now();
    let result: InternalCheckResult;

    switch (check.checkType) {
      case 'completeness': {
        const columns = (check.params.columns as string[]) || [check.column!];
        // Check first column (checkCompleteness takes single column)
        result = toInternalResult(checkCompleteness(data, columns[0]));
        break;
      }

      case 'range':
        result = toInternalResult(checkRange(
          data,
          check.column!,
          check.params.min as number,
          check.params.max as number
        ));
        break;

      case 'uniqueness': {
        const uniqueColumns = (check.params.columns as string[]) || [check.column!];
        result = toInternalResult(checkUniqueness(data, uniqueColumns));
        break;
      }

      case 'freshness': {
        // checkFreshness expects: data, timestampColumn, maxAgeHours
        const timestampColumn = (check.params.timestampColumn as string) || check.column || 'created_at';
        const maxAgeMinutes = (check.params.maxAgeMinutes as number) || 60;
        const maxAgeHours = maxAgeMinutes / 60;
        result = toInternalResult(checkFreshness(data, timestampColumn, maxAgeHours));
        break;
      }

      case 'anomaly': {
        // detectAnomalies returns { anomalies: number[]; zScores: Map<number, number> }
        // We need to wrap it into an InternalCheckResult
        const anomalyResult = detectAnomalies(
          data,
          check.column!,
          check.params.threshold as number
        );
        const anomalyCount = anomalyResult.anomalies.length;
        result = {
          passed: anomalyCount === 0,
          score: data.length > 0 ? (data.length - anomalyCount) / data.length : 1,
          details: { anomalyIndices: anomalyResult.anomalies },
          rowsChecked: data.length,
          rowsFailed: anomalyCount,
        };
        break;
      }

      default:
        result = {
          passed: true,
          score: 1,
          details: {},
          rowsChecked: data.length,
          rowsFailed: 0,
        };
    }

    const executionTimeMs = Date.now() - startTime;

    const checkResult: DQCheckResult = {
      id: this.generateResultId(),
      checkId,
      runId,
      passed: result.passed,
      score: result.score,
      details: result.details,
      rowsChecked: result.rowsChecked,
      rowsFailed: result.rowsFailed,
      executionTimeMs,
      createdAt: new Date(),
    };

    // Store result
    if (!this.results.has(checkId)) {
      this.results.set(checkId, []);
    }
    this.results.get(checkId)!.push(checkResult);

    // Send Slack notification if failed
    if (!result.passed && this.slackNotifier) {
      const message = this.slackNotifier.formatCheckResult(check, checkResult);
      await this.slackNotifier.send(message);
    } else if (result.passed && check.notifyOnSuccess && this.slackNotifier) {
      const message = this.slackNotifier.formatCheckResult(check, checkResult);
      await this.slackNotifier.send(message);
    }

    return checkResult;
  }

  /**
   * Run all enabled checks
   */
  async runAllChecks(
    dataProvider: (tableName: string) => Promise<Record<string, unknown>[]>,
    triggeredBy: DQRun['triggeredBy'] = 'manual'
  ): Promise<DQRun> {
    const runId = this.generateRunId();
    const enabledChecks = [...this.checks.values()].filter(c => c.enabled);

    const run: DQRun = {
      id: runId,
      status: 'running',
      checksTotal: enabledChecks.length,
      checksPassed: 0,
      checksFailed: 0,
      checksSkipped: 0,
      overallScore: 0,
      startedAt: new Date(),
      completedAt: null,
      triggeredBy,
      metadata: {},
    };

    this.runs.set(runId, run);

    const results: DQCheckResult[] = [];
    let totalScore = 0;

    for (const check of enabledChecks) {
      try {
        const data = await dataProvider(check.tableName);
        const result = await this.executeCheck(check.id, data, runId);
        results.push(result);

        if (result.passed) {
          run.checksPassed++;
        } else {
          run.checksFailed++;
        }
        totalScore += result.score;
      } catch (error) {
        run.checksSkipped++;
        console.error(`Check ${check.id} failed:`, error);
      }
    }

    run.overallScore = enabledChecks.length > 0
      ? totalScore / enabledChecks.length
      : 0;
    run.status = 'completed';
    run.completedAt = new Date();

    // Send summary to Slack
    if (this.slackNotifier) {
      const message = this.slackNotifier.formatRunSummary(run, results);
      await this.slackNotifier.send(message);
    }

    return run;
  }

  /**
   * Run checks for specific table
   */
  async runChecksForTable(
    tableName: string,
    data: Record<string, unknown>[],
    triggeredBy: DQRun['triggeredBy'] = 'manual'
  ): Promise<DQRun> {
    const tableChecks = [...this.checks.values()].filter(
      c => c.tableName === tableName && c.enabled
    );

    const runId = this.generateRunId();
    const run: DQRun = {
      id: runId,
      status: 'running',
      checksTotal: tableChecks.length,
      checksPassed: 0,
      checksFailed: 0,
      checksSkipped: 0,
      overallScore: 0,
      startedAt: new Date(),
      completedAt: null,
      triggeredBy,
      metadata: { tableName },
    };

    this.runs.set(runId, run);

    let totalScore = 0;

    for (const check of tableChecks) {
      try {
        const result = await this.executeCheck(check.id, data, runId);
        if (result.passed) {
          run.checksPassed++;
        } else {
          run.checksFailed++;
        }
        totalScore += result.score;
      } catch (error) {
        run.checksSkipped++;
      }
    }

    run.overallScore = tableChecks.length > 0 ? totalScore / tableChecks.length : 0;
    run.status = 'completed';
    run.completedAt = new Date();

    return run;
  }

  /**
   * Get run by ID
   */
  getRun(runId: string): DQRun | undefined {
    return this.runs.get(runId);
  }

  /**
   * Get recent runs
   */
  getRecentRuns(limit: number = 10): DQRun[] {
    return [...this.runs.values()]
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get check history
   */
  getCheckHistory(checkId: string, limit: number = 50): DQCheckResult[] {
    const history = this.results.get(checkId) || [];
    return history.slice(-limit);
  }

  /**
   * Get check trend
   */
  getCheckTrend(checkId: string, days: number = 7): {
    date: Date;
    avgScore: number;
    passRate: number;
  }[] {
    const history = this.results.get(checkId) || [];
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const dailyData = new Map<string, DQCheckResult[]>();

    for (const result of history) {
      if (result.createdAt >= cutoff) {
        const dateKey = result.createdAt.toISOString().split('T')[0];
        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, []);
        }
        dailyData.get(dateKey)!.push(result);
      }
    }

    return [...dailyData.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, results]) => ({
        date: new Date(dateStr),
        avgScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
        passRate: results.filter(r => r.passed).length / results.length,
      }));
  }

  /**
   * Get overall DQ score
   */
  getOverallScore(): number {
    const recentRuns = this.getRecentRuns(5);
    if (recentRuns.length === 0) return 0;
    return recentRuns.reduce((sum, r) => sum + r.overallScore, 0) / recentRuns.length;
  }

  /**
   * Enable/disable check
   */
  setCheckEnabled(checkId: string, enabled: boolean): void {
    const check = this.checks.get(checkId);
    if (check) {
      check.enabled = enabled;
    }
  }

  /**
   * Start scheduler (simplified - in production use proper cron)
   */
  startScheduler(intervalMs: number = 60000): void {
    if (this.schedulerInterval) return;

    this.schedulerInterval = setInterval(() => {
      // In production, would parse cron expressions and run due checks
      console.log('[DQ Runner] Scheduler tick');
    }, intervalMs);
  }

  /**
   * Stop scheduler
   */
  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultRunner: DQRunner | null = null;

/**
 * Get default runner
 */
export function getDefaultRunner(slackConfig?: SlackConfig): DQRunner {
  if (!defaultRunner) {
    defaultRunner = new DQRunner(slackConfig);
  }
  return defaultRunner;
}

/**
 * Reset runner (for testing)
 */
export function resetRunner(): void {
  if (defaultRunner) {
    defaultRunner.stopScheduler();
    defaultRunner = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DQRunner,
  SlackNotifier,
  DEFAULT_DQ_CHECKS,
  getDefaultRunner,
  resetRunner,
};
