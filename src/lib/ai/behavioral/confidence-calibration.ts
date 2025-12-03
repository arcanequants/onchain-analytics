/**
 * Confidence Calibration Tracking
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Track stated confidence vs actual accuracy
 * - Calibration curves
 * - Overconfidence/underconfidence detection
 * - Provider-specific calibration profiles
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ConfidenceSample {
  id: string;
  provider: string;
  model: string;
  statedConfidence: number;  // 0-1, what model claimed
  actualAccuracy: number;    // 0-1, verified accuracy
  queryType: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CalibrationBin {
  minConfidence: number;
  maxConfidence: number;
  midpoint: number;
  sampleCount: number;
  averageConfidence: number;
  averageAccuracy: number;
  calibrationError: number;  // |confidence - accuracy|
  isOverconfident: boolean;
}

export interface CalibrationCurve {
  bins: CalibrationBin[];
  expectedCalibrationError: number;  // ECE
  maxCalibrationError: number;       // MCE
  brierScore: number;                // Overall quality
  isWellCalibrated: boolean;
  calibrationType: 'overconfident' | 'underconfident' | 'well_calibrated' | 'mixed';
}

export interface ProviderCalibration {
  provider: string;
  model: string;
  sampleCount: number;
  curve: CalibrationCurve;
  recommendations: string[];
  lastUpdated: Date;
}

export interface CalibrationReport {
  generatedAt: Date;
  totalSamples: number;
  providers: ProviderCalibration[];
  overallECE: number;
  bestCalibratedProvider: string | null;
  worstCalibratedProvider: string | null;
  recommendations: string[];
}

// ============================================================================
// STORAGE
// ============================================================================

const calibrationSamples: ConfidenceSample[] = [];
const calibrationCache = new Map<string, CalibrationCurve>();

// ============================================================================
// SAMPLE COLLECTION
// ============================================================================

/**
 * Record a confidence sample
 */
