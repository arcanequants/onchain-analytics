/**
 * Data Observability & Freshness SLA Module
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Data observability dashboard
 * - Freshness SLA monitoring
 * - Data volume tracking
 * - Anomaly detection
 * - Pipeline health metrics
 * - Alert management
 * - Historical trends
 */

// ============================================================================
// TYPES
// ============================================================================

export type MetricType =
  | 'freshness'
  | 'volume'
  | 'completeness'
  | 'accuracy'
  | 'uniqueness'
  | 'schema_compliance';

export type SLAStatus = 'met' | 'at_risk' | 'breached';

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export type AlertState = 'open' | 'acknowledged' | 'resolved' | 'silenced';

export type TrendDirection = 'up' | 'down' | 'stable';

export interface FreshnessSLA {
  id: string;
  tableName: string;
  maxStalenessSeconds: number;
  warningThresholdPercent: number; // e.g., 80% of max = warning
  timestampColumn: string;
  enabled: boolean;
  schedule: string; // cron expression
  notifyOnBreach: boolean;
  notifyChannels: string[];
}

export interface FreshnessCheck {
  id: string;
  slaId: string;
  tableName: string;
  checkedAt: Date;
  lastDataTimestamp: Date | null;
  stalenessSeconds: number;
  status: SLAStatus;
  percentOfSLA: number;
}

export interface VolumeMetric {
  tableName: string;
  timestamp: Date;
  rowCount: number;
  sizeBytes: number;
  insertedRows: number;
  updatedRows: number;
  deletedRows: number;
}

export interface DataQualityScore {
  tableName: string;
  timestamp: Date;
  overall: number; // 0-100
  dimensions: {
    freshness: number;
    completeness: number;
    accuracy: number;
    uniqueness: number;
  };
}

export interface Anomaly {
  id: string;
  tableName: string;
  metricType: MetricType;
  detectedAt: Date;
  expectedValue: number;
  actualValue: number;
  deviationPercent: number;
  severity: AlertPriority;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface PipelineHealth {
  pipelineId: string;
  lastRunAt: Date | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  successRate: number; // 0-100
  avgDurationMs: number;
  lastStatus: 'success' | 'failure' | 'running' | 'unknown';
  errorsLast24h: number;
}

export interface ObservabilityAlert {
  id: string;
  type: MetricType;
  priority: AlertPriority;
  state: AlertState;
  title: string;
  message: string;
  tableName?: string;
  pipelineId?: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  metadata: Record<string, unknown>;
}

export interface DashboardSummary {
  timestamp: Date;
  overallHealth: number; // 0-100
  tablesMonitored: number;
  pipelinesMonitored: number;
  slas: {
    total: number;
    met: number;
    atRisk: number;
    breached: number;
  };
  alerts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  freshness: {
    averageStalenessSeconds: number;
    oldestTableSeconds: number;
    oldestTableName: string;
  };
  volume: {
    totalRows: number;
    totalSizeBytes: number;
    rowsLast24h: number;
  };
}

export interface Trend {
  tableName: string;
  metricType: MetricType;
  direction: TrendDirection;
  changePercent: number;
  period: string; // e.g., '24h', '7d'
  dataPoints: { timestamp: Date; value: number }[];
}

// ============================================================================
// FRESHNESS SLA MANAGER
// ============================================================================

export class FreshnessSLAManager {
  private slas: Map<string, FreshnessSLA> = new Map();
  private checks: FreshnessCheck[] = [];

  /**
   * Register SLA
   */
  registerSLA(sla: FreshnessSLA): void {
    this.slas.set(sla.id, sla);
  }

  /**
   * Get SLA by ID
   */
  getSLA(id: string): FreshnessSLA | undefined {
    return this.slas.get(id);
  }

  /**
   * Get all SLAs
   */
  getAllSLAs(): FreshnessSLA[] {
    return Array.from(this.slas.values());
  }

