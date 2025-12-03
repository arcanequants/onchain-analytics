/**
 * Data Quality Framework
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Features:
 * - Data quality rules and validation
 * - Anomaly detection
 * - Quality scoring
 * - Data lineage tracking
 */

// ============================================================================
// TYPES
// ============================================================================

export type QualityDimension =
  | 'completeness'    // No missing values
  | 'accuracy'        // Values are correct
  | 'consistency'     // Values match across sources
  | 'timeliness'      // Data is up-to-date
  | 'uniqueness'      // No duplicates
  | 'validity';       // Values conform to rules

export type RuleSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface QualityRule {
  id: string;
  name: string;
  description: string;
  dimension: QualityDimension;
  severity: RuleSeverity;
  table: string;
  column?: string;
  expression: string;
  threshold?: number;
  enabled: boolean;
}

export interface QualityCheckResult {
  ruleId: string;
  ruleName: string;
  dimension: QualityDimension;
  severity: RuleSeverity;
  passed: boolean;
  actualValue: number | string;
  expectedValue?: number | string;
  affectedRows?: number;
  totalRows?: number;
  message: string;
  timestamp: Date;
}

export interface QualityReport {
  reportId: string;
  generatedAt: Date;
  table: string;
  overallScore: number;        // 0-100
  dimensionScores: Record<QualityDimension, number>;
  checkResults: QualityCheckResult[];
  issues: QualityIssue[];
  recommendations: string[];
}

export interface QualityIssue {
  id: string;
  dimension: QualityDimension;
  severity: RuleSeverity;
  description: string;
  affectedRecords: number;
  firstDetected: Date;
  lastDetected: Date;
  status: 'open' | 'acknowledged' | 'resolved';
}

export interface DataLineage {
  entityId: string;
  entityType: 'table' | 'column' | 'view' | 'report';
  name: string;
  upstream: LineageNode[];
  downstream: LineageNode[];
  transformations: Transformation[];
  lastRefreshed: Date;
  refreshFrequency: string;
}

export interface LineageNode {
  entityId: string;
  name: string;
  type: string;
  relationship: 'source' | 'derived' | 'aggregated' | 'filtered';
}

export interface Transformation {
  name: string;
  type: 'filter' | 'aggregate' | 'join' | 'map' | 'enrich';
  expression?: string;
  timestamp: Date;
}

// ============================================================================
// QUALITY RULES
// ============================================================================

export const DEFAULT_QUALITY_RULES: QualityRule[] = [
  // Completeness rules
  {
    id: 'rule-completeness-brand-name',
    name: 'Brand Name Required',
    description: 'Brand name must not be null or empty',
    dimension: 'completeness',
    severity: 'critical',
    table: 'brands',
    column: 'brand_name',
    expression: 'NOT NULL AND LENGTH > 0',
    enabled: true,
  },
  {
    id: 'rule-completeness-score',
    name: 'Score Required',
    description: 'Perception scores must not be null',
    dimension: 'completeness',
    severity: 'error',
    table: 'brand_scores',
    column: 'overall_score',
    expression: 'NOT NULL',
    enabled: true,
  },

  // Accuracy rules
  {
    id: 'rule-accuracy-score-range',
    name: 'Score Range Valid',
    description: 'Scores must be between 0 and 100',
    dimension: 'accuracy',
    severity: 'error',
    table: 'brand_scores',
    column: 'overall_score',
    expression: 'BETWEEN 0 AND 100',
    enabled: true,
  },
  {
    id: 'rule-accuracy-sentiment-range',
    name: 'Sentiment Range Valid',
    description: 'Sentiment must be between -100 and 100',
    dimension: 'accuracy',
    severity: 'error',
    table: 'brand_scores',
    column: 'sentiment_score',
    expression: 'BETWEEN -100 AND 100',
    enabled: true,
  },

  // Consistency rules
  {
    id: 'rule-consistency-provider-valid',
    name: 'Provider Valid',
    description: 'Provider must be in valid list',
    dimension: 'consistency',
    severity: 'warning',
    table: 'brand_scores',
    column: 'provider_id',
    expression: 'IN (openai, anthropic, google, perplexity)',
    enabled: true,
  },

  // Timeliness rules
  {
    id: 'rule-timeliness-score-fresh',
    name: 'Score Freshness',
    description: 'Scores should be updated within 24 hours',
    dimension: 'timeliness',
    severity: 'warning',
    table: 'brand_scores',
    column: 'updated_at',
    expression: 'WITHIN 24 HOURS',
    threshold: 24,
    enabled: true,
  },

  // Uniqueness rules
  {
    id: 'rule-uniqueness-brand-provider',
    name: 'Unique Brand-Provider Combination',
    description: 'Each brand should have one current score per provider',
    dimension: 'uniqueness',
    severity: 'error',
    table: 'brand_scores',
    expression: 'UNIQUE(brand_id, provider_id, is_current)',
    enabled: true,
  },

  // Validity rules
  {
    id: 'rule-validity-date-format',
    name: 'Valid Date Format',
    description: 'Dates must be valid ISO format',
    dimension: 'validity',
    severity: 'error',
    table: 'brand_scores',
    column: 'created_at',
    expression: 'VALID ISO8601 DATE',
    enabled: true,
  },
];