export function recordConfidenceSample(sample: Omit<ConfidenceSample, 'id' | 'timestamp'>): ConfidenceSample {
  const fullSample: ConfidenceSample = {
    ...sample,
    id: `cal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
  };

  calibrationSamples.push(fullSample);

  // Invalidate cache for this provider
  calibrationCache.delete(sample.provider);

  return fullSample;
}

/**
 * Batch record samples
 */
export function recordBatchSamples(
  samples: Array<Omit<ConfidenceSample, 'id' | 'timestamp'>>
): ConfidenceSample[] {
  return samples.map(s => recordConfidenceSample(s));
}

/**
 * Get samples for provider
 */
export function getSamples(
  provider?: string,
  limit?: number
): ConfidenceSample[] {
  let filtered = calibrationSamples;

  if (provider) {
    filtered = filtered.filter(s => s.provider === provider);
  }

  // Sort by timestamp descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  return filtered;
}

// ============================================================================
// CALIBRATION CURVE COMPUTATION
// ============================================================================

/**
 * Compute calibration curve from samples
 */
export function computeCalibrationCurve(
  samples: ConfidenceSample[],
  numBins: number = 10
): CalibrationCurve {
  if (samples.length === 0) {
    return {
      bins: [],
      expectedCalibrationError: 0,
      maxCalibrationError: 0,
      brierScore: 0,
      isWellCalibrated: true,
      calibrationType: 'well_calibrated',
    };
  }

  // Create bins
  const binWidth = 1.0 / numBins;
  const bins: CalibrationBin[] = [];

  for (let i = 0; i < numBins; i++) {
    const minConf = i * binWidth;
    const maxConf = (i + 1) * binWidth;
    const midpoint = (minConf + maxConf) / 2;

    const binSamples = samples.filter(
      s => s.statedConfidence >= minConf && s.statedConfidence < maxConf
    );

    if (binSamples.length === 0) {
      bins.push({
        minConfidence: minConf,
        maxConfidence: maxConf,
        midpoint,
        sampleCount: 0,
        averageConfidence: midpoint,
        averageAccuracy: midpoint,  // Assume perfect calibration when no data
        calibrationError: 0,
        isOverconfident: false,
      });
      continue;
    }

    const avgConfidence = binSamples.reduce((s, x) => s + x.statedConfidence, 0) / binSamples.length;
    const avgAccuracy = binSamples.reduce((s, x) => s + x.actualAccuracy, 0) / binSamples.length;
    const calibError = Math.abs(avgConfidence - avgAccuracy);

    bins.push({
      minConfidence: minConf,
      maxConfidence: maxConf,
      midpoint,
      sampleCount: binSamples.length,
      averageConfidence: avgConfidence,
      averageAccuracy: avgAccuracy,
      calibrationError: calibError,
      isOverconfident: avgConfidence > avgAccuracy,
    });
  }

  // Calculate Expected Calibration Error (ECE)
  const totalSamples = samples.length;
  let ece = 0;
  let mce = 0;

  for (const bin of bins) {
    if (bin.sampleCount > 0) {
      const weight = bin.sampleCount / totalSamples;
      ece += weight * bin.calibrationError;
      mce = Math.max(mce, bin.calibrationError);
    }
  }

  // Calculate Brier Score
  const brierScore = samples.reduce(
    (sum, s) => sum + Math.pow(s.statedConfidence - s.actualAccuracy, 2),
    0
  ) / samples.length;

  // Determine calibration type
  const overconfidentBins = bins.filter(b => b.sampleCount > 0 && b.isOverconfident);
  const underconfidentBins = bins.filter(b => b.sampleCount > 0 && !b.isOverconfident);
  const nonEmptyBins = bins.filter(b => b.sampleCount > 0);

  let calibrationType: 'overconfident' | 'underconfident' | 'well_calibrated' | 'mixed';

  if (ece < 0.05) {
    calibrationType = 'well_calibrated';
  } else if (overconfidentBins.length > nonEmptyBins.length * 0.7) {
    calibrationType = 'overconfident';
  } else if (underconfidentBins.length > nonEmptyBins.length * 0.7) {
    calibrationType = 'underconfident';
  } else {
    calibrationType = 'mixed';
  }

  return {
    bins,
    expectedCalibrationError: ece,
    maxCalibrationError: mce,
    brierScore,
    isWellCalibrated: ece < 0.1,
    calibrationType,
  };
}

/**
 * Get calibration curve for provider (cached)
 */
export function getProviderCalibration(provider: string): CalibrationCurve {
  if (calibrationCache.has(provider)) {
    return calibrationCache.get(provider)!;
  }

  const samples = getSamples(provider);
  const curve = computeCalibrationCurve(samples);
  calibrationCache.set(provider, curve);

  return curve;
}

// ============================================================================
// CALIBRATION ANALYSIS
// ============================================================================

/**
 * Analyze calibration for a provider
 */
export function analyzeProviderCalibration(provider: string, model?: string): ProviderCalibration {
  let samples = getSamples(provider);

  if (model) {
    samples = samples.filter(s => s.model === model);
  }

  const curve = computeCalibrationCurve(samples);
  const recommendations: string[] = [];

  // Generate recommendations
  if (curve.calibrationType === 'overconfident') {
    recommendations.push(`${provider} tends to overstate confidence - apply temperature scaling`);
    recommendations.push('Consider requesting hedged language in prompts');
  }

  if (curve.calibrationType === 'underconfident') {
    recommendations.push(`${provider} understates confidence - may be overly cautious`);
    recommendations.push('Consider boosting confidence for well-supported claims');
  }

  if (curve.expectedCalibrationError > 0.15) {
    recommendations.push('High calibration error - confidence scores need significant adjustment');
  }

  if (curve.maxCalibrationError > 0.3) {
    recommendations.push('Severe miscalibration in some confidence ranges');
  }

  // Check specific bins
  for (const bin of curve.bins) {
    if (bin.sampleCount > 10 && bin.calibrationError > 0.2) {
      recommendations.push(
        `Poor calibration in ${(bin.minConfidence * 100).toFixed(0)}-${(bin.maxConfidence * 100).toFixed(0)}% confidence range`
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Calibration is within acceptable limits');
  }

  return {
    provider,
    model: model || 'all',
    sampleCount: samples.length,
    curve,
    recommendations,
    lastUpdated: new Date(),
  };
}

/**
 * Generate full calibration report
 */
export function generateCalibrationReport(): CalibrationReport {
  const providers = [...new Set(calibrationSamples.map(s => s.provider))];
  const providerCalibrations: ProviderCalibration[] = providers.map(p =>
    analyzeProviderCalibration(p)
  );

  // Find best/worst calibrated
  let bestProvider: string | null = null;
  let worstProvider: string | null = null;
  let bestECE = Infinity;
  let worstECE = -1;

  for (const pc of providerCalibrations) {
    if (pc.sampleCount >= 10) {  // Minimum samples for comparison
      if (pc.curve.expectedCalibrationError < bestECE) {
        bestECE = pc.curve.expectedCalibrationError;
        bestProvider = pc.provider;
      }
      if (pc.curve.expectedCalibrationError > worstECE) {
        worstECE = pc.curve.expectedCalibrationError;
        worstProvider = pc.provider;
      }
    }
  }

  // Overall ECE
  const allCurve = computeCalibrationCurve(calibrationSamples);

  // Generate recommendations
  const recommendations: string[] = [];

  if (allCurve.calibrationType === 'overconfident') {
    recommendations.push('Overall system tends to overstate confidence');
    recommendations.push('Implement Platt scaling or isotonic regression for calibration');
  }

  if (bestProvider && worstProvider && bestProvider !== worstProvider) {
    recommendations.push(`Consider weighting ${bestProvider} confidence more heavily`);
  }

  if (providerCalibrations.some(pc => pc.curve.expectedCalibrationError > 0.2)) {
    recommendations.push('Some providers need calibration adjustment');
  }

  return {
    generatedAt: new Date(),
    totalSamples: calibrationSamples.length,
    providers: providerCalibrations,
    overallECE: allCurve.expectedCalibrationError,
    bestCalibratedProvider: bestProvider,
    worstCalibratedProvider: worstProvider,
    recommendations,
  };
}

// ============================================================================
// CALIBRATION ADJUSTMENT
// ============================================================================

/**
 * Apply temperature scaling to adjust confidence
 */
export function applyTemperatureScaling(
  confidence: number,
  temperature: number
): number {
  // Higher temperature = less extreme predictions
  if (temperature <= 0) return confidence;

  const logit = Math.log(confidence / (1 - confidence + 1e-10));
  const scaledLogit = logit / temperature;
  return 1 / (1 + Math.exp(-scaledLogit));
}

/**
 * Estimate optimal temperature for calibration
 */
export function estimateOptimalTemperature(samples: ConfidenceSample[]): number {
  if (samples.length < 10) return 1.0;

  // Binary search for best temperature
  let bestTemp = 1.0;
  let bestError = Infinity;

  for (let temp = 0.5; temp <= 2.0; temp += 0.1) {
    let error = 0;

    for (const sample of samples) {
      const adjusted = applyTemperatureScaling(sample.statedConfidence, temp);
      error += Math.pow(adjusted - sample.actualAccuracy, 2);
    }

    error /= samples.length;

    if (error < bestError) {
      bestError = error;
      bestTemp = temp;
    }
  }

  return bestTemp;
}

/**
 * Get calibration-adjusted confidence
 */
export function getCalibratedConfidence(
  provider: string,
  rawConfidence: number
): number {
  const samples = getSamples(provider);
  if (samples.length < 20) {
    return rawConfidence;  // Not enough data
  }

  const temperature = estimateOptimalTemperature(samples);
  return applyTemperatureScaling(rawConfidence, temperature);
}

// ============================================================================
// RELIABILITY DIAGRAM DATA
// ============================================================================

/**
 * Get data for reliability diagram visualization
 */
export function getReliabilityDiagramData(provider?: string): {
  bins: Array<{ confidence: number; accuracy: number; count: number }>;
  perfectCalibration: Array<{ x: number; y: number }>;
} {
  const samples = provider ? getSamples(provider) : calibrationSamples;
  const curve = computeCalibrationCurve(samples);

  const bins = curve.bins.map(bin => ({
    confidence: bin.averageConfidence,
    accuracy: bin.averageAccuracy,
    count: bin.sampleCount,
  }));

  const perfectCalibration = Array.from({ length: 11 }, (_, i) => ({
    x: i / 10,
    y: i / 10,
  }));

  return { bins, perfectCalibration };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Sample collection
  recordConfidenceSample,
  recordBatchSamples,
  getSamples,

  // Calibration computation
  computeCalibrationCurve,
  getProviderCalibration,

  // Analysis
  analyzeProviderCalibration,
  generateCalibrationReport,

  // Adjustment
  applyTemperatureScaling,
  estimateOptimalTemperature,
  getCalibratedConfidence,

  // Visualization
  getReliabilityDiagramData,
};
