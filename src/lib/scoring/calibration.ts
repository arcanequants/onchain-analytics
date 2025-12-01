/**
 * Score Calibration Service
 *
 * Provides industry-specific score calibration to ensure consistency and
 * fairness across different analysis contexts. Uses polynomial calibration
 * curves derived from user feedback and RLHF signals.
 *
 * Features:
 * - Global, industry-specific, user-specific, and brand-specific calibration
 * - Polynomial and piecewise linear calibration
 * - Calibration feedback collection
 * - Automatic curve updates based on feedback
 *
 * @module lib/scoring/calibration
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Scope levels for calibration
 */
export type CalibrationScope = 'global' | 'industry' | 'user' | 'brand';

/**
 * Calibration curve configuration
 */
export interface CalibrationCurve {
  id: string;
  scope: CalibrationScope;
  industryId?: string;
  userId?: string;
  brandId?: string;
  coefficients: number[]; // [a0, a1, a2, a3] for polynomial
  calibrationPoints?: CalibrationPoint[];
  sampleSize: number;
  meanRawScore?: number;
  stdRawScore?: number;
  meanSatisfaction?: number;
  mae?: number;
  rmse?: number;
  rSquared?: number;
  confidenceLevel: number;
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
}

/**
 * Point on a piecewise linear calibration curve
 */
export interface CalibrationPoint {
  raw: number;
  calibrated: number;
}

/**
 * User feedback on calibration accuracy
 */
export interface CalibrationFeedback {
  analysisId: string;
  userId?: string;
  rawScore: number;
  calibratedScore: number;
  perceivedAccuracy?: 'way_too_low' | 'too_low' | 'accurate' | 'too_high' | 'way_too_high';
  expectedScore?: number;
  satisfactionRating?: number; // 1-5
  context?: Record<string, unknown>;
}

/**
 * Calibration result with metadata
 */
export interface CalibrationResult {
  rawScore: number;
  calibratedScore: number;
  curveId?: string;
  scope: CalibrationScope;
  confidenceLevel: number;
  curveCoefficients: number[];
}

/**
 * Configuration for calibration service
 */
export interface CalibrationConfig {
  /** Cache TTL in ms */
  cacheTtlMs: number;
  /** Default to identity calibration if no curve found */
  defaultToIdentity: boolean;
  /** Enable debug logging */
  debug: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_CALIBRATION_CONFIG: CalibrationConfig = {
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
  defaultToIdentity: true,
  debug: false,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Apply polynomial calibration: a0 + a1*x + a2*x^2 + a3*x^3
 */
export function applyPolynomialCalibration(
  rawScore: number,
  coefficients: number[]
): number {
  if (coefficients.length < 2) {
    return rawScore;
  }

  const [a0, a1, a2 = 0, a3 = 0] = coefficients;
  const x = rawScore;

  const calibrated = a0 + a1 * x + a2 * x * x + a3 * x * x * x;

  // Clamp to valid range
  return Math.max(0, Math.min(100, Math.round(calibrated)));
}

/**
 * Apply piecewise linear calibration
 */
export function applyPiecewiseCalibration(
  rawScore: number,
  points: CalibrationPoint[]
): number {
  if (points.length < 2) {
    return rawScore;
  }

  // Sort points by raw score
  const sortedPoints = [...points].sort((a, b) => a.raw - b.raw);

  // Handle edge cases
  if (rawScore <= sortedPoints[0].raw) {
    return sortedPoints[0].calibrated;
  }
  if (rawScore >= sortedPoints[sortedPoints.length - 1].raw) {
    return sortedPoints[sortedPoints.length - 1].calibrated;
  }

  // Find the segment
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];

    if (rawScore >= p1.raw && rawScore <= p2.raw) {
      // Linear interpolation
      const t = (rawScore - p1.raw) / (p2.raw - p1.raw);
      const calibrated = p1.calibrated + t * (p2.calibrated - p1.calibrated);
      return Math.round(calibrated);
    }
  }

  return rawScore;
}

/**
 * Create identity calibration curve (no change)
 */
export function createIdentityCurve(): CalibrationCurve {
  return {
    id: 'identity',
    scope: 'global',
    coefficients: [0, 1, 0, 0], // calibrated = raw
    sampleSize: 0,
    confidenceLevel: 0.5,
    validFrom: new Date(),
    isActive: true,
  };
}

/**
 * Calculate calibration metrics from data
 */
