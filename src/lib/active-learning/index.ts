/**
 * Active Learning Module
 *
 * Provides intelligent sample selection for human labeling
 * to maximize model improvement with minimal labeling effort.
 *
 * @module lib/active-learning
 * @version 1.0.0
 */

// Sample selector
export {
  // Types
  type SelectionStrategy,
  type SampleCandidate,
  type LabeledSample,
  type SelectionBatch,
  type SampleSelectorConfig,
  type SelectionQuery,
  // Constants
  DEFAULT_BATCH_SIZE,
  DEFAULT_UNCERTAINTY_THRESHOLD,
  DEFAULT_WEIGHTS,
  DIVERSITY_FEATURES,
  // Class
  SampleSelector,
  // Factory functions
  getSampleSelector,
  initSampleSelector,
  destroySampleSelector,
} from './sample-selector';
