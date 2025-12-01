/**
 * Semantic Audit Types
 *
 * Type definitions for data quality rules and semantic validation
 *
 * Phase 3, Week 10
 */

// ================================================================
// DATA QUALITY RULE TYPES
// ================================================================

export type RuleSeverity = 'error' | 'warning' | 'info';
export type RuleCategory =
  | 'completeness'
  | 'uniqueness'
  | 'consistency'
  | 'validity'
  | 'accuracy'
  | 'timeliness'
  | 'integrity';

export interface DataQualityRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule category */
  category: RuleCategory;
  /** Severity level */
  severity: RuleSeverity;
  /** Fields this rule applies to */
  fields: string[];
  /** Whether rule is enabled */
  enabled: boolean;
  /** Custom rule parameters */
  params?: Record<string, unknown>;
}

export interface RuleValidationResult {
  /** Rule that was validated */
  ruleId: string;
  /** Whether validation passed */
  passed: boolean;
  /** Number of records checked */
  recordsChecked: number;
  /** Number of records that failed */
  recordsFailed: number;
  /** Failure rate (0-1) */
  failureRate: number;
  /** Sample of failed records */
  failedRecords?: Array<{
    recordId: string | number;
    field: string;
    value: unknown;
    reason: string;
  }>;
  /** Validation timestamp */
  timestamp: Date;
  /** Duration in milliseconds */
  durationMs: number;
}

// ================================================================
// ANOMALY DETECTION
// ================================================================

export type AnomalyType =
  | 'outlier'
  | 'missing_value'
  | 'duplicate'
  | 'invalid_format'
  | 'out_of_range'
  | 'unexpected_pattern'
  | 'temporal_anomaly'
  | 'referential_integrity';

export interface Anomaly {
  /** Anomaly type */
  type: AnomalyType;
  /** Affected field/column */
  field: string;
  /** Record identifier */
  recordId: string | number;
  /** Problematic value */
  value: unknown;
  /** Expected value or pattern */
  expected?: unknown;
  /** Anomaly score (0-1, higher = more anomalous) */
  score: number;
  /** Detection method used */
  method: string;
  /** Additional context */
  context?: Record<string, unknown>;
  /** Detection timestamp */
  timestamp: Date;
}

export interface AnomalyDetectionConfig {
  /** Enable outlier detection */
  detectOutliers: boolean;
  /** Standard deviations for outlier threshold */
  outlierThreshold: number;
  /** Enable missing value detection */
  detectMissing: boolean;
  /** Enable duplicate detection */
  detectDuplicates: boolean;
  /** Fields to use for duplicate detection */
  duplicateKeyFields?: string[];
  /** Enable format validation */
  validateFormats: boolean;
  /** Enable temporal pattern detection */
  detectTemporalAnomalies: boolean;
  /** Maximum anomalies to return */
  maxAnomalies: number;
}

// ================================================================
// ORPHAN DETECTION
// ================================================================

export interface OrphanRecord {
  /** Source table/collection */
  sourceTable: string;
  /** Record identifier */
  recordId: string | number;
  /** Foreign key field */
  foreignKeyField: string;
  /** Foreign key value */
  foreignKeyValue: unknown;
  /** Target table/collection that should have the reference */
  targetTable: string;
  /** Target primary key field */
  targetPrimaryKey: string;
  /** Detection timestamp */
  timestamp: Date;
}

export interface ReferentialIntegrityCheck {
  /** Source table */
  sourceTable: string;
  /** Foreign key field in source */
  foreignKeyField: string;
  /** Target table */
  targetTable: string;
  /** Primary key field in target */
  targetPrimaryKey: string;
  /** Whether check is enabled */
  enabled: boolean;
}

// ================================================================
// SCHEMA VALIDATION
// ================================================================

export type FieldType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'uuid'
  | 'json'
  | 'array'
  | 'object'
  | 'any';

