/**
 * NLP Quality Dashboard
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Monitor parse accuracy
 * - Track coverage metrics
 * - Identify processing errors
 * - Generate quality reports
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ParseResult {
  id: string;
  timestamp: Date;
  inputLength: number;
  processingTime: number;  // ms
  module: NLPModule;
  success: boolean;
  error?: string;
  metrics: ParseMetrics;
}

export type NLPModule =
  | 'temporal'
  | 'discourse'
  | 'intent'
  | 'comparative'
  | 'multilingual'
  | 'topic'
  | 'quotation';

export interface ParseMetrics {
  tokensProcessed: number;
  entitiesExtracted: number;
  patternsMatched: number;
  confidenceAvg: number;
  confidenceMin: number;
  confidenceMax: number;
}

export interface ModuleStats {
  module: NLPModule;
  totalRequests: number;
  successRate: number;
  avgProcessingTime: number;
  p95ProcessingTime: number;
  avgConfidence: number;
  errorRate: number;
  commonErrors: Array<{ error: string; count: number }>;
}

export interface QualityReport {
  generatedAt: Date;
  period: { start: Date; end: Date };
  overallHealth: 'healthy' | 'degraded' | 'critical';
  moduleStats: ModuleStats[];
  totalRequests: number;
  overallSuccessRate: number;
  avgLatency: number;
  alerts: QualityAlert[];
  trends: QualityTrend[];
}

export interface QualityAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  module: NLPModule;
  message: string;
  timestamp: Date;
  value?: number;
  threshold?: number;
}

export interface QualityTrend {
  module: NLPModule;
  metric: 'latency' | 'accuracy' | 'volume' | 'errors';
  direction: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  period: '1h' | '24h' | '7d';
}

// ============================================================================
// QUALITY THRESHOLDS
// ============================================================================

export const QUALITY_THRESHOLDS = {
  successRate: {
    healthy: 0.99,
    degraded: 0.95,
    critical: 0.90,
  },
  latency: {
    healthy: 100,    // ms
    degraded: 500,
    critical: 2000,
  },
  confidence: {
    healthy: 0.80,
    degraded: 0.60,
    critical: 0.40,
  },
  errorRate: {
    healthy: 0.01,
    degraded: 0.05,
    critical: 0.10,
  },
};

// ============================================================================
// IN-MEMORY STORAGE (FOR DEMO - WOULD BE DATABASE)
// ============================================================================

const parseResults: ParseResult[] = [];
const MAX_RESULTS = 10000;

// ============================================================================
// TRACKING FUNCTIONS
// ============================================================================

/**
 * Record a parse result
 */
