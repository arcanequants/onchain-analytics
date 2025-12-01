/**
 * Statistical Analysis for A/B Experiments
 *
 * Provides:
 * - Z-test for proportions (conversion rates, click rates)
 * - T-test for continuous metrics (latency, satisfaction)
 * - Sample size calculations
 * - Confidence interval estimation
 *
 * @module lib/experiments/analysis
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw metrics for a variant
 */
export interface VariantData {
  /** Number of users/sessions assigned */
  n: number;
  /** Number of successes (for proportion tests) */
  successes?: number;
  /** Mean value (for continuous tests) */
  mean?: number;
  /** Standard deviation (for continuous tests) */
  std?: number;
  /** Sum of values (for computing mean) */
  sum?: number;
  /** Sum of squared values (for computing std) */
  sumSquares?: number;
}

/**
 * Result of statistical test
 */
export interface StatisticalTestResult {
  /** Test statistic (z or t) */
  statistic: number;
  /** P-value (two-tailed) */
  pValue: number;
  /** Confidence level (1 - p-value) */
  confidence: number;
  /** Whether the difference is statistically significant */
  isSignificant: boolean;
  /** Effect size (Cohen's d for continuous, Cohen's h for proportions) */
  effectSize: number;
  /** Relative lift (treatment / control - 1) */
  lift: number;
  /** 95% confidence interval for the difference */
  confidenceInterval: [number, number];
}

/**
 * Sample size calculation result
 */
export interface SampleSizeResult {
  /** Required sample size per variant */
  perVariant: number;
  /** Total sample size needed */
  total: number;
  /** Days to reach sample size at given daily traffic */
  estimatedDays?: number;
}

/**
 * Experiment analysis result
 */
