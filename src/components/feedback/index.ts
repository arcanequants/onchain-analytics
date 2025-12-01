/**
 * Feedback Components
 *
 * UI components for collecting user feedback for RLHF training
 * and score calibration.
 *
 * @module components/feedback
 * @version 1.0.0
 */

// Score feedback (thumbs, ratings, corrections)
export {
  ScoreFeedback,
  RecommendationFeedback,
  type FeedbackType,
  type FeedbackTarget,
  type FeedbackData,
  type ScoreFeedbackProps,
  type RecommendationFeedbackProps,
} from './ScoreFeedback';

// Outcome tracking (comparisons, calibration)
export {
  PreferenceComparison,
  CalibrationFeedbackForm,
  OutcomeHistory,
  type AnalysisSummary,
  type ComparisonOutcome,
  type CalibrationOutcome,
  type PreferenceComparisonProps,
  type CalibrationFeedbackProps,
  type OutcomeHistoryProps,
} from './OutcomeTracking';

// Competitor validation
export {
  CompetitorValidation,
  type DetectedCompetitor,
  type CompetitorValidation as CompetitorValidationType,
  type MissingCompetitor,
  type CompetitorValidationResult,
  type CompetitorValidationProps,
} from './CompetitorValidation';

// Hallucination reporting
export {
  HallucinationReport,
  SingleStatementReport,
  type HallucinationType,
  type AIStatement,
  type HallucinationCorrection,
  type HallucinationReportResult,
  type HallucinationReportProps,
  type SingleStatementReportProps,
} from './HallucinationReport';

// Recommendation outcome tracking
export {
  RecommendationResponse,
  OutcomeFollowUp,
  type InitialResponse,
  type OutcomeImpact,
  type Recommendation,
  type OutcomeData,
  type RecommendationResponseProps,
  type OutcomeFollowUpProps,
} from './RecommendationOutcome';
