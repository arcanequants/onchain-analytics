/**
 * AI Behavioral Research Module
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Provides tools for:
 * - Multi-run sampling with confidence intervals
 * - Response drift detection
 * - Model cards and documentation
 * - Position bias mitigation
 * - Confidence calibration tracking
 * - Behavioral fingerprints per provider
 * - Sycophancy detection
 * - Manipulation detection
 * - Capability tracking matrix
 * - Adversarial test suite
 */

// ============================================================================
// MULTI-RUN SAMPLING
// ============================================================================

export {
  executeMultiRunSampling,
  analyzeScores,
  analyzeConsistency,
  findConsensusResponse,
  extractScoreFromResponse,
  getMultiRunSummary,
} from './multi-run-sampling';

export type {
  SamplingConfig,
  RunResult,
  StatisticalAnalysis,
  ConsistencyAnalysis,
  MultiRunResult,
} from './multi-run-sampling';

// ============================================================================
// DRIFT DETECTION
// ============================================================================

export {
  createSnapshot,
  getSnapshots,
  detectDrift,
  quickDriftCheck,
  checkAndAlert,
  getActiveAlerts,
  acknowledgeAlert,
  getDriftSummary,
  hashQuery,
  DRIFT_THRESHOLDS,
} from './drift-detection';

export type {
  ResponseSnapshot,
  ResponseStructure,
  DriftType,
  DriftSignal,
  DriftAnalysis,
  DriftAlert,
} from './drift-detection';

// ============================================================================
// MODEL CARDS
// ============================================================================

export {
  upsertModelCard,
  getModelCard,
  getAllModelCards,
  getModelCardsByProvider,
  initializeDefaultModelCards,
  compareModels,
  renderModelCardMarkdown,
} from './model-card';

export type {
  ModelCard,
  BenchmarkResult,
  InternalTestResult,
  ModelComparison,
} from './model-card';

// ============================================================================
// POSITION BIAS
// ============================================================================

export {
  shuffleArray,
  generateShuffledOrderings,
  detectPositionBias,
  applyDebiasStrategy,
  createDebiasedQuery,
  aggregateDebiasedScores,
  getPositionWeight,
  DEFAULT_POSITION_WEIGHTS,
} from './position-bias';

export type {
  DebiasStrategy,
  PositionBiasResult,
  PositionBiasAnalysis,
} from './position-bias';

// ============================================================================
// CONFIDENCE CALIBRATION
// ============================================================================

export {
  recordConfidenceSample,
  recordBatchSamples,
  getSamples,
  computeCalibrationCurve,
  getProviderCalibration,
  analyzeProviderCalibration,
  generateCalibrationReport,
  applyTemperatureScaling,
  estimateOptimalTemperature,
  getCalibratedConfidence,
  getReliabilityDiagramData,
} from './confidence-calibration';

export type {
  ConfidenceSample,
  CalibrationBin,
  CalibrationCurve,
  ProviderCalibration,
  CalibrationReport,
} from './confidence-calibration';

// ============================================================================
// BEHAVIORAL FINGERPRINTS
// ============================================================================

export {
  recordResponse,
  analyzeResponseStyle,
  analyzeBiasProfile,
  analyzeConsistency as analyzeConsistencyMetrics,
  generateFingerprint,
  compareFingerprints,
  getAllFingerprints,
  getFingerprint,
} from './behavioral-fingerprints';

export type {
  ResponseStyle,
  BiasProfile,
  ConsistencyMetrics,
  ProviderBehavioralFingerprint,
  FingerprintComparison,
} from './behavioral-fingerprints';

// ============================================================================
// SYCOPHANCY DETECTION
// ============================================================================

export {
  detectSycophancyIndicators,
  calculateSeverity,
  compareSycophancyResponses,
  runSycophancyTest,
  recordTestResult,
  analyzeSycophancy,
  generateResistantPrompt,
  generatePushbackQuery,
  SYCOPHANCY_TEST_TEMPLATES,
} from './sycophancy-detection';

