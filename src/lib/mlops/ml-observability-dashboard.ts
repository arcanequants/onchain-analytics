/**
 * ML Observability Dashboard
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Model performance monitoring
 * - Feature drift detection
 * - Prediction distribution tracking
 * - Latency and throughput metrics
 * - Alert management
 * - Cost tracking
 */

// ============================================================================
// TYPES
// ============================================================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

export interface HistogramBucket {
  le: number;  // less than or equal
  count: number;
}

export interface HistogramMetric {
  name: string;
  buckets: HistogramBucket[];
  sum: number;
  count: number;
  labels: Record<string, string>;
  timestamp: Date;
}

export interface ModelMetrics {
  modelId: string;
  modelVersion: string;
  predictions: {
    total: number;
    successful: number;
    failed: number;
    cached: number;
  };
  latency: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    avg: number;
    max: number;
  };
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    total: number;
    perRequest: number;
    perToken: number;
  };
  lastUpdated: Date;
}

export interface FeatureDistribution {
  featureName: string;
  type: 'numeric' | 'categorical';
  stats?: {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
    p5: number;
    p95: number;
  };
  histogram?: {
    bins: number[];
    counts: number[];
  };
  categories?: Record<string, number>;
  sampleSize: number;
  timestamp: Date;
}

export interface DriftResult {
  featureName: string;
  driftScore: number;
  driftDetected: boolean;
  method: 'psi' | 'ks' | 'chi2' | 'wasserstein';
  threshold: number;
  referenceStats: FeatureDistribution;
  currentStats: FeatureDistribution;
  timestamp: Date;
}

export interface PredictionDistribution {
  modelId: string;
  outputName: string;
  type: 'classification' | 'regression' | 'embedding';
  distribution: {
    classes?: Record<string, number>;
    histogram?: {
      bins: number[];
      counts: number[];
    };
    stats?: {
      mean: number;
      std: number;
      min: number;
      max: number;
    };
  };
  sampleSize: number;
  windowStart: Date;
  windowEnd: Date;
}

export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  source: string;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  labels: Record<string, string>;
  triggeredAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  annotations: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  condition: (metrics: Map<string, Metric>) => boolean;
  severity: AlertSeverity;
  message: string | ((metrics: Map<string, Metric>) => string);
  labels: Record<string, string>;
  cooldownMs: number;
  lastTriggered: Date | null;
}

export interface DashboardConfig {
  refreshIntervalMs: number;
  retentionHours: number;
  alertRules: AlertRule[];
  driftThreshold: number;
  latencyThresholds: {
    p50: number;
    p95: number;
    p99: number;
  };
  costBudget?: {
    daily: number;
    monthly: number;
  };
}

