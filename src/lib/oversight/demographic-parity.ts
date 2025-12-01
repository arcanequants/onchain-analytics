/**
 * Demographic Parity Module
 * Phase 1, Week 3, Day 5 - Governance Tasks
 *
 * Monitors and ensures fair treatment across demographic groups.
 * Implements parity metrics and bias detection for AI decisions.
 */

// ================================================================
// TYPES
// ================================================================

export type ProtectedAttribute =
  | 'age_group'
  | 'gender'
  | 'ethnicity'
  | 'location'
  | 'income_bracket'
  | 'education_level'
  | 'employment_status'
  | 'disability_status'
  | 'language'
  | 'industry';

export type ParityMetric =
  | 'demographic_parity'      // Equal positive rates across groups
  | 'equalized_odds'          // Equal TPR and FPR across groups
  | 'equal_opportunity'       // Equal TPR across groups
  | 'predictive_parity'       // Equal precision across groups
  | 'calibration';            // Equal calibration across groups

export type BiasLevel =
  | 'none'      // No significant bias detected
  | 'low'       // Minor disparities within acceptable range
  | 'moderate'  // Notable disparities requiring attention
  | 'high'      // Significant bias requiring intervention
  | 'critical'; // Severe bias requiring immediate action

export interface DemographicGroup {
  attribute: ProtectedAttribute;
  value: string;
  count: number;
  positiveRate: number;
  negativeRate: number;
  truePositiveRate?: number;
  falsePositiveRate?: number;
  precision?: number;
}

export interface ParityResult {
  metric: ParityMetric;
  attribute: ProtectedAttribute;
  groups: DemographicGroup[];
  disparityRatio: number;
  maxDisparity: number;
  averageDisparity: number;
  biasLevel: BiasLevel;
  referenceGroup: string;
  warnings: string[];
  recommendations: string[];
}

export interface ParityConfig {
  thresholds: {
    none: number;      // 0-0.8 disparity ratio = none
    low: number;       // 0.8-0.9 = low
    moderate: number;  // 0.9-0.95 = moderate
    high: number;      // 0.95-0.99 = high
    // >= 0.99 = critical
  };
  minimumGroupSize: number;
  referenceGroupStrategy: 'largest' | 'majority' | 'overall';
}

export interface DecisionRecord {
  id: string;
  outcome: boolean;
  groundTruth?: boolean;
  predictedProbability?: number;
  demographics: Partial<Record<ProtectedAttribute, string>>;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AuditReport {
  generatedAt: Date;
  period: { start: Date; end: Date };
  totalDecisions: number;
  attributesAnalyzed: ProtectedAttribute[];
  results: ParityResult[];
  overallBiasLevel: BiasLevel;
  criticalIssues: string[];
  summary: string;
}

// ================================================================
// DEFAULT CONFIGURATION
// ================================================================

const DEFAULT_CONFIG: ParityConfig = {
  thresholds: {
    none: 0.8,
    low: 0.9,
    moderate: 0.95,
    high: 0.99
  },
  minimumGroupSize: 30,
  referenceGroupStrategy: 'largest'
};

// ================================================================
// DEMOGRAPHIC PARITY ANALYZER CLASS
// ================================================================

export class DemographicParityAnalyzer {
  private config: ParityConfig;
  private records: DecisionRecord[] = [];

  constructor(customConfig?: Partial<ParityConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...customConfig,
      thresholds: {
        ...DEFAULT_CONFIG.thresholds,
        ...(customConfig?.thresholds || {})
      }
    };
  }

  /**
   * Add decision record for analysis
   */
  addRecord(record: DecisionRecord): void {
    this.records.push(record);
  }

  /**
   * Add multiple decision records
   */
  addRecords(records: DecisionRecord[]): void {
    this.records.push(...records);
  }

  /**
   * Clear all records
   */
  clearRecords(): void {
    this.records = [];
  }

  /**
   * Get record count
   */
  getRecordCount(): number {
    return this.records.length;
  }

