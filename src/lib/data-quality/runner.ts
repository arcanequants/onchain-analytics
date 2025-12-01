/**
 * Data Quality Runner
 *
 * Executes rules in batches and manages check results
 *
 * Phase 3, Week 10, Day 1
 */

import type {
  DataQualityRule,
  RuleCheckResult,
  RuleCheckBatch,
  BatchSummary,
  CheckResult,
  RuleCategory,
  RuleSeverity,
  DataQualityConfig,
  DataQualityAlert,
} from './types';
import { DEFAULT_DQ_CONFIG } from './types';
import { executeRule, type RuleExecutionContext } from './rules';

// ================================================================
// RUNNER TYPES
// ================================================================

export interface DataProvider {
  /** Fetch data for a table */
  fetchTableData(table: string, limit?: number): Promise<Record<string, unknown>[]>;
}

export interface ResultStore {
  /** Store a batch result */
  storeBatchResult(batch: RuleCheckBatch): Promise<void>;
  /** Store individual check result */
  storeCheckResult(result: RuleCheckResult): Promise<void>;
  /** Get recent results */
  getRecentResults(limit?: number): Promise<RuleCheckResult[]>;
  /** Get results for a rule */
  getRuleResults(ruleId: string, limit?: number): Promise<RuleCheckResult[]>;
}

export interface AlertHandler {
  /** Send an alert */
  sendAlert(alert: DataQualityAlert): Promise<void>;
}

export interface RunnerOptions {
  /** Configuration */
  config?: Partial<DataQualityConfig>;
  /** Data provider */
  dataProvider: DataProvider;
  /** Result store */
  resultStore?: ResultStore;
  /** Alert handler */
  alertHandler?: AlertHandler;
  /** Rules to execute */
  rules: DataQualityRule[];
}

// ================================================================
// RUNNER CLASS
// ================================================================

export class DataQualityRunner {
  private config: DataQualityConfig;
  private dataProvider: DataProvider;
  private resultStore?: ResultStore;
  private alertHandler?: AlertHandler;
  private rules: DataQualityRule[];
  private isRunning: boolean = false;
  private lastRunTime?: Date;
  private intervalHandle?: ReturnType<typeof setInterval>;

  constructor(options: RunnerOptions) {
    this.config = { ...DEFAULT_DQ_CONFIG, ...options.config };
    this.dataProvider = options.dataProvider;
    this.resultStore = options.resultStore;
    this.alertHandler = options.alertHandler;
    this.rules = options.rules;
  }

  /**
   * Add a rule to the runner
   */
  addRule(rule: DataQualityRule): void {
    // Check for duplicates
    const existing = this.rules.find((r) => r.id === rule.id);
    if (existing) {
      throw new Error(`Rule with ID ${rule.id} already exists`);
    }
    this.rules.push(rule);
  }

  /**
   * Remove a rule from the runner
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all rules
   */
  getRules(): DataQualityRule[] {
    return [...this.rules];
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: RuleCategory): DataQualityRule[] {
    return this.rules.filter((r) => r.category === category);
  }

  /**
   * Get rules by severity
   */
  getRulesBySeverity(severity: RuleSeverity): DataQualityRule[] {
    return this.rules.filter((r) => r.severity === severity);
  }

  /**
   * Get rules for a table
   */
  getRulesForTable(table: string): DataQualityRule[] {
    return this.rules.filter((r) => r.tables.includes(table));
  }

  /**
   * Execute a single rule
   */
  async executeRule(ruleId: string): Promise<RuleCheckResult> {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    const table = rule.tables[0];
    const data = await this.dataProvider.fetchTableData(table);

    const context: RuleExecutionContext = {
      data,
      timestamp: new Date(),
      maxSamples: this.config.maxFailingSamples,
    };

    const result = executeRule(rule, context);

    // Store result if store is available
    if (this.resultStore) {
      await this.resultStore.storeCheckResult(result);
    }

    // Generate alerts for failures
    await this.handleResult(rule, result);

    return result;
  }

