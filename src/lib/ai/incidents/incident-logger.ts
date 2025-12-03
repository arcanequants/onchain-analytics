/**
 * AI Incident Logger
 *
 * Phase 4, Week 8 Extended - CTO/CAIO Executive Checklist
 *
 * Features:
 * - AI incident classification (P0-P4)
 * - Incident logging to database
 * - Automated alerting for critical issues
 * - Incident analytics and reporting
 * - Integration with postmortem workflow
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type IncidentSeverity = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'open' | 'investigating' | 'mitigated' | 'resolved' | 'closed';
export type IncidentCategory =
  | 'safety'
  | 'accuracy'
  | 'availability'
  | 'performance'
  | 'security'
  | 'bias'
  | 'privacy'
  | 'compliance';

export interface AIIncident {
  id?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  category: IncidentCategory;
  title: string;
  description: string;
  provider?: string;
  model?: string;
  affectedUsers?: number;
  affectedRequests?: number;
  detectedAt: string;
  acknowledgedAt?: string;
  mitigatedAt?: string;
  resolvedAt?: string;
  rootCause?: string;
  resolution?: string;
  preventiveActions?: string[];
  timeToAcknowledge?: number;
  timeToMitigate?: number;
  timeToResolve?: number;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
}

export interface IncidentUpdate {
  id?: string;
  incidentId: string;
  updateType: 'status_change' | 'investigation' | 'mitigation' | 'resolution' | 'note';
  previousStatus?: IncidentStatus;
  newStatus?: IncidentStatus;
  content: string;
  createdAt: string;
  createdBy?: string;
}

export interface IncidentAlert {
  severity: IncidentSeverity;
  channels: AlertChannel[];
  message: string;
  incidentId: string;
  sentAt?: string;
}

export type AlertChannel = 'slack' | 'email' | 'pagerduty' | 'webhook';

export interface IncidentMetrics {
  totalIncidents: number;
  bySeverity: Record<IncidentSeverity, number>;
  byCategory: Record<IncidentCategory, number>;
  byStatus: Record<IncidentStatus, number>;
  avgTimeToAcknowledge: number;
  avgTimeToMitigate: number;
  avgTimeToResolve: number;
  mttr: number; // Mean Time To Resolve
  mtta: number; // Mean Time To Acknowledge
}

// ============================================================================
// SEVERITY CONFIGURATION
// ============================================================================

export const SEVERITY_CONFIG: Record<IncidentSeverity, {
  label: string;
  description: string;
  responseTime: string;
  responseMinutes: number;
  alertChannels: AlertChannel[];
  color: string;
}> = {
  P0: {
    label: 'Critical',
    description: 'Critical safety issue - harmful content or security breach',
    responseTime: '15 minutes',
    responseMinutes: 15,
    alertChannels: ['pagerduty', 'slack', 'email'],
    color: '#EF4444',
  },
  P1: {
    label: 'Major',
    description: 'Major accuracy failure or significant user impact',
    responseTime: '1 hour',
    responseMinutes: 60,
    alertChannels: ['slack', 'email'],
    color: '#F97316',
  },
  P2: {
    label: 'Significant',
    description: 'Significant issue affecting multiple users',
    responseTime: '4 hours',
    responseMinutes: 240,
    alertChannels: ['slack'],
    color: '#F59E0B',
  },
  P3: {
    label: 'Minor',
    description: 'Minor issue with limited impact',
    responseTime: '24 hours',
    responseMinutes: 1440,
    alertChannels: ['slack'],
    color: '#3B82F6',
  },
  P4: {
    label: 'Improvement',
    description: 'Performance optimization or enhancement',
    responseTime: '1 week',
    responseMinutes: 10080,
    alertChannels: [],
    color: '#6B7280',
  },
};

// ============================================================================
// INCIDENT LOGGER CLASS
// ============================================================================

export class AIIncidentLogger {
  private supabase: SupabaseClient | null = null;
  private alertHandlers: Map<AlertChannel, (alert: IncidentAlert) => Promise<void>> = new Map();
  private incidentCache: Map<string, AIIncident> = new Map();

  constructor() {
    this.initializeSupabase();
    this.setupDefaultAlertHandlers();
  }

  private initializeSupabase(): void {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (url && key) {
      this.supabase = createClient(url, key);
    }
  }

  private setupDefaultAlertHandlers(): void {
    // Slack handler
    this.alertHandlers.set('slack', async (alert) => {
      const webhookUrl = process.env.SLACK_INCIDENT_WEBHOOK;
      if (!webhookUrl) return;

      const severity = SEVERITY_CONFIG[alert.severity];

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color: severity.color,
            title: `🚨 ${severity.label} AI Incident`,
            text: alert.message,
            fields: [
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Incident ID', value: alert.incidentId, short: true },
              { title: 'Response Time', value: severity.responseTime, short: true },
            ],
            ts: Math.floor(Date.now() / 1000),
          }],
        }),
      });
    });

    // Email handler
    this.alertHandlers.set('email', async (alert) => {
      // Would integrate with email service (e.g., Resend)
      console.log('[Incident Email]', alert.message);
    });

    // Webhook handler
    this.alertHandlers.set('webhook', async (alert) => {
      const webhookUrl = process.env.INCIDENT_WEBHOOK_URL;
      if (!webhookUrl) return;

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
      });
    });
  }

  /**
   * Create a new AI incident
   */
  async createIncident(incident: Omit<AIIncident, 'id' | 'detectedAt'>): Promise<AIIncident> {
    const now = new Date().toISOString();
    const fullIncident: AIIncident = {
      ...incident,
      id: crypto.randomUUID(),
      detectedAt: now,
      status: incident.status || 'open',
    };

    // Store in database
    if (this.supabase) {
      const { error } = await this.supabase
        .from('ai_incidents')
        .insert(this.toDbRecord(fullIncident));

      if (error) {
        console.error('[Incident Logger] Failed to store incident:', error);
      }
    }

    // Cache locally
    this.incidentCache.set(fullIncident.id!, fullIncident);

    // Send alerts
    await this.sendAlerts(fullIncident);

    return fullIncident;
  }

  /**
   * Update an existing incident
   */
  async updateIncident(
    incidentId: string,
    updates: Partial<AIIncident>,
    updateContent?: string,
    updatedBy?: string
  ): Promise<AIIncident | null> {
    const existing = await this.getIncident(incidentId);
    if (!existing) return null;

    const previousStatus = existing.status;
    const now = new Date().toISOString();

    // Calculate time metrics
    const updatedIncident: AIIncident = { ...existing, ...updates };

    if (updates.status === 'investigating' && !existing.acknowledgedAt) {
      updatedIncident.acknowledgedAt = now;
      updatedIncident.timeToAcknowledge =
        (new Date(now).getTime() - new Date(existing.detectedAt).getTime()) / 60000;
    }

    if (updates.status === 'mitigated' && !existing.mitigatedAt) {
      updatedIncident.mitigatedAt = now;
      updatedIncident.timeToMitigate =
        (new Date(now).getTime() - new Date(existing.detectedAt).getTime()) / 60000;
    }

    if (updates.status === 'resolved' && !existing.resolvedAt) {
      updatedIncident.resolvedAt = now;
      updatedIncident.timeToResolve =
        (new Date(now).getTime() - new Date(existing.detectedAt).getTime()) / 60000;
    }

    updatedIncident.updatedBy = updatedBy;

    // Update in database
    if (this.supabase) {
      await this.supabase
        .from('ai_incidents')
        .update(this.toDbRecord(updatedIncident))
        .eq('id', incidentId);

      // Log update
      if (updateContent || updates.status !== previousStatus) {
        await this.supabase.from('ai_incident_updates').insert({
          incident_id: incidentId,
          update_type: updates.status !== previousStatus ? 'status_change' : 'note',
          previous_status: previousStatus,
          new_status: updates.status,
          content: updateContent || `Status changed to ${updates.status}`,
          created_at: now,
          created_by: updatedBy,
        });
      }
    }

    // Update cache
    this.incidentCache.set(incidentId, updatedIncident);

    return updatedIncident;
  }

  /**
   * Get incident by ID
   */
  async getIncident(incidentId: string): Promise<AIIncident | null> {
    // Check cache first
    if (this.incidentCache.has(incidentId)) {
      return this.incidentCache.get(incidentId)!;
    }

    // Fetch from database
    if (this.supabase) {
      const { data, error } = await this.supabase
        .from('ai_incidents')
        .select('*')
        .eq('id', incidentId)
        .single();

      if (error || !data) return null;

      const incident = this.fromDbRecord(data);
      this.incidentCache.set(incidentId, incident);
      return incident;
    }

    return null;
  }

  /**
   * List incidents with filters
   */
  async listIncidents(options: {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    category?: IncidentCategory;
    provider?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<AIIncident[]> {
    if (!this.supabase) return [];

    let query = this.supabase
      .from('ai_incidents')
      .select('*')
      .order('detected_at', { ascending: false });

    if (options.status) query = query.eq('status', options.status);
    if (options.severity) query = query.eq('severity', options.severity);
    if (options.category) query = query.eq('category', options.category);
    if (options.provider) query = query.eq('provider', options.provider);
    if (options.fromDate) query = query.gte('detected_at', options.fromDate);
    if (options.toDate) query = query.lte('detected_at', options.toDate);
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error } = await query;

    if (error || !data) return [];
    return data.map(this.fromDbRecord);
  }

  /**
   * Get incident metrics
   */
  async getMetrics(options: {
    fromDate?: string;
    toDate?: string;
  } = {}): Promise<IncidentMetrics> {
    const incidents = await this.listIncidents(options);

    const metrics: IncidentMetrics = {
      totalIncidents: incidents.length,
      bySeverity: { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0 },
      byCategory: {
        safety: 0, accuracy: 0, availability: 0, performance: 0,
        security: 0, bias: 0, privacy: 0, compliance: 0,
      },
      byStatus: { open: 0, investigating: 0, mitigated: 0, resolved: 0, closed: 0 },
      avgTimeToAcknowledge: 0,
      avgTimeToMitigate: 0,
      avgTimeToResolve: 0,
      mttr: 0,
      mtta: 0,
    };

    let totalTTA = 0, countTTA = 0;
    let totalTTM = 0, countTTM = 0;
    let totalTTR = 0, countTTR = 0;

    for (const incident of incidents) {
      metrics.bySeverity[incident.severity]++;
      metrics.byCategory[incident.category]++;
      metrics.byStatus[incident.status]++;

      if (incident.timeToAcknowledge) {
        totalTTA += incident.timeToAcknowledge;
        countTTA++;
      }
      if (incident.timeToMitigate) {
        totalTTM += incident.timeToMitigate;
        countTTM++;
      }
      if (incident.timeToResolve) {
        totalTTR += incident.timeToResolve;
        countTTR++;
      }
    }

    metrics.avgTimeToAcknowledge = countTTA > 0 ? totalTTA / countTTA : 0;
    metrics.avgTimeToMitigate = countTTM > 0 ? totalTTM / countTTM : 0;
    metrics.avgTimeToResolve = countTTR > 0 ? totalTTR / countTTR : 0;
    metrics.mtta = metrics.avgTimeToAcknowledge;
    metrics.mttr = metrics.avgTimeToResolve;

    return metrics;
  }

  /**
   * Send alerts for incident
   */
  private async sendAlerts(incident: AIIncident): Promise<void> {
    const config = SEVERITY_CONFIG[incident.severity];
    const alert: IncidentAlert = {
      severity: incident.severity,
      channels: config.alertChannels,
      message: `${incident.title}\n\n${incident.description}`,
      incidentId: incident.id!,
      sentAt: new Date().toISOString(),
    };

    for (const channel of config.alertChannels) {
      const handler = this.alertHandlers.get(channel);
      if (handler) {
        try {
          await handler(alert);
        } catch (error) {
          console.error(`[Incident Alert] Failed to send ${channel} alert:`, error);
        }
      }
    }
  }

  /**
   * Register custom alert handler
   */
  registerAlertHandler(channel: AlertChannel, handler: (alert: IncidentAlert) => Promise<void>): void {
    this.alertHandlers.set(channel, handler);
  }

  /**
   * Convert to database record
   */
  private toDbRecord(incident: AIIncident): Record<string, unknown> {
    return {
      id: incident.id,
      severity: incident.severity,
      status: incident.status,
      category: incident.category,
      title: incident.title,
      description: incident.description,
      provider: incident.provider,
      model: incident.model,
      affected_users: incident.affectedUsers,
      affected_requests: incident.affectedRequests,
      detected_at: incident.detectedAt,
      acknowledged_at: incident.acknowledgedAt,
      mitigated_at: incident.mitigatedAt,
      resolved_at: incident.resolvedAt,
      root_cause: incident.rootCause,
      resolution: incident.resolution,
      preventive_actions: incident.preventiveActions,
      time_to_acknowledge: incident.timeToAcknowledge,
      time_to_mitigate: incident.timeToMitigate,
      time_to_resolve: incident.timeToResolve,
      metadata: incident.metadata,
      created_by: incident.createdBy,
      updated_by: incident.updatedBy,
    };
  }

  /**
   * Convert from database record
   */
  private fromDbRecord(record: Record<string, unknown>): AIIncident {
    return {
      id: record.id as string,
      severity: record.severity as IncidentSeverity,
      status: record.status as IncidentStatus,
      category: record.category as IncidentCategory,
      title: record.title as string,
      description: record.description as string,
      provider: record.provider as string | undefined,
      model: record.model as string | undefined,
      affectedUsers: record.affected_users as number | undefined,
      affectedRequests: record.affected_requests as number | undefined,
      detectedAt: record.detected_at as string,
      acknowledgedAt: record.acknowledged_at as string | undefined,
      mitigatedAt: record.mitigated_at as string | undefined,
      resolvedAt: record.resolved_at as string | undefined,
      rootCause: record.root_cause as string | undefined,
      resolution: record.resolution as string | undefined,
      preventiveActions: record.preventive_actions as string[] | undefined,
      timeToAcknowledge: record.time_to_acknowledge as number | undefined,
      timeToMitigate: record.time_to_mitigate as number | undefined,
      timeToResolve: record.time_to_resolve as number | undefined,
      metadata: record.metadata as Record<string, unknown> | undefined,
      createdBy: record.created_by as string | undefined,
      updatedBy: record.updated_by as string | undefined,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick incident creation helpers
 */
export const createSafetyIncident = (
  title: string,
  description: string,
  options: Partial<AIIncident> = {}
) => incidentLogger.createIncident({
  severity: 'P0',
  category: 'safety',
  status: 'open',
  title,
  description,
  ...options,
});

export const createAccuracyIncident = (
  title: string,
  description: string,
  options: Partial<AIIncident> = {}
) => incidentLogger.createIncident({
  severity: 'P1',
  category: 'accuracy',
  status: 'open',
  title,
  description,
  ...options,
});

export const createAvailabilityIncident = (
  provider: string,
  description: string,
  options: Partial<AIIncident> = {}
) => incidentLogger.createIncident({
  severity: 'P2',
  category: 'availability',
  status: 'open',
  title: `${provider} Availability Issue`,
  description,
  provider,
  ...options,
});

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const incidentLogger = new AIIncidentLogger();

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AIIncidentLogger,
  incidentLogger,
  SEVERITY_CONFIG,
  createSafetyIncident,
  createAccuracyIncident,
  createAvailabilityIncident,
};
