/**
 * Scoring Module
 *
 * Provides score calculation, calibration, and normalization services.
 *
 * @module lib/scoring
 * @version 1.0.0
 */

// Calibration service
export {
  // Types
  type CalibrationScope,
  type CalibrationCurve,
  type CalibrationPoint,
  type CalibrationFeedback,
  type CalibrationResult,
  type CalibrationConfig,
  // Constants
  DEFAULT_CALIBRATION_CONFIG,
  // Utilities
  applyPolynomialCalibration,
  applyPiecewiseCalibration,
  createIdentityCurve,
  calculateCalibrationMetrics,
  fitPolynomialCoefficients,
  // Class
  CalibrationService,
  // Factory
  getCalibrationService,
  calibrateScore,
} from './calibration';
