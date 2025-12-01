/**
 * Canonical Enum Types
 *
 * Type-safe enum definitions matching PostgreSQL ENUM types
 * These mirror the database enums defined in:
 * /supabase/migrations/20251130_canonical_enums.sql
 *
 * Phase 3, Week 10 - Semantic Audit
 */

// ================================================================
// AI PROVIDER ENUMS
// ================================================================

/**
 * Supported AI/LLM providers for analysis queries
 * @database ai_provider
 */
export const AI_PROVIDERS = ['openai', 'anthropic', 'google', 'perplexity'] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

/**
 * Types of queries sent to AI providers for brand analysis
 * @database ai_query_type
 */
export const AI_QUERY_TYPES = [
  'recommendation',
  'comparison',
  'sentiment',
  'authority',
  'features',
  'ranking',
  'review',
  'use_case',
  'alternatives',
  'evaluation',
] as const;
export type AIQueryType = (typeof AI_QUERY_TYPES)[number];

// ================================================================
// ANALYSIS STATUS ENUMS
// ================================================================

/**
 * Lifecycle states for brand perception analyses
 * @database analysis_status
 */
export const ANALYSIS_STATUSES = [
  'pending',
  'validating',
  'querying',
  'processing',
  'aggregating',
  'completed',
  'failed',
  'expired',
  'cancelled',
] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

// ================================================================
// SENTIMENT ENUMS
// ================================================================

/**
 * Categorical sentiment classification for text analysis
 * @database sentiment_label
 */
export const SENTIMENT_LABELS = [
  'very_positive',
  'positive',
  'neutral',
  'negative',
  'very_negative',
  'mixed',
] as const;
export type SentimentLabel = (typeof SENTIMENT_LABELS)[number];

// ================================================================
// SEVERITY / PRIORITY ENUMS
// ================================================================

/**
 * Severity levels for issues, alerts, and recommendations
 * @database severity_level
 */
export const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info'] as const;
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

/**
 * Priority levels for recommendations and action items
 * @database priority_level
 */
