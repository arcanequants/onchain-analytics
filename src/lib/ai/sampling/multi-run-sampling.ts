/**
 * Multi-Run Sampling with Outlier Detection
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Execute multiple API calls (5x) for statistical robustness
 * - Detect and filter outliers using IQR and Z-score methods
 * - Calculate confidence intervals for scores
 * - Track variance across runs
 * - Model version tracking per call
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SamplingConfig {
  numRuns: number;
  outlierMethod: 'iqr' | 'zscore' | 'both';
  confidenceLevel: number; // 0.95 for 95% CI
  maxRetries: number;
  timeoutMs: number;
  parallelRuns: boolean;
}

export interface RunResult<T> {
  runIndex: number;
  result: T;
  latencyMs: number;
  modelVersion: string;
  timestamp: string;
  isOutlier: boolean;
  outlierReason?: string;
}

export interface SamplingResult<T> {
  runs: RunResult<T>[];
  validRuns: RunResult<T>[];
  outlierRuns: RunResult<T>[];
  aggregated: T;
  statistics: SamplingStatistics;
  confidenceInterval: ConfidenceInterval;
  modelVersions: string[];
}

export interface SamplingStatistics {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  iqr: number;
  q1: number;
  q3: number;
  coefficientOfVariation: number;
  outlierCount: number;
  validCount: number;
}

export interface ConfidenceInterval {
  level: number;
  lower: number;
  upper: number;
  marginOfError: number;
}

export interface ScoreExtractor<T> {
  (result: T): number;
}

export interface ResultAggregator<T> {
  (results: T[]): T;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

export const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  numRuns: 5,
  outlierMethod: 'both',
  confidenceLevel: 0.95,
  maxRetries: 2,
  timeoutMs: 30000,
  parallelRuns: true,
};

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Calculate mean of an array of numbers
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate median of an array of numbers
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate standard deviation
 */
export function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculate quartiles (Q1, Q2/Median, Q3)
 */
export function calculateQuartiles(values: number[]): { q1: number; q2: number; q3: number } {
  if (values.length === 0) return { q1: 0, q2: 0, q3: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const q2 = calculateMedian(sorted);

  const lowerHalf = sorted.slice(0, Math.floor(n / 2));
  const upperHalf = sorted.slice(Math.ceil(n / 2));

  const q1 = calculateMedian(lowerHalf);
  const q3 = calculateMedian(upperHalf);

  return { q1, q2, q3 };
}

/**
 * Calculate IQR (Interquartile Range)
 */
export function calculateIQR(values: number[]): number {
  const { q1, q3 } = calculateQuartiles(values);
  return q3 - q1;
}

/**
 * Detect outliers using IQR method
 * Outliers are values below Q1 - 1.5*IQR or above Q3 + 1.5*IQR
 */
export function detectOutliersIQR(values: number[], multiplier: number = 1.5): Set<number> {
  const outlierIndices = new Set<number>();
  if (values.length < 4) return outlierIndices;

  const { q1, q3 } = calculateQuartiles(values);
  const iqr = q3 - q1;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  values.forEach((val, idx) => {
    if (val < lowerBound || val > upperBound) {
      outlierIndices.add(idx);
    }
  });

  return outlierIndices;
}

/**
 * Detect outliers using Z-score method
 * Outliers are values with |z-score| > threshold (typically 2 or 3)
 */
export function detectOutliersZScore(values: number[], threshold: number = 2): Set<number> {
  const outlierIndices = new Set<number>();
  if (values.length < 3) return outlierIndices;

  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);

  if (stdDev === 0) return outlierIndices;

  values.forEach((val, idx) => {
    const zScore = Math.abs((val - mean) / stdDev);
    if (zScore > threshold) {
      outlierIndices.add(idx);
    }
  });

  return outlierIndices;
}

/**
 * Combined outlier detection using both IQR and Z-score
 */
export function detectOutliersCombined(
  values: number[],
  iqrMultiplier: number = 1.5,
  zScoreThreshold: number = 2
): Map<number, string[]> {
  const outlierReasons = new Map<number, string[]>();

  const iqrOutliers = detectOutliersIQR(values, iqrMultiplier);
  const zScoreOutliers = detectOutliersZScore(values, zScoreThreshold);

  iqrOutliers.forEach(idx => {
    const reasons = outlierReasons.get(idx) || [];
    reasons.push('IQR');
    outlierReasons.set(idx, reasons);
  });

  zScoreOutliers.forEach(idx => {
    const reasons = outlierReasons.get(idx) || [];
    reasons.push('Z-score');
    outlierReasons.set(idx, reasons);
  });

  return outlierReasons;
}

/**
 * Calculate confidence interval
 */
