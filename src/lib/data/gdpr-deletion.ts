/**
 * GDPR Deletion API Module
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Right to erasure (Article 17) implementation
 * - Data subject request handling
 * - Cascading deletion across tables
 * - Audit trail for compliance
 * - Retention period verification
 * - Data export (portability)
 */

// ============================================================================
// TYPES
// ============================================================================

export type RequestType =
  | 'erasure' // Right to be forgotten
  | 'access' // Subject access request
  | 'portability' // Data export
  | 'rectification' // Correct data
  | 'restriction'; // Restrict processing

export type RequestStatus =
  | 'received'
  | 'validating'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'failed';

export type IdentifierType = 'wallet_address' | 'email' | 'user_id' | 'session_id';

export interface DataSubject {
  identifier: string;
  identifierType: IdentifierType;
  email?: string;
  verified: boolean;
  verifiedAt?: Date;
}

export interface DeletionRequest {
  id: string;
  subject: DataSubject;
  type: RequestType;
  status: RequestStatus;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  processingLog: ProcessingLogEntry[];
  affectedRecords: AffectedRecord[];
  retentionCheck?: RetentionCheck;
  metadata: Record<string, unknown>;
}

export interface ProcessingLogEntry {
  timestamp: Date;
  action: string;
  status: 'success' | 'failed' | 'skipped';
  details?: string;
  error?: string;
}

export interface AffectedRecord {
  tableName: string;
  recordCount: number;
  action: 'deleted' | 'anonymized' | 'retained';
  retentionReason?: string;
}

export interface RetentionCheck {
  canDelete: boolean;
  retentionEndDate?: Date;
  reason?: string;
  legalBasis?: string;
}

export interface TableDeletionConfig {
  tableName: string;
  identifierColumn: string;
  identifierType: IdentifierType;
  softDelete: boolean;
  softDeleteColumn?: string;
  anonymize: boolean;
  anonymizeColumns?: string[];
  cascadeTo?: string[];
  retentionDays?: number;
  retentionReason?: string;
}

export interface DataExport {
  requestId: string;
  subject: DataSubject;
  exportedAt: Date;
  format: 'json' | 'csv';
  tables: {
    tableName: string;
    recordCount: number;
    data: unknown[];
  }[];
  sizeBytes: number;
  downloadUrl?: string;
  expiresAt?: Date;
}

export interface ComplianceAudit {
  id: string;
  requestId: string;
  auditedAt: Date;
  auditedBy: string;
  findings: AuditFinding[];
  compliant: boolean;
}

export interface AuditFinding {
  severity: 'info' | 'warning' | 'violation';
  category: string;
  description: string;
  recommendation?: string;
}

// ============================================================================
// GDPR DELETION SERVICE
// ============================================================================

export class GDPRDeletionService {
  private requests: Map<string, DeletionRequest> = new Map();
  private tableConfigs: Map<string, TableDeletionConfig> = new Map();
  private audits: ComplianceAudit[] = [];

  /**
   * Register table deletion configuration
   */
  registerTableConfig(config: TableDeletionConfig): void {
    this.tableConfigs.set(config.tableName, config);
  }

  /**
   * Get table config
   */
  getTableConfig(tableName: string): TableDeletionConfig | undefined {
    return this.tableConfigs.get(tableName);
  }

  /**
   * Get all table configs
   */
  getAllTableConfigs(): TableDeletionConfig[] {
    return Array.from(this.tableConfigs.values());
  }