// ============================================================================
// METRICS COLLECTOR
// ============================================================================

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private histograms: Map<string, HistogramMetric[]> = new Map();
  private retentionMs: number;

  constructor(retentionHours: number = 24) {
    this.retentionMs = retentionHours * 60 * 60 * 1000;
  }

  /**
   * Get metric key
   */
  private getKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  /**
   * Record counter
   */
  inc(name: string, value: number = 1, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels);
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const existing = this.metrics.get(key)!;
    const lastValue = existing.length > 0 ? existing[existing.length - 1].value : 0;

    this.metrics.get(key)!.push({
      name,
      type: 'counter',
      value: lastValue + value,
      labels,
      timestamp: new Date(),
    });

    this.cleanup(key);
  }

  /**
   * Record gauge
   */
  set(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.getKey(name, labels);
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: new Date(),
    });

    this.cleanup(key);
  }

  /**
   * Record histogram observation
   */
  observe(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ): void {
    const key = this.getKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }

    const histogramBuckets: HistogramBucket[] = buckets.map(le => ({
      le,
      count: value <= le ? 1 : 0,
    }));
    histogramBuckets.push({ le: Infinity, count: 1 });

    const existingHistograms = this.histograms.get(key)!;
    const last = existingHistograms.length > 0
      ? existingHistograms[existingHistograms.length - 1]
      : null;

    if (last) {
      // Merge with last histogram
      for (let i = 0; i < histogramBuckets.length; i++) {
        histogramBuckets[i].count += last.buckets[i]?.count || 0;
      }
    }

    this.histograms.get(key)!.push({
      name,
      buckets: histogramBuckets,
      sum: (last?.sum || 0) + value,
      count: (last?.count || 0) + 1,
      labels,
      timestamp: new Date(),
    });

    this.cleanupHistogram(key);
  }

  /**
   * Get latest metric value
   */
  getValue(name: string, labels: Record<string, string> = {}): number | undefined {
    const key = this.getKey(name, labels);
    const metrics = this.metrics.get(key);
    if (!metrics || metrics.length === 0) return undefined;
    return metrics[metrics.length - 1].value;
  }

  /**
   * Get metric history
   */
  getHistory(
    name: string,
    labels: Record<string, string> = {},
    since?: Date
  ): Metric[] {
    const key = this.getKey(name, labels);
    const metrics = this.metrics.get(key) || [];

    if (since) {
      return metrics.filter(m => m.timestamp >= since);
    }
    return metrics;
  }

  /**
   * Get histogram percentile
   */
  getPercentile(name: string, percentile: number, labels: Record<string, string> = {}): number {
    const key = this.getKey(name, labels);
    const histograms = this.histograms.get(key);
    if (!histograms || histograms.length === 0) return 0;

    const latest = histograms[histograms.length - 1];
    const targetCount = latest.count * (percentile / 100);

    for (let i = 0; i < latest.buckets.length - 1; i++) {
      if (latest.buckets[i].count >= targetCount) {
        return latest.buckets[i].le;
      }
    }

    return latest.buckets[latest.buckets.length - 2]?.le || 0;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, Metric> {
    const result = new Map<string, Metric>();
    for (const [key, metrics] of this.metrics.entries()) {
      if (metrics.length > 0) {
        result.set(key, metrics[metrics.length - 1]);
      }
    }
    return result;
  }

  /**
   * Cleanup old metrics
   */
  private cleanup(key: string): void {
    const cutoff = new Date(Date.now() - this.retentionMs);
    const metrics = this.metrics.get(key);
    if (metrics) {
      const filtered = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(key, filtered);
    }
  }

  private cleanupHistogram(key: string): void {
    const cutoff = new Date(Date.now() - this.retentionMs);
    const histograms = this.histograms.get(key);
    if (histograms) {
      const filtered = histograms.filter(h => h.timestamp > cutoff);
      this.histograms.set(key, filtered);
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.histograms.clear();
  }
}

// ============================================================================
// DRIFT DETECTOR
// ============================================================================

class DriftDetector {
  private referenceDistributions: Map<string, FeatureDistribution> = new Map();
  private currentDistributions: Map<string, FeatureDistribution> = new Map();

  /**
   * Set reference distribution for a feature
   */
  setReference(distribution: FeatureDistribution): void {
    this.referenceDistributions.set(distribution.featureName, distribution);
  }

  /**
   * Update current distribution for a feature
   */
  updateCurrent(distribution: FeatureDistribution): void {
    this.currentDistributions.set(distribution.featureName, distribution);
  }

  /**
   * Compute PSI (Population Stability Index)
   */
  private computePSI(expected: number[], actual: number[]): number {
    let psi = 0;
    const epsilon = 0.0001;

    for (let i = 0; i < expected.length; i++) {
      const e = Math.max(expected[i], epsilon);
      const a = Math.max(actual[i], epsilon);
      psi += (a - e) * Math.log(a / e);
    }

    return psi;
  }

  /**
   * Compute Kolmogorov-Smirnov statistic
   */
  private computeKS(dist1: number[], dist2: number[]): number {
    const all = [...dist1, ...dist2].sort((a, b) => a - b);
    let maxDiff = 0;

    for (const value of all) {
      const cdf1 = dist1.filter(v => v <= value).length / dist1.length;
      const cdf2 = dist2.filter(v => v <= value).length / dist2.length;
      maxDiff = Math.max(maxDiff, Math.abs(cdf1 - cdf2));
    }

    return maxDiff;
  }

  /**
   * Check drift for a feature
   */
  checkDrift(featureName: string, threshold: number = 0.1): DriftResult | null {
    const reference = this.referenceDistributions.get(featureName);
    const current = this.currentDistributions.get(featureName);

    if (!reference || !current) return null;

    let driftScore = 0;
    let method: DriftResult['method'] = 'psi';

    if (reference.type === 'numeric' && reference.histogram && current.histogram) {
      // Normalize histograms
      const refTotal = reference.histogram.counts.reduce((a, b) => a + b, 0);
      const curTotal = current.histogram.counts.reduce((a, b) => a + b, 0);

      const refNorm = reference.histogram.counts.map(c => c / refTotal);
      const curNorm = current.histogram.counts.map(c => c / curTotal);

      driftScore = this.computePSI(refNorm, curNorm);
    } else if (reference.type === 'categorical' && reference.categories && current.categories) {
      // Compute PSI for categorical features
      const allCategories = new Set([
        ...Object.keys(reference.categories),
        ...Object.keys(current.categories),
      ]);

      const refTotal = Object.values(reference.categories).reduce((a, b) => a + b, 0);
      const curTotal = Object.values(current.categories).reduce((a, b) => a + b, 0);

      const refProbs: number[] = [];
      const curProbs: number[] = [];

      for (const cat of allCategories) {
        refProbs.push((reference.categories[cat] || 0) / refTotal);
        curProbs.push((current.categories[cat] || 0) / curTotal);
      }

      driftScore = this.computePSI(refProbs, curProbs);
    }

    return {
      featureName,
      driftScore,
      driftDetected: driftScore > threshold,
      method,
      threshold,
      referenceStats: reference,
      currentStats: current,
      timestamp: new Date(),
    };
  }

  /**
   * Check drift for all features
   */
  checkAllDrift(threshold: number = 0.1): DriftResult[] {
    const results: DriftResult[] = [];

    for (const featureName of this.referenceDistributions.keys()) {
      const result = this.checkDrift(featureName, threshold);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get features with detected drift
   */
  getDriftingFeatures(threshold: number = 0.1): string[] {
    return this.checkAllDrift(threshold)
      .filter(r => r.driftDetected)
      .map(r => r.featureName);
  }
}

// ============================================================================
// ALERT MANAGER
// ============================================================================

class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private rules: AlertRule[] = [];
  private handlers: Array<(alert: Alert) => void> = [];

  /**
   * Generate alert ID
   */
  private generateId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Add alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Evaluate all rules
   */
  evaluateRules(metrics: Map<string, Metric>): Alert[] {
    const newAlerts: Alert[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered) {
        const elapsed = Date.now() - rule.lastTriggered.getTime();
        if (elapsed < rule.cooldownMs) continue;
      }

      try {
        if (rule.condition(metrics)) {
          const message = typeof rule.message === 'function'
            ? rule.message(metrics)
            : rule.message;

          const alert = this.trigger(rule.name, rule.severity, message, {
            source: 'rule',
            labels: rule.labels,
          });

          rule.lastTriggered = new Date();
          newAlerts.push(alert);
        }
      } catch {
        // Rule evaluation failed, skip
      }
    }

    return newAlerts;
  }

  /**
   * Trigger alert manually
   */
  trigger(
    name: string,
    severity: AlertSeverity,
    message: string,
    options?: {
      source?: string;
      metric?: string;
      threshold?: number;
      currentValue?: number;
      labels?: Record<string, string>;
      annotations?: Record<string, string>;
    }
  ): Alert {
    const alert: Alert = {
      id: this.generateId(),
      name,
      severity,
      status: 'active',
      message,
      source: options?.source || 'manual',
      metric: options?.metric,
      threshold: options?.threshold,
      currentValue: options?.currentValue,
      labels: options?.labels || {},
      triggeredAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      annotations: options?.annotations || {},
    };

    this.alerts.set(alert.id, alert);
    this.notifyHandlers(alert);

    return alert;
  }

  /**
   * Acknowledge alert
   */
  acknowledge(alertId: string, by: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = by;

    return alert;
  }

  /**
   * Resolve alert
   */
  resolve(alertId: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();

    return alert;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return [...this.alerts.values()].filter(a => a.status === 'active');
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): Alert[] {
    return [...this.alerts.values()];
  }

  /**
   * Add alert handler
   */
  onAlert(handler: (alert: Alert) => void): void {
    this.handlers.push(handler);
  }

  /**
   * Notify handlers
   */
  private notifyHandlers(alert: Alert): void {
    for (const handler of this.handlers) {
      try {
        handler(alert);
      } catch {
        // Handler failed, skip
      }
    }
  }

  /**
   * Clear resolved alerts
   */
  clearResolved(): number {
    let count = 0;
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.status === 'resolved') {
        this.alerts.delete(id);
        count++;
      }
    }
    return count;
  }
}