export interface ExperimentAnalysis {
  /** Current sample sizes */
  sampleSizes: Record<string, number>;
  /** Whether minimum sample size is reached */
  hasMinSample: boolean;
  /** Statistical test results per variant (compared to control) */
  tests: Record<string, StatisticalTestResult>;
  /** Winning variant (if any) */
  winner: string | null;
  /** Overall recommendation */
  recommendation: 'continue' | 'stop_winner' | 'stop_no_effect' | 'inconclusive';
  /** Human-readable summary */
  summary: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Standard normal distribution critical values */
const Z_VALUES: Record<number, number> = {
  0.80: 0.842,
  0.85: 1.036,
  0.90: 1.282,
  0.95: 1.645,
  0.99: 2.326,
};

/** Two-tailed Z values for confidence intervals */
const Z_TWO_TAILED: Record<number, number> = {
  0.80: 1.282,
  0.90: 1.645,
  0.95: 1.960,
  0.99: 2.576,
};

// ============================================================================
// NORMAL DISTRIBUTION FUNCTIONS
// ============================================================================

/**
 * Cumulative distribution function for standard normal
 * Uses Abramowitz and Stegun approximation
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * P-value from Z-score (two-tailed)
 */
export function zToPValue(z: number): number {
  return 2 * (1 - normalCDF(Math.abs(z)));
}

/**
 * Z-score from p-value (two-tailed)
 */
export function pValueToZ(p: number): number {
  // Newton-Raphson approximation
  let z = 0;
  let step = 0.1;

  for (let i = 0; i < 100; i++) {
    const currentP = zToPValue(z);
    if (Math.abs(currentP - p) < 0.0001) break;

    if (currentP > p) {
      z += step;
    } else {
      z -= step;
      step /= 2;
    }
  }

  return z;
}

// ============================================================================
// PROPORTION TESTS
// ============================================================================

/**
 * Two-proportion Z-test
 *
 * Compares conversion rates between two groups.
 *
 * @param control - Control group data
 * @param treatment - Treatment group data
 * @param alpha - Significance level (default 0.05)
 * @returns Statistical test result
 */
export function proportionZTest(
  control: { n: number; successes: number },
  treatment: { n: number; successes: number },
  alpha: number = 0.05
): StatisticalTestResult {
  const n1 = control.n;
  const n2 = treatment.n;
  const x1 = control.successes;
  const x2 = treatment.successes;

  // Proportions
  const p1 = x1 / n1;
  const p2 = x2 / n2;

  // Pooled proportion under null hypothesis
  const pPooled = (x1 + x2) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

  // Z-statistic
  const z = se > 0 ? (p2 - p1) / se : 0;

  // P-value (two-tailed)
  const pValue = zToPValue(z);

  // Confidence interval for difference
  const seDiff = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
  const zCritical = Z_TWO_TAILED[0.95] ?? 1.96;
  const diff = p2 - p1;
  const ci: [number, number] = [
    diff - zCritical * seDiff,
    diff + zCritical * seDiff,
  ];

  // Cohen's h (effect size for proportions)
  const phi1 = 2 * Math.asin(Math.sqrt(p1));
  const phi2 = 2 * Math.asin(Math.sqrt(p2));
  const effectSize = Math.abs(phi2 - phi1);

  // Lift
  const lift = p1 > 0 ? (p2 - p1) / p1 : 0;

  return {
    statistic: z,
    pValue,
    confidence: 1 - pValue,
    isSignificant: pValue < alpha,
    effectSize,
    lift,
    confidenceInterval: ci,
  };
}

// ============================================================================
// CONTINUOUS TESTS
// ============================================================================

/**
 * Welch's t-test for unequal variances
 *
 * Compares means between two groups.
 *
 * @param control - Control group data
 * @param treatment - Treatment group data
 * @param alpha - Significance level (default 0.05)
 * @returns Statistical test result
 */
export function welchTTest(
  control: { n: number; mean: number; std: number },
  treatment: { n: number; mean: number; std: number },
  alpha: number = 0.05
): StatisticalTestResult {
  const n1 = control.n;
  const n2 = treatment.n;
  const m1 = control.mean;
  const m2 = treatment.mean;
  const s1 = control.std;
  const s2 = treatment.std;

  // Standard error
  const se = Math.sqrt((s1 * s1) / n1 + (s2 * s2) / n2);

  // T-statistic
  const t = se > 0 ? (m2 - m1) / se : 0;

  // Degrees of freedom (Welch-Satterthwaite)
  const v1 = (s1 * s1) / n1;
  const v2 = (s2 * s2) / n2;
  const df = Math.floor(
    ((v1 + v2) * (v1 + v2)) /
      ((v1 * v1) / (n1 - 1) + (v2 * v2) / (n2 - 1))
  );

  // Approximate p-value using normal for large samples
  // For small samples, would need t-distribution
  const pValue = df > 30 ? zToPValue(t) : zToPValue(t * 0.95);

  // Confidence interval
  const zCritical = Z_TWO_TAILED[0.95] ?? 1.96;
  const diff = m2 - m1;
  const ci: [number, number] = [
    diff - zCritical * se,
    diff + zCritical * se,
  ];

  // Cohen's d (effect size)
  const pooledStd = Math.sqrt(
    ((n1 - 1) * s1 * s1 + (n2 - 1) * s2 * s2) / (n1 + n2 - 2)
  );
  const effectSize = pooledStd > 0 ? Math.abs(m2 - m1) / pooledStd : 0;

  // Lift
  const lift = m1 !== 0 ? (m2 - m1) / Math.abs(m1) : 0;

  return {
    statistic: t,
    pValue,
    confidence: 1 - pValue,
    isSignificant: pValue < alpha,
    effectSize,
    lift,
    confidenceInterval: ci,
  };
}

// ============================================================================
// SAMPLE SIZE CALCULATIONS
// ============================================================================

/**
 * Calculate required sample size for proportion test
 *
 * @param baselineRate - Expected conversion rate for control
 * @param mde - Minimum detectable effect (relative lift)
 * @param power - Statistical power (default 0.80)
 * @param alpha - Significance level (default 0.05)
 * @returns Required sample size per variant
 */
export function sampleSizeForProportion(
  baselineRate: number,
  mde: number,
  power: number = 0.80,
  alpha: number = 0.05
): SampleSizeResult {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);

  const zAlpha = Z_VALUES[1 - alpha / 2] ?? 1.96;
  const zBeta = Z_VALUES[power] ?? 0.842;

  const pooledP = (p1 + p2) / 2;
  const effectSize = Math.abs(p2 - p1);