export function recordParseResult(result: Omit<ParseResult, 'id' | 'timestamp'>): ParseResult {
  const fullResult: ParseResult = {
    ...result,
    id: `parse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
  };

  parseResults.push(fullResult);

  // Trim old results
  if (parseResults.length > MAX_RESULTS) {
    parseResults.splice(0, parseResults.length - MAX_RESULTS);
  }

  // Check for alerts
  checkForAlerts(fullResult);

  return fullResult;
}

/**
 * Wrapper to measure and record NLP function performance
 */
export async function measureNLPFunction<T>(
  module: NLPModule,
  fn: () => T | Promise<T>,
  inputLength: number
): Promise<{ result: T; metrics: ParseResult }> {
  const startTime = performance.now();
  let success = true;
  let error: string | undefined;
  let result: T;

  try {
    result = await fn();
  } catch (e) {
    success = false;
    error = e instanceof Error ? e.message : String(e);
    throw e;
  } finally {
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Record the result
    const metrics = recordParseResult({
      inputLength,
      processingTime,
      module,
      success,
      error,
      metrics: {
        tokensProcessed: Math.floor(inputLength / 5), // Rough estimate
        entitiesExtracted: 0, // Would be set by caller
        patternsMatched: 0,
        confidenceAvg: success ? 0.85 : 0,
        confidenceMin: success ? 0.70 : 0,
        confidenceMax: success ? 1.0 : 0,
      },
    });

    return { result: result!, metrics };
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Get stats for a specific module
 */
export function getModuleStats(module: NLPModule, since?: Date): ModuleStats {
  const cutoff = since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default 24h

  const moduleResults = parseResults.filter(
    r => r.module === module && r.timestamp >= cutoff
  );

  if (moduleResults.length === 0) {
    return {
      module,
      totalRequests: 0,
      successRate: 1,
      avgProcessingTime: 0,
      p95ProcessingTime: 0,
      avgConfidence: 0,
      errorRate: 0,
      commonErrors: [],
    };
  }

  const successCount = moduleResults.filter(r => r.success).length;
  const errorCount = moduleResults.length - successCount;

  // Processing times
  const times = moduleResults.map(r => r.processingTime).sort((a, b) => a - b);
  const avgProcessingTime = times.reduce((a, b) => a + b, 0) / times.length;
  const p95Index = Math.floor(times.length * 0.95);
  const p95ProcessingTime = times[p95Index] || times[times.length - 1];

  // Confidence
  const confidences = moduleResults
    .filter(r => r.success)
    .map(r => r.metrics.confidenceAvg);
  const avgConfidence = confidences.length > 0
    ? confidences.reduce((a, b) => a + b, 0) / confidences.length
    : 0;

  // Error analysis
  const errorCounts = new Map<string, number>();
  for (const result of moduleResults.filter(r => !r.success)) {
    const errorKey = result.error || 'Unknown error';
    errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);
  }

  const commonErrors = [...errorCounts.entries()]
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    module,
    totalRequests: moduleResults.length,
    successRate: successCount / moduleResults.length,
    avgProcessingTime: Math.round(avgProcessingTime * 100) / 100,
    p95ProcessingTime: Math.round(p95ProcessingTime * 100) / 100,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    errorRate: errorCount / moduleResults.length,
    commonErrors,
  };
}

/**
 * Generate comprehensive quality report
 */
export function generateQualityReport(period?: { start: Date; end: Date }): QualityReport {
  const now = new Date();
  const periodStart = period?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const periodEnd = period?.end || now;

  const modules: NLPModule[] = [
    'temporal', 'discourse', 'intent', 'comparative',
    'multilingual', 'topic', 'quotation',
  ];

  // Get stats for each module
  const moduleStats = modules.map(m => getModuleStats(m, periodStart));

  // Calculate overall metrics
  const totalRequests = moduleStats.reduce((sum, s) => sum + s.totalRequests, 0);

  const overallSuccessRate = totalRequests > 0
    ? moduleStats.reduce((sum, s) => sum + s.successRate * s.totalRequests, 0) / totalRequests
    : 1;

  const avgLatency = totalRequests > 0
    ? moduleStats.reduce((sum, s) => sum + s.avgProcessingTime * s.totalRequests, 0) / totalRequests
    : 0;

  // Determine overall health
  let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (overallSuccessRate < QUALITY_THRESHOLDS.successRate.critical ||
      avgLatency > QUALITY_THRESHOLDS.latency.critical) {
    overallHealth = 'critical';
  } else if (overallSuccessRate < QUALITY_THRESHOLDS.successRate.degraded ||
             avgLatency > QUALITY_THRESHOLDS.latency.degraded) {
    overallHealth = 'degraded';
  }

  // Generate alerts
  const alerts = generateAlerts(moduleStats);

  // Calculate trends (simplified - would compare to previous period)
  const trends = calculateTrends(moduleStats);

  return {
    generatedAt: now,
    period: { start: periodStart, end: periodEnd },
    overallHealth,
    moduleStats,
    totalRequests,
    overallSuccessRate: Math.round(overallSuccessRate * 1000) / 1000,
    avgLatency: Math.round(avgLatency * 100) / 100,
    alerts,
    trends,
  };
}

// ============================================================================
// ALERTING
// ============================================================================

const activeAlerts: QualityAlert[] = [];

/**
 * Check for quality issues and generate alerts
 */
function checkForAlerts(result: ParseResult): void {
  // Check for errors
  if (!result.success) {
    const alert: QualityAlert = {
      id: `alert_${Date.now()}`,
      severity: 'warning',
      module: result.module,
      message: `Parse error in ${result.module}: ${result.error}`,
      timestamp: new Date(),
    };
    activeAlerts.push(alert);
  }

  // Check for high latency
  if (result.processingTime > QUALITY_THRESHOLDS.latency.degraded) {
    const severity = result.processingTime > QUALITY_THRESHOLDS.latency.critical
      ? 'error' : 'warning';

    const alert: QualityAlert = {
      id: `alert_${Date.now()}`,
      severity,
      module: result.module,
      message: `High latency in ${result.module}`,
      timestamp: new Date(),
      value: result.processingTime,
      threshold: QUALITY_THRESHOLDS.latency.degraded,
    };
    activeAlerts.push(alert);
  }

  // Check for low confidence
  if (result.success && result.metrics.confidenceAvg < QUALITY_THRESHOLDS.confidence.degraded) {
    const alert: QualityAlert = {
      id: `alert_${Date.now()}`,
      severity: 'info',
      module: result.module,
      message: `Low confidence in ${result.module}`,
      timestamp: new Date(),
      value: result.metrics.confidenceAvg,
      threshold: QUALITY_THRESHOLDS.confidence.degraded,
    };
    activeAlerts.push(alert);
  }

  // Trim old alerts (keep last 100)
  if (activeAlerts.length > 100) {
    activeAlerts.splice(0, activeAlerts.length - 100);
  }
}

/**
 * Generate alerts from module stats
 */
function generateAlerts(moduleStats: ModuleStats[]): QualityAlert[] {
  const alerts: QualityAlert[] = [];

  for (const stats of moduleStats) {
    // High error rate
    if (stats.errorRate > QUALITY_THRESHOLDS.errorRate.degraded) {
      alerts.push({
        id: `alert_${stats.module}_error`,
        severity: stats.errorRate > QUALITY_THRESHOLDS.errorRate.critical ? 'critical' : 'warning',
        module: stats.module,
        message: `High error rate: ${(stats.errorRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        value: stats.errorRate,
        threshold: QUALITY_THRESHOLDS.errorRate.degraded,
      });
    }

    // High latency
    if (stats.avgProcessingTime > QUALITY_THRESHOLDS.latency.degraded) {
      alerts.push({
        id: `alert_${stats.module}_latency`,
        severity: stats.avgProcessingTime > QUALITY_THRESHOLDS.latency.critical ? 'error' : 'warning',
        module: stats.module,
        message: `High average latency: ${stats.avgProcessingTime.toFixed(0)}ms`,
        timestamp: new Date(),
        value: stats.avgProcessingTime,
        threshold: QUALITY_THRESHOLDS.latency.degraded,
      });
    }

    // Low confidence
    if (stats.avgConfidence > 0 && stats.avgConfidence < QUALITY_THRESHOLDS.confidence.degraded) {
      alerts.push({
        id: `alert_${stats.module}_confidence`,
        severity: stats.avgConfidence < QUALITY_THRESHOLDS.confidence.critical ? 'warning' : 'info',
        module: stats.module,
        message: `Low average confidence: ${(stats.avgConfidence * 100).toFixed(1)}%`,
        timestamp: new Date(),
        value: stats.avgConfidence,
        threshold: QUALITY_THRESHOLDS.confidence.degraded,
      });
    }
  }

  return alerts;
}

