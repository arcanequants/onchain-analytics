/**
 * Supabase Database Types
 *
 * Phase 1, Week 1, Day 1
 * Auto-generated types based on database schema
 * File: supabase/migrations/20251127_ai_perception_core.sql
 *
 * Usage:
 * - Import specific table types: import type { Analysis, UserProfile } from '@/lib/database/types'
 * - Use with Supabase client for type-safe queries
 */

// ================================================================
// ENUMS
// ================================================================

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | 'unpaid' | 'paused';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';
export type QueryType = 'recommendation' | 'comparison' | 'sentiment' | 'authority' | 'features';

export type RecommendationCategory = 'content' | 'technical' | 'authority' | 'visibility' | 'competitive';
export type RecommendationPriority = 'high' | 'medium' | 'low';
export type EffortLevel = 'quick-win' | 'moderate' | 'significant';

export type CompetitorTier = 'enterprise' | 'mid-market' | 'smb' | 'local';

export type HallucinationType =
  | 'factual_error'
  | 'outdated_info'
  | 'fabricated_entity'
  | 'wrong_attribution'
  | 'contradictory'
  | 'other';
export type HallucinationStatus = 'pending' | 'confirmed' | 'rejected' | 'fixed';

export type BillingInterval = 'month' | 'year';

// ================================================================
// TABLE: user_profiles
// ================================================================

export interface UserProfile {
  id: string; // UUID, references auth.users
  email: string;
  full_name: string | null;
  company_name: string | null;
  company_url: string | null;
  industry: string | null;
  company_size: CompanySize | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
  analyses_used_this_month: number;
  analyses_limit: number;
  created_at: string; // ISO timestamp
  updated_at: string;
}

export interface UserProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  company_name?: string | null;
  company_url?: string | null;
  industry?: string | null;
  company_size?: CompanySize | null;
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  stripe_customer_id?: string | null;
  analyses_used_this_month?: number;
  analyses_limit?: number;
}

export interface UserProfileUpdate {
  email?: string;
  full_name?: string | null;
  company_name?: string | null;
  company_url?: string | null;
  industry?: string | null;
  company_size?: CompanySize | null;
  subscription_tier?: SubscriptionTier;
  subscription_status?: SubscriptionStatus;
  stripe_customer_id?: string | null;
  analyses_used_this_month?: number;
  analyses_limit?: number;
}

// ================================================================
// TABLE: industries
// ================================================================

