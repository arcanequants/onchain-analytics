/**
 * Semantic Audit Module
 *
 * Data quality validation, anomaly detection, and referential integrity
 *
 * Phase 3, Week 10
 */

// Types
export type {
  RuleSeverity,
  RuleCategory,
  DataQualityRule,
  RuleValidationResult,
  AnomalyType,
  Anomaly,
  AnomalyDetectionConfig,
  OrphanRecord,
  ReferentialIntegrityCheck,
  FieldType,
  FieldSchema,
  SchemaValidationResult,
  SchemaValidationError,
  AuditReport,
  AuditSummary,
  SemanticAuditConfig,
} from './types';

export { DEFAULT_AUDIT_CONFIG } from './types';

// Rules
export {
  createCompletenessRule,
  createUniquenessRule,
  createValidityRule,
  createConsistencyRule,
  createRangeRule,
  validateRule,
  validateRules,
  EMAIL_RULE,
  URL_RULE,
  UUID_RULE,
  POSITIVE_NUMBER_RULE,
  PERCENTAGE_RULE,
} from './rules';

// Anomaly Detection
export {
  DEFAULT_ANOMALY_CONFIG,
  detectOutliers,
  detectOutliersIQR,
  detectMissingValues,
  detectDuplicates,
  detectFormatAnomalies,
  detectAutoFormat,
  detectTemporalAnomalies,
  detectOutOfRange,
  detectAllAnomalies,
} from './anomaly';

// Orphan Detection
export {
  detectOrphans,
  detectAllOrphans,
  detectSelfReferenceOrphans,
  checkBidirectionalRelationship,
  findCascadeImpact,
  calculateCascadeImpact,
  getIntegrityStats,
  groupOrphansByTable,
  groupOrphansByTarget,
} from './orphans';

// Schema Validation
export {
  validateSchema,
  stringField,
  numberField,
  integerField,
  booleanField,
  emailField,
  urlField,
  uuidField,
  dateField,
  datetimeField,
  arrayField,
  objectField,
  enumField,
  inferSchema,
} from './schema';

// ================================================================
// AUDIT REPORT GENERATION
// ================================================================

import type {
  DataQualityRule,
  AuditReport,
  AuditSummary,
  SemanticAuditConfig,
  FieldSchema,
  ReferentialIntegrityCheck,
  AnomalyType,
} from './types';
import { DEFAULT_AUDIT_CONFIG } from './types';
import { validateRules } from './rules';
import { detectAllAnomalies } from './anomaly';
import { detectAllOrphans } from './orphans';
import { validateSchema as _validateSchema } from './schema';

type RecordType = Record<string, unknown>;

/**
 * Generate comprehensive audit report
 */
export function generateAuditReport(
  datasetName: string,
  records: RecordType[],
  options: {
    rules?: DataQualityRule[];
    schema?: Record<string, FieldSchema>;
    integrityChecks?: ReferentialIntegrityCheck[];
    relatedTables?: Map<string, RecordType[]>;
    config?: Partial<SemanticAuditConfig>;
  } = {}
): AuditReport {
  const config = { ...DEFAULT_AUDIT_CONFIG, ...options.config };
  const startTime = Date.now();

  // Initialize results
  const ruleResults = config.enableRules && options.rules
    ? validateRules(options.rules, records)
    : [];

  // Detect anomalies
  const fields = Object.keys(records[0] || {});
  const anomalies = config.enableAnomalyDetection
    ? detectAllAnomalies(records, fields, config.anomalyConfig)
    : [];

  // Detect orphans
  const orphans = config.enableOrphanDetection &&
    options.integrityChecks &&
    options.relatedTables
    ? (() => {
        const tables = new Map(options.relatedTables);
        tables.set(datasetName, records);
        return detectAllOrphans(tables, options.integrityChecks);
      })()
    : [];

  // Schema validation (validate first 100 records)
  const schemaValidation = config.enableSchemaValidation && options.schema
    ? records.slice(0, 100).reduce(
        (acc, record) => {
          const result = _validateSchema(record, options.schema!);
          acc.valid = acc.valid && result.valid;
          acc.errors.push(...result.errors);
          acc.warnings.push(...result.warnings);
          result.extraFields.forEach((f) => acc.extraFields.add(f));
          result.missingFields.forEach((f) => acc.missingFields.add(f));
          return acc;
        },
        {
          valid: true,
          errors: [] as typeof schemaValidation.errors,
          warnings: [] as typeof schemaValidation.warnings,
          validatedFields: Object.keys(options.schema),
          extraFields: new Set<string>(),
          missingFields: new Set<string>(),
        }
      )
    : undefined;

  // Calculate summary
  const summary = calculateSummary(ruleResults, anomalies, orphans);

  // Calculate quality score
  const qualityScore = calculateQualityScore(summary, records.length);

  // Generate recommendations
  const recommendations = generateRecommendations(summary, ruleResults, anomalies);

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `${datasetName} Audit Report`,
    dataset: datasetName,
    generatedAt: new Date(),
    totalRecords: records.length,
    qualityScore,
    ruleResults,
    anomalies,
    orphans,
    schemaValidation: schemaValidation
      ? {
          ...schemaValidation,
          extraFields: [...schemaValidation.extraFields],
          missingFields: [...schemaValidation.missingFields],
        }
      : undefined,
    summary,
    recommendations,
  };
}

