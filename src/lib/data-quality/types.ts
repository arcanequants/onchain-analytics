/**
 * Data Quality Module Types
 *
 * Type definitions for data quality rules, validation, and monitoring
 *
 * Phase 3, Week 10, Day 1
 */

// ================================================================
// RULE DEFINITIONS
// ================================================================

export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type RuleCategory =
  | 'completeness'      // Required fields are present
  | 'validity'          // Values are in expected format/range
  | 'consistency'       // Data is consistent across tables
  | 'accuracy'          // Data matches expected values
  | 'uniqueness'        // No duplicates where expected
  | 'timeliness'        // Data is fresh enough
  | 'referential'       // Foreign keys are valid
  | 'custom';           // Custom business rules

export type RuleStatus = 'active' | 'disabled' | 'deprecated';

export type CheckResult = 'pass' | 'fail' | 'warning' | 'error' | 'skipped';

export interface DataQualityRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Detailed description */
  description: string;
  /** Rule category */
  category: RuleCategory;
  /** Severity level */
  severity: RuleSeverity;
  /** Current status */
  status: RuleStatus;
  /** Table(s) this rule applies to */
  tables: string[];
  /** Column(s) this rule applies to (optional) */
  columns?: string[];
  /** Rule configuration */
  config: RuleConfig;
  /** Tags for filtering */
  tags: string[];
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

export interface RuleConfig {
  /** Rule type for built-in validators */
  type: RuleType;
  /** Type-specific parameters */
  params: Record<string, unknown>;
  /** Custom SQL query for complex rules */
  customQuery?: string;
  /** Threshold for warnings (optional) */
  warningThreshold?: number;
  /** Threshold for failures (optional) */
  failureThreshold?: number;
  /** Expected value or pattern */
  expected?: unknown;
}

export type RuleType =
  // Completeness rules
  | 'not_null'
  | 'not_empty'
  | 'required_fields'
  // Validity rules
  | 'regex_match'
  | 'range_check'
  | 'enum_check'
  | 'type_check'
  | 'format_check'
  // Consistency rules
  | 'cross_table_match'
  | 'sum_check'
  | 'ratio_check'
  // Accuracy rules
  | 'value_match'
  | 'lookup_match'
  // Uniqueness rules
  | 'unique'
  | 'unique_composite'
  // Timeliness rules
  | 'freshness'
  | 'staleness_check'
  // Referential rules
  | 'foreign_key'
  | 'orphan_check'
  // Custom
  | 'custom_sql'
  | 'custom_function';

// ================================================================
// CHECK EXECUTION
// ================================================================

export interface RuleCheckResult {
  /** Rule that was checked */
  ruleId: string;
  /** Check result status */
  status: CheckResult;
  /** Number of records checked */
  totalRecords: number;
  /** Number of passing records */
  passingRecords: number;
  /** Number of failing records */
  failingRecords: number;
  /** Pass rate as percentage */
  passRate: number;
  /** Execution duration in ms */
  durationMs: number;
  /** Error message if any */
  errorMessage?: string;
  /** Sample of failing records (limited) */
  failingSamples?: FailingSample[];
  /** Check timestamp */
  checkedAt: Date;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface FailingSample {
  /** Record identifier */
  recordId: string;
  /** Table name */
  table: string;
  /** Column name (if applicable) */
  column?: string;
  /** Actual value */
  actualValue: unknown;
  /** Expected value or condition */
  expectedCondition: string;
  /** Additional context */
  context?: Record<string, unknown>;
}

export interface RuleCheckBatch {
  /** Batch identifier */
  batchId: string;
  /** Rules executed */
  rules: DataQualityRule[];
  /** Results per rule */
  results: RuleCheckResult[];
  /** Overall batch status */
  overallStatus: CheckResult;
  /** Total duration in ms */
  totalDurationMs: number;
  /** Started timestamp */
  startedAt: Date;
  /** Completed timestamp */
  completedAt: Date;
  /** Summary statistics */
  summary: BatchSummary;
}

export interface BatchSummary {
  /** Total rules executed */
  totalRules: number;
  /** Rules that passed */
  passed: number;
  /** Rules that failed */
  failed: number;
  /** Rules with warnings */
  warnings: number;
  /** Rules that errored */
  errors: number;
  /** Rules skipped */
  skipped: number;
  /** By severity */
  bySeverity: Record<RuleSeverity, SeveritySummary>;
  /** By category */
  byCategory: Record<RuleCategory, CategorySummary>;
}

export interface SeveritySummary {
  total: number;
  passed: number;
  failed: number;
}

export interface CategorySummary {
  total: number;
  passed: number;
  failed: number;
}

// ================================================================
// DATA PROFILING
// ================================================================

export interface ColumnProfile {
  /** Column name */
  column: string;
  /** Data type */
  dataType: string;
  /** Total row count */
  totalCount: number;
  /** Non-null count */
  nonNullCount: number;
  /** Null count */
  nullCount: number;
  /** Null percentage */
  nullPercentage: number;
  /** Unique value count */
  uniqueCount: number;
  /** Uniqueness percentage */
  uniquenessPercentage: number;
  /** Most frequent values (top N) */
  topValues?: ValueFrequency[];
  /** Numeric statistics (if applicable) */
  numericStats?: NumericStats;
  /** String statistics (if applicable) */
  stringStats?: StringStats;
  /** Date statistics (if applicable) */
  dateStats?: DateStats;
}

export interface ValueFrequency {
  value: unknown;
  count: number;
  percentage: number;
}

export interface NumericStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  sum: number;
  zeros: number;
  negatives: number;
  positives: number;
}