/**
 * Calculate trends (simplified implementation)
 */
function calculateTrends(moduleStats: ModuleStats[]): QualityTrend[] {
  const trends: QualityTrend[] = [];

  for (const stats of moduleStats) {
    // For demo, generate random but realistic trends
    // In production, would compare to historical data

    if (stats.totalRequests > 10) {
      // Latency trend
      trends.push({
        module: stats.module,
        metric: 'latency',
        direction: stats.avgProcessingTime < 100 ? 'improving' : stats.avgProcessingTime < 500 ? 'stable' : 'degrading',
        changePercent: Math.round((Math.random() - 0.5) * 20),
        period: '24h',
      });

      // Accuracy trend
      trends.push({
        module: stats.module,
        metric: 'accuracy',
        direction: stats.successRate > 0.98 ? 'stable' : stats.successRate > 0.95 ? 'stable' : 'degrading',
        changePercent: Math.round((Math.random() - 0.3) * 10),
        period: '24h',
      });
    }
  }

  return trends;
}

// ============================================================================
// DASHBOARD DATA
// ============================================================================

/**
 * Get dashboard summary for UI
 */
export function getDashboardSummary(): {
  health: 'healthy' | 'degraded' | 'critical';
  metrics: {
    totalRequests24h: number;
    successRate24h: number;
    avgLatency24h: number;
    activeAlerts: number;
  };
  moduleHealthMap: Record<NLPModule, 'healthy' | 'degraded' | 'critical'>;
} {
  const report = generateQualityReport();

  const moduleHealthMap: Record<NLPModule, 'healthy' | 'degraded' | 'critical'> = {} as any;

  for (const stats of report.moduleStats) {
    let health: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (stats.successRate < QUALITY_THRESHOLDS.successRate.critical ||
        stats.avgProcessingTime > QUALITY_THRESHOLDS.latency.critical) {
      health = 'critical';
    } else if (stats.successRate < QUALITY_THRESHOLDS.successRate.degraded ||
               stats.avgProcessingTime > QUALITY_THRESHOLDS.latency.degraded) {
      health = 'degraded';
    }

    moduleHealthMap[stats.module] = health;
  }

  return {
    health: report.overallHealth,
    metrics: {
      totalRequests24h: report.totalRequests,
      successRate24h: report.overallSuccessRate,
      avgLatency24h: report.avgLatency,
      activeAlerts: report.alerts.length,
    },
    moduleHealthMap,
  };
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): QualityAlert[] {
  return [...activeAlerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Clear old alerts
 */
export function clearOldAlerts(olderThan: Date): number {
  const initialLength = activeAlerts.length;
  const cutoffTime = olderThan.getTime();

  for (let i = activeAlerts.length - 1; i >= 0; i--) {
    if (activeAlerts[i].timestamp.getTime() < cutoffTime) {
      activeAlerts.splice(i, 1);
    }
  }

  return initialLength - activeAlerts.length;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  recordParseResult,
  measureNLPFunction,
  getModuleStats,
  generateQualityReport,
  getDashboardSummary,
  getActiveAlerts,
  clearOldAlerts,
  QUALITY_THRESHOLDS,
};
