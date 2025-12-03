/**
 * A/B Testing Framework with Statistical Significance
 *
 * Phase 4, Week 8 Extended - RLHF & Feedback Loop
 *
 * Features:
 * - Statistical significance calculations (chi-square, t-test, z-test)
 * - Sample size calculator with power analysis
 * - Deterministic variant assignment (hash-based)
 * - Confidence intervals
 * - Multi-variant support (A/B/n testing)
 * - Bayesian probability calculations
 */

// ============================================================================
// TYPES
// ============================================================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'archived';
export type VariantType = 'control' | 'treatment';
export type MetricType = 'conversion' | 'continuous' | 'count' | 'revenue';

export interface Variant {
  id: string;
  name: string;
  type: VariantType;
  weight: number; // Traffic allocation (0-1)
  description?: string;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: ExperimentStatus;
  variants: Variant[];
  primaryMetric: string;
  secondaryMetrics?: string[];
  targetSampleSize: number;
  minimumDetectableEffect: number; // MDE as percentage
  significanceLevel: number; // Alpha (typically 0.05)
  statisticalPower: number; // 1-Beta (typically 0.8)
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantStats {
  variantId: string;
  sampleSize: number;
  conversions?: number;
  conversionRate?: number;
  mean?: number;
  standardDeviation?: number;
  sum?: number;
  min?: number;
  max?: number;
}

export interface ExperimentResult {
  experimentId: string;
  controlStats: VariantStats;
  treatmentStats: VariantStats;
  relativeLift: number; // Percentage improvement
  absoluteLift: number;
  pValue: number;
  isSignificant: boolean;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;
  };
  statisticalPower: number;
  requiredSampleSize: number;
  currentProgress: number; // 0-1
  recommendation: 'continue' | 'stop_winner' | 'stop_no_effect' | 'inconclusive';
  bayesianProbability?: number; // P(treatment > control)
}

export interface SampleSizeParams {
  baselineConversionRate: number;
  minimumDetectableEffect: number; // As relative percentage (e.g., 0.1 = 10% lift)
  significanceLevel?: number; // Default 0.05
  statisticalPower?: number; // Default 0.8
  tails?: 1 | 2; // Default 2
}

// ============================================================================
// STATISTICAL UTILITIES
// ============================================================================

/**
 * Standard normal cumulative distribution function (CDF)
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
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Inverse normal CDF (quantile function)
 * Uses Acklam's algorithm
 */
export function normalInverseCDF(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new Error('Probability must be between 0 and 1 (exclusive)');
  }

  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.383577518672690e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];
  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];
  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

/**
 * Chi-square CDF approximation using Wilson-Hilferty transformation
 */
export function chiSquareCDF(x: number, degreesOfFreedom: number): number {
  if (x <= 0) return 0;
  if (degreesOfFreedom <= 0) throw new Error('Degrees of freedom must be positive');

  // Wilson-Hilferty transformation
  const k = degreesOfFreedom;
  const z = Math.pow(x / k, 1 / 3) - (1 - 2 / (9 * k));
  const denom = Math.sqrt(2 / (9 * k));

  return normalCDF(z / denom);
}

/**
 * Student's t-distribution CDF approximation
 */
export function tDistributionCDF(t: number, df: number): number {
  // For large df, use normal approximation
  if (df > 100) {
    return normalCDF(t);
  }

  // Use regularized incomplete beta function approximation
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;

  // Simplified beta approximation
  const betaApprox = incompleteBeta(x, a, b);

  if (t >= 0) {
    return 1 - 0.5 * betaApprox;
  } else {
    return 0.5 * betaApprox;
  }
}

/**
 * Incomplete beta function approximation
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use continued fraction approximation
  const maxIterations = 100;
  const epsilon = 1e-10;

  let result = 0;
  let term = 1;

  for (let n = 0; n < maxIterations; n++) {
    term *= (a + n) * x / (a + b + n);
    result += term / (a + n + 1);
    if (Math.abs(term) < epsilon) break;
  }

  return result * Math.pow(x, a) * Math.pow(1 - x, b) / beta(a, b);
}

/**
 * Beta function using log-gamma
 */
function beta(a: number, b: number): number {
  return Math.exp(logGamma(a) + logGamma(b) - logGamma(a + b));
}

/**
 * Log-gamma function (Stirling's approximation)
 */
function logGamma(x: number): number {
  if (x <= 0) throw new Error('Gamma function undefined for non-positive values');

  const coefficients = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5
  ];

  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;

  for (let j = 0; j < 6; j++) {
    ser += coefficients[j] / ++y;
  }

  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

// ============================================================================
// SAMPLE SIZE CALCULATOR
// ============================================================================

/**
 * Calculate required sample size per variant for conversion rate experiments
 */