export type {
  SycophancyType,
  SeverityLevel,
  SycophancyIndicator,
  SycophancyTestResult,
  SycophancyAnalysis,
} from './sycophancy-detection';

// ============================================================================
// MANIPULATION DETECTION
// ============================================================================

export {
  analyzeSourceCredibility,
  detectTextManipulation,
  detectSemanticInjection,
  detectTemporalGaming,
  detectScoreAnomalies,
  analyzeForManipulation,
} from './manipulation-detection';

export type {
  ManipulationType,
  ThreatLevel,
  ManipulationIndicator,
  SourceCredibility,
  ManipulationDetectionResult,
  AnomalyPattern,
} from './manipulation-detection';

// ============================================================================
// CAPABILITY MATRIX
// ============================================================================

export {
  getProfile as getCapabilityProfile,
  getAllProfiles as getAllCapabilityProfiles,
  updateCapability,
  compareModels as compareModelCapabilities,
  findBestModel,
  getCapabilityMatrix,
  getCapabilityScore,
  getRoutingRecommendation,
} from './capability-matrix';

export type {
  CapabilityDomain,
  CapabilityScore,
  ModelCapabilityProfile,
  CapabilityRequirement,
  CapabilityComparison,
} from './capability-matrix';

// ============================================================================
// ADVERSARIAL TESTS
// ============================================================================

export {
  executeTest as executeAdversarialTest,
  executeTestSuite,
  createTestCase,
  generateTestVariations,
  generateBrandTests,
  compareProviderResults,
  getTestsBySeverity,
  getTestsByCategory,
  generateTestReport,
  ADVERSARIAL_TEST_CASES,
} from './adversarial-tests';

export type {
  AdversarialCategory,
  TestSeverity,
  TestStatus,
  AdversarialTestCase,
  TestResult,
  TestSuiteResult,
} from './adversarial-tests';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

import { executeMultiRunSampling, type SamplingConfig, type MultiRunResult } from './multi-run-sampling';
import { createSnapshot, detectDrift, quickDriftCheck, type DriftAnalysis } from './drift-detection';
import { initializeDefaultModelCards, getAllModelCards, compareModels, type ModelCard } from './model-card';

/**
 * Initialize behavioral research module
 */
export function initializeBehavioralResearch(): void {
  initializeDefaultModelCards();
}

/**
 * Run behavioral analysis on a query
 */
export async function runBehavioralAnalysis(
  provider: string,
  query: string,
  options?: Partial<SamplingConfig>
): Promise<{
  sampling: MultiRunResult;
  drift: DriftAnalysis;
}> {
  // Run multi-run sampling
  const sampling = await executeMultiRunSampling(query, {
    numRuns: options?.numRuns || 5,
    temperature: options?.temperature || 0.7,
    provider,
    ...options,
  });

  // Create snapshots from runs
  for (const run of sampling.runs.filter(r => !r.error)) {
    createSnapshot(provider, query, run.responseText, run.score);
  }

  // Check for drift
  const drift = quickDriftCheck(
    sampling.runs[0]?.responseText ? `q_${query.substring(0, 20)}` : 'unknown',
    provider
  );

  return { sampling, drift };
}

/**
 * Get behavioral research dashboard data
 */
export function getBehavioralDashboard(): {
  models: ModelCard[];
  activeAlerts: number;
  totalSnapshots: number;
} {
  const models = getAllModelCards();
  const { getActiveAlerts } = require('./drift-detection');
  const alerts = getActiveAlerts();

  return {
    models,
    activeAlerts: alerts.length,
    totalSnapshots: 0, // Would query from storage
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Initialization
  initializeBehavioralResearch,

  // Analysis
  runBehavioralAnalysis,
  executeMultiRunSampling,
  detectDrift,
  quickDriftCheck,

  // Model Cards
  getAllModelCards,
  compareModels,

  // Dashboard
  getBehavioralDashboard,
};
