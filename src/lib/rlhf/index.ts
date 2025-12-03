/**
 * RLHF (Reinforcement Learning from Human Feedback) Module
 *
 * This module provides tools for collecting and processing user feedback
 * to improve AI-generated content and recommendations.
 *
 * @module lib/rlhf
 * @version 1.0.0
 */

// Implicit signals collector (core)
export {
  // Types
  type ImplicitEventType,
  type PageType,
  type ImplicitEvent,
  type ScrollDepthEvent,
  type DwellTimeEvent,
  type ClickEvent,
  type HoverEvent,
  type SignalCollectorConfig,
  // Constants
  DEFAULT_CONFIG,
  // Utilities
  generateSessionId,
  getOrCreateSessionId,
  detectPageType,
  getViewportDimensions,
  calculateScrollDepth,
  getElementIdentifier,
  shouldSample,
  // Class
  ImplicitSignalCollector,
  // Singleton functions
  getSignalCollector,
  initSignalCollector,
  destroySignalCollector,
  // Basic hook (non-React)
  useSignalCollector,
} from './implicit-signals';

// React hooks and components
export {
  // Types
  type UseImplicitSignalsOptions,
  type UseImplicitSignalsReturn,
  type ImplicitSignalsProviderProps,
  // Main hook
  useImplicitSignals,
  // Context
  ImplicitSignalsProvider,
  useImplicitSignalsContext,
  // Utility hooks
  useScrollDepthTracker,
  useElementDwellTime,
} from './useImplicitSignals.js';

// Preference pair constructor (mining)
export {
  // Types
  type PreferenceSource,
  type PreferenceOutcome,
  type PairMiningConfig,
  type AnalysisSignals,
  type PreferencePair,
  type MiningResult,
  // Constants
  DEFAULT_MINING_CONFIG,
  // Utilities
  calculateConfidence,
  isHighQualityPair,
  // Class
  PreferencePairConstructor,
  // Factory
  createPairConstructor,
} from './pair-constructor';

// Reward model (satisfaction prediction)
export {
  // Types
  type AnalysisFeatures,
  type RewardPrediction,
  type RewardFactor,
  type RewardModelVersion,
  type ValidationResult,
  // Constants
  DEFAULT_FEATURE_WEIGHTS,
  SATISFACTION_THRESHOLDS,
  TARGET_ACCURACY,
  // Class
  RewardModel,
  // Factory
  createRewardModel,
} from './reward-model';

// Labeling efficiency tracking
export {
  // Types
  type LabelingEfficiencyMetrics,
  type EfficiencyComparison,
  type LabelingSession,
  type ActiveLearningImpact,
  // Constants
  TARGET_IMPROVEMENT,
  BASELINE_METRICS,
  // Class
  LabelingEfficiencyTracker,
  // Factory
  createLabelingEfficiencyTracker,
} from './labeling-efficiency';