export function calculateConfidenceInterval(
  values: number[],
  confidenceLevel: number = 0.95
): ConfidenceInterval {
  if (values.length === 0) {
    return { level: confidenceLevel, lower: 0, upper: 0, marginOfError: 0 };
  }

  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);
  const n = values.length;

  // Z-scores for common confidence levels
  const zScores: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const z = zScores[confidenceLevel] || 1.96;
  const marginOfError = z * (stdDev / Math.sqrt(n));

  return {
    level: confidenceLevel,
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    marginOfError,
  };
}

/**
 * Calculate comprehensive statistics
 */
export function calculateStatistics(values: number[], outlierCount: number): SamplingStatistics {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      range: 0,
      iqr: 0,
      q1: 0,
      q3: 0,
      coefficientOfVariation: 0,
      outlierCount,
      validCount: 0,
    };
  }

  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values);
  const { q1, q3 } = calculateQuartiles(values);
  const sorted = [...values].sort((a, b) => a - b);

  return {
    mean,
    median: calculateMedian(values),
    stdDev,
    variance: stdDev * stdDev,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    range: sorted[sorted.length - 1] - sorted[0],
    iqr: q3 - q1,
    q1,
    q3,
    coefficientOfVariation: mean !== 0 ? (stdDev / mean) * 100 : 0,
    outlierCount,
    validCount: values.length,
  };
}

// ============================================================================
// MULTI-RUN SAMPLING
// ============================================================================

/**
 * Execute a function multiple times and aggregate results with outlier detection
 */
export async function executeMultiRunSampling<T>(
  executor: () => Promise<{ result: T; modelVersion: string }>,
  scoreExtractor: ScoreExtractor<T>,
  aggregator: ResultAggregator<T>,
  config: Partial<SamplingConfig> = {}
): Promise<SamplingResult<T>> {
  const fullConfig: SamplingConfig = { ...DEFAULT_SAMPLING_CONFIG, ...config };
  const runs: RunResult<T>[] = [];

  // Execute runs
  if (fullConfig.parallelRuns) {
    const promises = Array.from({ length: fullConfig.numRuns }, (_, i) =>
      executeWithRetry(executor, i, fullConfig)
    );
    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        runs.push(result.value);
      } else {
        console.error(`Run ${index} failed:`, result.reason);
      }
    });
  } else {
    for (let i = 0; i < fullConfig.numRuns; i++) {
      try {
        const result = await executeWithRetry(executor, i, fullConfig);
        runs.push(result);
      } catch (error) {
        console.error(`Run ${i} failed:`, error);
      }
    }
  }

  // Extract scores for statistical analysis
  const scores = runs.map(run => scoreExtractor(run.result));

  // Detect outliers
  const outlierMap = detectOutliers(scores, fullConfig.outlierMethod);

  // Mark outliers in runs
  runs.forEach((run, idx) => {
    const outlierReasons = outlierMap.get(idx);
    if (outlierReasons && outlierReasons.length > 0) {
      run.isOutlier = true;
      run.outlierReason = outlierReasons.join(', ');
    }
  });

  // Separate valid and outlier runs
  const validRuns = runs.filter(run => !run.isOutlier);
  const outlierRuns = runs.filter(run => run.isOutlier);

  // Calculate statistics on valid scores
  const validScores = validRuns.map(run => scoreExtractor(run.result));
  const statistics = calculateStatistics(validScores, outlierRuns.length);
  const confidenceInterval = calculateConfidenceInterval(validScores, fullConfig.confidenceLevel);

  // Aggregate valid results
  const validResults = validRuns.map(run => run.result);
  const aggregated = validResults.length > 0 ? aggregator(validResults) : runs[0]?.result;

  // Collect unique model versions
  const modelVersions = [...new Set(runs.map(run => run.modelVersion))];

  return {
    runs,
    validRuns,
    outlierRuns,
    aggregated,
    statistics,
    confidenceInterval,
    modelVersions,
  };
}

/**
 * Execute with retry logic
 */
async function executeWithRetry<T>(
  executor: () => Promise<{ result: T; modelVersion: string }>,
  runIndex: number,
  config: SamplingConfig
): Promise<RunResult<T>> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const startTime = Date.now();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), config.timeoutMs);
      });

      const { result, modelVersion } = await Promise.race([executor(), timeoutPromise]);

      const latencyMs = Date.now() - startTime;

      return {
        runIndex,
        result,
        latencyMs,
        modelVersion,
        timestamp: new Date().toISOString(),
        isOutlier: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < config.maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error('All retries failed');
}

/**
 * Detect outliers based on configured method
 */