export const PRIORITY_LEVELS = ['urgent', 'high', 'medium', 'low'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/**
 * Effort estimation for implementing recommendations
 * @database effort_level
 */
export const EFFORT_LEVELS = ['quick_win', 'moderate', 'significant', 'major'] as const;
export type EffortLevel = (typeof EFFORT_LEVELS)[number];

// ================================================================
// SUBSCRIPTION ENUMS
// ================================================================

/**
 * Subscription plan tiers for billing
 * @database subscription_tier
 */
export const SUBSCRIPTION_TIERS = ['free', 'starter', 'pro', 'enterprise'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

/**
 * Payment/subscription status states
 * @database subscription_status
 */
export const SUBSCRIPTION_STATUSES = [
  'active',
  'trialing',
  'past_due',
  'cancelled',
  'paused',
  'unpaid',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/**
 * Billing frequency for subscriptions
 * @database billing_interval
 */
export const BILLING_INTERVALS = ['month', 'year'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

// ================================================================
// COMPANY ENUMS
// ================================================================

/**
 * Company size categories for user profiles
 * @database company_size
 */
export const COMPANY_SIZES = [
  'solo',
  'small', // 2-10
  'medium', // 11-50
  'large', // 51-200
  'enterprise', // 201-1000
  'corporate', // 1000+
] as const;
export type CompanySize = (typeof COMPANY_SIZES)[number];

/**
 * Competitor classification by market segment
 * @database competitor_tier
 */
export const COMPETITOR_TIERS = [
  'enterprise',
  'mid_market',
  'smb',
  'local',
  'startup',
] as const;
export type CompetitorTier = (typeof COMPETITOR_TIERS)[number];

// ================================================================
// RECOMMENDATION ENUMS
// ================================================================

/**
 * Categories for AI perception improvement recommendations
 * @database recommendation_category
 */
export const RECOMMENDATION_CATEGORIES = [
  'content',
  'technical_seo',
  'authority',
  'entity_seo',
  'citations',
  'social_proof',
  'structured_data',
  'brand_mentions',
  'visibility',
  'competitive',
] as const;
export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

// ================================================================
// HALLUCINATION ENUMS
// ================================================================

/**
 * Types of AI hallucinations/errors detected
 * @database hallucination_type
 */
export const HALLUCINATION_TYPES = [
  'factual_error',
  'outdated_info',
  'fabricated_entity',
  'wrong_attribution',
  'contradictory',
  'exaggeration',
  'other',
] as const;
export type HallucinationType = (typeof HALLUCINATION_TYPES)[number];

/**
 * Status states for content/report reviews
 * @database review_status
 */
export const REVIEW_STATUSES = [
  'pending',
  'in_review',
  'confirmed',
  'rejected',
  'fixed',
  'wont_fix',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

// ================================================================
// CERTAINTY / CONFIDENCE ENUMS
// ================================================================

/**
 * Certainty/confidence levels for NLP text analysis
 * @database certainty_level
 */
export const CERTAINTY_LEVELS = [
  'very_high',
  'high',
  'medium',
  'low',
  'very_low',
  'uncertain',
] as const;
export type CertaintyLevel = (typeof CERTAINTY_LEVELS)[number];

// ================================================================
// SCORE ENUMS
// ================================================================

/**
 * Grade classification for perception scores (0-100 scale)
 * @database score_grade
 */
export const SCORE_GRADES = [
  'excellent', // 80-100
  'good', // 60-79
  'average', // 40-59
  'poor', // 20-39
  'critical', // 0-19
] as const;
export type ScoreGrade = (typeof SCORE_GRADES)[number];

/**
 * Score breakdown categories for perception analysis
 * @database score_category
 */
export const SCORE_CATEGORIES = [
  'visibility',
  'sentiment',
  'authority',
  'relevance',
  'competitive',
  'coverage',
  'recency',
  'consistency',
] as const;
export type ScoreCategory = (typeof SCORE_CATEGORIES)[number];

// ================================================================
// ENTITY ENUMS
// ================================================================

/**
 * Types of entities detected in text analysis
 * @database entity_type
 */
export const ENTITY_TYPES = [
  'organization',
  'product',
  'service',
  'person',
  'brand',
  'location',
  'event',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

// ================================================================
// ON-CHAIN ANALYTICS ENUMS (existing, not in PostgreSQL ENUMs yet)
// ================================================================

/**
 * Supported blockchain networks
 */
export const CHAINS = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'] as const;
export type Chain = (typeof CHAINS)[number];

/**
 * Gas price status levels
 */
export const GAS_STATUSES = ['low', 'medium', 'high'] as const;
export type GasStatus = (typeof GAS_STATUSES)[number];

/**
 * Fear & Greed classification
 */
export const FEAR_GREED_CLASSIFICATIONS = [
  'extreme_fear',
  'fear',
  'neutral',
  'greed',
  'extreme_greed',
] as const;
export type FearGreedClassification = (typeof FEAR_GREED_CLASSIFICATIONS)[number];

/**
 * Event types
 */
export const EVENT_TYPES = [
  'unlock',
  'airdrop',
  'listing',
  'mainnet',
  'upgrade',
  'halving',
  'hardfork',
  'conference',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/**
 * Event status
 */
export const EVENT_STATUSES = ['upcoming', 'ongoing', 'completed', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/**
 * Event importance level
 */
export const EVENT_IMPORTANCES = ['low', 'medium', 'high', 'critical'] as const;
export type EventImportance = (typeof EVENT_IMPORTANCES)[number];

/**
 * Submission status
 */
export const SUBMISSION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

/**
 * Backfill job types
 */
export const BACKFILL_JOB_TYPES = ['gas_prices', 'fear_greed', 'events'] as const;
export type BackfillJobType = (typeof BACKFILL_JOB_TYPES)[number];

/**
 * Backfill job status
 */
export const BACKFILL_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;
export type BackfillStatus = (typeof BACKFILL_STATUSES)[number];

/**
 * CRON execution status
 */
export const CRON_STATUSES = ['running', 'success', 'failure'] as const;
export type CronStatus = (typeof CRON_STATUSES)[number];

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Check if a value is a valid enum value
 */
export function isValidEnumValue<T extends readonly string[]>(
  values: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

/**
 * Get score grade from numeric score
 */
export function getScoreGrade(score: number): ScoreGrade {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  if (score >= 20) return 'poor';
  return 'critical';
}

/**
 * Get sentiment label from numeric score (-1 to 1)
 */
export function getSentimentLabel(score: number): SentimentLabel {
  if (score >= 0.6) return 'very_positive';
  if (score >= 0.2) return 'positive';
  if (score > -0.2) return 'neutral';
  if (score > -0.6) return 'negative';
  return 'very_negative';
}

/**
 * Get certainty level from score (0 to 1)
 */
export function getCertaintyLevel(score: number): CertaintyLevel {
  if (score >= 0.9) return 'very_high';
  if (score >= 0.7) return 'high';
  if (score >= 0.5) return 'medium';
  if (score >= 0.3) return 'low';
  if (score >= 0.1) return 'very_low';
  return 'uncertain';
}

/**
 * Map company size to employee count range
 */
export const COMPANY_SIZE_RANGES: Record<CompanySize, { min: number; max: number | null }> = {
  solo: { min: 1, max: 1 },
  small: { min: 2, max: 10 },
  medium: { min: 11, max: 50 },
  large: { min: 51, max: 200 },
  enterprise: { min: 201, max: 1000 },
  corporate: { min: 1001, max: null },
};

/**
 * Get company size from employee count
 */
export function getCompanySize(employeeCount: number): CompanySize {
  if (employeeCount <= 1) return 'solo';
  if (employeeCount <= 10) return 'small';
  if (employeeCount <= 50) return 'medium';
  if (employeeCount <= 200) return 'large';
  if (employeeCount <= 1000) return 'enterprise';
  return 'corporate';
}

// ================================================================
// ENUM MAPS FOR DISPLAY
// ================================================================

/**
 * Human-readable labels for AI providers
 */
export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
  perplexity: 'Perplexity',
};

/**
 * Human-readable labels for subscription tiers
 */
export const SUBSCRIPTION_TIER_LABELS: Record<SubscriptionTier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Professional',
  enterprise: 'Enterprise',
};

/**
 * Human-readable labels for severity levels
 */
export const SEVERITY_LEVEL_LABELS: Record<SeverityLevel, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Informational',
};

/**
 * Human-readable labels for sentiment
 */
export const SENTIMENT_LABEL_DISPLAY: Record<SentimentLabel, string> = {
  very_positive: 'Very Positive',
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
  very_negative: 'Very Negative',
  mixed: 'Mixed',
};

/**
 * Colors for sentiment labels (Tailwind classes)
 */
export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  very_positive: 'text-green-600 bg-green-100',
  positive: 'text-green-500 bg-green-50',
  neutral: 'text-gray-600 bg-gray-100',
  negative: 'text-red-500 bg-red-50',
  very_negative: 'text-red-600 bg-red-100',
  mixed: 'text-yellow-600 bg-yellow-100',
};

/**
 * Colors for score grades (Tailwind classes)
 */
export const SCORE_GRADE_COLORS: Record<ScoreGrade, string> = {
  excellent: 'text-green-600 bg-green-100',
  good: 'text-blue-600 bg-blue-100',
  average: 'text-yellow-600 bg-yellow-100',
  poor: 'text-orange-600 bg-orange-100',
  critical: 'text-red-600 bg-red-100',
};

/**
 * Colors for severity levels (Tailwind classes)
 */
export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  critical: 'text-red-700 bg-red-100',
  high: 'text-red-500 bg-red-50',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-blue-500 bg-blue-50',
  info: 'text-gray-500 bg-gray-100',
};

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default {
  // Const arrays
  AI_PROVIDERS,
  AI_QUERY_TYPES,
  ANALYSIS_STATUSES,
  SENTIMENT_LABELS,
  SEVERITY_LEVELS,
  PRIORITY_LEVELS,
  EFFORT_LEVELS,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES,
  BILLING_INTERVALS,
  COMPANY_SIZES,
  COMPETITOR_TIERS,
  RECOMMENDATION_CATEGORIES,
  HALLUCINATION_TYPES,
  REVIEW_STATUSES,
  CERTAINTY_LEVELS,
  SCORE_GRADES,
  SCORE_CATEGORIES,
  ENTITY_TYPES,
  CHAINS,
  GAS_STATUSES,
  FEAR_GREED_CLASSIFICATIONS,
  EVENT_TYPES,
  EVENT_STATUSES,
  EVENT_IMPORTANCES,
  SUBMISSION_STATUSES,
  BACKFILL_JOB_TYPES,
  BACKFILL_STATUSES,
  CRON_STATUSES,

  // Helper functions
  isValidEnumValue,
  getScoreGrade,
  getSentimentLabel,
  getCertaintyLevel,
  getCompanySize,

  // Display maps
  AI_PROVIDER_LABELS,
  SUBSCRIPTION_TIER_LABELS,
  SEVERITY_LEVEL_LABELS,
  SENTIMENT_LABEL_DISPLAY,
  SENTIMENT_COLORS,
  SCORE_GRADE_COLORS,
  SEVERITY_COLORS,
  COMPANY_SIZE_RANGES,
};