export function calculateSampleSize(params: SampleSizeParams): number {
  const {
    baselineConversionRate,
    minimumDetectableEffect,
    significanceLevel = 0.05,
    statisticalPower = 0.8,
    tails = 2
  } = params;

  const p1 = baselineConversionRate;
  const p2 = baselineConversionRate * (1 + minimumDetectableEffect);

  // Pooled standard error
  const pooledP = (p1 + p2) / 2;
  const pooledSE = Math.sqrt(2 * pooledP * (1 - pooledP));

  // Individual standard errors
  const se1 = Math.sqrt(p1 * (1 - p1));
  const se2 = Math.sqrt(p2 * (1 - p2));
  const combinedSE = Math.sqrt(se1 * se1 + se2 * se2);

  // Z-scores
  const zAlpha = tails === 2
    ? normalInverseCDF(1 - significanceLevel / 2)
    : normalInverseCDF(1 - significanceLevel);
  const zBeta = normalInverseCDF(statisticalPower);

  // Sample size formula
  const effect = Math.abs(p2 - p1);
  const numerator = Math.pow(zAlpha * pooledSE + zBeta * combinedSE, 2);
  const denominator = Math.pow(effect, 2);

  return Math.ceil(numerator / denominator);
}

/**
 * Calculate required sample size for continuous metrics (means)
 */
export function calculateSampleSizeContinuous(
  baselineMean: number,
  baselineStdDev: number,
  minimumDetectableEffect: number, // Relative change
  significanceLevel = 0.05,
  statisticalPower = 0.8
): number {
  const effect = baselineMean * minimumDetectableEffect;
  const zAlpha = normalInverseCDF(1 - significanceLevel / 2);
  const zBeta = normalInverseCDF(statisticalPower);

  const numerator = 2 * Math.pow(baselineStdDev, 2) * Math.pow(zAlpha + zBeta, 2);
  const denominator = Math.pow(effect, 2);

  return Math.ceil(numerator / denominator);
}

// ============================================================================
// STATISTICAL TESTS
// ============================================================================

/**
 * Two-proportion Z-test for conversion rate experiments
 */
export function proportionZTest(
  conversions1: number,
  sampleSize1: number,
  conversions2: number,
  sampleSize2: number
): { zScore: number; pValue: number } {
  const p1 = conversions1 / sampleSize1;
  const p2 = conversions2 / sampleSize2;

  // Pooled proportion
  const pooledP = (conversions1 + conversions2) / (sampleSize1 + sampleSize2);

  // Standard error
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / sampleSize1 + 1 / sampleSize2));

  if (se === 0) {
    return { zScore: 0, pValue: 1 };
  }

  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return { zScore, pValue };
}

/**
 * Two-sample t-test for continuous metrics
 */
export function twoSampleTTest(
  mean1: number,
  stdDev1: number,
  n1: number,
  mean2: number,
  stdDev2: number,
  n2: number
): { tScore: number; pValue: number; degreesOfFreedom: number } {
  // Welch's t-test (unequal variances)
  const se = Math.sqrt((stdDev1 * stdDev1) / n1 + (stdDev2 * stdDev2) / n2);

  if (se === 0) {
    return { tScore: 0, pValue: 1, degreesOfFreedom: n1 + n2 - 2 };
  }

  const tScore = (mean2 - mean1) / se;

  // Welch-Satterthwaite degrees of freedom
  const v1 = (stdDev1 * stdDev1) / n1;
  const v2 = (stdDev2 * stdDev2) / n2;
  const df = Math.pow(v1 + v2, 2) / (
    Math.pow(v1, 2) / (n1 - 1) + Math.pow(v2, 2) / (n2 - 1)
  );

  const pValue = 2 * (1 - tDistributionCDF(Math.abs(tScore), df));

  return { tScore, pValue, degreesOfFreedom: df };
}

/**
 * Chi-square test for independence
 */
export function chiSquareTest(
  observedControl: { success: number; failure: number },
  observedTreatment: { success: number; failure: number }
): { chiSquare: number; pValue: number } {
  const table = [
    [observedControl.success, observedControl.failure],
    [observedTreatment.success, observedTreatment.failure]
  ];

  const rowTotals = table.map(row => row[0] + row[1]);
  const colTotals = [
    table[0][0] + table[1][0],
    table[0][1] + table[1][1]
  ];
  const grandTotal = rowTotals[0] + rowTotals[1];

  let chiSquare = 0;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const expected = (rowTotals[i] * colTotals[j]) / grandTotal;
      if (expected > 0) {
        chiSquare += Math.pow(table[i][j] - expected, 2) / expected;
      }
    }
  }

  const pValue = 1 - chiSquareCDF(chiSquare, 1);

  return { chiSquare, pValue };
}

// ============================================================================
// CONFIDENCE INTERVALS
// ============================================================================

/**
 * Calculate confidence interval for proportion difference
 */
