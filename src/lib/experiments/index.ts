/**
 * Experiments Module
 *
 * A/B testing framework for prompt experiments.
 * Includes variant assignment, event tracking, and statistical analysis.
 *
 * @module lib/experiments
 * @version 1.0.0
 */

// A/B Test Service
export {
  // Types
  type ExperimentStatus,
  type VariantConfig,
  type GuardrailMetric,
  type TargetingRules,
  type Experiment,
  type ExperimentResult,
  type VariantMetrics,
  type ExperimentAssignment,
  type ExperimentEvent,
  type AssignmentContext,
  type CreateExperimentOptions,
  type ABTestServiceConfig,
  // Constants
  DEFAULT_MIN_SAMPLE_SIZE,
  DEFAULT_SIGNIFICANCE_THRESHOLD,
  DEFAULT_TRAFFIC_PERCENTAGE,
  DEFAULT_CACHE_TTL_MS,
  EVENT_TYPES,
  PROMPT_TYPES,
  // Class
  ABTestService,
  // Factory functions
  getABTestService,
  initABTestService,
  destroyABTestService,
} from './ab-test';

// Statistical Analysis
export {
  // Types
  type VariantData,
  type StatisticalTestResult,
  type SampleSizeResult,
  type ExperimentAnalysis,
  // Statistical functions
  normalCDF,
  zToPValue,
  pValueToZ,
  proportionZTest,
  welchTTest,
  // Sample size calculations
  sampleSizeForProportion,
  sampleSizeForContinuous,
  estimateDaysToSample,
  // Experiment analysis
  analyzeExperiment,
  // Utilities
  updateRunningStats,
  interpretEffectSize,
  checkGuardrails,
} from './analysis';