export function calculateCalibrationMetrics(
  rawScores: number[],
  calibratedScores: number[],
  actualScores: number[]
): { mae: number; rmse: number; rSquared: number } {
  if (
    rawScores.length !== calibratedScores.length ||
    rawScores.length !== actualScores.length ||
    rawScores.length === 0
  ) {
    return { mae: 0, rmse: 0, rSquared: 0 };
  }

  const n = rawScores.length;
  let sumAbsError = 0;
  let sumSquaredError = 0;
  let sumActual = 0;
  let sumSquaredActual = 0;

  for (let i = 0; i < n; i++) {
    const error = calibratedScores[i] - actualScores[i];
    sumAbsError += Math.abs(error);
    sumSquaredError += error * error;
    sumActual += actualScores[i];
    sumSquaredActual += actualScores[i] * actualScores[i];
  }

  const mae = sumAbsError / n;
  const rmse = Math.sqrt(sumSquaredError / n);

  // R-squared calculation
  const meanActual = sumActual / n;
  const ssTot = actualScores.reduce((sum, y) => sum + (y - meanActual) ** 2, 0);
  const ssRes = sumSquaredError;
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { mae, rmse, rSquared: Math.max(0, rSquared) };
}

/**
 * Fit polynomial coefficients using least squares
 * Simple implementation for degree 3 polynomial
 */
export function fitPolynomialCoefficients(
  rawScores: number[],
  targetScores: number[],
  degree = 3
): number[] {
  if (rawScores.length !== targetScores.length || rawScores.length < degree + 1) {
    return [0, 1, 0, 0]; // Identity
  }

  // Simplified: use linear regression for now
  // For production, use a proper polynomial regression library
  const n = rawScores.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += rawScores[i];
    sumY += targetScores[i];
    sumXY += rawScores[i] * targetScores[i];
    sumX2 += rawScores[i] * rawScores[i];
  }

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 0.0001) {
    return [0, 1, 0, 0];
  }

  const a1 = (n * sumXY - sumX * sumY) / denom;
  const a0 = (sumY - a1 * sumX) / n;

  return [a0, a1, 0, 0];
}

// ============================================================================
// CALIBRATION SERVICE CLASS
// ============================================================================

/**
 * Main calibration service
 */