  /**
   * Check freshness for a table
   */
  checkFreshness(slaId: string, lastDataTimestamp: Date | null): FreshnessCheck {
    const sla = this.slas.get(slaId);
    if (!sla) {
      throw new Error(`SLA not found: ${slaId}`);
    }

    const now = new Date();
    const stalenessSeconds = lastDataTimestamp
      ? (now.getTime() - lastDataTimestamp.getTime()) / 1000
      : Infinity;

    const percentOfSLA = (stalenessSeconds / sla.maxStalenessSeconds) * 100;

    let status: SLAStatus = 'met';
    if (stalenessSeconds > sla.maxStalenessSeconds) {
      status = 'breached';
    } else if (percentOfSLA >= sla.warningThresholdPercent) {
      status = 'at_risk';
    }

    const check: FreshnessCheck = {
      id: `fc_${slaId}_${Date.now()}`,
      slaId,
      tableName: sla.tableName,
      checkedAt: now,
      lastDataTimestamp,
      stalenessSeconds: Math.round(stalenessSeconds),
      status,
      percentOfSLA: Math.round(percentOfSLA * 100) / 100,
    };

    this.checks.push(check);
    return check;
  }

  /**
   * Get latest check for SLA
   */
  getLatestCheck(slaId: string): FreshnessCheck | null {
    const slaChecks = this.checks
      .filter((c) => c.slaId === slaId)
      .sort((a, b) => b.checkedAt.getTime() - a.checkedAt.getTime());

    return slaChecks[0] || null;
  }

  /**
   * Get SLA status summary
   */
  getStatusSummary(): { met: number; atRisk: number; breached: number } {
    const summary = { met: 0, atRisk: 0, breached: 0 };

    for (const sla of this.slas.values()) {
      const latestCheck = this.getLatestCheck(sla.id);
      if (!latestCheck) continue;

      switch (latestCheck.status) {
        case 'met':
          summary.met++;
          break;
        case 'at_risk':
          summary.atRisk++;
          break;
        case 'breached':
          summary.breached++;
          break;
      }
    }

    return summary;
  }

  /**
   * Generate SQL for freshness check
   */
  generateCheckSQL(sla: FreshnessSLA): string {
    return `
-- Freshness check for ${sla.tableName}
SELECT
    '${sla.tableName}' as table_name,
    MAX(${sla.timestampColumn}) as last_data_timestamp,
    EXTRACT(EPOCH FROM (NOW() - MAX(${sla.timestampColumn}))) as staleness_seconds,
    CASE
        WHEN EXTRACT(EPOCH FROM (NOW() - MAX(${sla.timestampColumn}))) > ${sla.maxStalenessSeconds}
            THEN 'breached'
        WHEN EXTRACT(EPOCH FROM (NOW() - MAX(${sla.timestampColumn}))) > ${sla.maxStalenessSeconds * (sla.warningThresholdPercent / 100)}
            THEN 'at_risk'
        ELSE 'met'
    END as status
FROM ${sla.tableName};
`.trim();
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.slas.clear();
    this.checks = [];
  }
}

// ============================================================================
// VOLUME TRACKER
// ============================================================================

export class VolumeTracker {
  private metrics: VolumeMetric[] = [];

  /**
   * Record volume metric
   */
  record(metric: Omit<VolumeMetric, 'timestamp'>): VolumeMetric {
    const fullMetric: VolumeMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);
    return fullMetric;
  }