  const numerator = (zAlpha * Math.sqrt(2 * pooledP * (1 - pooledP)) +
    zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2;
  const denominator = effectSize ** 2;

  const perVariant = Math.ceil(numerator / denominator);

  return {
    perVariant,
    total: perVariant * 2,
  };
}

/**
 * Calculate required sample size for continuous metric test
 *
 * @param baselineStd - Expected standard deviation
 * @param mde - Minimum detectable effect (absolute difference)
 * @param power - Statistical power (default 0.80)
 * @param alpha - Significance level (default 0.05)
 * @returns Required sample size per variant
 */
export function sampleSizeForContinuous(
  baselineStd: number,
  mde: number,
  power: number = 0.80,
  alpha: number = 0.05
): SampleSizeResult {
  const zAlpha = Z_VALUES[1 - alpha / 2] ?? 1.96;
  const zBeta = Z_VALUES[power] ?? 0.842;

  const perVariant = Math.ceil(
    (2 * baselineStd ** 2 * (zAlpha + zBeta) ** 2) / (mde ** 2)
  );

  return {
    perVariant,
    total: perVariant * 2,
  };
}

/**
 * Estimate days to reach sample size
 *
 * @param requiredSample - Required sample size per variant
 * @param dailyTraffic - Daily traffic
 * @param numVariants - Number of variants
 * @param trafficPercentage - Percentage of traffic in experiment
 * @returns Estimated days
 */
export function estimateDaysToSample(
  requiredSample: number,
  dailyTraffic: number,
  numVariants: number = 2,
  trafficPercentage: number = 100
): number {
  const dailyPerVariant =
    (dailyTraffic * (trafficPercentage / 100)) / numVariants;
  return Math.ceil(requiredSample / dailyPerVariant);
}

// ============================================================================
// EXPERIMENT ANALYSIS
// ============================================================================

/**
 * Analyze an experiment and provide recommendations
 *
 * @param variantData - Data for each variant
 * @param metricType - Type of metric ('proportion' or 'continuous')
 * @param minSampleSize - Minimum sample size per variant
 * @param significanceThreshold - Required confidence level
 * @param controlVariantId - ID of the control variant
 * @returns Experiment analysis
 */
export function analyzeExperiment(
  variantData: Record<string, VariantData>,
  metricType: 'proportion' | 'continuous',
  minSampleSize: number = 100,
  significanceThreshold: number = 0.95,
  controlVariantId: string = 'control'
): ExperimentAnalysis {
  const variantIds = Object.keys(variantData);
  const sampleSizes: Record<string, number> = {};
  const tests: Record<string, StatisticalTestResult> = {};

  // Get control data
  const controlData = variantData[controlVariantId];
  if (!controlData) {
    return {
      sampleSizes,
      hasMinSample: false,
      tests: {},
      winner: null,
      recommendation: 'inconclusive',
      summary: `Control variant "${controlVariantId}" not found`,
    };
  }

  // Record sample sizes and check minimum
  let allHaveMinSample = true;
  for (const [variantId, data] of Object.entries(variantData)) {
    sampleSizes[variantId] = data.n;
    if (data.n < minSampleSize) {
      allHaveMinSample = false;
    }
  }

  // Run statistical tests for each treatment vs control
  const alpha = 1 - significanceThreshold;
  let bestTreatment: string | null = null;
  let bestLift = -Infinity;
  let allTestsRun = true;

  for (const variantId of variantIds) {
    if (variantId === controlVariantId) continue;

    const treatmentData = variantData[variantId];

    if (metricType === 'proportion') {
      if (
        controlData.successes === undefined ||
        treatmentData.successes === undefined
      ) {
        allTestsRun = false;
        continue;
      }

      tests[variantId] = proportionZTest(
        { n: controlData.n, successes: controlData.successes },
        { n: treatmentData.n, successes: treatmentData.successes },
        alpha
      );
    } else {
      if (
        controlData.mean === undefined ||
        controlData.std === undefined ||
        treatmentData.mean === undefined ||
        treatmentData.std === undefined
      ) {
        allTestsRun = false;
        continue;
      }

      tests[variantId] = welchTTest(
        { n: controlData.n, mean: controlData.mean, std: controlData.std },
        {
          n: treatmentData.n,
          mean: treatmentData.mean,
          std: treatmentData.std,
        },
        alpha
      );
    }

    // Track best performing treatment
    if (tests[variantId].isSignificant && tests[variantId].lift > bestLift) {
      bestLift = tests[variantId].lift;
      bestTreatment = variantId;
    }
  }

  // Determine recommendation
  let recommendation: ExperimentAnalysis['recommendation'];
  let summary: string;

  if (!allHaveMinSample) {
    recommendation = 'continue';
    summary = `Experiment needs more data. Current sample sizes: ${JSON.stringify(sampleSizes)}. Minimum required: ${minSampleSize} per variant.`;
  } else if (!allTestsRun) {
    recommendation = 'inconclusive';
    summary = 'Missing data for some variants. Unable to complete analysis.';
  } else if (bestTreatment) {
    recommendation = 'stop_winner';
    const liftPct = (bestLift * 100).toFixed(1);
    const confidence = (tests[bestTreatment].confidence * 100).toFixed(1);
    summary = `Winner found: "${bestTreatment}" with ${liftPct}% lift at ${confidence}% confidence.`;
  } else {
    // Check if all treatments are significantly worse
    const allWorse = Object.values(tests).every(
      (t) => t.isSignificant && t.lift < 0
    );

    if (allWorse) {
      recommendation = 'stop_no_effect';
      summary =
        'Control is the best performing variant. All treatments performed worse.';
    } else {
      const anyNearSignificant = Object.values(tests).some(
        (t) => t.confidence > 0.8 && t.confidence < significanceThreshold
      );

      if (anyNearSignificant) {
        recommendation = 'continue';
        summary =
          'No significant winner yet, but some variants are approaching significance. Continue collecting data.';
      } else {
        recommendation = 'stop_no_effect';
        summary =
          'No significant difference between variants. Consider stopping the experiment.';
      }
    }
  }

  return {
    sampleSizes,
    hasMinSample: allHaveMinSample,
    tests,
    winner: bestTreatment,
    recommendation,
    summary,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Compute running mean and variance (Welford's algorithm)
 */
export function updateRunningStats(
  existingCount: number,
  existingMean: number,
  existingM2: number,
  newValue: number
): { n: number; mean: number; m2: number; variance: number; std: number } {
  const n = existingCount + 1;
  const delta = newValue - existingMean;
  const mean = existingMean + delta / n;
  const delta2 = newValue - mean;
  const m2 = existingM2 + delta * delta2;

  const variance = n > 1 ? m2 / (n - 1) : 0;
  const std = Math.sqrt(variance);

  return { n, mean, m2, variance, std };
}

/**
 * Interpret effect size (Cohen's conventions)
 */
export function interpretEffectSize(
  effectSize: number,
  type: 'proportion' | 'continuous'
): 'negligible' | 'small' | 'medium' | 'large' {
  if (type === 'proportion') {
    // Cohen's h
    if (effectSize < 0.2) return 'negligible';
    if (effectSize < 0.5) return 'small';
    if (effectSize < 0.8) return 'medium';
    return 'large';
  } else {
    // Cohen's d
    if (effectSize < 0.2) return 'negligible';
    if (effectSize < 0.5) return 'small';
    if (effectSize < 0.8) return 'medium';
    return 'large';
  }
}

/**
 * Check if experiment should be stopped early (guardrail check)
 */
export function checkGuardrails(
  variantMetrics: Record<
    string,
    { errorRate?: number; latencyP95?: number; [key: string]: number | undefined }
  >,
  guardrails: Record<string, { min?: number; max?: number }>
): { violated: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const [variantId, metrics] of Object.entries(variantMetrics)) {
    for (const [metricName, constraints] of Object.entries(guardrails)) {
      const value = metrics[metricName];
      if (value === undefined) continue;

      if (constraints.max !== undefined && value > constraints.max) {
        violations.push(
          `${variantId}: ${metricName} (${value}) exceeds max (${constraints.max})`
        );
      }

      if (constraints.min !== undefined && value < constraints.min) {
        violations.push(
          `${variantId}: ${metricName} (${value}) below min (${constraints.min})`
        );
      }
    }
  }

  return {
    violated: violations.length > 0,
    violations,
  };
}