  /**
   * Execute all rules (batch)
   */
  async executeAll(): Promise<RuleCheckBatch> {
    if (!this.config.enabled) {
      return this.createSkippedBatch('Data quality checks are disabled');
    }

    this.isRunning = true;
    const startedAt = new Date();
    const results: RuleCheckResult[] = [];

    try {
      // Group rules by table to minimize data fetches
      const rulesByTable = this.groupRulesByTable();

      // Execute rules for each table
      for (const [table, tableRules] of rulesByTable) {
        const data = await this.dataProvider.fetchTableData(table);

        const context: RuleExecutionContext = {
          data,
          timestamp: new Date(),
          maxSamples: this.config.maxFailingSamples,
        };

        for (const rule of tableRules) {
          const result = executeRule(rule, context);
          results.push(result);

          // Store individual result
          if (this.resultStore) {
            await this.resultStore.storeCheckResult(result);
          }

          // Handle alerts
          await this.handleResult(rule, result);
        }
      }

      const batch = this.createBatch(results, startedAt);

      // Store batch result
      if (this.resultStore) {
        await this.resultStore.storeBatchResult(batch);
      }

      this.lastRunTime = new Date();
      return batch;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Execute rules for a specific table
   */
  async executeForTable(table: string): Promise<RuleCheckBatch> {
    const tableRules = this.getRulesForTable(table);
    if (tableRules.length === 0) {
      return this.createSkippedBatch(`No rules found for table: ${table}`);
    }

    const startedAt = new Date();
    const data = await this.dataProvider.fetchTableData(table);
    const results: RuleCheckResult[] = [];

    const context: RuleExecutionContext = {
      data,
      timestamp: new Date(),
      maxSamples: this.config.maxFailingSamples,
    };

    for (const rule of tableRules) {
      const result = executeRule(rule, context);
      results.push(result);
      await this.handleResult(rule, result);
    }

    return this.createBatch(results, startedAt);
  }

  /**
   * Start scheduled execution
   */
  start(): void {
    if (this.intervalHandle) {
      return; // Already running
    }

    const intervalMs = this.config.checkIntervalMinutes * 60 * 1000;
    this.intervalHandle = setInterval(() => {
      this.executeAll().catch(console.error);
    }, intervalMs);

    // Run immediately on start
    this.executeAll().catch(console.error);
  }

  /**
   * Stop scheduled execution
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
  }

  /**
   * Check if runner is currently executing
   */
  isExecuting(): boolean {
    return this.isRunning;
  }

  /**
   * Get last run time
   */
  getLastRunTime(): Date | undefined {
    return this.lastRunTime;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DataQualityConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart if interval changed
    if (config.checkIntervalMinutes !== undefined && this.intervalHandle) {
      this.stop();
      this.start();
    }
  }

  // ================================================================
  // PRIVATE METHODS
  // ================================================================

  private groupRulesByTable(): Map<string, DataQualityRule[]> {
    const grouped = new Map<string, DataQualityRule[]>();

    for (const rule of this.rules) {
      if (rule.status !== 'active') continue;

      for (const table of rule.tables) {
        if (!grouped.has(table)) {
          grouped.set(table, []);
        }
        grouped.get(table)!.push(rule);
      }
    }

    return grouped;
  }

  private createBatch(results: RuleCheckResult[], startedAt: Date): RuleCheckBatch {
    const completedAt = new Date();
    const summary = this.calculateSummary(results);

    return {
      batchId: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      rules: this.rules.filter((r) => results.some((res) => res.ruleId === r.id)),
      results,
      overallStatus: this.determineOverallStatus(results),
      totalDurationMs: completedAt.getTime() - startedAt.getTime(),
      startedAt,
      completedAt,
      summary,
    };
  }

  private createSkippedBatch(reason: string): RuleCheckBatch {
    const now = new Date();
    return {
      batchId: `batch_skipped_${Date.now()}`,
      rules: [],
      results: [],
      overallStatus: 'skipped',
      totalDurationMs: 0,
      startedAt: now,
      completedAt: now,
      summary: {
        totalRules: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        errors: 0,
        skipped: 0,
        bySeverity: {} as BatchSummary['bySeverity'],
        byCategory: {} as BatchSummary['byCategory'],
      },
    };
  }

  private calculateSummary(results: RuleCheckResult[]): BatchSummary {
    const bySeverity: BatchSummary['bySeverity'] = {
      critical: { total: 0, passed: 0, failed: 0 },
      high: { total: 0, passed: 0, failed: 0 },
      medium: { total: 0, passed: 0, failed: 0 },
      low: { total: 0, passed: 0, failed: 0 },
      info: { total: 0, passed: 0, failed: 0 },
    };

    const byCategory: BatchSummary['byCategory'] = {
      completeness: { total: 0, passed: 0, failed: 0 },
      validity: { total: 0, passed: 0, failed: 0 },
      consistency: { total: 0, passed: 0, failed: 0 },
      accuracy: { total: 0, passed: 0, failed: 0 },
      uniqueness: { total: 0, passed: 0, failed: 0 },
      timeliness: { total: 0, passed: 0, failed: 0 },
      referential: { total: 0, passed: 0, failed: 0 },
      custom: { total: 0, passed: 0, failed: 0 },
    };

    let passed = 0;
    let failed = 0;
    let warnings = 0;
    let errors = 0;
    let skipped = 0;

    for (const result of results) {
      const rule = this.rules.find((r) => r.id === result.ruleId);
      if (!rule) continue;

      // Count by status
      switch (result.status) {
        case 'pass':
          passed++;
          break;
        case 'fail':
          failed++;
          break;
        case 'warning':
          warnings++;
          break;
        case 'error':
          errors++;
          break;
        case 'skipped':
          skipped++;
          break;
      }

      // Update severity stats
      const severityStats = bySeverity[rule.severity];
      if (severityStats) {
        severityStats.total++;
        if (result.status === 'pass') severityStats.passed++;
        if (result.status === 'fail') severityStats.failed++;
      }

      // Update category stats
      const categoryStats = byCategory[rule.category];
      if (categoryStats) {
        categoryStats.total++;
        if (result.status === 'pass') categoryStats.passed++;
        if (result.status === 'fail') categoryStats.failed++;
      }
    }

    return {
      totalRules: results.length,
      passed,
      failed,
      warnings,
      errors,
      skipped,
      bySeverity,
      byCategory,
    };
  }

  private determineOverallStatus(results: RuleCheckResult[]): CheckResult {
    if (results.length === 0) return 'skipped';

    // Any error -> error
    if (results.some((r) => r.status === 'error')) return 'error';

    // Any critical/high failure -> fail
    const criticalFailures = results.filter((r) => {
      const rule = this.rules.find((rule) => rule.id === r.ruleId);
      return (
        r.status === 'fail' &&
        rule &&
        (rule.severity === 'critical' || rule.severity === 'high')
      );
    });
    if (criticalFailures.length > 0) return 'fail';

    // Any warning -> warning
    if (results.some((r) => r.status === 'warning')) return 'warning';

    // Any failure -> fail (lower severity)
    if (results.some((r) => r.status === 'fail')) return 'fail';

    // All passed
    return 'pass';
  }

  private async handleResult(rule: DataQualityRule, result: RuleCheckResult): Promise<void> {
    if (!this.alertHandler) return;

    // Only alert on failures and warnings
    if (result.status !== 'fail' && result.status !== 'warning') return;

    // Check severity threshold
    const severityOrder: RuleSeverity[] = ['info', 'low', 'medium', 'high', 'critical'];
    const minSeverityIndex = severityOrder.indexOf(
      this.config.alertChannels[0]?.minSeverity || 'low'
    );
    const ruleSeverityIndex = severityOrder.indexOf(rule.severity);

    if (ruleSeverityIndex < minSeverityIndex) return;

    const alert: DataQualityAlert = {
      id: `alert_${rule.id}_${Date.now()}`,
      type: 'rule_failure',
      severity: rule.severity,
      title: `Data Quality Check Failed: ${rule.name}`,
      message: `Rule "${rule.name}" ${result.status}. Pass rate: ${result.passRate.toFixed(1)}% (${result.failingRecords} failures out of ${result.totalRecords} records)`,
      ruleId: rule.id,
      checkResult: result,
      createdAt: new Date(),
      acknowledged: false,
    };

    await this.alertHandler.sendAlert(alert);
  }
}

// ================================================================
// FACTORY FUNCTION
// ================================================================

/**
 * Create a data quality runner
 */
export function createRunner(options: RunnerOptions): DataQualityRunner {
  return new DataQualityRunner(options);
}

// ================================================================
// IN-MEMORY STORES (for testing/development)
// ================================================================

/**
 * Create an in-memory data provider
 */
export function createInMemoryDataProvider(
  data: Record<string, Record<string, unknown>[]>
): DataProvider {
  return {
    async fetchTableData(table: string, limit?: number) {
      const tableData = data[table] || [];
      return limit ? tableData.slice(0, limit) : tableData;
    },
  };
}

/**
 * Create an in-memory result store
 */
export function createInMemoryResultStore(): ResultStore & {
  getBatches(): RuleCheckBatch[];
  getResults(): RuleCheckResult[];
  clear(): void;
} {
  const batches: RuleCheckBatch[] = [];
  const results: RuleCheckResult[] = [];

  return {
    async storeBatchResult(batch: RuleCheckBatch) {
      batches.push(batch);
    },
    async storeCheckResult(result: RuleCheckResult) {
      results.push(result);
    },
    async getRecentResults(limit = 100) {
      return results.slice(-limit);
    },
    async getRuleResults(ruleId: string, limit = 100) {
      return results.filter((r) => r.ruleId === ruleId).slice(-limit);
    },
    getBatches() {
      return batches;
    },
    getResults() {
      return results;
    },
    clear() {
      batches.length = 0;
      results.length = 0;
    },
  };
}

/**
 * Create an in-memory alert handler
 */
export function createInMemoryAlertHandler(): AlertHandler & {
  getAlerts(): DataQualityAlert[];
  clear(): void;
} {
  const alerts: DataQualityAlert[] = [];

  return {
    async sendAlert(alert: DataQualityAlert) {
      alerts.push(alert);
    },
    getAlerts() {
      return alerts;
    },
    clear() {
      alerts.length = 0;
    },
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  DataQualityRunner,
  createRunner,
  createInMemoryDataProvider,
  createInMemoryResultStore,
  createInMemoryAlertHandler,
};