  /**
   * Analyze demographic parity for an attribute
   */
  analyzeAttribute(
    attribute: ProtectedAttribute,
    metric: ParityMetric = 'demographic_parity'
  ): ParityResult {
    // Group records by attribute value
    const groups = this.groupByAttribute(attribute);

    // Filter groups below minimum size
    const validGroups = groups.filter(g => g.count >= this.config.minimumGroupSize);

    if (validGroups.length < 2) {
      return this.insufficientDataResult(attribute, metric, groups);
    }

    // Calculate metric for each group
    const enrichedGroups = this.calculateMetrics(validGroups, metric);

    // Find reference group
    const referenceGroup = this.selectReferenceGroup(enrichedGroups);

    // Calculate disparities
    const disparities = this.calculateDisparities(
      enrichedGroups,
      referenceGroup,
      metric
    );

    // Determine bias level
    const biasLevel = this.determineBiasLevel(disparities.minRatio);

    // Generate warnings and recommendations
    const warnings = this.generateWarnings(enrichedGroups, disparities, biasLevel);
    const recommendations = this.generateRecommendations(
      attribute,
      metric,
      biasLevel,
      disparities
    );

    return {
      metric,
      attribute,
      groups: enrichedGroups,
      disparityRatio: disparities.minRatio,
      maxDisparity: disparities.maxDisparity,
      averageDisparity: disparities.avgDisparity,
      biasLevel,
      referenceGroup: referenceGroup.value,
      warnings,
      recommendations
    };
  }

  /**
   * Group records by attribute value
   */
  private groupByAttribute(attribute: ProtectedAttribute): DemographicGroup[] {
    const groupMap = new Map<string, {
      count: number;
      positive: number;
      truePositive: number;
      falsePositive: number;
      trueNegative: number;
      falseNegative: number;
    }>();

    for (const record of this.records) {
      const value = record.demographics[attribute];
      if (!value) continue;

      if (!groupMap.has(value)) {
        groupMap.set(value, {
          count: 0,
          positive: 0,
          truePositive: 0,
          falsePositive: 0,
          trueNegative: 0,
          falseNegative: 0
        });
      }

      const group = groupMap.get(value)!;
      group.count++;

      if (record.outcome) {
        group.positive++;
        if (record.groundTruth === true) group.truePositive++;
        if (record.groundTruth === false) group.falsePositive++;
      } else {
        if (record.groundTruth === true) group.falseNegative++;
        if (record.groundTruth === false) group.trueNegative++;
      }
    }

    return Array.from(groupMap.entries()).map(([value, data]) => ({
      attribute,
      value,
      count: data.count,
      positiveRate: data.count > 0 ? data.positive / data.count : 0,
      negativeRate: data.count > 0 ? (data.count - data.positive) / data.count : 0,
      truePositiveRate: (data.truePositive + data.falseNegative) > 0
        ? data.truePositive / (data.truePositive + data.falseNegative)
        : undefined,
      falsePositiveRate: (data.falsePositive + data.trueNegative) > 0
        ? data.falsePositive / (data.falsePositive + data.trueNegative)
        : undefined,
      precision: (data.truePositive + data.falsePositive) > 0
        ? data.truePositive / (data.truePositive + data.falsePositive)
        : undefined
    }));
  }

  /**
   * Calculate metric values for groups
   */
  private calculateMetrics(
    groups: DemographicGroup[],
    metric: ParityMetric
  ): DemographicGroup[] {
    // Metrics are already calculated in groupByAttribute
    // This method can be extended for additional metric calculations
    return groups;
  }

  /**
   * Select reference group based on strategy
   */
  private selectReferenceGroup(groups: DemographicGroup[]): DemographicGroup {
    switch (this.config.referenceGroupStrategy) {
      case 'largest':
        return groups.reduce((a, b) => a.count > b.count ? a : b);
      case 'majority':
        // Majority = highest positive rate
        return groups.reduce((a, b) => a.positiveRate > b.positiveRate ? a : b);
      case 'overall':
      default:
        // Overall = weighted average behavior
        const totalCount = groups.reduce((sum, g) => sum + g.count, 0);
        const weightedRate = groups.reduce(
          (sum, g) => sum + (g.positiveRate * g.count),
          0
        ) / totalCount;

        // Return group closest to overall rate
        return groups.reduce((a, b) =>
          Math.abs(a.positiveRate - weightedRate) < Math.abs(b.positiveRate - weightedRate)
            ? a : b
        );
    }
  }

