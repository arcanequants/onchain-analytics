/**
 * Comprehensive Audit Logging System
 *
 * RED TEAM AUDIT FIX: MEDIUM-005
 * Complete audit trail for all sensitive operations
 *
 * Features:
 * - Structured logging for all operations
 * - PII handling (masking/hashing)
 * - Retention policy support
 * - Query capabilities
 * - Export functionality
 * - Real-time streaming to Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type AuditEventType =
  // Authentication events
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'
  | 'auth.password_reset'
  | 'auth.token_refresh'
  | 'auth.api_key_created'
  | 'auth.api_key_revoked'
  // Data access events
  | 'data.read'
  | 'data.create'
  | 'data.update'
  | 'data.delete'
  | 'data.export'
  // AI operation events
  | 'ai.request'
  | 'ai.response'
  | 'ai.error'
  | 'ai.rate_limited'
  | 'ai.jailbreak_detected'
  | 'ai.prompt_leakage'
  | 'ai.override'
  // Security events
  | 'security.csrf_failure'
  | 'security.rate_limit_hit'
  | 'security.blocked_ip'
  | 'security.ssrf_attempt'
  | 'security.injection_attempt'
  // Admin events
  | 'admin.config_change'
  | 'admin.user_role_change'
  | 'admin.feature_toggle'
  | 'admin.data_purge'
  // System events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error'
  | 'system.maintenance';

export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface AuditEvent {
  id?: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action: string;
  outcome: 'success' | 'failure' | 'blocked';
  details: Record<string, unknown>;
  metadata: {
    requestId?: string;
    duration?: number;
    source?: string;
    environment?: string;
  };
}

export interface AuditLogQuery {
  eventTypes?: AuditEventType[];
  severities?: AuditSeverity[];
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  outcome?: 'success' | 'failure' | 'blocked';
  limit?: number;
  offset?: number;
}

export interface AuditLogConfig {
  enabled?: boolean;
  minSeverity?: AuditSeverity;
  retentionDays?: number;
  maskPII?: boolean;
  asyncWrite?: boolean;
  batchSize?: number;
  flushInterval?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<AuditLogConfig> = {
  enabled: true,
  minSeverity: 'info',
  retentionDays: 90,
  maskPII: true,
  asyncWrite: true,
  batchSize: 100,
  flushInterval: 5000,
};

const SEVERITY_LEVELS: Record<AuditSeverity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

const PII_FIELDS = [
  'email',
  'password',
  'phone',
  'ssn',
  'credit_card',
  'address',
  'ip_address',
  'api_key',
  'token',
  'secret',
];

// ============================================================================
// PII HANDLING
// ============================================================================

/**
 * Mask sensitive data in audit logs
 */