export interface StringStats {
  minLength: number;
  maxLength: number;
  avgLength: number;
  emptyCount: number;
  patterns?: PatternFrequency[];
}

export interface PatternFrequency {
  pattern: string;
  count: number;
  percentage: number;
}

export interface DateStats {
  min: Date;
  max: Date;
  daySpan: number;
  futureCount: number;
  nullDateCount: number;
}

export interface TableProfile {
  /** Table name */
  table: string;
  /** Total row count */
  rowCount: number;
  /** Column profiles */
  columns: ColumnProfile[];
  /** Primary key columns */
  primaryKey: string[];
  /** Foreign key relationships */
  foreignKeys: ForeignKeyInfo[];
  /** Indexes */
  indexes: IndexInfo[];
  /** Last profiled */
  profiledAt: Date;
  /** Profile duration in ms */
  durationMs: number;
}

export interface ForeignKeyInfo {
  column: string;
  referencesTable: string;
  referencesColumn: string;
  orphanCount: number;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimary: boolean;
}

// ================================================================
// ANOMALY DETECTION
// ================================================================

export type AnomalyType =
  | 'value_spike'
  | 'value_drop'
  | 'null_spike'
  | 'pattern_change'
  | 'distribution_shift'
  | 'volume_anomaly'
  | 'missing_data';

export interface DataAnomaly {
  /** Anomaly identifier */
  id: string;
  /** Anomaly type */
  type: AnomalyType;
  /** Severity */
  severity: RuleSeverity;
  /** Affected table */
  table: string;
  /** Affected column(s) */
  columns: string[];
  /** Description */
  description: string;
  /** Expected value/range */
  expected: unknown;
  /** Actual value/observation */
  actual: unknown;
  /** Deviation percentage */
  deviationPercent: number;
  /** Detection timestamp */
  detectedAt: Date;
  /** Time range of anomaly */
  timeRange?: {
    start: Date;
    end: Date;
  };
  /** Resolution status */
  resolved: boolean;
  /** Resolution notes */
  resolutionNotes?: string;
}

// ================================================================
// ALERTS & NOTIFICATIONS
// ================================================================

export interface DataQualityAlert {
  /** Alert identifier */
  id: string;
  /** Alert type */
  type: 'rule_failure' | 'threshold_breach' | 'anomaly_detected' | 'trend_warning';
  /** Severity */
  severity: RuleSeverity;
  /** Alert title */
  title: string;
  /** Alert message */
  message: string;
  /** Related rule ID (if applicable) */
  ruleId?: string;
  /** Related anomaly ID (if applicable) */
  anomalyId?: string;
  /** Related check result */
  checkResult?: RuleCheckResult;
  /** Created timestamp */
  createdAt: Date;
  /** Acknowledged */
  acknowledged: boolean;
  /** Acknowledged by */
  acknowledgedBy?: string;
  /** Acknowledged at */
  acknowledgedAt?: Date;
}

// ================================================================
// CONFIGURATION
// ================================================================

export interface DataQualityConfig {
  /** Enable data quality checks */
  enabled: boolean;
  /** Check interval in minutes */
  checkIntervalMinutes: number;
  /** Maximum samples to store per failure */
  maxFailingSamples: number;
  /** Enable profiling */
  profilingEnabled: boolean;
  /** Profiling interval in hours */
  profilingIntervalHours: number;
  /** Enable anomaly detection */
  anomalyDetectionEnabled: boolean;
  /** Alert notification channels */
  alertChannels: AlertChannel[];
  /** Retention period for results in days */
  resultRetentionDays: number;
  /** Tables to include (empty = all) */
  includeTables?: string[];
  /** Tables to exclude */
  excludeTables?: string[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'log';
  enabled: boolean;
  config: Record<string, unknown>;
  minSeverity: RuleSeverity;
}

export const DEFAULT_DQ_CONFIG: DataQualityConfig = {
  enabled: true,
  checkIntervalMinutes: 60,
  maxFailingSamples: 10,
  profilingEnabled: true,
  profilingIntervalHours: 24,
  anomalyDetectionEnabled: true,
  alertChannels: [
    {
      type: 'log',
      enabled: true,
      config: {},
      minSeverity: 'low',
    },
  ],
  resultRetentionDays: 30,
};

// ================================================================
// EXPORTS
// ================================================================

export default {
  DEFAULT_DQ_CONFIG,
};