export interface Industry {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  keywords: string[] | null;
  regulatory_context: string[] | null;
  seasonality_factors: Record<string, unknown> | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface IndustryInsert {
  slug: string;
  name: string;
  parent_id?: string | null;
  description?: string | null;
  keywords?: string[] | null;
  regulatory_context?: string[] | null;
  seasonality_factors?: Record<string, unknown> | null;
  is_active?: boolean;
  display_order?: number;
}

// ================================================================
// TABLE: analyses
// ================================================================

export interface ScoreBreakdown {
  visibility: number;
  sentiment: number;
  authority: number;
  recency: number;
}

export interface Analysis {
  id: string;
  user_id: string | null;
  url: string;
  brand_name: string;
  industry_id: string | null;
  status: AnalysisStatus;
  overall_score: number | null;
  score_breakdown: ScoreBreakdown | null;
  confidence_score: number | null;
  providers_queried: AIProvider[];
  total_tokens_used: number;
  total_cost_usd: number;
  processing_time_ms: number | null;
  share_token: string | null;
  is_public: boolean;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
}

export interface AnalysisInsert {
  user_id?: string | null;
  url: string;
  brand_name: string;
  industry_id?: string | null;
  status?: AnalysisStatus;
  overall_score?: number | null;
  score_breakdown?: ScoreBreakdown | null;
  confidence_score?: number | null;
  providers_queried?: AIProvider[];
  total_tokens_used?: number;
  total_cost_usd?: number;
  processing_time_ms?: number | null;
  share_token?: string | null;
  is_public?: boolean;
  expires_at?: string | null;
}

export interface AnalysisUpdate {
  status?: AnalysisStatus;
  overall_score?: number | null;
  score_breakdown?: ScoreBreakdown | null;
  confidence_score?: number | null;
  providers_queried?: AIProvider[];
  total_tokens_used?: number;
  total_cost_usd?: number;
  processing_time_ms?: number | null;
  share_token?: string | null;
  is_public?: boolean;
  completed_at?: string | null;
  expires_at?: string | null;
}

// ================================================================
// TABLE: ai_responses
// ================================================================

export interface AIResponse {
  id: string;
  analysis_id: string;
  provider: AIProvider;
  model: string;
  model_version: string | null;
  prompt_template: string;
  prompt_variables: Record<string, unknown> | null;
  query_type: QueryType;
  raw_response: string;
  parsed_response: Record<string, unknown>;
  mentions_brand: boolean;
  sentiment_score: number | null;
  position_in_list: number | null;
  competitors_mentioned: string[] | null;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  latency_ms: number | null;
  was_cached: boolean;
  cache_key: string | null;
  retry_count: number;
  error_message: string | null;
  created_at: string;
}

export interface AIResponseInsert {
  analysis_id: string;
  provider: AIProvider;
  model: string;
  model_version?: string | null;
  prompt_template: string;
  prompt_variables?: Record<string, unknown> | null;
  query_type: QueryType;
  raw_response: string;
  parsed_response: Record<string, unknown>;
  mentions_brand?: boolean;
  sentiment_score?: number | null;
  position_in_list?: number | null;
  competitors_mentioned?: string[] | null;
  tokens_input?: number;
  tokens_output?: number;
  cost_usd?: number;
  latency_ms?: number | null;
  was_cached?: boolean;
  cache_key?: string | null;
  retry_count?: number;
  error_message?: string | null;
}

// ================================================================
// TABLE: competitors
// ================================================================

export interface Competitor {
  id: string;
  analysis_id: string;
  name: string;
  url: string | null;
  mention_count: number;
  average_position: number | null;
  sentiment_score: number | null;
  mentioned_by_providers: AIProvider[];
  tier: CompetitorTier | null;
  created_at: string;
}

export interface CompetitorInsert {
  analysis_id: string;
  name: string;
  url?: string | null;
  mention_count?: number;
  average_position?: number | null;
  sentiment_score?: number | null;
  mentioned_by_providers?: AIProvider[];
  tier?: CompetitorTier | null;
}

// ================================================================
// TABLE: recommendations
// ================================================================

export interface Recommendation {
  id: string;
  analysis_id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  estimated_score_impact: number | null;
  effort_level: EffortLevel | null;
  is_dismissed: boolean;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface RecommendationInsert {
  analysis_id: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  title: string;
  description: string;
  estimated_score_impact?: number | null;
  effort_level?: EffortLevel | null;
  is_dismissed?: boolean;
  is_completed?: boolean;
}

export interface RecommendationUpdate {
  is_dismissed?: boolean;
  is_completed?: boolean;
  completed_at?: string | null;
}

// ================================================================
// TABLE: ai_subscriptions
// ================================================================

export interface AISubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  plan_tier: Exclude<SubscriptionTier, 'free'>;
  billing_interval: BillingInterval;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AISubscriptionInsert {
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  plan_tier: Exclude<SubscriptionTier, 'free'>;
  billing_interval: BillingInterval;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  trial_end?: string | null;
  cancel_at_period_end?: boolean;
}

export interface AISubscriptionUpdate {
  status?: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  trial_end?: string | null;
  cancel_at_period_end?: boolean;
  cancelled_at?: string | null;
}

// ================================================================
// TABLE: usage_tracking
// ================================================================

export interface UsageTracking {
  id: string;
  user_id: string;
  period_start: string; // DATE
  period_end: string; // DATE
  analyses_count: number;
  ai_calls_count: number;
  total_tokens: number;
  total_cost_usd: number;
  analyses_limit: number;
  created_at: string;
  updated_at: string;
}

export interface UsageTrackingInsert {
  user_id: string;
  period_start: string;
  period_end: string;
  analyses_count?: number;
  ai_calls_count?: number;
  total_tokens?: number;
  total_cost_usd?: number;
  analyses_limit: number;
}

// ================================================================
// TABLE: hallucination_reports
// ================================================================

export interface HallucinationReport {
  id: string;
  ai_response_id: string;
  reported_by: string | null;
  hallucination_type: HallucinationType;
  description: string;
  evidence_url: string | null;
  status: HallucinationStatus;
  reviewed_at: string | null;
  reviewed_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface HallucinationReportInsert {
  ai_response_id: string;
  reported_by?: string | null;
  hallucination_type: HallucinationType;
  description: string;
  evidence_url?: string | null;
  status?: HallucinationStatus;
}

// ================================================================
// TABLE: api_cost_tracking
// ================================================================

export interface APICostTracking {
  id: string;
  date: string; // DATE
  provider: AIProvider;
  model: string;
  total_requests: number;
  total_tokens_input: number;
  total_tokens_output: number;
  total_cost_usd: number;
  cache_hits: number;
  cache_misses: number;
  created_at: string;
}

export interface APICostTrackingInsert {
  date: string;
  provider: AIProvider;
  model: string;
  total_requests?: number;
  total_tokens_input?: number;
  total_tokens_output?: number;
  total_cost_usd?: number;
  cache_hits?: number;
  cache_misses?: number;
}

// ================================================================
// TABLE: daily_cost_summary
// ================================================================

export interface DailyCostSummary {
  id: string;
  date: string; // DATE
  total_analyses: number;
  total_ai_calls: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_cost_per_analysis: number | null;
  avg_tokens_per_analysis: number | null;
  cache_hit_rate: number | null;
  daily_budget_usd: number;
  budget_remaining_usd: number | null;
  is_over_budget: boolean;
  created_at: string;
}

// ================================================================
// SUPABASE DATABASE TYPE
// ================================================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: UserProfileInsert;
        Update: UserProfileUpdate;
      };
      industries: {
        Row: Industry;
        Insert: IndustryInsert;
        Update: Partial<IndustryInsert>;
      };
      analyses: {
        Row: Analysis;
        Insert: AnalysisInsert;
        Update: AnalysisUpdate;
      };
      ai_responses: {
        Row: AIResponse;
        Insert: AIResponseInsert;
        Update: Partial<AIResponseInsert>;
      };
      competitors: {
        Row: Competitor;
        Insert: CompetitorInsert;
        Update: Partial<CompetitorInsert>;
      };
      recommendations: {
        Row: Recommendation;
        Insert: RecommendationInsert;
        Update: RecommendationUpdate;
      };
      ai_subscriptions: {
        Row: AISubscription;
        Insert: AISubscriptionInsert;
        Update: AISubscriptionUpdate;
      };
      usage_tracking: {
        Row: UsageTracking;
        Insert: UsageTrackingInsert;
        Update: Partial<UsageTrackingInsert>;
      };
      hallucination_reports: {
        Row: HallucinationReport;
        Insert: HallucinationReportInsert;
        Update: Partial<HallucinationReportInsert>;
      };
      api_cost_tracking: {
        Row: APICostTracking;
        Insert: APICostTrackingInsert;
        Update: Partial<APICostTrackingInsert>;
      };
      daily_cost_summary: {
        Row: DailyCostSummary;
        Insert: Omit<DailyCostSummary, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyCostSummary, 'id' | 'date' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_usage: {
        Args: {
          p_user_id: string;
          p_tokens: number;
          p_cost: number;
        };
        Returns: void;
      };
    };
    Enums: {
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      company_size: CompanySize;
      analysis_status: AnalysisStatus;
      ai_provider: AIProvider;
      query_type: QueryType;
      recommendation_category: RecommendationCategory;
      recommendation_priority: RecommendationPriority;
      effort_level: EffortLevel;
      competitor_tier: CompetitorTier;
      hallucination_type: HallucinationType;
      hallucination_status: HallucinationStatus;
      billing_interval: BillingInterval;
    };
  };
}

// ================================================================
// TYPE UTILITIES
// ================================================================

/**
 * Extract row type from table name
 */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/**
 * Extract insert type from table name
 */
export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/**
 * Extract update type from table name
 */
export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// ================================================================
// COMMON QUERY RESULT TYPES
// ================================================================

/**
 * Analysis with related data
 */
export interface AnalysisWithRelations extends Analysis {
  industry?: Industry | null;
  user?: Pick<UserProfile, 'id' | 'email' | 'full_name'> | null;
  ai_responses?: AIResponse[];
  competitors?: Competitor[];
  recommendations?: Recommendation[];
}

/**
 * User with subscription info
 */
export interface UserWithSubscription extends UserProfile {
  subscription?: AISubscription | null;
  current_usage?: UsageTracking | null;
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  total_analyses: number;
  analyses_this_month: number;
  average_score: number;
  total_cost_this_month: number;
  recent_analyses: Analysis[];
}

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default Database;
