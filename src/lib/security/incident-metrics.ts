/**
 * Incident Metrics - MTTD/MTTR Monitoring
 *
 * Phase 4, Week 8 - CISO Security Checklist
 *
 * Tracks and reports on incident response metrics:
 * - MTTD (Mean Time to Detect) - Target: < 10 minutes
 * - MTTR (Mean Time to Respond) - Target: < 60 minutes
 */

// ============================================================================
// TYPES
// ============================================================================

export type IncidentSeverity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';
export type IncidentStatus = 'detected' | 'acknowledged' | 'investigating' | 'mitigating' | 'resolved' | 'closed';

export interface IncidentTimeline {
  /** When the incident actually occurred (may be backfilled) */
  occurredAt: Date;
  /** When the incident was detected by monitoring/alerts */
  detectedAt: Date;
  /** When the incident was acknowledged by on-call */
  acknowledgedAt?: Date;
  /** When investigation started */
  investigationStartedAt?: Date;
  /** When mitigation started */
  mitigationStartedAt?: Date;
  /** When the incident was resolved */
  resolvedAt?: Date;
  /** When the incident was closed (post-mortem complete) */
  closedAt?: Date;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  timeline: IncidentTimeline;
  impactedServices: string[];
  rootCause?: string;
  postmortemUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentMetrics {
  /** Mean Time to Detect in minutes */
  mttd: number;
  /** Mean Time to Respond (Acknowledge) in minutes */
  mttr: number;
  /** Mean Time to Resolve in minutes */
  mtres: number;
  /** Total incidents in period */
  totalIncidents: number;
  /** Incidents by severity */
  bySeverity: Record<IncidentSeverity, number>;
  /** Period start */
  periodStart: Date;
  /** Period end */
  periodEnd: Date;
}

export interface SLOCompliance {
  mttd: {
    target: number; // minutes
    actual: number;
    passing: boolean;
    margin: number; // percentage
  };
  mttr: {
    target: number;
    actual: number;
    passing: boolean;
    margin: number;
  };
}

// ============================================================================
// SLO TARGETS
// ============================================================================

export const INCIDENT_SLOS = {
  MTTD: {
    SEV1: 5, // 5 minutes for critical
    SEV2: 10, // 10 minutes for high
    SEV3: 30, // 30 minutes for medium
    SEV4: 60, // 1 hour for low
  },
  MTTR: {
    SEV1: 15, // 15 minutes for critical
    SEV2: 60, // 1 hour for high
    SEV3: 240, // 4 hours for medium
    SEV4: 1440, // 24 hours for low
  },
  MTRES: {
    SEV1: 60, // 1 hour for critical
    SEV2: 240, // 4 hours for high
    SEV3: 1440, // 24 hours for medium
    SEV4: 4320, // 3 days for low
  },
};

// ============================================================================
// IN-MEMORY STORE (Production would use database)
// ============================================================================

class IncidentStore {
  private incidents: Map<string, Incident> = new Map();

  add(incident: Incident): void {
    this.incidents.set(incident.id, incident);
  }