export class CalibrationService {
  private supabase: SupabaseClient;
  private config: CalibrationConfig;
  private curveCache: Map<string, { curve: CalibrationCurve; expiresAt: number }> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string, config: Partial<CalibrationConfig> = {}) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.config = { ...DEFAULT_CALIBRATION_CONFIG, ...config };
  }

  /**
   * Calibrate a raw score using the appropriate curve
   */
  public async calibrate(
    rawScore: number,
    options: {
      industryId?: string;
      userId?: string;
      brandId?: string;
    } = {}
  ): Promise<CalibrationResult> {
    // Try to find the most specific applicable curve
    const curve = await this.getApplicableCurve(options);

    if (!curve) {
      // Use identity calibration
      return {
        rawScore,
        calibratedScore: rawScore,
        scope: 'global',
        confidenceLevel: 0.5,
        curveCoefficients: [0, 1, 0, 0],
      };
    }

    let calibratedScore: number;

    // Use piecewise if available, otherwise polynomial
    if (curve.calibrationPoints && curve.calibrationPoints.length >= 2) {
      calibratedScore = applyPiecewiseCalibration(rawScore, curve.calibrationPoints);
    } else {
      calibratedScore = applyPolynomialCalibration(rawScore, curve.coefficients);
    }

    return {
      rawScore,
      calibratedScore,
      curveId: curve.id,
      scope: curve.scope,
      confidenceLevel: curve.confidenceLevel,
      curveCoefficients: curve.coefficients,
    };
  }

  /**
   * Batch calibrate multiple scores
   */
  public async calibrateBatch(
    scores: Array<{ rawScore: number; industryId?: string }>
  ): Promise<CalibrationResult[]> {
    const results: CalibrationResult[] = [];

    // Group by industry for efficiency
    const byIndustry = new Map<string | undefined, number[]>();
    for (let i = 0; i < scores.length; i++) {
      const industryId = scores[i].industryId;
      if (!byIndustry.has(industryId)) {
        byIndustry.set(industryId, []);
      }
      byIndustry.get(industryId)!.push(i);
    }

    for (const [industryId, indices] of byIndustry) {
      const curve = await this.getApplicableCurve({ industryId });

      for (const i of indices) {
        const { rawScore } = scores[i];
        let calibratedScore: number;

        if (curve && curve.calibrationPoints && curve.calibrationPoints.length >= 2) {
          calibratedScore = applyPiecewiseCalibration(rawScore, curve.calibrationPoints);
        } else if (curve) {
          calibratedScore = applyPolynomialCalibration(rawScore, curve.coefficients);
        } else {
          calibratedScore = rawScore;
        }

        results[i] = {
          rawScore,
          calibratedScore,
          curveId: curve?.id,
          scope: curve?.scope || 'global',
          confidenceLevel: curve?.confidenceLevel || 0.5,
          curveCoefficients: curve?.coefficients || [0, 1, 0, 0],
        };
      }
    }

    return results;
  }

  /**
   * Get the most specific applicable calibration curve
   */
  private async getApplicableCurve(options: {
    industryId?: string;
    userId?: string;
    brandId?: string;
  }): Promise<CalibrationCurve | null> {
    // Check cache first
    const cacheKey = this.getCacheKey(options);
    const cached = this.curveCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.curve;
    }

    // Try in order of specificity: brand > user > industry > global
    let curve: CalibrationCurve | null = null;

    if (options.brandId) {
      curve = await this.loadCurve('brand', options.brandId);
    }

    if (!curve && options.userId) {
      curve = await this.loadCurve('user', options.userId);
    }

    if (!curve && options.industryId) {
      curve = await this.loadCurve('industry', options.industryId);
    }

    if (!curve) {
      curve = await this.loadCurve('global');
    }

    // Cache the result
    if (curve) {
      this.curveCache.set(cacheKey, {
        curve,
        expiresAt: Date.now() + this.config.cacheTtlMs,
      });
    } else if (this.config.defaultToIdentity) {
      curve = createIdentityCurve();
    }

    return curve;
  }

  /**
   * Load a calibration curve from the database
   */
  private async loadCurve(
    scope: CalibrationScope,
    referenceId?: string
  ): Promise<CalibrationCurve | null> {
    let query = this.supabase
      .from('calibration_curves')
      .select('*')
      .eq('scope', scope)
      .eq('is_active', true)
      .lte('valid_from', new Date().toISOString())
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
      .limit(1);

    if (scope === 'industry' && referenceId) {
      query = query.eq('industry_id', referenceId);
    } else if (scope === 'user' && referenceId) {
      query = query.eq('user_id', referenceId);
    } else if (scope === 'brand' && referenceId) {
      query = query.eq('brand_id', referenceId);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      id: row.id,
      scope: row.scope,
      industryId: row.industry_id,
      userId: row.user_id,
      brandId: row.brand_id,
      coefficients: row.coefficients,
      calibrationPoints: row.calibration_points,
      sampleSize: row.sample_size,
      meanRawScore: row.mean_raw_score,
      stdRawScore: row.std_raw_score,
      meanSatisfaction: row.mean_satisfaction,
      mae: row.mae,
      rmse: row.rmse,
      rSquared: row.r_squared,
      confidenceLevel: row.confidence_level,
      validFrom: new Date(row.valid_from),
      validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
      isActive: row.is_active,
    };
  }

  /**
   * Submit calibration feedback
   */
  public async submitFeedback(feedback: CalibrationFeedback): Promise<string> {
    // Get the current calibration curve for context
    const curve = await this.getApplicableCurve({});

    const { data, error } = await this.supabase
      .from('calibration_feedback')
      .insert({
        analysis_id: feedback.analysisId,
        user_id: feedback.userId || null,
        calibration_curve_id: curve?.id || null,
        raw_score: feedback.rawScore,
        calibrated_score: feedback.calibratedScore,
        perceived_accuracy: feedback.perceivedAccuracy || null,
        expected_score: feedback.expectedScore || null,
        satisfaction_rating: feedback.satisfactionRating || null,
        feedback_context: feedback.context || {},
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Create or update a calibration curve
   */
  public async upsertCurve(curve: Omit<CalibrationCurve, 'id'>): Promise<string> {
    // Deactivate existing curves for the same scope/reference
    if (curve.scope === 'global') {
      await this.supabase
        .from('calibration_curves')
        .update({ is_active: false })
        .eq('scope', 'global')
        .eq('is_active', true);
    } else if (curve.scope === 'industry' && curve.industryId) {
      await this.supabase
        .from('calibration_curves')
        .update({ is_active: false })
        .eq('scope', 'industry')
        .eq('industry_id', curve.industryId)
        .eq('is_active', true);
    }

    const { data, error } = await this.supabase
      .from('calibration_curves')
      .insert({
        scope: curve.scope,
        industry_id: curve.industryId || null,
        user_id: curve.userId || null,
        brand_id: curve.brandId || null,
        coefficients: curve.coefficients,
        calibration_points: curve.calibrationPoints || [],
        sample_size: curve.sampleSize,
        mean_raw_score: curve.meanRawScore || null,
        std_raw_score: curve.stdRawScore || null,
        mean_satisfaction: curve.meanSatisfaction || null,
        mae: curve.mae || null,
        rmse: curve.rmse || null,
        r_squared: curve.rSquared || null,
        confidence_level: curve.confidenceLevel,
        valid_from: curve.validFrom.toISOString(),
        valid_until: curve.validUntil?.toISOString() || null,
        is_active: curve.isActive,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create curve: ${error.message}`);
    }

    // Invalidate cache
    this.clearCache();

    return data.id;
  }

  /**
   * Get all active calibration curves
   */
  public async getActiveCurves(): Promise<CalibrationCurve[]> {
    const { data, error } = await this.supabase
      .from('vw_active_calibrations')
      .select('*');

    if (error) {
      throw new Error(`Failed to get curves: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      scope: row.scope,
      coefficients: row.coefficients,
      sampleSize: row.sample_size,
      meanSatisfaction: row.mean_satisfaction,
      mae: row.mae,
      rSquared: row.r_squared,
      confidenceLevel: row.confidence_level,
      validFrom: new Date(row.valid_from),
      validUntil: row.valid_until ? new Date(row.valid_until) : undefined,
      isActive: true,
    }));
  }

  /**
   * Train a new calibration curve from feedback data
   */
  public async trainFromFeedback(options: {
    scope: CalibrationScope;
    industryId?: string;
    minSamples?: number;
  }): Promise<CalibrationCurve | null> {
    const minSamples = options.minSamples || 30;

    // Get feedback data
    let query = this.supabase
      .from('calibration_feedback')
      .select('raw_score, calibrated_score, expected_score, satisfaction_rating')
      .not('expected_score', 'is', null);

    // Note: For industry filtering, would need to join with analyses table

    const { data, error } = await query;

    if (error || !data || data.length < minSamples) {
      this.log(`Not enough samples for training: ${data?.length || 0} < ${minSamples}`);
      return null;
    }

    // Prepare training data
    const rawScores = data.map((d) => d.raw_score);
    const targetScores = data.map((d) => d.expected_score);

    // Fit polynomial
    const coefficients = fitPolynomialCoefficients(rawScores, targetScores);

    // Calculate metrics
    const calibratedScores = rawScores.map((r) =>
      applyPolynomialCalibration(r, coefficients)
    );
    const metrics = calculateCalibrationMetrics(rawScores, calibratedScores, targetScores);

    // Calculate statistics
    const meanRaw = rawScores.reduce((a, b) => a + b, 0) / rawScores.length;
    const variance =
      rawScores.reduce((sum, x) => sum + (x - meanRaw) ** 2, 0) / rawScores.length;
    const stdRaw = Math.sqrt(variance);

    const satisfactionRatings = data
      .filter((d) => d.satisfaction_rating)
      .map((d) => d.satisfaction_rating);
    const meanSatisfaction =
      satisfactionRatings.length > 0
        ? satisfactionRatings.reduce((a, b) => a + b, 0) / satisfactionRatings.length / 5 // Normalize to 0-1
        : undefined;

    // Determine confidence based on sample size and metrics
    const sampleConfidence = Math.min(1, data.length / 100);
    const metricsConfidence = metrics.rSquared;
    const confidenceLevel = (sampleConfidence + metricsConfidence) / 2;

    const newCurve: Omit<CalibrationCurve, 'id'> = {
      scope: options.scope,
      industryId: options.industryId,
      coefficients,
      sampleSize: data.length,
      meanRawScore: meanRaw,
      stdRawScore: stdRaw,
      meanSatisfaction,
      mae: metrics.mae,
      rmse: metrics.rmse,
      rSquared: metrics.rSquared,
      confidenceLevel,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
    };

    // Save the curve
    const id = await this.upsertCurve(newCurve);

    return { ...newCurve, id };
  }

  /**
   * Clear the curve cache
   */
  public clearCache(): void {
    this.curveCache.clear();
  }

  private getCacheKey(options: {
    industryId?: string;
    userId?: string;
    brandId?: string;
  }): string {
    return `${options.brandId || ''}_${options.userId || ''}_${options.industryId || ''}_global`;
  }

  private log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[Calibration] ${message}`, ...args);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let serviceInstance: CalibrationService | null = null;

/**
 * Get or create the calibration service instance
 */
export function getCalibrationService(
  config?: Partial<CalibrationConfig>
): CalibrationService {
  if (!serviceInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    serviceInstance = new CalibrationService(supabaseUrl, supabaseKey, config);
  }

  return serviceInstance;
}

/**
 * Quick calibration function for simple use cases
 */
export async function calibrateScore(
  rawScore: number,
  industryId?: string
): Promise<number> {
  const service = getCalibrationService();
  const result = await service.calibrate(rawScore, { industryId });
  return result.calibratedScore;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CalibrationService;