// ============================================================================
// QUALITY CHECK FUNCTIONS
// ============================================================================

/**
 * Check completeness of data
 */
export function checkCompleteness(
  data: Record<string, unknown>[],
  column: string
): QualityCheckResult {
  const total = data.length;
  const nullCount = data.filter(
    row => row[column] === null || row[column] === undefined || row[column] === ''
  ).length;
  const completeCount = total - nullCount;
  const completenessScore = total > 0 ? (completeCount / total) * 100 : 100;

  return {
    ruleId: `check-completeness-${column}`,
    ruleName: `Completeness: ${column}`,
    dimension: 'completeness',
    severity: nullCount > 0 ? 'warning' : 'info',
    passed: nullCount === 0,
    actualValue: completenessScore,
    expectedValue: 100,
    affectedRows: nullCount,
    totalRows: total,
    message: nullCount > 0
      ? `${nullCount} rows have null/empty ${column}`
      : `All ${total} rows have valid ${column}`,
    timestamp: new Date(),
  };
}

/**
 * Check value range accuracy
 */
export function checkRange(
  data: Record<string, unknown>[],
  column: string,
  min: number,
  max: number
): QualityCheckResult {
  const values = data
    .map(row => row[column])
    .filter((v): v is number => typeof v === 'number');

  const outOfRange = values.filter(v => v < min || v > max).length;
  const passed = outOfRange === 0;

  return {
    ruleId: `check-range-${column}`,
    ruleName: `Range: ${column}`,
    dimension: 'accuracy',
    severity: outOfRange > 0 ? 'error' : 'info',
    passed,
    actualValue: `${values.length - outOfRange}/${values.length} in range`,
    expectedValue: `${min} to ${max}`,
    affectedRows: outOfRange,
    totalRows: values.length,
    message: passed
      ? `All values in valid range [${min}, ${max}]`
      : `${outOfRange} values outside range [${min}, ${max}]`,
    timestamp: new Date(),
  };
}

/**
 * Check for duplicates
 */
export function checkUniqueness(
  data: Record<string, unknown>[],
  columns: string[]
): QualityCheckResult {
  const keySet = new Set<string>();
  const duplicates: Record<string, unknown>[] = [];

  for (const row of data) {
    const key = columns.map(c => String(row[c])).join('|');
    if (keySet.has(key)) {
      duplicates.push(row);
    } else {
      keySet.add(key);
    }
  }

  return {
    ruleId: `check-uniqueness-${columns.join('-')}`,
    ruleName: `Uniqueness: ${columns.join(', ')}`,
    dimension: 'uniqueness',
    severity: duplicates.length > 0 ? 'error' : 'info',
    passed: duplicates.length === 0,
    actualValue: `${duplicates.length} duplicates`,
    expectedValue: '0 duplicates',
    affectedRows: duplicates.length,
    totalRows: data.length,
    message: duplicates.length > 0
      ? `Found ${duplicates.length} duplicate rows`
      : 'No duplicates found',
    timestamp: new Date(),
  };
}

/**
 * Check data freshness
 */
export function checkFreshness(
  data: Record<string, unknown>[],
  timestampColumn: string,
  maxAgeHours: number
): QualityCheckResult {
  const now = Date.now();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  const staleCount = data.filter(row => {
    const timestamp = row[timestampColumn];
    if (!timestamp) return true;
    const date = new Date(timestamp as string | number);
    return now - date.getTime() > maxAgeMs;
  }).length;

  return {
    ruleId: `check-freshness-${timestampColumn}`,
    ruleName: `Freshness: ${timestampColumn}`,
    dimension: 'timeliness',
    severity: staleCount > 0 ? 'warning' : 'info',
    passed: staleCount === 0,
    actualValue: `${staleCount} stale records`,
    expectedValue: `Updated within ${maxAgeHours}h`,
    affectedRows: staleCount,
    totalRows: data.length,
    message: staleCount > 0
      ? `${staleCount} records older than ${maxAgeHours} hours`
      : 'All records are fresh',
    timestamp: new Date(),
  };
}