/**
 * Calculate audit summary
 */
function calculateSummary(
  ruleResults: AuditReport['ruleResults'],
  anomalies: AuditReport['anomalies'],
  orphans: AuditReport['orphans']
): AuditSummary {
  const anomaliesByType: Record<AnomalyType, number> = {
    outlier: 0,
    missing_value: 0,
    duplicate: 0,
    invalid_format: 0,
    out_of_range: 0,
    unexpected_pattern: 0,
    temporal_anomaly: 0,
    referential_integrity: 0,
  };

  for (const anomaly of anomalies) {
    anomaliesByType[anomaly.type]++;
  }

  const fieldsWithIssues = new Set<string>();
  for (const anomaly of anomalies) {
    fieldsWithIssues.add(anomaly.field);
  }
  for (const result of ruleResults) {
    if (!result.passed && result.failedRecords) {
      for (const record of result.failedRecords) {
        fieldsWithIssues.add(record.field);
      }
    }
  }

  return {
    rulesChecked: ruleResults.length,
    rulesPassed: ruleResults.filter((r) => r.passed).length,
    rulesFailed: ruleResults.filter((r) => !r.passed).length,
    anomaliesFound: anomalies.length,
    anomaliesByType,
    orphansFound: orphans.length,
    fieldsWithIssues: [...fieldsWithIssues],
    criticalIssues: ruleResults.filter((r) => !r.passed).length + orphans.length,
    warningCount: anomalies.length,
  };
}

/**
 * Calculate overall quality score (0-100)
 */
function calculateQualityScore(summary: AuditSummary, totalRecords: number): number {
  if (totalRecords === 0) return 0;

  // Start at 100
  let score = 100;

  // Deduct for failed rules (up to 40 points)
  const ruleFailureRate = summary.rulesChecked > 0
    ? summary.rulesFailed / summary.rulesChecked
    : 0;
  score -= ruleFailureRate * 40;

  // Deduct for anomalies (up to 30 points)
  const anomalyRate = summary.anomaliesFound / totalRecords;
  score -= Math.min(30, anomalyRate * 100);

  // Deduct for orphans (up to 20 points)
  const orphanRate = summary.orphansFound / totalRecords;
  score -= Math.min(20, orphanRate * 100);

  // Deduct for critical issues (up to 10 points)
  score -= Math.min(10, summary.criticalIssues * 2);

  return Math.max(0, Math.round(score));
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations(
  summary: AuditSummary,
  ruleResults: AuditReport['ruleResults'],
  anomalies: AuditReport['anomalies']
): string[] {
  const recommendations: string[] = [];

  // Rule-based recommendations
  if (summary.rulesFailed > 0) {
    recommendations.push(
      `Review and fix ${summary.rulesFailed} failed data quality rules.`
    );
  }

  // Anomaly-based recommendations
  if (summary.anomaliesByType.missing_value > 0) {
    recommendations.push(
      `Address ${summary.anomaliesByType.missing_value} missing values. Consider adding default values or making fields optional.`
    );
  }

  if (summary.anomaliesByType.duplicate > 0) {
    recommendations.push(
      `Review ${summary.anomaliesByType.duplicate} duplicate records. Consider adding unique constraints.`
    );
  }

  if (summary.anomaliesByType.outlier > 0) {
    recommendations.push(
      `Investigate ${summary.anomaliesByType.outlier} statistical outliers. They may indicate data entry errors.`
    );
  }

  if (summary.anomaliesByType.invalid_format > 0) {
    recommendations.push(
      `Fix ${summary.anomaliesByType.invalid_format} format validation errors. Consider adding input validation.`
    );
  }

  if (summary.orphansFound > 0) {
    recommendations.push(
      `Resolve ${summary.orphansFound} orphan records. Consider cascading deletes or foreign key constraints.`
    );
  }

  // Field-specific recommendations
  if (summary.fieldsWithIssues.length > 3) {
    recommendations.push(
      `Focus on fields with most issues: ${summary.fieldsWithIssues.slice(0, 3).join(', ')}`
    );
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Data quality is good. Continue regular monitoring.');
  }

  return recommendations;
}

/**
 * Quick data quality check
 */
export function quickAudit(
  records: RecordType[],
  fields?: string[]
): { score: number; issues: string[] } {
  const fieldsToCheck = fields || Object.keys(records[0] || {});
  const anomalies = detectAllAnomalies(records, fieldsToCheck, {
    ...DEFAULT_AUDIT_CONFIG.anomalyConfig,
    maxAnomalies: 20,
  });

  const issues: string[] = [];
  const issuesByType = new Map<string, number>();

  for (const anomaly of anomalies) {
    const count = issuesByType.get(anomaly.type) || 0;
    issuesByType.set(anomaly.type, count + 1);
  }

  for (const [type, count] of issuesByType) {
    issues.push(`${count} ${type.replace(/_/g, ' ')} issues`);
  }

  const score = Math.max(0, 100 - anomalies.length * 5);

  return { score, issues };
}

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default {
  generateAuditReport,
  quickAudit,
};