export interface FieldSchema {
  /** Field name */
  name: string;
  /** Field type */
  type: FieldType;
  /** Whether field is required */
  required: boolean;
  /** Whether field should be unique */
  unique: boolean;
  /** Minimum value (for numbers) */
  min?: number;
  /** Maximum value (for numbers) */
  max?: number;
  /** Minimum length (for strings/arrays) */
  minLength?: number;
  /** Maximum length (for strings/arrays) */
  maxLength?: number;
  /** Regex pattern (for strings) */
  pattern?: string;
  /** Allowed values (enum) */
  enum?: unknown[];
  /** Default value */
  default?: unknown;
  /** Nested schema (for objects/arrays) */
  items?: FieldSchema;
  /** Object properties */
  properties?: Record<string, FieldSchema>;
}

export interface SchemaValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: SchemaValidationError[];
  /** Validation warnings */
  warnings: SchemaValidationError[];
  /** Fields that were validated */
  validatedFields: string[];
  /** Fields that were not in schema (extra fields) */
  extraFields: string[];
  /** Fields that were missing */
  missingFields: string[];
}

export interface SchemaValidationError {
  /** Field path */
  field: string;
  /** Error message */
  message: string;
  /** Expected type/value */
  expected?: unknown;
  /** Actual value */
  actual?: unknown;
  /** Error code */
  code: string;
}

// ================================================================
// AUDIT REPORT
// ================================================================

export interface AuditReport {
  /** Report identifier */
  id: string;
  /** Report name */
  name: string;
  /** Dataset/table audited */
  dataset: string;
  /** Report generation timestamp */
  generatedAt: Date;
  /** Total records analyzed */
  totalRecords: number;
  /** Overall data quality score (0-100) */
  qualityScore: number;
  /** Rule validation results */
  ruleResults: RuleValidationResult[];
  /** Detected anomalies */
  anomalies: Anomaly[];
  /** Detected orphan records */
  orphans: OrphanRecord[];
  /** Schema validation result */
  schemaValidation?: SchemaValidationResult;
  /** Summary statistics */
  summary: AuditSummary;
  /** Recommendations */
  recommendations: string[];
}

export interface AuditSummary {
  /** Rules checked */
  rulesChecked: number;
  /** Rules passed */
  rulesPassed: number;
  /** Rules failed */
  rulesFailed: number;
  /** Total anomalies found */
  anomaliesFound: number;
  /** Anomalies by type */
  anomaliesByType: Record<AnomalyType, number>;
  /** Total orphans found */
  orphansFound: number;
  /** Fields with issues */
  fieldsWithIssues: string[];
  /** Critical issues count */
  criticalIssues: number;
  /** Warning count */
  warningCount: number;
}

// ================================================================
// CONFIGURATION
// ================================================================

export interface SemanticAuditConfig {
  /** Enable data quality rules */
  enableRules: boolean;
  /** Enable anomaly detection */
  enableAnomalyDetection: boolean;
  /** Enable orphan detection */
  enableOrphanDetection: boolean;
  /** Enable schema validation */
  enableSchemaValidation: boolean;
  /** Maximum records to sample for analysis */
  maxSampleSize: number;
  /** Include failed record samples in report */
  includeSamples: boolean;
  /** Maximum samples per rule */
  maxSamplesPerRule: number;
  /** Anomaly detection config */
  anomalyConfig: AnomalyDetectionConfig;
}

export const DEFAULT_AUDIT_CONFIG: SemanticAuditConfig = {
  enableRules: true,
  enableAnomalyDetection: true,
  enableOrphanDetection: true,
  enableSchemaValidation: true,
  maxSampleSize: 10000,
  includeSamples: true,
  maxSamplesPerRule: 10,
  anomalyConfig: {
    detectOutliers: true,
    outlierThreshold: 3,
    detectMissing: true,
    detectDuplicates: true,
    validateFormats: true,
    detectTemporalAnomalies: true,
    maxAnomalies: 100,
  },
};
