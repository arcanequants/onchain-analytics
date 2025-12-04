/**
 * SLA Monitoring System
 *
 * RED TEAM AUDIT FIX: MEDIUM-006
 * Automated SLA tracking and alerting
 *
 * Features:
 * - Response time tracking
 * - Availability monitoring
 * - Error rate tracking
 * - SLA breach detection
 * - Automated alerts
 * - Historical reporting
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SLADefinition {
  name: string;
  metric: 'response_time' | 'availability' | 'error_rate' | 'throughput';
  target: number;
  threshold: number;  // Warning threshold
  unit: 'ms' | 'percent' | 'requests_per_second';
  window: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export interface SLAStatus {
  sla: SLADefinition;
  currentValue: number;
  status: 'healthy' | 'warning' | 'breached';
  samples: number;
  lastUpdated: string;
  breachCount: number;
  compliancePercent: number;
}

export interface SLAAlert {
  id: string;
  timestamp: string;
  slaName: string;
  severity: 'warning' | 'critical';
  message: string;
  currentValue: number;
  targetValue: number;
  duration: number;  // How long the breach has lasted
  acknowledged: boolean;
}

export interface SLAMetricPoint {
  timestamp: string;
  value: number;
  slaName: string;
}

export interface SLAReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalSLAs: number;
    healthySLAs: number;
    breachedSLAs: number;
    overallCompliance: number;
  };
  slaStatuses: SLAStatus[];
  alerts: SLAAlert[];
  recommendations: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SLAS: SLADefinition[] = [
  {
    name: 'API Response Time',
    metric: 'response_time',
    target: 500,       // 500ms target
    threshold: 800,    // 800ms warning
    unit: 'ms',
    window: 'minute',
  },
  {
    name: 'API Availability',
    metric: 'availability',
    target: 99.9,      // 99.9% target
    threshold: 99.5,   // 99.5% warning
    unit: 'percent',
    window: 'day',
  },
  {
    name: 'Error Rate',
    metric: 'error_rate',
    target: 0.1,       // 0.1% target
    threshold: 0.5,    // 0.5% warning
    unit: 'percent',
    window: 'hour',
  },
  {
    name: 'AI Analysis Time',
    metric: 'response_time',
    target: 10000,     // 10s target
    threshold: 15000,  // 15s warning
    unit: 'ms',
    window: 'minute',
  },
  {
    name: 'Throughput',
    metric: 'throughput',
    target: 100,       // 100 req/s
    threshold: 50,     // 50 req/s warning
    unit: 'requests_per_second',
    window: 'minute',
  },
];

// ============================================================================
// METRICS STORAGE
// ============================================================================

interface MetricsWindow {
  values: number[];
  timestamps: number[];
  lastCleanup: number;
}

// ============================================================================
// SLA MONITOR CLASS
// ============================================================================

export class SLAMonitor {
  private slas: Map<string, SLADefinition> = new Map();
  private metrics: Map<string, MetricsWindow> = new Map();
  private alerts: SLAAlert[] = [];
  private breachStartTimes: Map<string, number> = new Map();

  constructor(slaDefinitions: SLADefinition[] = DEFAULT_SLAS) {
    for (const sla of slaDefinitions) {
      this.slas.set(sla.name, sla);
      this.metrics.set(sla.name, {
        values: [],
        timestamps: [],
        lastCleanup: Date.now(),
      });
    }
  }

  /**
   * Record a metric value
   */
  recordMetric(slaName: string, value: number): void {
    const window = this.metrics.get(slaName);
    if (!window) {
      console.warn(`[SLA] Unknown SLA: ${slaName}`);
      return;
    }

    const now = Date.now();
    window.values.push(value);
    window.timestamps.push(now);

    // Clean up old values periodically
    if (now - window.lastCleanup > 60000) {
      this.cleanupWindow(slaName);
    }

    // Check for SLA breach
    this.checkSLA(slaName);
  }

  /**
   * Clean up old metric values based on window
   */
  private cleanupWindow(slaName: string): void {
    const sla = this.slas.get(slaName);
    const window = this.metrics.get(slaName);

    if (!sla || !window) return;

    const now = Date.now();
    const cutoff = this.getWindowCutoff(sla.window);

    const validIndices: number[] = [];
    for (let i = 0; i < window.timestamps.length; i++) {
      if (now - window.timestamps[i] < cutoff) {
        validIndices.push(i);
      }
    }

    window.values = validIndices.map((i) => window.values[i]);
    window.timestamps = validIndices.map((i) => window.timestamps[i]);
    window.lastCleanup = now;
  }

  /**
   * Get window duration in milliseconds
   */
  private getWindowCutoff(window: SLADefinition['window']): number {
    switch (window) {
      case 'minute': return 60 * 1000;
      case 'hour': return 60 * 60 * 1000;
      case 'day': return 24 * 60 * 60 * 1000;
      case 'week': return 7 * 24 * 60 * 60 * 1000;
      case 'month': return 30 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Calculate current metric value
   */
  private calculateCurrentValue(slaName: string): number {
    const sla = this.slas.get(slaName);
    const window = this.metrics.get(slaName);

    if (!sla || !window || window.values.length === 0) return 0;

    switch (sla.metric) {
      case 'response_time':
        // Return p95 response time
        const sorted = [...window.values].sort((a, b) => a - b);
        const p95Index = Math.floor(sorted.length * 0.95);
        return sorted[p95Index] || 0;

      case 'availability':
        // Assuming values are 1 (up) or 0 (down)
        const upCount = window.values.filter((v) => v === 1).length;
        return (upCount / window.values.length) * 100;

      case 'error_rate':
        // Assuming values are 1 (error) or 0 (success)
        const errorCount = window.values.filter((v) => v === 1).length;
        return (errorCount / window.values.length) * 100;

      case 'throughput':
        const windowMs = this.getWindowCutoff(sla.window);
        return window.values.length / (windowMs / 1000);
    }
  }

  /**
   * Check SLA status and generate alerts
   */
  private checkSLA(slaName: string): void {
    const sla = this.slas.get(slaName);
    if (!sla) return;

    const currentValue = this.calculateCurrentValue(slaName);
    const status = this.getSLAStatus(sla, currentValue);

    if (status === 'breached') {
      this.handleBreach(sla, currentValue);
    } else if (status === 'warning') {
      this.handleWarning(sla, currentValue);
    } else {
      // Clear breach tracking if healthy
      this.breachStartTimes.delete(slaName);
    }
  }

  /**
   * Determine SLA status
   */
  private getSLAStatus(
    sla: SLADefinition,
    currentValue: number
  ): 'healthy' | 'warning' | 'breached' {
    // For metrics where lower is better (response time, error rate)
    const lowerIsBetter = sla.metric === 'response_time' || sla.metric === 'error_rate';

    if (lowerIsBetter) {
      if (currentValue > sla.target) return 'breached';
      if (currentValue > sla.threshold) return 'warning';
    } else {
      // For metrics where higher is better (availability, throughput)
      if (currentValue < sla.target) return 'breached';
      if (currentValue < sla.threshold) return 'warning';
    }

    return 'healthy';
  }

  /**
   * Handle SLA breach
   */
  private handleBreach(sla: SLADefinition, currentValue: number): void {
    const now = Date.now();

    // Track breach start time
    if (!this.breachStartTimes.has(sla.name)) {
      this.breachStartTimes.set(sla.name, now);
    }

    const breachDuration = now - (this.breachStartTimes.get(sla.name) || now);

    // Generate alert if not already alerted recently
    const recentAlert = this.alerts.find(
      (a) =>
        a.slaName === sla.name &&
        !a.acknowledged &&
        now - new Date(a.timestamp).getTime() < 300000 // 5 minutes
    );

    if (!recentAlert) {
      this.alerts.push({
        id: `sla_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
        slaName: sla.name,
        severity: 'critical',
        message: `SLA breach: ${sla.name} is at ${currentValue.toFixed(2)}${sla.unit === 'percent' ? '%' : sla.unit} (target: ${sla.target}${sla.unit === 'percent' ? '%' : sla.unit})`,
        currentValue,
        targetValue: sla.target,
        duration: breachDuration,
        acknowledged: false,
      });
    }
  }

  /**
   * Handle SLA warning
   */
  private handleWarning(sla: SLADefinition, currentValue: number): void {
    const now = Date.now();

    // Generate warning alert if not already warned recently
    const recentWarning = this.alerts.find(
      (a) =>
        a.slaName === sla.name &&
        a.severity === 'warning' &&
        !a.acknowledged &&
        now - new Date(a.timestamp).getTime() < 900000 // 15 minutes
    );

    if (!recentWarning) {
      this.alerts.push({
        id: `sla_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        timestamp: new Date().toISOString(),
        slaName: sla.name,
        severity: 'warning',
        message: `SLA warning: ${sla.name} is approaching threshold at ${currentValue.toFixed(2)}${sla.unit === 'percent' ? '%' : sla.unit}`,
        currentValue,
        targetValue: sla.target,
        duration: 0,
        acknowledged: false,
      });
    }
  }

  /**
   * Get all SLA statuses
   */
  getStatuses(): SLAStatus[] {
    const statuses: SLAStatus[] = [];

    for (const [name, sla] of this.slas) {
      const window = this.metrics.get(name);
      const currentValue = this.calculateCurrentValue(name);
      const status = this.getSLAStatus(sla, currentValue);

      // Count breaches in history
      const breachCount = this.alerts.filter(
        (a) => a.slaName === name && a.severity === 'critical'
      ).length;

      // Calculate compliance
      const allChecks = (window?.values.length || 0);
      const compliantChecks = allChecks - breachCount;
      const compliancePercent = allChecks > 0 ? (compliantChecks / allChecks) * 100 : 100;

      statuses.push({
        sla,
        currentValue,
        status,
        samples: window?.values.length || 0,
        lastUpdated: new Date().toISOString(),
        breachCount,
        compliancePercent,
      });
    }

    return statuses;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SLAAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Generate SLA report
   */
  generateReport(periodDays: number = 30): SLAReport {
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);

    const statuses = this.getStatuses();
    const periodAlerts = this.alerts.filter(
      (a) => new Date(a.timestamp) >= periodStart
    );

    const healthySLAs = statuses.filter((s) => s.status === 'healthy').length;
    const breachedSLAs = statuses.filter((s) => s.status === 'breached').length;
    const overallCompliance =
      statuses.reduce((sum, s) => sum + s.compliancePercent, 0) / statuses.length;

    // Generate recommendations
    const recommendations: string[] = [];
    for (const status of statuses) {
      if (status.status === 'breached') {
        recommendations.push(
          `Investigate ${status.sla.name} - currently ${status.status} at ${status.currentValue.toFixed(2)}${status.sla.unit === 'percent' ? '%' : status.sla.unit}`
        );
      }
    }

    if (breachedSLAs > 0) {
      recommendations.push('Consider scaling infrastructure to improve response times');
    }

    if (overallCompliance < 99) {
      recommendations.push('Review error handling and retry logic');
    }

    return {
      period: {
        start: periodStart.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        totalSLAs: statuses.length,
        healthySLAs,
        breachedSLAs,
        overallCompliance,
      },
      slaStatuses: statuses,
      alerts: periodAlerts,
      recommendations,
    };
  }

  /**
   * Add a custom SLA definition
   */
  addSLA(sla: SLADefinition): void {
    this.slas.set(sla.name, sla);
    this.metrics.set(sla.name, {
      values: [],
      timestamps: [],
      lastCleanup: Date.now(),
    });
  }

  /**
   * Remove an SLA definition
   */
  removeSLA(name: string): boolean {
    this.metrics.delete(name);
    return this.slas.delete(name);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let slaMonitorInstance: SLAMonitor | null = null;

export function getSLAMonitor(slaDefinitions?: SLADefinition[]): SLAMonitor {
  if (!slaMonitorInstance) {
    slaMonitorInstance = new SLAMonitor(slaDefinitions);
  }
  return slaMonitorInstance;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Record API response time
 */
export function recordResponseTime(endpoint: string, durationMs: number): void {
  const monitor = getSLAMonitor();
  monitor.recordMetric('API Response Time', durationMs);
}

/**
 * Record AI analysis time
 */
export function recordAIAnalysisTime(durationMs: number): void {
  const monitor = getSLAMonitor();
  monitor.recordMetric('AI Analysis Time', durationMs);
}

/**
 * Record success/failure for availability
 */
export function recordAvailability(success: boolean): void {
  const monitor = getSLAMonitor();
  monitor.recordMetric('API Availability', success ? 1 : 0);
}

/**
 * Record error occurrence
 */
export function recordError(isError: boolean): void {
  const monitor = getSLAMonitor();
  monitor.recordMetric('Error Rate', isError ? 1 : 0);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SLAMonitor,
  getSLAMonitor,
  recordResponseTime,
  recordAIAnalysisTime,
  recordAvailability,
  recordError,
  DEFAULT_SLAS,
};