function maskPIIData(data: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if this is a PII field
    const isPII = PII_FIELDS.some(
      (field) => lowerKey.includes(field) || field.includes(lowerKey)
    );

    if (isPII && typeof value === 'string') {
      // Mask the value
      if (lowerKey.includes('email')) {
        // Show first 2 chars and domain
        const [local, domain] = value.split('@');
        masked[key] = local
          ? `${local.substring(0, 2)}***@${domain || '***'}`
          : '***@***';
      } else if (lowerKey.includes('ip')) {
        // Show first octet only
        const parts = value.split('.');
        masked[key] = `${parts[0] || '*'}.***.***.***.`;
      } else if (value.length > 4) {
        // Show first and last 2 chars
        masked[key] = `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
      } else {
        masked[key] = '***';
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively mask nested objects
      masked[key] = maskPIIData(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Hash sensitive data for exact matching without revealing
 */
async function hashForMatching(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// ============================================================================
// AUDIT LOGGER CLASS
// ============================================================================

export class AuditLogger {
  private config: Required<AuditLogConfig>;
  private supabase: SupabaseClient | null = null;
  private eventQueue: AuditEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(config: AuditLogConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeSupabase();

    // Set up periodic flush for async writes
    if (this.config.asyncWrite) {
      this.startFlushInterval();
    }
  }

  private initializeSupabase(): void {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (url && key) {
      this.supabase = createClient(url, key, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  private startFlushInterval(): void {
    this.flushTimeout = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Check if event should be logged based on severity
   */
  private shouldLog(severity: AuditSeverity): boolean {
    if (!this.config.enabled) return false;
    return SEVERITY_LEVELS[severity] >= SEVERITY_LEVELS[this.config.minSeverity];
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.shouldLog(event.severity)) return;

    const fullEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      details: this.config.maskPII ? maskPIIData(event.details) : event.details,
      metadata: {
        ...event.metadata,
        environment: process.env.NODE_ENV,
      },
    };

    if (this.config.asyncWrite) {
      this.eventQueue.push(fullEvent);

      // Flush if queue is full
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flush();
      }
    } else {
      await this.writeEvent(fullEvent);
    }

    // Console log for critical events
    if (event.severity === 'critical' || event.severity === 'error') {
      console.error('[AUDIT]', JSON.stringify(fullEvent));
    }
  }

  /**
   * Write event to storage
   */
  private async writeEvent(event: AuditEvent): Promise<void> {
    if (!this.supabase) {
      console.error('[AUDIT] Supabase not initialized, event lost:', event.eventType);
      return;
    }

    try {
      const { error } = await this.supabase.from('audit_log').insert({
        event_type: event.eventType,
        severity: event.severity,
        user_id: event.userId,
        session_id: event.sessionId,
        ip_address: event.ipAddress,
        user_agent: event.userAgent,
        resource: event.resource,
        action: event.action,
        outcome: event.outcome,
        details: event.details,
        metadata: event.metadata,
        created_at: event.timestamp,
      });

      if (error) {
        console.error('[AUDIT] Failed to write event:', error);
      }
    } catch (error) {
      console.error('[AUDIT] Exception writing event:', error);
    }
  }

  /**
   * Flush all queued events to storage
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToWrite = [...this.eventQueue];
    this.eventQueue = [];

    if (!this.supabase) {
      console.error('[AUDIT] Supabase not initialized, events lost:', eventsToWrite.length);
      return;
    }

    try {
      const { error } = await this.supabase.from('audit_log').insert(
        eventsToWrite.map((event) => ({
          event_type: event.eventType,
          severity: event.severity,
          user_id: event.userId,
          session_id: event.sessionId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          resource: event.resource,
          action: event.action,
          outcome: event.outcome,
          details: event.details,
          metadata: event.metadata,
          created_at: event.timestamp,
        }))
      );

      if (error) {
        console.error('[AUDIT] Failed to flush events:', error);
        // Re-queue events on failure
        this.eventQueue = [...eventsToWrite, ...this.eventQueue];
      }
    } catch (error) {
      console.error('[AUDIT] Exception flushing events:', error);
      this.eventQueue = [...eventsToWrite, ...this.eventQueue];
    }
  }

  /**
   * Query audit logs
   */
  async query(params: AuditLogQuery): Promise<AuditEvent[]> {
    if (!this.supabase) {
      console.error('[AUDIT] Supabase not initialized');
      return [];
    }

    let query = this.supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (params.eventTypes && params.eventTypes.length > 0) {
      query = query.in('event_type', params.eventTypes);
    }

    if (params.severities && params.severities.length > 0) {
      query = query.in('severity', params.severities);
    }

    if (params.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params.outcome) {
      query = query.eq('outcome', params.outcome);
    }

    if (params.startDate) {
      query = query.gte('created_at', params.startDate.toISOString());
    }

    if (params.endDate) {
      query = query.lte('created_at', params.endDate.toISOString());
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AUDIT] Query failed:', error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      timestamp: row.created_at,
      eventType: row.event_type,
      severity: row.severity,
      userId: row.user_id,
      sessionId: row.session_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      resource: row.resource,
      action: row.action,
      outcome: row.outcome,
      details: row.details,
      metadata: row.metadata,
    }));
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async enforceRetention(): Promise<number> {
    if (!this.supabase) {
      console.error('[AUDIT] Supabase not initialized');
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const { data, error } = await this.supabase
      .from('audit_log')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('[AUDIT] Retention enforcement failed:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Shutdown the logger
   */
  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
    }

    // Final flush
    await this.flush();
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

let auditLoggerInstance: AuditLogger | null = null;

export function getAuditLogger(config?: AuditLogConfig): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger(config);
  }
  return auditLoggerInstance;
}

/**
 * Log authentication event
 */
export async function logAuth(
  action: 'login' | 'logout' | 'failed_login' | 'password_reset' | 'token_refresh',
  userId: string | undefined,
  outcome: 'success' | 'failure',
  details: Record<string, unknown> = {},
  request?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
  const logger = getAuditLogger();
  await logger.log({
    eventType: `auth.${action}` as AuditEventType,
    severity: outcome === 'failure' ? 'warning' : 'info',
    userId,
    ipAddress: request?.ipAddress,
    userAgent: request?.userAgent,
    action,
    outcome,
    details,
    metadata: {},
  });
}

/**
 * Log data access event
 */
export async function logDataAccess(
  action: 'read' | 'create' | 'update' | 'delete' | 'export',
  resource: string,
  userId: string | undefined,
  outcome: 'success' | 'failure',
  details: Record<string, unknown> = {}
): Promise<void> {
  const logger = getAuditLogger();
  await logger.log({
    eventType: `data.${action}` as AuditEventType,
    severity: 'info',
    userId,
    resource,
    action,
    outcome,
    details,
    metadata: {},
  });
}

/**
 * Log AI operation event
 */
export async function logAIOperation(
  action: 'request' | 'response' | 'error' | 'rate_limited' | 'jailbreak_detected' | 'prompt_leakage' | 'override',
  userId: string | undefined,
  outcome: 'success' | 'failure' | 'blocked',
  details: Record<string, unknown> = {}
): Promise<void> {
  const logger = getAuditLogger();

  let severity: AuditSeverity = 'info';
  if (action === 'error') severity = 'error';
  if (action === 'jailbreak_detected' || action === 'prompt_leakage') severity = 'warning';

  await logger.log({
    eventType: `ai.${action}` as AuditEventType,
    severity,
    userId,
    action,
    outcome,
    details,
    metadata: {},
  });
}

/**
 * Log security event
 */
export async function logSecurity(
  action: 'csrf_failure' | 'rate_limit_hit' | 'blocked_ip' | 'ssrf_attempt' | 'injection_attempt',
  ipAddress: string | undefined,
  details: Record<string, unknown> = {}
): Promise<void> {
  const logger = getAuditLogger();
  await logger.log({
    eventType: `security.${action}` as AuditEventType,
    severity: 'warning',
    ipAddress,
    action,
    outcome: 'blocked',
    details,
    metadata: {},
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AuditLogger,
  getAuditLogger,
  logAuth,
  logDataAccess,
  logAIOperation,
  logSecurity,
  maskPIIData,
  hashForMatching,
};