  get(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  update(id: string, updates: Partial<Incident>): Incident | undefined {
    const incident = this.incidents.get(id);
    if (!incident) return undefined;

    const updated = {
      ...incident,
      ...updates,
      updatedAt: new Date(),
    };
    this.incidents.set(id, updated);
    return updated;
  }

  getAll(filter?: {
    since?: Date;
    until?: Date;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
  }): Incident[] {
    let incidents = Array.from(this.incidents.values());

    if (filter?.since) {
      incidents = incidents.filter(i => i.createdAt >= filter.since!);
    }
    if (filter?.until) {
      incidents = incidents.filter(i => i.createdAt <= filter.until!);
    }
    if (filter?.severity) {
      incidents = incidents.filter(i => i.severity === filter.severity);
    }
    if (filter?.status) {
      incidents = incidents.filter(i => i.status === filter.status);
    }

    return incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  clear(): void {
    this.incidents.clear();
  }
}

// ============================================================================
// METRIC CALCULATOR
// ============================================================================

function calculateMinutesDiff(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

function calculateMTTD(incidents: Incident[]): number {
  const validIncidents = incidents.filter(
    i => i.timeline.occurredAt && i.timeline.detectedAt
  );

  if (validIncidents.length === 0) return 0;

  const totalMinutes = validIncidents.reduce((sum, i) => {
    return sum + calculateMinutesDiff(i.timeline.occurredAt, i.timeline.detectedAt);
  }, 0);

  return totalMinutes / validIncidents.length;
}

function calculateMTTR(incidents: Incident[]): number {
  const validIncidents = incidents.filter(
    i => i.timeline.detectedAt && i.timeline.acknowledgedAt
  );

  if (validIncidents.length === 0) return 0;

  const totalMinutes = validIncidents.reduce((sum, i) => {
    return sum + calculateMinutesDiff(i.timeline.detectedAt, i.timeline.acknowledgedAt!);
  }, 0);

  return totalMinutes / validIncidents.length;
}

function calculateMTRES(incidents: Incident[]): number {
  const validIncidents = incidents.filter(
    i => i.timeline.detectedAt && i.timeline.resolvedAt
  );

  if (validIncidents.length === 0) return 0;

  const totalMinutes = validIncidents.reduce((sum, i) => {
    return sum + calculateMinutesDiff(i.timeline.detectedAt, i.timeline.resolvedAt!);
  }, 0);

  return totalMinutes / validIncidents.length;
}

// ============================================================================
// INCIDENT METRICS SERVICE
// ============================================================================

export class IncidentMetricsService {
  private store: IncidentStore;

  constructor() {
    this.store = new IncidentStore();
  }

  /**
   * Create a new incident
   */
  createIncident(params: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    occurredAt?: Date;
    impactedServices?: string[];
  }): Incident {
    const now = new Date();
    const incident: Incident = {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: params.title,
      description: params.description,
      severity: params.severity,
      status: 'detected',
      timeline: {
        occurredAt: params.occurredAt || now,
        detectedAt: now,
      },
      impactedServices: params.impactedServices || [],
      createdAt: now,
      updatedAt: now,
    };

    this.store.add(incident);
    this.checkMTTDSLO(incident);

    return incident;
  }

  /**
   * Acknowledge an incident
   */
  acknowledgeIncident(id: string): Incident | undefined {
    const incident = this.store.get(id);
    if (!incident) return undefined;

    const updated = this.store.update(id, {
      status: 'acknowledged',
      timeline: {
        ...incident.timeline,
        acknowledgedAt: new Date(),
      },
    });

    if (updated) {
      this.checkMTTRSLO(updated);
    }

    return updated;
  }

  /**
   * Start investigation
   */
  startInvestigation(id: string): Incident | undefined {
    const incident = this.store.get(id);
    if (!incident) return undefined;

    return this.store.update(id, {
      status: 'investigating',
      timeline: {
        ...incident.timeline,
        investigationStartedAt: new Date(),
      },
    });
  }

  /**
   * Start mitigation
   */
  startMitigation(id: string): Incident | undefined {
    const incident = this.store.get(id);
    if (!incident) return undefined;

    return this.store.update(id, {
      status: 'mitigating',
      timeline: {
        ...incident.timeline,
        mitigationStartedAt: new Date(),
      },
    });
  }

  /**
   * Resolve an incident
   */
  resolveIncident(id: string, rootCause?: string): Incident | undefined {
    const incident = this.store.get(id);
    if (!incident) return undefined;

    return this.store.update(id, {
      status: 'resolved',
      rootCause,
      timeline: {
        ...incident.timeline,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Close an incident (post-mortem complete)
   */
  closeIncident(id: string, postmortemUrl?: string): Incident | undefined {
    const incident = this.store.get(id);
    if (!incident) return undefined;

    return this.store.update(id, {
      status: 'closed',
      postmortemUrl,
      timeline: {
        ...incident.timeline,
        closedAt: new Date(),
      },
    });
  }

  /**
   * Get incident by ID
   */
  getIncident(id: string): Incident | undefined {
    return this.store.get(id);
  }

  /**
   * Get all incidents with optional filters
   */
  getIncidents(filter?: {
    since?: Date;
    until?: Date;
    severity?: IncidentSeverity;
    status?: IncidentStatus;
  }): Incident[] {
    return this.store.getAll(filter);
  }

  /**
   * Calculate metrics for a period
   */
  calculateMetrics(periodStart: Date, periodEnd: Date): IncidentMetrics {
    const incidents = this.store.getAll({
      since: periodStart,
      until: periodEnd,
    });

    const bySeverity: Record<IncidentSeverity, number> = {
      SEV1: 0,
      SEV2: 0,
      SEV3: 0,
      SEV4: 0,
    };

    for (const incident of incidents) {
      bySeverity[incident.severity]++;
    }

    return {
      mttd: calculateMTTD(incidents),
      mttr: calculateMTTR(incidents),
      mtres: calculateMTRES(incidents),
      totalIncidents: incidents.length,
      bySeverity,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Get SLO compliance status
   */
  getSLOCompliance(periodStart: Date, periodEnd: Date): SLOCompliance {
    const metrics = this.calculateMetrics(periodStart, periodEnd);

    // Use overall targets (SEV2 as baseline)
    const mttdTarget = INCIDENT_SLOS.MTTD.SEV2;
    const mttrTarget = INCIDENT_SLOS.MTTR.SEV2;

    return {
      mttd: {
        target: mttdTarget,
        actual: metrics.mttd,
        passing: metrics.mttd <= mttdTarget,
        margin: ((mttdTarget - metrics.mttd) / mttdTarget) * 100,
      },
      mttr: {
        target: mttrTarget,
        actual: metrics.mttr,
        passing: metrics.mttr <= mttrTarget,
        margin: ((mttrTarget - metrics.mttr) / mttrTarget) * 100,
      },
    };
  }

  /**
   * Generate metrics report
   */
  generateReport(periodStart: Date, periodEnd: Date): {
    metrics: IncidentMetrics;
    sloCompliance: SLOCompliance;
    incidents: Incident[];
    summary: string;
  } {
    const metrics = this.calculateMetrics(periodStart, periodEnd);
    const sloCompliance = this.getSLOCompliance(periodStart, periodEnd);
    const incidents = this.store.getAll({ since: periodStart, until: periodEnd });

    const summary = `
Incident Metrics Report
=======================
Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}

Key Metrics:
- MTTD: ${metrics.mttd.toFixed(1)} minutes (Target: <${INCIDENT_SLOS.MTTD.SEV2} min) ${sloCompliance.mttd.passing ? '✓' : '✗'}
- MTTR: ${metrics.mttr.toFixed(1)} minutes (Target: <${INCIDENT_SLOS.MTTR.SEV2} min) ${sloCompliance.mttr.passing ? '✓' : '✗'}
- MTRES: ${metrics.mtres.toFixed(1)} minutes

Incident Count: ${metrics.totalIncidents}
- SEV1: ${metrics.bySeverity.SEV1}
- SEV2: ${metrics.bySeverity.SEV2}
- SEV3: ${metrics.bySeverity.SEV3}
- SEV4: ${metrics.bySeverity.SEV4}

SLO Status:
- MTTD: ${sloCompliance.mttd.passing ? 'PASSING' : 'FAILING'} (${sloCompliance.mttd.margin.toFixed(1)}% margin)
- MTTR: ${sloCompliance.mttr.passing ? 'PASSING' : 'FAILING'} (${sloCompliance.mttr.margin.toFixed(1)}% margin)
`.trim();

    return {
      metrics,
      sloCompliance,
      incidents,
      summary,
    };
  }

  /**
   * Check MTTD SLO and alert if exceeded
   */
  private checkMTTDSLO(incident: Incident): void {
    const mttd = calculateMinutesDiff(
      incident.timeline.occurredAt,
      incident.timeline.detectedAt
    );
    const target = INCIDENT_SLOS.MTTD[incident.severity];

    if (mttd > target) {
      console.warn(
        `[IncidentMetrics] MTTD SLO exceeded for ${incident.id}: ${mttd.toFixed(1)} min > ${target} min target`
      );
      // In production: trigger alert
    }
  }

  /**
   * Check MTTR SLO and alert if exceeded
   */
  private checkMTTRSLO(incident: Incident): void {
    if (!incident.timeline.acknowledgedAt) return;

    const mttr = calculateMinutesDiff(
      incident.timeline.detectedAt,
      incident.timeline.acknowledgedAt
    );
    const target = INCIDENT_SLOS.MTTR[incident.severity];

    if (mttr > target) {
      console.warn(
        `[IncidentMetrics] MTTR SLO exceeded for ${incident.id}: ${mttr.toFixed(1)} min > ${target} min target`
      );
      // In production: trigger alert
    }
  }

  /**
   * Clear all incidents (for testing)
   */
  clear(): void {
    this.store.clear();
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let metricsInstance: IncidentMetricsService | null = null;

export function getIncidentMetricsService(): IncidentMetricsService {
  if (!metricsInstance) {
    metricsInstance = new IncidentMetricsService();
  }
  return metricsInstance;
}

export function resetIncidentMetricsService(): void {
  metricsInstance = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getIncidentMetricsService,
  resetIncidentMetricsService,
  INCIDENT_SLOS,
};
