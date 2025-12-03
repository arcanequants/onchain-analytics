/**
 * Data Engineering Module Index
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Dimensional modeling (star schema)
 * - Data quality framework
 * - Data lineage tracking
 * - Materialized views management
 * - Data quality runner with Slack alerts
 * - Data catalog documentation
 * - Data contracts and validation
 * - Contract CI/CD validation
 * - Time-based partitioning
 * - Retention policies
 * - Idempotent pipelines
 * - Data observability dashboard
 * - Freshness SLA monitoring
 * - Schema change detection
 * - Backup automation
 * - Recovery testing
 * - DR runbook
 * - GDPR deletion API
 */

// ============================================================================
// DIMENSIONAL MODEL
// ============================================================================

export {
  // Dimension generators
  generateTimeDimension,
  generateProviderDimension,

  // SCD operations
  insertBrandDimension,
  getBrandAtPointInTime,

  // Aggregations
  computeDailyBrandSummary,
  computeWeeklyProviderPerformance,
} from './dimensional-model';

export type {
  // Dimensions
  DimBrand,
  DimProvider,
  DimTime,
  DimQuery,
  DimUser,
  DimGeography,

  // Facts
  FactBrandPerception,
  FactAPIUsage,
  FactUserEngagement,

  // Aggregates
  AggDailyBrandSummary,
  AggWeeklyProviderPerformance,
} from './dimensional-model';

// ============================================================================
// DATA QUALITY (Legacy)
// ============================================================================

export {
  // Quality checks
  checkCompleteness,
  checkRange,
  checkUniqueness,
  checkFreshness,
  detectAnomalies,

  // Reporting
  generateQualityReport,

  // Lineage
  registerLineage,
  getLineage,
  traceUpstream,

  // Constants
  DEFAULT_QUALITY_RULES,
} from './data-quality';

export type {
  QualityDimension,
  RuleSeverity,
  QualityRule,
  QualityCheckResult,
  QualityReport,
  QualityIssue,
  DataLineage,
  LineageNode as LegacyLineageNode,
  Transformation,
} from './data-quality';

// ============================================================================
// MATERIALIZED VIEWS
// ============================================================================

export {
  MaterializedViewManager,
  getDefaultManager as getDefaultViewManager,
  resetManager as resetViewManager,
  MATERIALIZED_VIEW_DEFINITIONS,
} from './materialized-views';

export type {
  RefreshStrategy,
  MaterializedViewConfig,
  MaterializedView,
  RefreshResult,
} from './materialized-views';

// ============================================================================
// DATA QUALITY RUNNER
// ============================================================================

export {
  DQRunner,
  getDefaultRunner as getDefaultDQRunner,
  resetRunner as resetDQRunner,
  DEFAULT_DQ_CHECKS,
} from './dq-runner';

export type {
  CheckSeverity,
  RunStatus,
  DQCheck,
  DQCheckResult,
  DQRun,
  SlackConfig,
  SlackMessage,
} from './dq-runner';

// ============================================================================
// DATA CATALOG
// ============================================================================

export {
  DataCatalog,
  getDefaultCatalog,
  resetCatalog,
  DATA_CATALOG,
} from './data-catalog';

export type {
  ColumnMetadata,
  TableMetadata,
  SearchResult,
} from './data-catalog';

// ============================================================================
// DATA CONTRACTS
// ============================================================================

export {
  ContractRegistry,
  ContractValidator,
  getDefaultRegistry,
  getDefaultValidator,
  resetRegistry,
  validateAgainstContract,
  registerContract,
  getContract,
  checkCompatibility,
  contractToZodSchema,
  DEFAULT_CONTRACTS,
  TOKEN_PRICES_CONTRACT,
  PROTOCOL_TVL_CONTRACT,
  GAS_METRICS_CONTRACT,
} from './data-contracts';

export type {
  DataType,
  ConstraintType,
  BreakingChangeType,
  ContractStatus,
  FieldConstraint,
  FieldDefinition,
  SemanticRule,
  SLADefinition,
  DataContract,
  ContractVersion,
  BreakingChange,
  Producer,
  Consumer,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CompatibilityResult,
} from './data-contracts';

// ============================================================================
// CONTRACT CI/CD VALIDATION
// ============================================================================

export {
  MigrationParser,
  CIContractValidator,
  ContractTestRunner,
  getDefaultCIValidator,
  getDefaultTestRunner,
  resetCIValidation,
  runQuickCICheck,
  runContractTests,
  SAMPLE_TEST_CASES,
} from './contract-ci-validation';