export function proportionDifferenceCI(
  p1: number,
  n1: number,
  p2: number,
  n2: number,
  confidenceLevel = 0.95
): { lower: number; upper: number; level: number } {
  const diff = p2 - p1;
  const se = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
  const z = normalInverseCDF(1 - (1 - confidenceLevel) / 2);

  return {
    lower: diff - z * se,
    upper: diff + z * se,
    level: confidenceLevel
  };
}

/**
 * Calculate confidence interval for relative lift
 */
export function relativeLiftCI(
  p1: number,
  n1: number,
  p2: number,
  n2: number,
  confidenceLevel = 0.95
): { lower: number; upper: number; level: number } {
  if (p1 === 0) {
    return { lower: 0, upper: Infinity, level: confidenceLevel };
  }

  const lift = (p2 - p1) / p1;

  // Delta method for variance of ratio
  const var1 = (p1 * (1 - p1)) / n1;
  const var2 = (p2 * (1 - p2)) / n2;
  const seLift = Math.sqrt(var2 / (p1 * p1) + (p2 * p2 * var1) / Math.pow(p1, 4));

  const z = normalInverseCDF(1 - (1 - confidenceLevel) / 2);

  return {
    lower: lift - z * seLift,
    upper: lift + z * seLift,
    level: confidenceLevel
  };
}

// ============================================================================
// BAYESIAN ANALYSIS
// ============================================================================

/**
 * Calculate probability that treatment is better than control
 * Using Monte Carlo simulation with beta distributions
 */
export function bayesianProbabilityOfImprovement(
  controlConversions: number,
  controlSampleSize: number,
  treatmentConversions: number,
  treatmentSampleSize: number,
  iterations = 10000
): number {
  // Beta distribution parameters (using uniform prior)
  const alphaControl = controlConversions + 1;
  const betaControl = controlSampleSize - controlConversions + 1;
  const alphaTreatment = treatmentConversions + 1;
  const betaTreatment = treatmentSampleSize - treatmentConversions + 1;

  let treatmentWins = 0;

  for (let i = 0; i < iterations; i++) {
    const controlSample = sampleBeta(alphaControl, betaControl);
    const treatmentSample = sampleBeta(alphaTreatment, betaTreatment);

    if (treatmentSample > controlSample) {
      treatmentWins++;
    }
  }

  return treatmentWins / iterations;
}

/**
 * Sample from beta distribution using Gamma distribution
 */
function sampleBeta(alpha: number, beta: number): number {
  const gammaA = sampleGamma(alpha);
  const gammaB = sampleGamma(beta);
  return gammaA / (gammaA + gammaB);
}

/**
 * Sample from gamma distribution using Marsaglia and Tsang's method
 */