  /**
   * Calculate disparities between groups
   */
  private calculateDisparities(
    groups: DemographicGroup[],
    reference: DemographicGroup,
    metric: ParityMetric
  ): {
    minRatio: number;
    maxDisparity: number;
    avgDisparity: number;
    groupDisparities: Map<string, number>;
  } {
    const groupDisparities = new Map<string, number>();
    let minRatio = 1;
    let maxDisparity = 0;
    let totalDisparity = 0;

    const getRateForMetric = (group: DemographicGroup): number => {
      switch (metric) {
        case 'demographic_parity':
          return group.positiveRate;
        case 'equal_opportunity':
          return group.truePositiveRate ?? group.positiveRate;
        case 'equalized_odds':
          // Average of TPR and FPR
          const tpr = group.truePositiveRate ?? group.positiveRate;
          const fpr = group.falsePositiveRate ?? 0;
          return (tpr + (1 - fpr)) / 2;
        case 'predictive_parity':
          return group.precision ?? group.positiveRate;
        case 'calibration':
          return group.positiveRate;
        default:
          return group.positiveRate;
      }
    };

    const referenceRate = getRateForMetric(reference);

    for (const group of groups) {
      if (group.value === reference.value) {
        groupDisparities.set(group.value, 0);
        continue;
      }

      const groupRate = getRateForMetric(group);

      // Calculate disparity ratio (smaller / larger)
      let ratio: number;
      if (referenceRate === 0 && groupRate === 0) {
        ratio = 1;
      } else if (referenceRate === 0 || groupRate === 0) {
        ratio = 0;
      } else {
        ratio = Math.min(groupRate, referenceRate) / Math.max(groupRate, referenceRate);
      }

      const disparity = Math.abs(groupRate - referenceRate);

      groupDisparities.set(group.value, disparity);
      minRatio = Math.min(minRatio, ratio);
      maxDisparity = Math.max(maxDisparity, disparity);
      totalDisparity += disparity;
    }

    return {
      minRatio,
      maxDisparity,
      avgDisparity: groups.length > 1 ? totalDisparity / (groups.length - 1) : 0,
      groupDisparities
    };
  }

  /**
   * Determine bias level from disparity ratio
   * Higher ratio = better parity = less bias
   * A ratio of 1.0 means perfect parity (no bias)
   * A ratio of 0.0 means maximum disparity (critical bias)
   */
  private determineBiasLevel(disparityRatio: number): BiasLevel {
    const { thresholds } = this.config;

    // Invert the logic: lower ratio = more bias
    if (disparityRatio >= thresholds.high) return 'none';        // >= 0.99 = no bias
    if (disparityRatio >= thresholds.moderate) return 'low';     // >= 0.95 = low bias
    if (disparityRatio >= thresholds.low) return 'moderate';     // >= 0.9 = moderate
    if (disparityRatio >= thresholds.none) return 'high';        // >= 0.8 = high
    return 'critical';                                            // < 0.8 = critical
  }