function detectOutliers(
  values: number[],
  method: 'iqr' | 'zscore' | 'both'
): Map<number, string[]> {
  switch (method) {
    case 'iqr': {
      const outliers = detectOutliersIQR(values);
      const map = new Map<number, string[]>();
      outliers.forEach(idx => map.set(idx, ['IQR']));
      return map;
    }
    case 'zscore': {
      const outliers = detectOutliersZScore(values);
      const map = new Map<number, string[]>();
      outliers.forEach(idx => map.set(idx, ['Z-score']));
      return map;
    }
    case 'both':
    default:
      return detectOutliersCombined(values);
  }
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

/**
 * Aggregate scores by taking the median
 */
export function aggregateByMedian(scores: number[]): number {
  return calculateMedian(scores);
}

/**
 * Aggregate scores by taking the mean
 */
export function aggregateByMean(scores: number[]): number {
  return calculateMean(scores);
}

/**
 * Aggregate scores by taking the trimmed mean (exclude top and bottom 10%)
 */
export function aggregateByTrimmedMean(scores: number[], trimPercent: number = 0.1): number {
  if (scores.length < 3) return calculateMean(scores);

  const sorted = [...scores].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimPercent);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  return calculateMean(trimmed);
}

/**
 * Create a generic object aggregator that uses median for numeric fields
 */
export function createObjectAggregator<T extends Record<string, unknown>>(
  numericFields: (keyof T)[]
): ResultAggregator<T> {
  return (results: T[]): T => {
    if (results.length === 0) throw new Error('No results to aggregate');
    if (results.length === 1) return results[0];

    const aggregated = { ...results[0] };

    numericFields.forEach(field => {
      const values = results
        .map(r => r[field])
        .filter(v => typeof v === 'number') as number[];

      if (values.length > 0) {
        (aggregated as Record<string, unknown>)[field as string] = calculateMedian(values);
      }
    });

    return aggregated;
  };
}

// ============================================================================
// SCORE VARIANCE TRACKER
// ============================================================================

export interface VarianceTracker {
  trackRun(brandId: string, provider: string, score: number, modelVersion: string): void;
  getVarianceReport(brandId: string): VarianceReport | null;
  getAllReports(): Map<string, VarianceReport>;
}

export interface VarianceReport {
  brandId: string;
  totalRuns: number;
  byProvider: Map<string, ProviderVariance>;
  overallVariance: number;
  isHighVariance: boolean;
  lastUpdated: string;
}

export interface ProviderVariance {
  provider: string;
  scores: number[];
  mean: number;
  stdDev: number;
  coefficientOfVariation: number;
  modelVersions: Set<string>;
}

/**
 * Create a variance tracker for monitoring score consistency
 */
export function createVarianceTracker(highVarianceThreshold: number = 15): VarianceTracker {
  const reports = new Map<string, {
    byProvider: Map<string, { scores: number[]; modelVersions: Set<string> }>;
    lastUpdated: string;
  }>();

  return {
    trackRun(brandId: string, provider: string, score: number, modelVersion: string): void {
      if (!reports.has(brandId)) {
        reports.set(brandId, {
          byProvider: new Map(),
          lastUpdated: new Date().toISOString(),
        });
      }

      const report = reports.get(brandId)!;

      if (!report.byProvider.has(provider)) {
        report.byProvider.set(provider, { scores: [], modelVersions: new Set() });
      }

      const providerData = report.byProvider.get(provider)!;
      providerData.scores.push(score);
      providerData.modelVersions.add(modelVersion);
      report.lastUpdated = new Date().toISOString();
    },

    getVarianceReport(brandId: string): VarianceReport | null {
      const data = reports.get(brandId);
      if (!data) return null;

      const byProvider = new Map<string, ProviderVariance>();
      const allScores: number[] = [];

      data.byProvider.forEach((providerData, provider) => {
        const mean = calculateMean(providerData.scores);
        const stdDev = calculateStdDev(providerData.scores);
        const cv = mean !== 0 ? (stdDev / mean) * 100 : 0;

        byProvider.set(provider, {
          provider,
          scores: providerData.scores,
          mean,
          stdDev,
          coefficientOfVariation: cv,
          modelVersions: providerData.modelVersions,
        });

        allScores.push(...providerData.scores);
      });

      const overallVariance = calculateStdDev(allScores);

      return {
        brandId,
        totalRuns: allScores.length,
        byProvider,
        overallVariance,
        isHighVariance: overallVariance > highVarianceThreshold,
        lastUpdated: data.lastUpdated,
      };
    },

    getAllReports(): Map<string, VarianceReport> {
      const result = new Map<string, VarianceReport>();
      reports.forEach((_, brandId) => {
        const report = this.getVarianceReport(brandId);
        if (report) result.set(brandId, report);
      });
      return result;
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  executeMultiRunSampling,
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculateQuartiles,
  calculateIQR,
  calculateConfidenceInterval,
  calculateStatistics,
  detectOutliersIQR,
  detectOutliersZScore,
  detectOutliersCombined,
  aggregateByMedian,
  aggregateByMean,
  aggregateByTrimmedMean,
  createObjectAggregator,
  createVarianceTracker,
  DEFAULT_SAMPLING_CONFIG,
};