function sampleGamma(shape: number): number {
  if (shape < 1) {
    return sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number, v: number;
    do {
      x = normalRandom();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * x * x * x * x) {
      return d * v;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

/**
 * Generate standard normal random number using Box-Muller transform
 */
function normalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ============================================================================
// VARIANT ASSIGNMENT
// ============================================================================

/**
 * Deterministic variant assignment using hash
 * Ensures same user always gets same variant
 */
export function assignVariant(
  userId: string,
  experimentId: string,
  variants: Variant[]
): Variant {
  // Create deterministic hash
  const hash = hashString(`${experimentId}:${userId}`);
  const normalizedHash = hash / 0xFFFFFFFF; // Normalize to 0-1

  // Assign based on weights
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    if (normalizedHash < cumulativeWeight) {
      return variant;
    }
  }

  // Fallback to last variant
  return variants[variants.length - 1];
}

/**
 * Simple string hash function (djb2)
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash >>> 0; // Convert to unsigned 32-bit
  }
  return hash;
}

// ============================================================================
// EXPERIMENT ANALYSIS
// ============================================================================

/**
 * Analyze experiment results for conversion metrics
 */
export function analyzeConversionExperiment(
  experiment: Experiment,
  controlStats: VariantStats,
  treatmentStats: VariantStats
): ExperimentResult {
  const p1 = controlStats.conversionRate!;
  const p2 = treatmentStats.conversionRate!;
  const n1 = controlStats.sampleSize;
  const n2 = treatmentStats.sampleSize;

  // Calculate lifts
  const absoluteLift = p2 - p1;
  const relativeLift = p1 > 0 ? (p2 - p1) / p1 : 0;

  // Statistical tests
  const { pValue } = proportionZTest(
    controlStats.conversions!,
    n1,
    treatmentStats.conversions!,
    n2
  );

  // Confidence interval
  const confidenceInterval = relativeLiftCI(p1, n1, p2, n2, 1 - experiment.significanceLevel);

  // Is significant?
  const isSignificant = pValue < experiment.significanceLevel;

  // Bayesian probability
  const bayesianProbability = bayesianProbabilityOfImprovement(
    controlStats.conversions!,
    n1,
    treatmentStats.conversions!,
    n2
  );

  // Sample size and progress
  const requiredSampleSize = calculateSampleSize({
    baselineConversionRate: p1,
    minimumDetectableEffect: experiment.minimumDetectableEffect,
    significanceLevel: experiment.significanceLevel,
    statisticalPower: experiment.statisticalPower
  });
  const totalSamples = n1 + n2;
  const currentProgress = Math.min(1, totalSamples / (requiredSampleSize * 2));

  // Actual power (post-hoc)
  const actualPower = calculateActualPower(
    p1, p2, n1, n2, experiment.significanceLevel
  );

  // Recommendation
  const recommendation = determineRecommendation(
    isSignificant,
    relativeLift,
    experiment.minimumDetectableEffect,
    currentProgress,
    actualPower
  );

  return {
    experimentId: experiment.id,
    controlStats,
    treatmentStats,
    relativeLift,
    absoluteLift,
    pValue,
    isSignificant,
    confidenceInterval,
    statisticalPower: actualPower,
    requiredSampleSize,
    currentProgress,
    recommendation,
    bayesianProbability
  };
}

/**
 * Calculate actual (post-hoc) power
 */
function calculateActualPower(
  p1: number,
  p2: number,
  n1: number,
  n2: number,
  alpha: number
): number {
  const effect = Math.abs(p2 - p1);
  if (effect === 0) return alpha; // No effect = power equals alpha

  const pooledP = (p1 + p2) / 2;
  const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));

  const se1 = Math.sqrt(p1 * (1 - p1) / n1);
  const se2 = Math.sqrt(p2 * (1 - p2) / n2);
  const combinedSE = Math.sqrt(se1 * se1 + se2 * se2);

  const zAlpha = normalInverseCDF(1 - alpha / 2);
  const criticalValue = zAlpha * pooledSE;

  // Non-centrality parameter
  const ncp = effect / combinedSE;

  // Power = P(reject H0 | H1 is true)
  const powerUpper = 1 - normalCDF(zAlpha - ncp);
  const powerLower = normalCDF(-zAlpha - ncp);

  return powerUpper + powerLower;
}

/**
 * Determine recommendation based on results
 */
function determineRecommendation(
  isSignificant: boolean,
  relativeLift: number,
  mde: number,
  progress: number,
  power: number
): 'continue' | 'stop_winner' | 'stop_no_effect' | 'inconclusive' {
  // Not enough data yet
  if (progress < 0.5) {
    return 'continue';
  }

  // Clear winner
  if (isSignificant && relativeLift >= mde && power >= 0.8) {
    return 'stop_winner';
  }

  // No effect detected with sufficient power
  if (!isSignificant && power >= 0.8 && progress >= 1) {
    return 'stop_no_effect';
  }

  // Significant but effect smaller than MDE
  if (isSignificant && relativeLift < mde) {
    return 'inconclusive';
  }

  // Not enough power yet
  if (progress < 1) {
    return 'continue';
  }

  return 'inconclusive';
}

// ============================================================================
// SEQUENTIAL TESTING (Early Stopping)
// ============================================================================

/**
 * O'Brien-Fleming spending function for sequential testing
 * Returns adjusted alpha at each interim analysis
 */
export function obfAlphaSpending(
  informationFraction: number,
  totalAlpha: number
): number {
  if (informationFraction <= 0) return 0;
  if (informationFraction >= 1) return totalAlpha;

  // O'Brien-Fleming: very conservative early, relaxed late
  const z = normalInverseCDF(1 - totalAlpha / 2);
  const adjustedZ = z / Math.sqrt(informationFraction);

  return 2 * (1 - normalCDF(adjustedZ));
}

/**
 * Pocock spending function (uniform spending)
 */
export function pocockAlphaSpending(
  informationFraction: number,
  totalAlpha: number
): number {
  if (informationFraction <= 0) return 0;
  if (informationFraction >= 1) return totalAlpha;

  // Pocock: constant boundary (more aggressive early stopping)
  return totalAlpha * Math.log(1 + (Math.E - 1) * informationFraction);
}

// ============================================================================
// EXPORTS
// ============================================================================

export const ABTesting = {
  // Sample size
  calculateSampleSize,
  calculateSampleSizeContinuous,

  // Statistical tests
  proportionZTest,
  twoSampleTTest,
  chiSquareTest,

  // Confidence intervals
  proportionDifferenceCI,
  relativeLiftCI,

  // Bayesian
  bayesianProbabilityOfImprovement,

  // Variant assignment
  assignVariant,

  // Analysis
  analyzeConversionExperiment,

  // Sequential testing
  obfAlphaSpending,
  pocockAlphaSpending,

  // Utilities
  normalCDF,
  normalInverseCDF
};

export default ABTesting;