  /**
   * Generate warnings
   */
  private generateWarnings(
    groups: DemographicGroup[],
    disparities: { maxDisparity: number; groupDisparities: Map<string, number> },
    biasLevel: BiasLevel
  ): string[] {
    const warnings: string[] = [];

    // Small sample size warning
    for (const group of groups) {
      if (group.count < this.config.minimumGroupSize * 2) {
        warnings.push(
          `Group "${group.value}" has small sample size (${group.count})`
        );
      }
    }

    // High disparity warning
    if (biasLevel === 'high' || biasLevel === 'critical') {
      warnings.push(
        `Significant disparity detected (${(disparities.maxDisparity * 100).toFixed(1)}%)`
      );
    }

    // Extremely low representation warning
    const totalCount = groups.reduce((sum, g) => sum + g.count, 0);
    for (const group of groups) {
      if (group.count / totalCount < 0.05) {
        warnings.push(
          `Group "${group.value}" represents less than 5% of data`
        );
      }
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    attribute: ProtectedAttribute,
    metric: ParityMetric,
    biasLevel: BiasLevel,
    disparities: { maxDisparity: number; groupDisparities: Map<string, number> }
  ): string[] {
    const recommendations: string[] = [];

    switch (biasLevel) {
      case 'none':
        recommendations.push('No intervention needed - continue monitoring');
        break;
      case 'low':
        recommendations.push('Continue monitoring for trend changes');
        recommendations.push('Consider periodic deeper analysis');
        break;
      case 'moderate':
        recommendations.push('Investigate root cause of disparities');
        recommendations.push('Review decision criteria for attribute impact');
        recommendations.push(`Examine ${attribute} handling in AI model`);
        break;
      case 'high':
        recommendations.push('Immediate review of decision process required');
        recommendations.push('Consider bias mitigation techniques');
        recommendations.push('Consult with fairness specialists');
        recommendations.push(`Audit ${attribute} related features`);
        break;
      case 'critical':
        recommendations.push('URGENT: Halt or closely monitor affected decisions');
        recommendations.push('Immediate fairness intervention required');
        recommendations.push('Executive escalation recommended');
        recommendations.push('Consider temporary attribute-blind processing');
        recommendations.push(`Full audit of ${attribute} impact on decisions`);
        break;
    }

    return recommendations;
  }

  /**
   * Return result for insufficient data
   */
  private insufficientDataResult(
    attribute: ProtectedAttribute,
    metric: ParityMetric,
    groups: DemographicGroup[]
  ): ParityResult {
    return {
      metric,
      attribute,
      groups,
      disparityRatio: 1,
      maxDisparity: 0,
      averageDisparity: 0,
      biasLevel: 'none',
      referenceGroup: groups[0]?.value || 'unknown',
      warnings: [
        `Insufficient data for ${attribute} analysis`,
        `Need at least 2 groups with ${this.config.minimumGroupSize}+ records each`
      ],
      recommendations: [
        'Collect more data before drawing conclusions',
        'Consider alternative analysis methods'
      ]
    };
  }

  /**
   * Run full audit across all attributes
   */
  runAudit(
    attributes: ProtectedAttribute[],
    period?: { start: Date; end: Date }
  ): AuditReport {
    const results: ParityResult[] = [];
    const criticalIssues: string[] = [];
    let worstBiasLevel: BiasLevel = 'none';

    const biasOrder: Record<BiasLevel, number> = {
      none: 0,
      low: 1,
      moderate: 2,
      high: 3,
      critical: 4
    };

    // Filter records by period if specified
    const recordsToAnalyze = period
      ? this.records.filter(
          r => r.timestamp >= period.start && r.timestamp <= period.end
        )
      : this.records;

    // Temporarily swap records for analysis
    const originalRecords = this.records;
    this.records = recordsToAnalyze;

    for (const attribute of attributes) {
      const result = this.analyzeAttribute(attribute);
      results.push(result);

      if (biasOrder[result.biasLevel] > biasOrder[worstBiasLevel]) {
        worstBiasLevel = result.biasLevel;
      }

      if (result.biasLevel === 'critical' || result.biasLevel === 'high') {
        criticalIssues.push(
          `${result.biasLevel.toUpperCase()}: ${attribute} shows ${(result.maxDisparity * 100).toFixed(1)}% disparity`
        );
      }
    }

    // Restore original records
    this.records = originalRecords;

    return {
      generatedAt: new Date(),
      period: period || {
        start: recordsToAnalyze.length > 0
          ? recordsToAnalyze.reduce((min, r) =>
              r.timestamp < min ? r.timestamp : min, recordsToAnalyze[0].timestamp)
          : new Date(),
        end: recordsToAnalyze.length > 0
          ? recordsToAnalyze.reduce((max, r) =>
              r.timestamp > max ? r.timestamp : max, recordsToAnalyze[0].timestamp)
          : new Date()
      },
      totalDecisions: recordsToAnalyze.length,
      attributesAnalyzed: attributes,
      results,
      overallBiasLevel: worstBiasLevel,
      criticalIssues,
      summary: this.generateAuditSummary(results, worstBiasLevel, criticalIssues)
    };
  }

  /**
   * Generate audit summary
   */
  private generateAuditSummary(
    results: ParityResult[],
    overallLevel: BiasLevel,
    criticalIssues: string[]
  ): string {
    const lines: string[] = [];

    lines.push(`Overall bias assessment: ${overallLevel.toUpperCase()}`);
    lines.push(`Attributes analyzed: ${results.length}`);

    const biasCount = {
      none: results.filter(r => r.biasLevel === 'none').length,
      low: results.filter(r => r.biasLevel === 'low').length,
      moderate: results.filter(r => r.biasLevel === 'moderate').length,
      high: results.filter(r => r.biasLevel === 'high').length,
      critical: results.filter(r => r.biasLevel === 'critical').length
    };

    lines.push('');
    lines.push('Breakdown by bias level:');
    if (biasCount.critical > 0) lines.push(`  Critical: ${biasCount.critical}`);
    if (biasCount.high > 0) lines.push(`  High: ${biasCount.high}`);
    if (biasCount.moderate > 0) lines.push(`  Moderate: ${biasCount.moderate}`);
    if (biasCount.low > 0) lines.push(`  Low: ${biasCount.low}`);
    if (biasCount.none > 0) lines.push(`  None: ${biasCount.none}`);

    if (criticalIssues.length > 0) {
      lines.push('');
      lines.push('Critical issues requiring attention:');
      for (const issue of criticalIssues) {
        lines.push(`  - ${issue}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Get configuration
   */
  getConfig(): ParityConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ParityConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      thresholds: {
        ...this.config.thresholds,
        ...(updates.thresholds || {})
      }
    };
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Create default demographic parity analyzer
 */
export function createDemographicParityAnalyzer(): DemographicParityAnalyzer {
  return new DemographicParityAnalyzer();
}

/**
 * Get all protected attributes
 */
export function getProtectedAttributes(): ProtectedAttribute[] {
  return [
    'age_group',
    'gender',
    'ethnicity',
    'location',
    'income_bracket',
    'education_level',
    'employment_status',
    'disability_status',
    'language',
    'industry'
  ];
}

/**
 * Get all parity metrics
 */
export function getParityMetrics(): ParityMetric[] {
  return [
    'demographic_parity',
    'equalized_odds',
    'equal_opportunity',
    'predictive_parity',
    'calibration'
  ];
}

/**
 * Get all bias levels
 */
export function getBiasLevels(): BiasLevel[] {
  return ['none', 'low', 'moderate', 'high', 'critical'];
}

/**
 * Check if bias level requires action
 */
export function requiresAction(level: BiasLevel): boolean {
  return level === 'high' || level === 'critical';
}

/**
 * Check if bias level requires immediate action
 */
export function requiresImmediateAction(level: BiasLevel): boolean {
  return level === 'critical';
}

/**
 * Format parity result for display
 */
export function formatParityResult(result: ParityResult): string {
  const lines = [
    `Attribute: ${result.attribute}`,
    `Metric: ${result.metric.replace(/_/g, ' ')}`,
    `Bias Level: ${result.biasLevel.toUpperCase()}`,
    `Disparity Ratio: ${(result.disparityRatio * 100).toFixed(1)}%`,
    `Max Disparity: ${(result.maxDisparity * 100).toFixed(1)}%`,
    `Reference Group: ${result.referenceGroup}`,
    '',
    'Groups:'
  ];

  for (const group of result.groups) {
    lines.push(`  ${group.value}: ${(group.positiveRate * 100).toFixed(1)}% (n=${group.count})`);
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join('\n');
}

/**
 * Compare bias levels (returns -1, 0, or 1)
 */
export function compareBiasLevels(a: BiasLevel, b: BiasLevel): number {
  const order: Record<BiasLevel, number> = {
    none: 0,
    low: 1,
    moderate: 2,
    high: 3,
    critical: 4
  };
  return order[a] - order[b];
}