  /**
   * Get metrics for table
   */
  getMetrics(tableName: string, limit: number = 24): VolumeMetric[] {
    return this.metrics
      .filter((m) => m.tableName === tableName)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(): Map<string, VolumeMetric> {
    const latest = new Map<string, VolumeMetric>();

    for (const metric of this.metrics) {
      const existing = latest.get(metric.tableName);
      if (!existing || metric.timestamp > existing.timestamp) {
        latest.set(metric.tableName, metric);
      }
    }

    return latest;
  }

  /**
   * Calculate trend
   */
  calculateTrend(tableName: string, periodHours: number = 24): Trend {
    const cutoff = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    const periodMetrics = this.metrics
      .filter((m) => m.tableName === tableName && m.timestamp >= cutoff)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (periodMetrics.length < 2) {
      return {
        tableName,
        metricType: 'volume',
        direction: 'stable',
        changePercent: 0,
        period: `${periodHours}h`,
        dataPoints: periodMetrics.map((m) => ({
          timestamp: m.timestamp,
          value: m.rowCount,
        })),
      };
    }

    const first = periodMetrics[0].rowCount;
    const last = periodMetrics[periodMetrics.length - 1].rowCount;
    const changePercent = first === 0 ? 100 : ((last - first) / first) * 100;

    let direction: TrendDirection = 'stable';
    if (changePercent > 5) direction = 'up';
    else if (changePercent < -5) direction = 'down';

    return {
      tableName,
      metricType: 'volume',
      direction,
      changePercent: Math.round(changePercent * 100) / 100,
      period: `${periodHours}h`,
      dataPoints: periodMetrics.map((m) => ({
        timestamp: m.timestamp,
        value: m.rowCount,
      })),
    };
  }

  /**
   * Generate SQL for volume tracking
   */
  generateTrackingSQL(tableName: string): string {
    return `
-- Volume tracking for ${tableName}
INSERT INTO data_volume_metrics (
    table_name,
    row_count,
    size_bytes,
    inserted_rows,
    updated_rows,
    deleted_rows,
    timestamp
)
SELECT
    '${tableName}' as table_name,
    (SELECT COUNT(*) FROM ${tableName}) as row_count,
    pg_total_relation_size('${tableName}') as size_bytes,
    (SELECT COUNT(*) FROM ${tableName} WHERE created_at > NOW() - INTERVAL '1 hour') as inserted_rows,
    (SELECT COUNT(*) FROM ${tableName} WHERE updated_at > created_at AND updated_at > NOW() - INTERVAL '1 hour') as updated_rows,
    0 as deleted_rows, -- Requires audit log
    NOW() as timestamp;
`.trim();
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.metrics = [];
  }
}

// ============================================================================
// ANOMALY DETECTOR
// ============================================================================

export class AnomalyDetector {
  private anomalies: Anomaly[] = [];
  private thresholds: Map<string, number> = new Map(); // tableName:metricType -> threshold %

  /**
   * Set threshold for anomaly detection
   */
  setThreshold(tableName: string, metricType: MetricType, thresholdPercent: number): void {
    this.thresholds.set(`${tableName}:${metricType}`, thresholdPercent);
  }

  /**
   * Get threshold
   */
  getThreshold(tableName: string, metricType: MetricType): number {
    return this.thresholds.get(`${tableName}:${metricType}`) || 50; // Default 50%
  }