export type {
  ValidationSeverity,
  CIProvider,
  CIConfig,
  MigrationFile,
  SchemaChange,
  MigrationValidationResult,
  CICheckResult,
  CIAnnotation,
  ContractTestCase,
  TestSuiteResult,
  TestCaseResult,
} from './contract-ci-validation';

// ============================================================================
// PARTITIONING & RETENTION
// ============================================================================

export {
  PartitionManager,
  RetentionPolicyManager,
  getDefaultPartitionManager,
  getDefaultRetentionManager,
  resetManagers as resetPartitionManagers,
  createPartitionsForRange,
  runAllMaintenance,
  DEFAULT_PARTITION_CONFIGS,
  DEFAULT_RETENTION_POLICIES,
} from './partitioning-retention';

export type {
  PartitionInterval,
  RetentionAction,
  PartitionState,
  PartitionConfig,
  Partition,
  RetentionPolicy,
  RetentionExecution,
  PartitionMaintenanceResult,
  CleanupResult,
} from './partitioning-retention';

// ============================================================================
// IDEMPOTENT PIPELINES
// ============================================================================

export {
  IdempotencyKeyGenerator,
  Deduplicator,
  UpsertGenerator,
  CheckpointManager,
  WatermarkManager,
  IdempotentPipeline,
  getDefaultCheckpointManager,
  getDefaultWatermarkManager,
  resetManagers as resetPipelineManagers,
  createTokenPricesPipeline,
  createTVLPipeline,
  createGasMetricsPipeline,
} from './idempotent-pipelines';

export type {
  UpsertStrategy,
  DeduplicationStrategy,
  CheckpointState,
  IdempotencyKey,
  UpsertConfig,
  Checkpoint,
  Watermark,
  DeduplicationResult,
  UpsertResult,
  PipelineRun,
  ReplayRequest,
  ReplayResult,
} from './idempotent-pipelines';

// ============================================================================
// DATA OBSERVABILITY
// ============================================================================

export {
  FreshnessSLAManager,
  VolumeTracker,
  AnomalyDetector,
  ObservabilityAlertManager,
  DataObservabilityDashboard,
  getDefaultDashboard,
  resetDashboard,
  DEFAULT_FRESHNESS_SLAS,
} from './data-observability';

export type {
  MetricType,
  SLAStatus,
  AlertPriority,
  AlertState,
  TrendDirection,
  FreshnessSLA,
  FreshnessCheck,
  VolumeMetric,
  DataQualityScore,
  Anomaly,
  PipelineHealth,
  ObservabilityAlert,
  DashboardSummary,
  Trend,
} from './data-observability';

// ============================================================================
// SCHEMA DETECTION
// ============================================================================

export {
  SchemaComparator,
  SchemaChangeDetector,
  getDefaultDetector,
  resetDetector,
  captureSchema,
  compareSchemas,
} from './schema-detection';

export type {
  ColumnType,
  ChangeType,
  ChangeImpact,
  ColumnDefinition,
  ConstraintDefinition,
  IndexDefinition,
  TableSchema,
  SchemaSnapshot,
  SchemaChange as SchemaChangeResult,
  SchemaComparisonResult,
  SchemaAlert,
} from './schema-detection';

// ============================================================================
// BACKUP & RECOVERY
// ============================================================================

export {
  BackupManager,
  RecoveryManager,
  RecoveryTestRunner,
  DRRunbookGenerator,
  getDefaultBackupManager,
  getDefaultRecoveryManager,
  getDefaultTestRunner as getDefaultRecoveryTestRunner,
  resetManagers as resetBackupManagers,
  DEFAULT_BACKUP_CONFIGS,
  DEFAULT_RECOVERY_PLANS,
  DEFAULT_RECOVERY_TESTS,
} from './backup-recovery';

export type {
  BackupType,
  BackupStatus,
  StorageLocation,
  RecoveryType,
  TestResult,
  BackupConfig,
  Backup,
  RecoveryPlan,
  RecoveryStep,
  RecoveryExecution,
  RecoveryLog,
  RecoveryTest,
  RecoveryTestResult,
  DRRunbook,
  RunbookSection,
  RunbookStep,
  Contact,
  EscalationLevel,
  Tool,
} from './backup-recovery';

// ============================================================================
// GDPR DELETION
// ============================================================================

export {
  GDPRDeletionService,
  getDefaultService as getDefaultGDPRService,
  resetService as resetGDPRService,
  createErasureRequest,
  createAccessRequest,
  processDeletionRequest,
  DEFAULT_TABLE_CONFIGS,
} from './gdpr-deletion';

