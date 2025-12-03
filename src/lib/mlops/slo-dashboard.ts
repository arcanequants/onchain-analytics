/**
 * SLO Dashboard
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Service Level Objective tracking
 * - Error budget monitoring
 * - SLI computation
 * - Alerting on SLO violations
 */

// ============================================================================
// TYPES
// ============================================================================

export type SLOType =
  | 'availability'     // Uptime percentage
  | 'latency'          // Response time
  | 'error_rate'       // Error percentage
  | 'throughput'       // Requests per second
  | 'quality'          // Response quality score
  | 'freshness';       // Data freshness

export type SLOWindow = '1h' | '24h' | '7d' | '30d' | '90d';

export interface SLODefinition {
  id: string;
  name: string;
  description: string;
  type: SLOType;
  target: number;          // Target percentage (e.g., 99.9)
  warningThreshold: number; // Warning at this percentage (e.g., 99.5)
  window: SLOWindow;
  service: string;
  owner: string;
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface SLI {
  timestamp: Date;
  sloId: string;
  goodEvents: number;
  totalEvents: number;
  value: number;  // Computed SLI (0-100)
}

export interface SLOStatus {
  sloId: string;
  sloName: string;
  target: number;
  current: number;
  errorBudget: {
    total: number;      // Total allowed errors
    consumed: number;   // Errors consumed
    remaining: number;  // Remaining budget
    percentUsed: number;
  };
  status: 'healthy' | 'warning' | 'critical' | 'violated';
  trend: 'improving' | 'stable' | 'degrading';
  lastUpdated: Date;
  history: SLI[];
}

export interface SLOAlert {
  id: string;
  sloId: string;
  severity: 'warning' | 'error' | 'critical';
  message: string;
  threshold: number;
  actual: number;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
}

export interface SLOReport {
  generatedAt: Date;
  period: { start: Date; end: Date };
  slos: SLOStatus[];
  overallHealth: 'healthy' | 'at_risk' | 'critical';
  violatedSLOs: string[];
  atRiskSLOs: string[];
  recommendations: string[];
}

// ============================================================================
// DEFAULT SLO DEFINITIONS
// ============================================================================

export const DEFAULT_SLOS: SLODefinition[] = [
  // Availability SLOs
  {
    id: 'slo-api-availability',
    name: 'API Availability',
    description: 'Percentage of successful API requests',
    type: 'availability',
    target: 99.9,
    warningThreshold: 99.5,
    window: '30d',
    service: 'api',
    owner: 'platform-team',
    enabled: true,
  },
  {
    id: 'slo-ai-availability',
    name: 'AI Service Availability',
    description: 'Percentage of successful AI inference requests',
    type: 'availability',
    target: 99.5,
    warningThreshold: 99.0,
    window: '30d',
    service: 'ai-inference',
    owner: 'ai-team',
    enabled: true,
  },

  // Latency SLOs
  {
    id: 'slo-api-latency-p95',
    name: 'API Latency P95',
    description: 'P95 API response time under 500ms',
    type: 'latency',
    target: 95.0,  // 95% of requests under threshold
    warningThreshold: 90.0,
    window: '24h',
    service: 'api',
    owner: 'platform-team',
    enabled: true,
    metadata: { thresholdMs: 500 },
  },
  {
    id: 'slo-ai-latency-p95',
    name: 'AI Latency P95',
    description: 'P95 AI inference time under 3000ms',
    type: 'latency',
    target: 95.0,
    warningThreshold: 90.0,
    window: '24h',
    service: 'ai-inference',
    owner: 'ai-team',
    enabled: true,
    metadata: { thresholdMs: 3000 },
  },

  // Error Rate SLOs
  {
    id: 'slo-api-error-rate',
    name: 'API Error Rate',
    description: 'Percentage of requests without errors',
    type: 'error_rate',
    target: 99.5,
    warningThreshold: 99.0,
    window: '24h',
    service: 'api',
    owner: 'platform-team',
    enabled: true,
  },
  {
    id: 'slo-ai-error-rate',
    name: 'AI Error Rate',
    description: 'Percentage of AI requests without errors',
    type: 'error_rate',
    target: 98.0,
    warningThreshold: 95.0,
    window: '24h',
    service: 'ai-inference',
    owner: 'ai-team',
    enabled: true,
  },

  // Quality SLOs
  {
    id: 'slo-ai-quality',
    name: 'AI Response Quality',
    description: 'Percentage of responses meeting quality threshold',
    type: 'quality',
    target: 90.0,
    warningThreshold: 85.0,
    window: '7d',
    service: 'ai-inference',
    owner: 'ai-team',
    enabled: true,
    metadata: { qualityThreshold: 0.7 },
  },
];

// ============================================================================
// STORAGE
// ============================================================================

const sloDefinitions = new Map<string, SLODefinition>(
  DEFAULT_SLOS.map(slo => [slo.id, slo])
);

const sliHistory = new Map<string, SLI[]>();
const sloAlerts: SLOAlert[] = [];

// ============================================================================
// SLI RECORDING
// ============================================================================

/**
 * Record an SLI data point
 */
export function recordSLI(
  sloId: string,
  goodEvents: number,
  totalEvents: number
): SLI {
  const sli: SLI = {
    timestamp: new Date(),
    sloId,
    goodEvents,
    totalEvents,
    value: totalEvents > 0 ? (goodEvents / totalEvents) * 100 : 100,
  };

  if (!sliHistory.has(sloId)) {
    sliHistory.set(sloId, []);
  }

  const history = sliHistory.get(sloId)!;
  history.push(sli);

  // Keep last 30 days of data
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const filtered = history.filter(s => s.timestamp >= cutoff);
  sliHistory.set(sloId, filtered);

  return sli;
}

/**
 * Record a single event
 */
export function recordEvent(
  sloId: string,
  isGood: boolean
): void {
  const history = sliHistory.get(sloId) || [];
  const now = new Date();
  const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

  // Find or create current hour's SLI
  let currentSLI = history.find(
    s => s.timestamp.getTime() === hourStart.getTime()
  );

  if (!currentSLI) {
    currentSLI = {
      timestamp: hourStart,
      sloId,
      goodEvents: 0,
      totalEvents: 0,
      value: 100,
    };
    history.push(currentSLI);
    sliHistory.set(sloId, history);
  }

  currentSLI.totalEvents++;
  if (isGood) currentSLI.goodEvents++;
  currentSLI.value = (currentSLI.goodEvents / currentSLI.totalEvents) * 100;
}

// ============================================================================
// SLO CALCULATION
// ============================================================================

/**
 * Get window duration in milliseconds
 */
function getWindowMs(window: SLOWindow): number {
  switch (window) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    case '90d': return 90 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Calculate current SLO status
 */
export function calculateSLOStatus(sloId: string): SLOStatus | null {
  const slo = sloDefinitions.get(sloId);
  if (!slo) return null;

  const history = sliHistory.get(sloId) || [];
  const windowMs = getWindowMs(slo.window);
  const cutoff = new Date(Date.now() - windowMs);

  const windowHistory = history.filter(s => s.timestamp >= cutoff);

  if (windowHistory.length === 0) {
    return {
      sloId,
      sloName: slo.name,
      target: slo.target,
      current: 100,
      errorBudget: {
        total: 100 - slo.target,
        consumed: 0,
        remaining: 100 - slo.target,
        percentUsed: 0,
      },
      status: 'healthy',
      trend: 'stable',
      lastUpdated: new Date(),
      history: [],
    };
  }

  // Aggregate SLIs
  const totalGood = windowHistory.reduce((sum, s) => sum + s.goodEvents, 0);
  const totalEvents = windowHistory.reduce((sum, s) => sum + s.totalEvents, 0);
  const current = totalEvents > 0 ? (totalGood / totalEvents) * 100 : 100;

  // Calculate error budget
  const totalBudget = 100 - slo.target;
  const consumed = Math.max(0, 100 - current);
  const remaining = Math.max(0, totalBudget - consumed);
  const percentUsed = totalBudget > 0 ? (consumed / totalBudget) * 100 : 0;

  // Determine status
  let status: SLOStatus['status'] = 'healthy';
  if (current < slo.target) {
    status = 'violated';
  } else if (current < slo.warningThreshold) {
    status = 'critical';
  } else if (percentUsed > 80) {
    status = 'warning';
  }

  // Calculate trend (compare first half to second half)
  const midpoint = Math.floor(windowHistory.length / 2);
  const firstHalf = windowHistory.slice(0, midpoint);
  const secondHalf = windowHistory.slice(midpoint);

  const firstHalfValue = firstHalf.length > 0
    ? firstHalf.reduce((sum, s) => sum + s.value, 0) / firstHalf.length
    : current;
  const secondHalfValue = secondHalf.length > 0
    ? secondHalf.reduce((sum, s) => sum + s.value, 0) / secondHalf.length
    : current;

  let trend: SLOStatus['trend'] = 'stable';
  if (secondHalfValue > firstHalfValue + 1) trend = 'improving';
  else if (secondHalfValue < firstHalfValue - 1) trend = 'degrading';

  // Check for alerts
  checkAndAlert(slo, current, status);

  return {
    sloId,
    sloName: slo.name,
    target: slo.target,
    current: Math.round(current * 100) / 100,
    errorBudget: {
      total: Math.round(totalBudget * 100) / 100,
      consumed: Math.round(consumed * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentUsed: Math.round(percentUsed * 100) / 100,
    },
    status,
    trend,
    lastUpdated: new Date(),
    history: windowHistory,
  };
}

// ============================================================================
// ALERTING
// ============================================================================

/**
 * Check and create alerts if needed
 */
function checkAndAlert(
  slo: SLODefinition,
  current: number,
  status: SLOStatus['status']
): void {
  if (status === 'healthy') return;

  // Check if similar alert exists in last hour
  const recentAlert = sloAlerts.find(
    a => a.sloId === slo.id &&
         a.triggeredAt > new Date(Date.now() - 60 * 60 * 1000) &&
         !a.resolvedAt
  );

  if (recentAlert) return;

  let severity: SLOAlert['severity'];
  let message: string;

  if (status === 'violated') {
    severity = 'critical';
    message = `SLO violated: ${slo.name} is at ${current.toFixed(2)}% (target: ${slo.target}%)`;
  } else if (status === 'critical') {
    severity = 'error';
    message = `SLO at risk: ${slo.name} is at ${current.toFixed(2)}% (warning: ${slo.warningThreshold}%)`;
  } else {
    severity = 'warning';
    message = `Error budget running low for ${slo.name}`;
  }

  const alert: SLOAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    sloId: slo.id,
    severity,
    message,
    threshold: status === 'violated' ? slo.target : slo.warningThreshold,
    actual: current,
    triggeredAt: new Date(),
  };

  sloAlerts.push(alert);
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): SLOAlert[] {
  return sloAlerts.filter(a => !a.resolvedAt);
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
  const alert = sloAlerts.find(a => a.id === alertId);
  if (!alert) return false;

  alert.acknowledgedAt = new Date();
  alert.acknowledgedBy = acknowledgedBy;
  return true;
}

/**
 * Resolve an alert
 */
export function resolveAlert(alertId: string): boolean {
  const alert = sloAlerts.find(a => a.id === alertId);
  if (!alert) return false;

  alert.resolvedAt = new Date();
  return true;
}

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * Generate SLO report
 */
export function generateSLOReport(period?: { start: Date; end: Date }): SLOReport {
  const now = new Date();
  const periodStart = period?.start || new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const periodEnd = period?.end || now;

  const slos: SLOStatus[] = [];
  const violatedSLOs: string[] = [];
  const atRiskSLOs: string[] = [];

  for (const [sloId] of sloDefinitions) {
    const status = calculateSLOStatus(sloId);
    if (status) {
      slos.push(status);

      if (status.status === 'violated') {
        violatedSLOs.push(status.sloName);
      } else if (status.status === 'critical' || status.status === 'warning') {
        atRiskSLOs.push(status.sloName);
      }
    }
  }

  // Determine overall health
  let overallHealth: SLOReport['overallHealth'] = 'healthy';
  if (violatedSLOs.length > 0) overallHealth = 'critical';
  else if (atRiskSLOs.length > 0) overallHealth = 'at_risk';

  // Generate recommendations
  const recommendations: string[] = [];

  if (violatedSLOs.length > 0) {
    recommendations.push(`Critical: ${violatedSLOs.length} SLO(s) violated. Immediate action required.`);
  }

  for (const slo of slos) {
    if (slo.errorBudget.percentUsed > 80 && slo.status !== 'violated') {
      recommendations.push(`Warning: ${slo.sloName} has used ${slo.errorBudget.percentUsed.toFixed(0)}% of error budget.`);
    }
    if (slo.trend === 'degrading') {
      recommendations.push(`Trend alert: ${slo.sloName} is showing degradation. Monitor closely.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('All SLOs are healthy. Continue monitoring.');
  }

  return {
    generatedAt: now,
    period: { start: periodStart, end: periodEnd },
    slos,
    overallHealth,
    violatedSLOs,
    atRiskSLOs,
    recommendations,
  };
}

/**
 * Get dashboard summary
 */
export function getDashboardSummary(): {
  totalSLOs: number;
  healthySLOs: number;
  atRiskSLOs: number;
  violatedSLOs: number;
  activeAlerts: number;
  avgErrorBudgetUsed: number;
} {
  const report = generateSLOReport();

  const healthyCounts = {
    healthy: 0,
    warning: 0,
    critical: 0,
    violated: 0,
  };

  let totalErrorBudgetUsed = 0;

  for (const slo of report.slos) {
    healthyCounts[slo.status]++;
    totalErrorBudgetUsed += slo.errorBudget.percentUsed;
  }

  return {
    totalSLOs: report.slos.length,
    healthySLOs: healthyCounts.healthy,
    atRiskSLOs: healthyCounts.warning + healthyCounts.critical,
    violatedSLOs: healthyCounts.violated,
    activeAlerts: getActiveAlerts().length,
    avgErrorBudgetUsed: report.slos.length > 0
      ? Math.round(totalErrorBudgetUsed / report.slos.length)
      : 0,
  };
}

// ============================================================================
// SLO MANAGEMENT
// ============================================================================

/**
 * Add or update SLO definition
 */
export function upsertSLO(slo: SLODefinition): void {
  sloDefinitions.set(slo.id, slo);
}

/**
 * Get all SLO definitions
 */
export function getAllSLOs(): SLODefinition[] {
  return Array.from(sloDefinitions.values());
}

/**
 * Get SLO by ID
 */
export function getSLO(sloId: string): SLODefinition | undefined {
  return sloDefinitions.get(sloId);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // SLI recording
  recordSLI,
  recordEvent,

  // SLO calculation
  calculateSLOStatus,
  generateSLOReport,
  getDashboardSummary,

  // Alerting
  getActiveAlerts,
  acknowledgeAlert,
  resolveAlert,

  // Management
  upsertSLO,
  getAllSLOs,
  getSLO,

  // Constants
  DEFAULT_SLOS,
};