// ============================================================================
// ML OBSERVABILITY DASHBOARD
// ============================================================================

export class MLObservabilityDashboard {
  private metrics: MetricsCollector;
  private driftDetector: DriftDetector;
  private alertManager: AlertManager;
  private modelMetrics: Map<string, ModelMetrics> = new Map();
  private predictionDistributions: Map<string, PredictionDistribution[]> = new Map();
  private config: DashboardConfig;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<DashboardConfig>) {
    this.config = {
      refreshIntervalMs: config?.refreshIntervalMs ?? 60000,
      retentionHours: config?.retentionHours ?? 24,
      alertRules: config?.alertRules ?? [],
      driftThreshold: config?.driftThreshold ?? 0.1,
      latencyThresholds: config?.latencyThresholds ?? {
        p50: 100,
        p95: 500,
        p99: 1000,
      },
      costBudget: config?.costBudget,
    };

    this.metrics = new MetricsCollector(this.config.retentionHours);
    this.driftDetector = new DriftDetector();
    this.alertManager = new AlertManager();

    // Add default alert rules
    this.setupDefaultAlertRules();

    // Add custom rules
    for (const rule of this.config.alertRules) {
      this.alertManager.addRule(rule);
    }
  }

  /**
   * Setup default alert rules
   */
  private setupDefaultAlertRules(): void {
    // High latency alert
    this.alertManager.addRule({
      id: 'high-latency-p95',
      name: 'High P95 Latency',
      enabled: true,
      condition: (metrics) => {
        for (const [key, metric] of metrics.entries()) {
          if (key.includes('latency_p95') && metric.value > this.config.latencyThresholds.p95) {
            return true;
          }
        }
        return false;
      },
      severity: 'warning',
      message: 'P95 latency exceeds threshold',
      labels: { category: 'performance' },
      cooldownMs: 300000, // 5 minutes
      lastTriggered: null,
    });

    // High error rate alert
    this.alertManager.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      enabled: true,
      condition: (metrics) => {
        let total = 0;
        let errors = 0;
        for (const [key, metric] of metrics.entries()) {
          if (key.includes('predictions_total')) total = metric.value;
          if (key.includes('predictions_failed')) errors = metric.value;
        }
        return total > 100 && (errors / total) > 0.05;
      },
      severity: 'error',
      message: 'Error rate exceeds 5%',
      labels: { category: 'reliability' },
      cooldownMs: 300000,
      lastTriggered: null,
    });

    // Cost budget alert
    if (this.config.costBudget) {
      this.alertManager.addRule({
        id: 'daily-cost-budget',
        name: 'Daily Cost Budget Exceeded',
        enabled: true,
        condition: (metrics) => {
          let dailyCost = 0;
          for (const [key, metric] of metrics.entries()) {
            if (key.includes('cost_daily')) dailyCost = metric.value;
          }
          return dailyCost > (this.config.costBudget?.daily || Infinity);
        },
        severity: 'warning',
        message: 'Daily cost budget exceeded',
        labels: { category: 'cost' },
        cooldownMs: 3600000, // 1 hour
        lastTriggered: null,
      });
    }
  }

  /**
   * Record model prediction
   */
  recordPrediction(
    modelId: string,
    modelVersion: string,
    options: {
      success: boolean;
      cached?: boolean;
      latencyMs: number;
      inputTokens: number;
      outputTokens: number;
      cost: number;
      output?: unknown;
      outputType?: 'classification' | 'regression' | 'embedding';
    }
  ): void {
    const labels = { model: modelId, version: modelVersion };

    // Update counters
    this.metrics.inc('predictions_total', 1, labels);
    if (options.success) {
      this.metrics.inc('predictions_successful', 1, labels);
    } else {
      this.metrics.inc('predictions_failed', 1, labels);
    }
    if (options.cached) {
      this.metrics.inc('predictions_cached', 1, labels);
    }

    // Update latency histogram
    this.metrics.observe('prediction_latency_seconds', options.latencyMs / 1000, labels);

    // Update token counters
    this.metrics.inc('tokens_input', options.inputTokens, labels);
    this.metrics.inc('tokens_output', options.outputTokens, labels);
    this.metrics.inc('tokens_total', options.inputTokens + options.outputTokens, labels);

    // Update cost
    this.metrics.inc('cost_total', options.cost, labels);
    this.metrics.inc('cost_daily', options.cost, labels);

    // Update model metrics aggregate
    this.updateModelMetrics(modelId, modelVersion, options);

    // Update prediction distribution
    if (options.output !== undefined && options.outputType) {
      this.updatePredictionDistribution(modelId, options.output, options.outputType);
    }

    // Evaluate alert rules
    this.alertManager.evaluateRules(this.metrics.getAllMetrics());
  }

  /**
   * Update aggregated model metrics
   */
  private updateModelMetrics(
    modelId: string,
    modelVersion: string,
    options: {
      success: boolean;
      cached?: boolean;
      latencyMs: number;
      inputTokens: number;
      outputTokens: number;
      cost: number;
    }
  ): void {
    const key = `${modelId}:${modelVersion}`;
    let metrics = this.modelMetrics.get(key);

    if (!metrics) {
      metrics = {
        modelId,
        modelVersion,
        predictions: { total: 0, successful: 0, failed: 0, cached: 0 },
        latency: { p50: 0, p90: 0, p95: 0, p99: 0, avg: 0, max: 0 },
        tokens: { input: 0, output: 0, total: 0 },
        cost: { total: 0, perRequest: 0, perToken: 0 },
        lastUpdated: new Date(),
      };
      this.modelMetrics.set(key, metrics);
    }

    metrics.predictions.total++;
    if (options.success) metrics.predictions.successful++;
    else metrics.predictions.failed++;
    if (options.cached) metrics.predictions.cached++;

    metrics.tokens.input += options.inputTokens;
    metrics.tokens.output += options.outputTokens;
    metrics.tokens.total += options.inputTokens + options.outputTokens;

    metrics.cost.total += options.cost;
    metrics.cost.perRequest = metrics.cost.total / metrics.predictions.total;
    metrics.cost.perToken = metrics.tokens.total > 0
      ? metrics.cost.total / metrics.tokens.total
      : 0;

    // Update latency percentiles
    const labels = { model: modelId, version: modelVersion };
    metrics.latency.p50 = this.metrics.getPercentile('prediction_latency_seconds', 50, labels) * 1000;
    metrics.latency.p90 = this.metrics.getPercentile('prediction_latency_seconds', 90, labels) * 1000;
    metrics.latency.p95 = this.metrics.getPercentile('prediction_latency_seconds', 95, labels) * 1000;
    metrics.latency.p99 = this.metrics.getPercentile('prediction_latency_seconds', 99, labels) * 1000;

    metrics.lastUpdated = new Date();
  }

  /**
   * Update prediction distribution
   */
  private updatePredictionDistribution(
    modelId: string,
    output: unknown,
    type: 'classification' | 'regression' | 'embedding'
  ): void {
    // Simplified - just track distribution type
    if (!this.predictionDistributions.has(modelId)) {
      this.predictionDistributions.set(modelId, []);
    }
  }

  /**
   * Record feature for drift detection
   */
  recordFeature(
    featureName: string,
    value: number | string,
    isReference: boolean = false
  ): void {
    // Simplified - in production would build full distributions
    const type = typeof value === 'number' ? 'numeric' : 'categorical';

    const distribution: FeatureDistribution = {
      featureName,
      type,
      sampleSize: 1,
      timestamp: new Date(),
    };

    if (type === 'numeric') {
      distribution.stats = {
        mean: value as number,
        std: 0,
        min: value as number,
        max: value as number,
        median: value as number,
        p5: value as number,
        p95: value as number,
      };
    } else {
      distribution.categories = { [value as string]: 1 };
    }

    if (isReference) {
      this.driftDetector.setReference(distribution);
    } else {
      this.driftDetector.updateCurrent(distribution);
    }
  }

  /**
   * Get model metrics
   */
  getModelMetrics(modelId: string, modelVersion?: string): ModelMetrics | null {
    for (const [key, metrics] of this.modelMetrics.entries()) {
      if (key.startsWith(modelId)) {
        if (!modelVersion || key === `${modelId}:${modelVersion}`) {
          return metrics;
        }
      }
    }
    return null;
  }

  /**
   * Get all model metrics
   */
  getAllModelMetrics(): ModelMetrics[] {
    return [...this.modelMetrics.values()];
  }

  /**
   * Check drift for all features
   */
  checkDrift(): DriftResult[] {
    return this.driftDetector.checkAllDrift(this.config.driftThreshold);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alertManager.getActiveAlerts();
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, by: string): Alert | null {
    return this.alertManager.acknowledge(alertId, by);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): Alert | null {
    return this.alertManager.resolve(alertId);
  }

  /**
   * Add alert handler
   */
  onAlert(handler: (alert: Alert) => void): void {
    this.alertManager.onAlert(handler);
  }

  /**
   * Generate dashboard summary
   */
  generateSummary(): {
    overview: {
      totalModels: number;
      totalPredictions: number;
      successRate: number;
      avgLatencyMs: number;
      totalCost: number;
    };
    models: ModelMetrics[];
    drift: DriftResult[];
    alerts: Alert[];
    timestamp: Date;
  } {
    const models = this.getAllModelMetrics();

    let totalPredictions = 0;
    let successfulPredictions = 0;
    let totalLatency = 0;
    let totalCost = 0;

    for (const m of models) {
      totalPredictions += m.predictions.total;
      successfulPredictions += m.predictions.successful;
      totalLatency += m.latency.avg * m.predictions.total;
      totalCost += m.cost.total;
    }

    return {
      overview: {
        totalModels: models.length,
        totalPredictions,
        successRate: totalPredictions > 0 ? successfulPredictions / totalPredictions : 0,
        avgLatencyMs: totalPredictions > 0 ? totalLatency / totalPredictions : 0,
        totalCost,
      },
      models,
      drift: this.checkDrift(),
      alerts: this.getActiveAlerts(),
      timestamp: new Date(),
    };
  }

  /**
   * Export metrics as Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];
    const metrics = this.metrics.getAllMetrics();

    for (const [key, metric] of metrics.entries()) {
      const labels = Object.entries(metric.labels)
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');

      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      lines.push(`${metric.name}{${labels}} ${metric.value}`);
    }

    return lines.join('\n');
  }

  /**
   * Start refresh interval
   */
  start(): void {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(() => {
      this.alertManager.evaluateRules(this.metrics.getAllMetrics());
    }, this.config.refreshIntervalMs);
  }

  /**
   * Stop refresh interval
   */
  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.metrics.clear();
    this.modelMetrics.clear();
    this.predictionDistributions.clear();
    this.alertManager.clearResolved();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultDashboard: MLObservabilityDashboard | null = null;

/**
 * Get default dashboard
 */
export function getDefaultDashboard(): MLObservabilityDashboard {
  if (!defaultDashboard) {
    defaultDashboard = new MLObservabilityDashboard();
  }
  return defaultDashboard;
}

/**
 * Reset dashboard (for testing)
 */
export function resetDashboard(): void {
  if (defaultDashboard) {
    defaultDashboard.stop();
    defaultDashboard = null;
  }
}

/**
 * Create dashboard
 */
export function createDashboard(config?: Partial<DashboardConfig>): MLObservabilityDashboard {
  return new MLObservabilityDashboard(config);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  MetricsCollector,
  DriftDetector,
  AlertManager,
};

export default {
  MLObservabilityDashboard,
  MetricsCollector,
  DriftDetector,
  AlertManager,
  createDashboard,
  getDefaultDashboard,
  resetDashboard,
};