export type {
  RequestType,
  RequestStatus,
  IdentifierType,
  DataSubject,
  DeletionRequest,
  ProcessingLogEntry,
  AffectedRecord,
  RetentionCheck,
  TableDeletionConfig,
  DataExport,
  ComplianceAudit,
  AuditFinding,
} from './gdpr-deletion';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

import {
  generateTimeDimension,
  generateProviderDimension,
  computeDailyBrandSummary,
} from './dimensional-model';

import {
  generateQualityReport,
  checkCompleteness,
  checkRange,
  detectAnomalies,
} from './data-quality';

import { getDefaultManager as getDefaultViewManager } from './materialized-views';
import { getDefaultRunner as getDefaultDQRunner } from './dq-runner';
import { getDefaultCatalog } from './data-catalog';
import { getDefaultRegistry, getDefaultValidator } from './data-contracts';
import { getDefaultCIValidator, getDefaultTestRunner } from './contract-ci-validation';
import { getDefaultPartitionManager, getDefaultRetentionManager } from './partitioning-retention';
import { getDefaultCheckpointManager, getDefaultWatermarkManager } from './idempotent-pipelines';
import { getDefaultDashboard } from './data-observability';
import { getDefaultDetector } from './schema-detection';
import { getDefaultBackupManager, getDefaultRecoveryManager, getDefaultTestRunner as getDefaultRecoveryTestRunner } from './backup-recovery';
import { getDefaultService as getDefaultGDPRService } from './gdpr-deletion';

/**
 * Quick data quality check for a dataset
 */
export function quickQualityCheck(
  data: Record<string, unknown>[],
  tableName: string
): {
  overallScore: number;
  issueCount: number;
  recommendations: string[];
} {
  const report = generateQualityReport(data, tableName);

  return {
    overallScore: report.overallScore,
    issueCount: report.issues.length,
    recommendations: report.recommendations,
  };
}

/**
 * Generate time dimension for the current year
 */
export function generateCurrentYearTimeDimension(): ReturnType<typeof generateTimeDimension> {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  return generateTimeDimension(startOfYear, endOfYear);
}

/**
 * Get data engineering module health (comprehensive)
 */
export function getDataEngineeringHealth(): {
  dimensionalModel: { tablesConfigured: number };
  dataQuality: { rulesConfigured: number; activeChecks: number };
  materializedViews: { total: number; stale: number };
  contracts: { total: number; active: number };
  observability: { health: number; alerts: number };
  backups: { total: number; lastSuccessful: Date | undefined };
} {
  const viewManager = getDefaultViewManager();
  const registry = getDefaultRegistry();
  const dashboard = getDefaultDashboard();
  const backupManager = getDefaultBackupManager();

  const views = viewManager.getAllViews();
  const contracts = registry.getAllContracts();
  const dashboardSummary = dashboard.getSummary();
  const backupSummary = backupManager.getSummary();

  return {
    dimensionalModel: {
      tablesConfigured: 9, // 6 dimensions + 3 facts
    },
    dataQuality: {
      rulesConfigured: 7, // DEFAULT_QUALITY_RULES.length
      activeChecks: 4,    // completeness, range, uniqueness, freshness
    },
    materializedViews: {
      total: views.length,
      stale: views.filter((v) => v.status === 'stale').length,
    },
    contracts: {
      total: contracts.length,
      active: contracts.filter((c) => c.status === 'active').length,
    },
    observability: {
      health: dashboardSummary.overallHealth,
      alerts: dashboardSummary.alerts.total,
    },
    backups: {
      total: backupSummary.totalBackups,
      lastSuccessful: backupSummary.latestBackup,
    },
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Dimensional model
  generateTimeDimension,
  generateProviderDimension,
  computeDailyBrandSummary,

  // Data quality
  generateQualityReport,
  checkCompleteness,
  checkRange,
  detectAnomalies,

  // New managers
  getDefaultViewManager,
  getDefaultDQRunner,
  getDefaultCatalog,
  getDefaultRegistry,
  getDefaultValidator,
  getDefaultCIValidator,
  getDefaultTestRunner,
  getDefaultPartitionManager,
  getDefaultRetentionManager,
  getDefaultCheckpointManager,
  getDefaultWatermarkManager,
  getDefaultDashboard,
  getDefaultDetector,
  getDefaultBackupManager,
  getDefaultRecoveryManager,
  getDefaultRecoveryTestRunner,
  getDefaultGDPRService,

  // Convenience
  quickQualityCheck,
  generateCurrentYearTimeDimension,
  getDataEngineeringHealth,
};
