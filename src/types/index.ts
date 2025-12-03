/**
 * Type Exports
 *
 * Central export point for all application types
 * Phase 1, Week 1, Day 5
 */

// Database types generated from Supabase schema
export * from './database.types';

// Re-import Database for the utility types
import type { Database } from './database.types';

// Import types needed for composite types
import type { AIProvider as AIProviderType, Chain as ChainType, GasStatus as GasStatusType } from './enums';

// ================================================================
// UTILITY TYPES
// ================================================================

/** JSON type for JSONB columns */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Extract the Row type from a table */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Extract the Insert type from a table */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Extract the Update type from a table */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// ================================================================
// AI PERCEPTION ENTITY TYPES
// ================================================================

/** Analysis record - main entity */
export type Analysis = TableRow<'analyses'>;
export type AnalysisInsert = TableInsert<'analyses'>;
export type AnalysisUpdate = TableUpdate<'analyses'>;

/** AI provider response */
export type AIResponse = TableRow<'ai_responses'>;
export type AIResponseInsert = TableInsert<'ai_responses'>;

/** User profile (extends auth.users) */
export type UserProfile = TableRow<'user_profiles'>;
export type UserProfileInsert = TableInsert<'user_profiles'>;
export type UserProfileUpdate = TableUpdate<'user_profiles'>;

/** Industry taxonomy */
export type Industry = TableRow<'industries'>;

/** Detected competitor */
export type Competitor = TableRow<'competitors'>;
export type CompetitorInsert = TableInsert<'competitors'>;

/** Actionable recommendation */
export type Recommendation = TableRow<'recommendations'>;
export type RecommendationInsert = TableInsert<'recommendations'>;
export type RecommendationUpdate = TableUpdate<'recommendations'>;

/** Subscription billing */
export type AISubscription = TableRow<'ai_subscriptions'>;

/** Monthly usage tracking */
export type UsageTracking = TableRow<'usage_tracking'>;

/** Hallucination report */
export type HallucinationReport = TableRow<'hallucination_reports'>;
export type HallucinationReportInsert = TableInsert<'hallucination_reports'>;

/** Daily cost tracking */
export type ApiCostTracking = TableRow<'api_cost_tracking'>;

/** Daily cost summary */
export type DailyCostSummary = TableRow<'daily_cost_summary'>;

// ================================================================
// ON-CHAIN ANALYTICS ENTITY TYPES
// ================================================================

/** Gas price record */
export type GasPrice = TableRow<'gas_prices'>;
export type GasPriceInsert = TableInsert<'gas_prices'>;

/** CRON job execution log */
export type CronExecution = TableRow<'cron_executions'>;
export type CronExecutionInsert = TableInsert<'cron_executions'>;

/** Fear & Greed Index */
export type FearGreedIndex = TableRow<'fear_greed_index'>;

/** Crypto event */
export type Event = TableRow<'events'>;
export type EventInsert = TableInsert<'events'>;

/** User-submitted event */
export type EventSubmission = TableRow<'event_submissions'>;
export type EventSubmissionInsert = TableInsert<'event_submissions'>;

/** Token price data */
export type TokenPrice = TableRow<'token_prices'>;

/** Historical token price */
export type TokenPriceHistory = TableRow<'token_price_history'>;

/** Trending coin */
export type TrendingCoin = TableRow<'trending_coins'>;

/** Wallet balance */
export type WalletBalance = TableRow<'wallet_balances'>;

/** Wallet transaction history */
export type WalletHistory = TableRow<'wallet_history'>;

/** Tracked wallet */
export type TrackedWallet = TableRow<'tracked_wallets'>;

/** Wallet NFT */
export type WalletNFT = TableRow<'wallet_nfts'>;

/** DEX volume */
export type DexVolume = TableRow<'dex_volumes'>;

/** Protocol TVL */
export type ProtocolTVL = TableRow<'protocol_tvl'>;

/** Analytics event */
export type AnalyticsEvent = TableRow<'analytics_events'>;

/** Backfill job */
export type BackfillJob = TableRow<'backfill_jobs'>;

// ================================================================
// CANONICAL ENUM TYPES
// Re-exported from enums.ts for backwards compatibility
// See /supabase/migrations/20251130_canonical_enums.sql for DB enums
// ================================================================

export {
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
} from './enums';

export type {
  AIProvider,
  AIQueryType,
  AnalysisStatus,
  SentimentLabel,
  SeverityLevel,
  PriorityLevel,
  EffortLevel,
  SubscriptionTier,
  SubscriptionStatus,
  BillingInterval,
  CompanySize,
  CompetitorTier,
  RecommendationCategory,
  HallucinationType,
  ReviewStatus,
  CertaintyLevel,
  ScoreGrade,
  ScoreCategory,
  EntityType,
  Chain,
  GasStatus,
  FearGreedClassification,
  EventType,
  EventStatus,
  EventImportance,
  SubmissionStatus,
  BackfillJobType,
  BackfillStatus,
  CronStatus,
} from './enums';

// Legacy type aliases for backwards compatibility
/** @deprecated Use AIQueryType instead */
export type QueryType = 'recommendation' | 'comparison' | 'sentiment' | 'authority' | 'features';
/** @deprecated Use PriorityLevel instead */
export type RecommendationPriority = 'high' | 'medium' | 'low';
/** @deprecated Use ReviewStatus instead */
export type HallucinationStatus = 'pending' | 'confirmed' | 'rejected' | 'fixed';

// ================================================================
// COMPOSITE TYPES
// ================================================================

/** Score breakdown for analysis */
export interface ScoreBreakdown {
  visibility: number;
  sentiment: number;
  authority: number;
  recency: number;
}

/** Parsed AI response structure */
export interface ParsedAIResponse {
  mentionsBrand: boolean;
  position?: number;
  competitors: string[];
  sentiment: number;
  rawText: string;
}

/** Seasonality factors for industries */
export interface SeasonalityFactors {
  Q1?: number;
  Q2?: number;
  Q3?: number;
  Q4?: number;
}

/** CRON execution metadata */
export interface CronMetadata {
  recordsProcessed?: number;
  recordsFailed?: number;
  duration?: number;
  error?: string;
  [key: string]: unknown;
}

// ================================================================
// API RESPONSE TYPES
// ================================================================

/** Standard API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

/** Paginated response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** Analysis result summary */
export interface AnalysisResult {
  id: string;
  url: string;
  brandName: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown;
  confidenceScore: number;
  competitors: Competitor[];
  recommendations: Recommendation[];
  providers: AIProviderType[];
  processingTimeMs: number;
  createdAt: string;
  completedAt: string;
}

/** Gas tracker response */
export interface GasTrackerData {
  chain: ChainType;
  gasPrice: number;
  baseFee: number;
  priorityFee: number;
  status: GasStatusType;
  blockNumber: number;
  updatedAt: string;
}

/** Token price with change data */
export interface TokenPriceWithChanges {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  priceChangePercentage30d: number;
  marketCap: number;
  marketCapRank: number;
  volume24h: number;
  image: string;
  lastUpdated: string;
}