  /**
   * Check for anomaly
   */
  checkAnomaly(
    tableName: string,
    metricType: MetricType,
    expectedValue: number,
    actualValue: number
  ): Anomaly | null {
    const threshold = this.getThreshold(tableName, metricType);
    const deviationPercent = expectedValue === 0
      ? (actualValue === 0 ? 0 : 100)
      : Math.abs((actualValue - expectedValue) / expectedValue) * 100;

    if (deviationPercent < threshold) {
      return null; // No anomaly
    }

    // Determine severity
    let severity: AlertPriority = 'low';
    if (deviationPercent >= threshold * 3) severity = 'critical';
    else if (deviationPercent >= threshold * 2) severity = 'high';
    else if (deviationPercent >= threshold * 1.5) severity = 'medium';

    const anomaly: Anomaly = {
      id: `anom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tableName,
      metricType,
      detectedAt: new Date(),
      expectedValue,
      actualValue,
      deviationPercent: Math.round(deviationPercent * 100) / 100,
      severity,
      resolved: false,
    };

    this.anomalies.push(anomaly);
    return anomaly;
  }

  /**
   * Get active anomalies
   */
  getActiveAnomalies(): Anomaly[] {
    return this.anomalies.filter((a) => !a.resolved);
  }

  /**
   * Resolve anomaly
   */
  resolveAnomaly(id: string): boolean {
    const anomaly = this.anomalies.find((a) => a.id === id);
    if (!anomaly) return false;

    anomaly.resolved = true;
    anomaly.resolvedAt = new Date();
    return true;
  }

  /**
   * Get anomaly summary
   */
  getSummary(): {
    total: number;
    active: number;
    bySeverity: Record<AlertPriority, number>;
    byMetricType: Record<MetricType, number>;
  } {
    const active = this.anomalies.filter((a) => !a.resolved);

    const bySeverity: Record<AlertPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const byMetricType: Partial<Record<MetricType, number>> = {};

    for (const anomaly of active) {
      bySeverity[anomaly.severity]++;
      byMetricType[anomaly.metricType] = (byMetricType[anomaly.metricType] || 0) + 1;
    }

    return {
      total: this.anomalies.length,
      active: active.length,
      bySeverity,
      byMetricType: byMetricType as Record<MetricType, number>,
    };
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.anomalies = [];
    this.thresholds.clear();
  }
}

// ============================================================================
// ALERT MANAGER
// ============================================================================

export class ObservabilityAlertManager {
  private alerts: ObservabilityAlert[] = [];

  /**
   * Create alert
   */
  createAlert(
    type: MetricType,
    priority: AlertPriority,
    title: string,
    message: string,
    metadata: Record<string, unknown> = {}
  ): ObservabilityAlert {
    const alert: ObservabilityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority,
      state: 'open',
      title,
      message,
      tableName: metadata.tableName as string | undefined,
      pipelineId: metadata.pipelineId as string | undefined,
      createdAt: new Date(),
      metadata,
    };

    this.alerts.push(alert);
    return alert;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(id: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert || alert.state !== 'open') return false;

    alert.state = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(id: string, resolvedBy: string): boolean {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert || alert.state === 'resolved') return false;

    alert.state = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    return true;
  }

  /**
   * Silence alert
   */
  silenceAlert(id: string): boolean {
    const alert = this.alerts.find((a) => a.id === id);
    if (!alert) return false;

    alert.state = 'silenced';
    return true;
  }

  /**
   * Get open alerts
   */
  getOpenAlerts(): ObservabilityAlert[] {
    return this.alerts.filter((a) => a.state === 'open');
  }

  /**
   * Get alerts by priority
   */
  getAlertsByPriority(priority: AlertPriority): ObservabilityAlert[] {
    return this.alerts.filter((a) => a.priority === priority && a.state === 'open');
  }

  /**
   * Get alert summary
   */
  getSummary(): Record<AlertPriority, number> {
    const summary: Record<AlertPriority, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const alert of this.getOpenAlerts()) {
      summary[alert.priority]++;
    }

    return summary;
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.alerts = [];
  }
}

// ============================================================================
// DATA OBSERVABILITY DASHBOARD
// ============================================================================

export class DataObservabilityDashboard {
  private freshnessManager: FreshnessSLAManager;
  private volumeTracker: VolumeTracker;
  private anomalyDetector: AnomalyDetector;
  private alertManager: ObservabilityAlertManager;
  private pipelineHealth: Map<string, PipelineHealth> = new Map();

  constructor(
    freshnessManager?: FreshnessSLAManager,
    volumeTracker?: VolumeTracker,
    anomalyDetector?: AnomalyDetector,
    alertManager?: ObservabilityAlertManager
  ) {
    this.freshnessManager = freshnessManager || new FreshnessSLAManager();
    this.volumeTracker = volumeTracker || new VolumeTracker();
    this.anomalyDetector = anomalyDetector || new AnomalyDetector();
    this.alertManager = alertManager || new ObservabilityAlertManager();
  }

  /**
   * Register freshness SLA
   */
  registerFreshnessSLA(sla: FreshnessSLA): void {
    this.freshnessManager.registerSLA(sla);
  }

  /**
   * Check freshness
   */
  checkFreshness(slaId: string, lastDataTimestamp: Date | null): FreshnessCheck {
    const check = this.freshnessManager.checkFreshness(slaId, lastDataTimestamp);

    // Create alert if breached
    if (check.status === 'breached') {
      this.alertManager.createAlert(
        'freshness',
        'high',
        `Freshness SLA Breached: ${check.tableName}`,
        `Table ${check.tableName} is ${check.stalenessSeconds} seconds stale (SLA: ${this.freshnessManager.getSLA(slaId)?.maxStalenessSeconds}s)`,
        { tableName: check.tableName, slaId, stalenessSeconds: check.stalenessSeconds }
      );
    }

    return check;
  }

  /**
   * Record volume
   */
  recordVolume(metric: Omit<VolumeMetric, 'timestamp'>): VolumeMetric {
    const recorded = this.volumeTracker.record(metric);

    // Check for volume anomaly
    const trend = this.volumeTracker.calculateTrend(metric.tableName);
    if (trend.dataPoints.length >= 2) {
      const avgVolume = trend.dataPoints.reduce((sum, dp) => sum + dp.value, 0) / trend.dataPoints.length;
      this.anomalyDetector.checkAnomaly(
        metric.tableName,
        'volume',
        avgVolume,
        metric.rowCount
      );
    }

    return recorded;
  }

  /**
   * Update pipeline health
   */
  updatePipelineHealth(health: PipelineHealth): void {
    this.pipelineHealth.set(health.pipelineId, health);

    // Create alert if pipeline has issues
    if (health.lastStatus === 'failure') {
      this.alertManager.createAlert(
        'completeness',
        'high',
        `Pipeline Failed: ${health.pipelineId}`,
        `Pipeline ${health.pipelineId} failed. Success rate: ${health.successRate}%`,
        { pipelineId: health.pipelineId, successRate: health.successRate }
      );
    }
  }

  /**
   * Get dashboard summary
   */
  getSummary(): DashboardSummary {
    const slaSummary = this.freshnessManager.getStatusSummary();
    const alertSummary = this.alertManager.getSummary();
    const latestVolumes = this.volumeTracker.getLatestMetrics();

    // Calculate freshness stats
    let totalStaleness = 0;
    let oldestStaleness = 0;
    let oldestTable = '';

    for (const sla of this.freshnessManager.getAllSLAs()) {
      const check = this.freshnessManager.getLatestCheck(sla.id);
      if (check) {
        totalStaleness += check.stalenessSeconds;
        if (check.stalenessSeconds > oldestStaleness) {
          oldestStaleness = check.stalenessSeconds;
          oldestTable = check.tableName;
        }
      }
    }

    const slaCount = this.freshnessManager.getAllSLAs().length;
    const avgStaleness = slaCount > 0 ? totalStaleness / slaCount : 0;

    // Calculate volume stats
    let totalRows = 0;
    let totalSize = 0;
    for (const metric of latestVolumes.values()) {
      totalRows += metric.rowCount;
      totalSize += metric.sizeBytes;
    }

    // Calculate overall health
    const totalSLAs = slaSummary.met + slaSummary.atRisk + slaSummary.breached;
    const slaHealth = totalSLAs > 0 ? (slaSummary.met / totalSLAs) * 100 : 100;
    const alertPenalty = (alertSummary.critical * 20) + (alertSummary.high * 10) + (alertSummary.medium * 5);
    const overallHealth = Math.max(0, Math.round(slaHealth - alertPenalty));

    return {
      timestamp: new Date(),
      overallHealth,
      tablesMonitored: latestVolumes.size,
      pipelinesMonitored: this.pipelineHealth.size,
      slas: {
        total: totalSLAs,
        met: slaSummary.met,
        atRisk: slaSummary.atRisk,
        breached: slaSummary.breached,
      },
      alerts: {
        total: Object.values(alertSummary).reduce((a, b) => a + b, 0),
        ...alertSummary,
      },
      freshness: {
        averageStalenessSeconds: Math.round(avgStaleness),
        oldestTableSeconds: Math.round(oldestStaleness),
        oldestTableName: oldestTable,
      },
      volume: {
        totalRows,
        totalSizeBytes: totalSize,
        rowsLast24h: 0, // Would need historical data
      },
    };
  }

  /**
   * Generate dashboard markdown
   */
  generateMarkdown(): string {
    const summary = this.getSummary();
    const lines: string[] = [
      '# Data Observability Dashboard',
      '',
      `**Generated:** ${summary.timestamp.toISOString()}`,
      '',
      '## Overall Health',
      '',
      `**Health Score:** ${summary.overallHealth}% ${this.getHealthEmoji(summary.overallHealth)}`,
      `**Tables Monitored:** ${summary.tablesMonitored}`,
      `**Pipelines Monitored:** ${summary.pipelinesMonitored}`,
      '',
      '## SLA Status',
      '',
      `| Status | Count |`,
      `|--------|-------|`,
      `| ✅ Met | ${summary.slas.met} |`,
      `| ⚠️ At Risk | ${summary.slas.atRisk} |`,
      `| ❌ Breached | ${summary.slas.breached} |`,
      '',
      '## Alerts',
      '',
      `| Priority | Count |`,
      `|----------|-------|`,
      `| 🔴 Critical | ${summary.alerts.critical} |`,
      `| 🟠 High | ${summary.alerts.high} |`,
      `| 🟡 Medium | ${summary.alerts.medium} |`,
      `| 🟢 Low | ${summary.alerts.low} |`,
      '',
      '## Freshness',
      '',
      `- **Average Staleness:** ${this.formatDuration(summary.freshness.averageStalenessSeconds)}`,
      `- **Oldest Table:** ${summary.freshness.oldestTableName || 'N/A'} (${this.formatDuration(summary.freshness.oldestTableSeconds)})`,
      '',
      '## Volume',
      '',
      `- **Total Rows:** ${this.formatNumber(summary.volume.totalRows)}`,
      `- **Total Size:** ${this.formatBytes(summary.volume.totalSizeBytes)}`,
      '',
    ];

    return lines.join('\n');
  }

  private getHealthEmoji(health: number): string {
    if (health >= 90) return '🟢';
    if (health >= 70) return '🟡';
    if (health >= 50) return '🟠';
    return '🔴';
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86400)}d`;
  }

  private formatNumber(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
    return `${bytes} B`;
  }

  /**
   * Get managers for direct access
   */
  getFreshnessManager(): FreshnessSLAManager {
    return this.freshnessManager;
  }

  getVolumeTracker(): VolumeTracker {
    return this.volumeTracker;
  }

  getAnomalyDetector(): AnomalyDetector {
    return this.anomalyDetector;
  }

  getAlertManager(): ObservabilityAlertManager {
    return this.alertManager;
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.freshnessManager.reset();
    this.volumeTracker.reset();
    this.anomalyDetector.reset();
    this.alertManager.reset();
    this.pipelineHealth.clear();
  }
}

// ============================================================================
// DEFAULT SLAS
// ============================================================================

export const DEFAULT_FRESHNESS_SLAS: FreshnessSLA[] = [
  {
    id: 'sla_token_prices',
    tableName: 'token_prices',
    maxStalenessSeconds: 300, // 5 minutes
    warningThresholdPercent: 80,
    timestampColumn: 'last_updated',
    enabled: true,
    schedule: '*/5 * * * *', // Every 5 minutes
    notifyOnBreach: true,
    notifyChannels: ['slack', 'email'],
  },
  {
    id: 'sla_gas_metrics',
    tableName: 'gas_metrics',
    maxStalenessSeconds: 60, // 1 minute
    warningThresholdPercent: 70,
    timestampColumn: 'collected_at',
    enabled: true,
    schedule: '* * * * *', // Every minute
    notifyOnBreach: true,
    notifyChannels: ['slack'],
  },
  {
    id: 'sla_protocol_tvl',
    tableName: 'protocol_tvl',
    maxStalenessSeconds: 3600, // 1 hour
    warningThresholdPercent: 80,
    timestampColumn: 'collected_at',
    enabled: true,
    schedule: '0 * * * *', // Every hour
    notifyOnBreach: true,
    notifyChannels: ['slack', 'email'],
  },
  {
    id: 'sla_dex_volume',
    tableName: 'dex_volume',
    maxStalenessSeconds: 3600, // 1 hour
    warningThresholdPercent: 80,
    timestampColumn: 'collected_at',
    enabled: true,
    schedule: '0 * * * *', // Every hour
    notifyOnBreach: true,
    notifyChannels: ['slack'],
  },
];

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultDashboard: DataObservabilityDashboard | null = null;

export function getDefaultDashboard(): DataObservabilityDashboard {
  if (!defaultDashboard) {
    defaultDashboard = new DataObservabilityDashboard();

    // Register default SLAs
    for (const sla of DEFAULT_FRESHNESS_SLAS) {
      defaultDashboard.registerFreshnessSLA(sla);
    }
  }
  return defaultDashboard;
}

export function resetDashboard(): void {
  defaultDashboard?.reset();
  defaultDashboard = null;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Classes
  FreshnessSLAManager,
  VolumeTracker,
  AnomalyDetector,
  ObservabilityAlertManager,
  DataObservabilityDashboard,

  // Singleton
  getDefaultDashboard,
  resetDashboard,

  // Defaults
  DEFAULT_FRESHNESS_SLAS,
};