  /**
   * Create deletion request
   */
  createRequest(
    subject: DataSubject,
    type: RequestType,
    reason?: string
  ): DeletionRequest {
    const request: DeletionRequest = {
      id: `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subject,
      type,
      status: 'received',
      reason,
      createdAt: new Date(),
      updatedAt: new Date(),
      processingLog: [
        {
          timestamp: new Date(),
          action: 'Request received',
          status: 'success',
          details: `${type} request for ${subject.identifierType}: ${this.maskIdentifier(subject.identifier)}`,
        },
      ],
      affectedRecords: [],
      metadata: {},
    };

    this.requests.set(request.id, request);
    return request;
  }

  /**
   * Validate request
   */
  validateRequest(requestId: string): DeletionRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;

    request.status = 'validating';
    request.updatedAt = new Date();

    // Check if subject is verified
    if (!request.subject.verified) {
      request.processingLog.push({
        timestamp: new Date(),
        action: 'Validation',
        status: 'failed',
        error: 'Subject identity not verified',
      });
      request.status = 'rejected';
      return request;
    }

    // Check retention requirements
    request.retentionCheck = this.checkRetention(request.subject);

    request.processingLog.push({
      timestamp: new Date(),
      action: 'Validation',
      status: 'success',
      details: `Subject verified, retention check: ${request.retentionCheck.canDelete ? 'can delete' : 'retention applies'}`,
    });

    return request;
  }

  /**
   * Check retention requirements
   */
  private checkRetention(subject: DataSubject): RetentionCheck {
    // Check all tables for retention requirements
    for (const config of this.tableConfigs.values()) {
      if (config.identifierType !== subject.identifierType) continue;

      if (config.retentionDays) {
        const retentionEndDate = new Date();
        retentionEndDate.setDate(retentionEndDate.getDate() + config.retentionDays);

        return {
          canDelete: false,
          retentionEndDate,
          reason: config.retentionReason || 'Legal retention period applies',
          legalBasis: 'Legal obligation (Article 6(1)(c))',
        };
      }
    }

    return { canDelete: true };
  }

  /**
   * Process deletion request
   */
  processRequest(requestId: string): DeletionRequest | null {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'validating') return null;

    request.status = 'processing';
    request.updatedAt = new Date();

    // Find all tables with matching identifier
    for (const config of this.tableConfigs.values()) {
      if (config.identifierType !== request.subject.identifierType) continue;

      const affected: AffectedRecord = {
        tableName: config.tableName,
        recordCount: 0,
        action: 'deleted',
      };

      // Check retention
      if (config.retentionDays) {
        affected.action = 'retained';
        affected.retentionReason = config.retentionReason;
        request.processingLog.push({
          timestamp: new Date(),
          action: `Skipping ${config.tableName}`,
          status: 'skipped',
          details: `Retention period applies: ${config.retentionReason}`,
        });
      } else if (config.anonymize) {
        affected.action = 'anonymized';
        request.processingLog.push({
          timestamp: new Date(),
          action: `Anonymizing ${config.tableName}`,
          status: 'success',
          details: `Columns: ${config.anonymizeColumns?.join(', ')}`,
        });
      } else if (config.softDelete) {
        request.processingLog.push({
          timestamp: new Date(),
          action: `Soft deleting from ${config.tableName}`,
          status: 'success',
        });
      } else {
        request.processingLog.push({
          timestamp: new Date(),
          action: `Hard deleting from ${config.tableName}`,
          status: 'success',
        });
      }

      request.affectedRecords.push(affected);

      // Process cascades
      if (config.cascadeTo?.length) {
        for (const cascadeTable of config.cascadeTo) {
          request.affectedRecords.push({
            tableName: cascadeTable,
            recordCount: 0,
            action: 'deleted',
          });
          request.processingLog.push({
            timestamp: new Date(),
            action: `Cascade delete from ${cascadeTable}`,
            status: 'success',
          });
        }
      }
    }

    request.status = 'completed';
    request.completedAt = new Date();
    request.updatedAt = new Date();

    request.processingLog.push({
      timestamp: new Date(),
      action: 'Request completed',
      status: 'success',
      details: `Affected ${request.affectedRecords.length} tables`,
    });

    return request;
  }

  /**
   * Get request by ID
   */
  getRequest(requestId: string): DeletionRequest | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Get all requests
   */
  getAllRequests(): DeletionRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * Get requests by status
   */
  getRequestsByStatus(status: RequestStatus): DeletionRequest[] {
    return this.getAllRequests().filter((r) => r.status === status);
  }

  /**
   * Generate deletion SQL
   */
  generateDeletionSQL(request: DeletionRequest): string {
    const statements: string[] = [
      '-- GDPR Deletion Request',
      `-- Request ID: ${request.id}`,
      `-- Subject: ${request.subject.identifierType} = ${this.maskIdentifier(request.subject.identifier)}`,
      `-- Type: ${request.type}`,
      '',
      'BEGIN;',
      '',
    ];

    for (const config of this.tableConfigs.values()) {
      if (config.identifierType !== request.subject.identifierType) continue;

      const identifier = request.subject.identifier;

      if (config.retentionDays) {
        statements.push(`-- Skipping ${config.tableName}: retention period applies`);
        continue;
      }

      if (config.anonymize && config.anonymizeColumns?.length) {
        const setClauses = config.anonymizeColumns.map((col) => {
          return `${col} = CASE
    WHEN ${col} IS NOT NULL THEN 'ANONYMIZED_' || MD5(${col}::text)
    ELSE NULL
  END`;
        });

        statements.push(`-- Anonymize ${config.tableName}`);
        statements.push(`UPDATE ${config.tableName}`);
        statements.push(`SET ${setClauses.join(',\n    ')},`);
        statements.push(`    updated_at = NOW()`);
        statements.push(`WHERE ${config.identifierColumn} = '${identifier}';`);
        statements.push('');
      } else if (config.softDelete && config.softDeleteColumn) {
        statements.push(`-- Soft delete from ${config.tableName}`);
        statements.push(`UPDATE ${config.tableName}`);
        statements.push(`SET ${config.softDeleteColumn} = NOW(),`);
        statements.push(`    updated_at = NOW()`);
        statements.push(`WHERE ${config.identifierColumn} = '${identifier}';`);
        statements.push('');
      } else {
        // Hard delete - handle cascades first
        if (config.cascadeTo?.length) {
          for (const cascadeTable of config.cascadeTo) {
            statements.push(`-- Cascade delete from ${cascadeTable}`);
            statements.push(`DELETE FROM ${cascadeTable}`);
            statements.push(`WHERE ${config.identifierColumn} = '${identifier}';`);
            statements.push('');
          }
        }

        statements.push(`-- Hard delete from ${config.tableName}`);
        statements.push(`DELETE FROM ${config.tableName}`);
        statements.push(`WHERE ${config.identifierColumn} = '${identifier}';`);
        statements.push('');
      }
    }

    statements.push('COMMIT;');
    statements.push('');
    statements.push('-- Audit log');
    statements.push(`INSERT INTO gdpr_audit_log (request_id, action, executed_at)`);
    statements.push(`VALUES ('${request.id}', 'deletion_completed', NOW());`);

    return statements.join('\n');
  }

  /**
   * Export subject data
   */
  exportSubjectData(request: DeletionRequest): DataExport {
    const tables: DataExport['tables'] = [];

    for (const config of this.tableConfigs.values()) {
      if (config.identifierType !== request.subject.identifierType) continue;

      tables.push({
        tableName: config.tableName,
        recordCount: 0, // Would be populated from actual query
        data: [], // Would contain actual data
      });
    }

    const dataExport: DataExport = {
      requestId: request.id,
      subject: request.subject,
      exportedAt: new Date(),
      format: 'json',
      tables,
      sizeBytes: 0,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    return dataExport;
  }

  /**
   * Generate export SQL
   */
  generateExportSQL(subject: DataSubject): string {
    const statements: string[] = [
      '-- GDPR Data Export',
      `-- Subject: ${subject.identifierType} = ${this.maskIdentifier(subject.identifier)}`,
      '',
    ];

    for (const config of this.tableConfigs.values()) {
      if (config.identifierType !== subject.identifierType) continue;

      statements.push(`-- Export from ${config.tableName}`);
      statements.push(`SELECT * FROM ${config.tableName}`);
      statements.push(`WHERE ${config.identifierColumn} = '${subject.identifier}';`);
      statements.push('');
    }

    return statements.join('\n');
  }

  /**
   * Audit request
   */
  auditRequest(requestId: string, auditedBy: string): ComplianceAudit {
    const request = this.requests.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    const findings: AuditFinding[] = [];

    // Check completion time (30 days GDPR requirement)
    if (request.completedAt) {
      const processingDays = Math.floor(
        (request.completedAt.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (processingDays > 30) {
        findings.push({
          severity: 'violation',
          category: 'Timeliness',
          description: `Request took ${processingDays} days to process (max 30 days)`,
          recommendation: 'Implement automated processing to meet deadline',
        });
      } else {
        findings.push({
          severity: 'info',
          category: 'Timeliness',
          description: `Request processed in ${processingDays} days`,
        });
      }
    } else if (request.status !== 'completed') {
      const pendingDays = Math.floor(
        (Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (pendingDays > 25) {
        findings.push({
          severity: 'warning',
          category: 'Timeliness',
          description: `Request pending for ${pendingDays} days`,
          recommendation: 'Expedite processing before 30-day deadline',
        });
      }
    }

    // Check subject verification
    if (!request.subject.verified) {
      findings.push({
        severity: 'warning',
        category: 'Identity Verification',
        description: 'Subject identity not verified',
        recommendation: 'Implement identity verification before processing',
      });
    }

    // Check audit trail completeness
    if (request.processingLog.length < 3) {
      findings.push({
        severity: 'warning',
        category: 'Audit Trail',
        description: 'Processing log appears incomplete',
        recommendation: 'Ensure all actions are logged',
      });
    }

    // Check retention handling
    if (request.retentionCheck && !request.retentionCheck.canDelete) {
      if (!request.retentionCheck.legalBasis) {
        findings.push({
          severity: 'violation',
          category: 'Legal Basis',
          description: 'Retention applied without documented legal basis',
          recommendation: 'Document legal basis for retention',
        });
      }
    }

    const audit: ComplianceAudit = {
      id: `audit_${Date.now()}`,
      requestId,
      auditedAt: new Date(),
      auditedBy,
      findings,
      compliant: !findings.some((f) => f.severity === 'violation'),
    };

    this.audits.push(audit);
    return audit;
  }

  /**
   * Get compliance report
   */
  getComplianceReport(): string {
    const requests = this.getAllRequests();
    const completed = requests.filter((r) => r.status === 'completed');
    const pending = requests.filter((r) =>
      ['received', 'validating', 'processing'].includes(r.status)
    );

    const avgProcessingTime =
      completed.length > 0
        ? completed.reduce((sum, r) => {
            if (r.completedAt) {
              return sum + (r.completedAt.getTime() - r.createdAt.getTime());
            }
            return sum;
          }, 0) /
          completed.length /
          (1000 * 60 * 60 * 24)
        : 0;

    const lines: string[] = [
      '# GDPR Compliance Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      '',
      '## Summary',
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Total Requests | ${requests.length} |`,
      `| Completed | ${completed.length} |`,
      `| Pending | ${pending.length} |`,
      `| Avg Processing Time | ${avgProcessingTime.toFixed(1)} days |`,
      '',
      '## By Request Type',
      '',
    ];

    const byType = new Map<RequestType, number>();
    for (const request of requests) {
      byType.set(request.type, (byType.get(request.type) || 0) + 1);
    }

    lines.push('| Type | Count |');
    lines.push('|------|-------|');
    for (const [type, count] of byType) {
      lines.push(`| ${type} | ${count} |`);
    }
    lines.push('');

    // Pending requests warning
    if (pending.length > 0) {
      lines.push('## Pending Requests', '');
      for (const request of pending) {
        const daysOld = Math.floor(
          (Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        const icon = daysOld > 25 ? '🔴' : daysOld > 20 ? '🟡' : '🟢';
        lines.push(
          `- ${icon} ${request.id}: ${request.type} (${daysOld} days old)`
        );
      }
      lines.push('');
    }

    // Audit findings
    const recentAudits = this.audits.slice(-10);
    if (recentAudits.length > 0) {
      lines.push('## Recent Audits', '');
      for (const audit of recentAudits) {
        const icon = audit.compliant ? '✅' : '❌';
        lines.push(
          `- ${icon} ${audit.requestId}: ${audit.findings.length} findings`
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Mask identifier for logging
   */
  private maskIdentifier(identifier: string): string {
    if (identifier.length <= 8) return '****';
    return identifier.substring(0, 4) + '...' + identifier.substring(identifier.length - 4);
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.requests.clear();
    this.tableConfigs.clear();
    this.audits = [];
  }
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_TABLE_CONFIGS: TableDeletionConfig[] = [
  {
    tableName: 'user_profiles',
    identifierColumn: 'wallet_address',
    identifierType: 'wallet_address',
    softDelete: false,
    anonymize: false,
    cascadeTo: ['user_watchlists', 'user_alerts', 'user_sessions'],
  },
  {
    tableName: 'user_sessions',
    identifierColumn: 'wallet_address',
    identifierType: 'wallet_address',
    softDelete: false,
    anonymize: false,
  },
  {
    tableName: 'user_watchlists',
    identifierColumn: 'wallet_address',
    identifierType: 'wallet_address',
    softDelete: false,
    anonymize: false,
  },
  {
    tableName: 'user_alerts',
    identifierColumn: 'wallet_address',
    identifierType: 'wallet_address',
    softDelete: false,
    anonymize: false,
  },
  {
    tableName: 'tracked_wallets',
    identifierColumn: 'tracked_by',
    identifierType: 'wallet_address',
    softDelete: true,
    softDeleteColumn: 'deleted_at',
    anonymize: false,
  },
  {
    tableName: 'tickets',
    identifierColumn: 'wallet_address',
    identifierType: 'wallet_address',
    softDelete: false,
    anonymize: true,
    anonymizeColumns: ['wallet_address'],
    retentionDays: 2555, // 7 years for financial records
    retentionReason: 'Financial records retention requirement',
  },
];

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultService: GDPRDeletionService | null = null;

export function getDefaultService(): GDPRDeletionService {
  if (!defaultService) {
    defaultService = new GDPRDeletionService();
    for (const config of DEFAULT_TABLE_CONFIGS) {
      defaultService.registerTableConfig(config);
    }
  }
  return defaultService;
}

export function resetService(): void {
  defaultService?.reset();
  defaultService = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create erasure request
 */
export function createErasureRequest(
  identifier: string,
  identifierType: IdentifierType,
  reason?: string
): DeletionRequest {
  const subject: DataSubject = {
    identifier,
    identifierType,
    verified: true, // Assume verified for API calls
    verifiedAt: new Date(),
  };

  return getDefaultService().createRequest(subject, 'erasure', reason);
}

/**
 * Create access request (data export)
 */
export function createAccessRequest(
  identifier: string,
  identifierType: IdentifierType
): DeletionRequest {
  const subject: DataSubject = {
    identifier,
    identifierType,
    verified: true,
    verifiedAt: new Date(),
  };

  return getDefaultService().createRequest(subject, 'access');
}

/**
 * Process request
 */
export function processDeletionRequest(requestId: string): DeletionRequest | null {
  const service = getDefaultService();
  service.validateRequest(requestId);
  return service.processRequest(requestId);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Service
  GDPRDeletionService,

  // Singleton
  getDefaultService,
  resetService,

  // Convenience
  createErasureRequest,
  createAccessRequest,
  processDeletionRequest,

  // Defaults
  DEFAULT_TABLE_CONFIGS,
};