/**
 * Detect anomalies using Z-score
 */
export function detectAnomalies(
  data: Record<string, unknown>[],
  column: string,
  threshold: number = 3
): { anomalies: number[]; zScores: Map<number, number> } {
  const values = data
    .map(row => row[column])
    .filter((v): v is number => typeof v === 'number');

  if (values.length < 3) {
    return { anomalies: [], zScores: new Map() };
  }

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  );

  const zScores = new Map<number, number>();
  const anomalies: number[] = [];

  for (let i = 0; i < values.length; i++) {
    const z = stdDev > 0 ? (values[i] - mean) / stdDev : 0;
    zScores.set(i, z);

    if (Math.abs(z) > threshold) {
      anomalies.push(i);
    }
  }

  return { anomalies, zScores };
}

// ============================================================================
// QUALITY REPORT GENERATION
// ============================================================================

/**
 * Generate comprehensive quality report
 */
export function generateQualityReport(
  data: Record<string, unknown>[],
  tableName: string,
  rules: QualityRule[] = DEFAULT_QUALITY_RULES
): QualityReport {
  const applicableRules = rules.filter(r => r.table === tableName && r.enabled);
  const checkResults: QualityCheckResult[] = [];
  const issues: QualityIssue[] = [];

  // Run completeness checks for columns
  const sampleRow = data[0] || {};
  for (const column of Object.keys(sampleRow)) {
    const result = checkCompleteness(data, column);
    checkResults.push(result);

    if (!result.passed) {
      issues.push({
        id: `issue-${result.ruleId}`,
        dimension: 'completeness',
        severity: result.severity,
        description: result.message,
        affectedRecords: result.affectedRows || 0,
        firstDetected: new Date(),
        lastDetected: new Date(),
        status: 'open',
      });
    }
  }

  // Calculate dimension scores
  const dimensionScores: Record<QualityDimension, number> = {
    completeness: 100,
    accuracy: 100,
    consistency: 100,
    timeliness: 100,
    uniqueness: 100,
    validity: 100,
  };

  for (const result of checkResults) {
    if (!result.passed) {
      const penalty = result.severity === 'critical' ? 30 :
                      result.severity === 'error' ? 20 :
                      result.severity === 'warning' ? 10 : 5;
      dimensionScores[result.dimension] = Math.max(0, dimensionScores[result.dimension] - penalty);
    }
  }

  // Calculate overall score
  const overallScore = Object.values(dimensionScores).reduce((a, b) => a + b, 0) / 6;

  // Generate recommendations
  const recommendations: string[] = [];

  if (dimensionScores.completeness < 90) {
    recommendations.push('Review and fill missing values in critical columns');
  }
  if (dimensionScores.accuracy < 90) {
    recommendations.push('Validate data against source systems');
  }
  if (dimensionScores.timeliness < 90) {
    recommendations.push('Check ETL pipeline for delays');
  }
  if (dimensionScores.uniqueness < 90) {
    recommendations.push('Implement deduplication process');
  }

  if (recommendations.length === 0) {
    recommendations.push('Data quality is within acceptable thresholds');
  }

  return {
    reportId: `qr_${Date.now()}`,
    generatedAt: new Date(),
    table: tableName,
    overallScore: Math.round(overallScore * 100) / 100,
    dimensionScores,
    checkResults,
    issues,
    recommendations,
  };
}

// ============================================================================
// DATA LINEAGE
// ============================================================================

const lineageRegistry = new Map<string, DataLineage>();

/**
 * Register data lineage
 */
export function registerLineage(lineage: DataLineage): void {
  lineageRegistry.set(lineage.entityId, lineage);
}

/**
 * Get lineage for entity
 */
export function getLineage(entityId: string): DataLineage | undefined {
  return lineageRegistry.get(entityId);
}

/**
 * Get full lineage graph (upstream trace)
 */
export function traceUpstream(entityId: string, depth: number = 10): LineageNode[] {
  const result: LineageNode[] = [];
  const visited = new Set<string>();
  const queue = [entityId];

  let currentDepth = 0;

  while (queue.length > 0 && currentDepth < depth) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const lineage = lineageRegistry.get(id);
    if (lineage) {
      for (const upstream of lineage.upstream) {
        result.push(upstream);
        queue.push(upstream.entityId);
      }
    }

    currentDepth++;
  }

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
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
};
