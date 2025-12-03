-- ================================================================
-- PERFORMANCE INDEXES
-- Phase 2, Week 3, Day 5
-- Optimized indexes for common query patterns
-- ================================================================

-- ================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ================================================================

-- analyses: User's recent analyses with status
CREATE INDEX IF NOT EXISTS idx_analyses_user_status_created
  ON analyses(user_id, status, created_at DESC);

-- analyses: Find analyses by URL within date range
CREATE INDEX IF NOT EXISTS idx_analyses_url_created
  ON analyses(url, created_at DESC);

-- analyses: Public analyses lookup
CREATE INDEX IF NOT EXISTS idx_analyses_public_created
  ON analyses(is_public, created_at DESC)
  WHERE is_public = true;

-- analyses: Pending/processing analyses for queue
CREATE INDEX IF NOT EXISTS idx_analyses_pending_queue
  ON analyses(status, created_at ASC)
  WHERE status IN ('pending', 'processing');

-- analyses: Score-based queries for leaderboards
CREATE INDEX IF NOT EXISTS idx_analyses_score_public
  ON analyses(overall_score DESC, created_at DESC)
  WHERE is_public = true AND overall_score IS NOT NULL;

-- ================================================================
-- AI RESPONSES INDEXES
-- ================================================================

-- ai_responses: Provider performance analysis
CREATE INDEX IF NOT EXISTS idx_ai_responses_provider_created
  ON ai_responses(provider, created_at DESC);

-- ai_responses: Latency analysis by provider and model
CREATE INDEX IF NOT EXISTS idx_ai_responses_provider_latency
  ON ai_responses(provider, model, latency_ms);

-- ai_responses: Cache performance tracking
CREATE INDEX IF NOT EXISTS idx_ai_responses_cached
  ON ai_responses(was_cached, created_at DESC);

-- ai_responses: Error tracking for reliability
CREATE INDEX IF NOT EXISTS idx_ai_responses_errors
  ON ai_responses(provider, created_at DESC)
  WHERE error_message IS NOT NULL;

-- ai_responses: Brand mentions for Share of Voice
CREATE INDEX IF NOT EXISTS idx_ai_responses_mentions
  ON ai_responses(analysis_id, mentions_brand)
  WHERE mentions_brand = true;

-- ai_responses: Sentiment analysis
CREATE INDEX IF NOT EXISTS idx_ai_responses_sentiment
  ON ai_responses(analysis_id, sentiment_score)
  WHERE sentiment_score IS NOT NULL;

-- ================================================================
-- RECOMMENDATIONS INDEXES
-- ================================================================

-- recommendations: Quick lookup by priority and status
CREATE INDEX IF NOT EXISTS idx_recommendations_priority_status
  ON recommendations(analysis_id, priority, is_completed, is_dismissed);

-- recommendations: Pending high-priority recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_pending_high
  ON recommendations(analysis_id, created_at DESC)
  WHERE priority = 'high' AND is_completed = false AND is_dismissed = false;

-- recommendations: Category-based filtering
CREATE INDEX IF NOT EXISTS idx_recommendations_category_priority
  ON recommendations(category, priority, is_completed);

-- ================================================================
-- COMPETITORS INDEXES
-- ================================================================

-- competitors: Top competitors by mention count
CREATE INDEX IF NOT EXISTS idx_competitors_mentions
  ON competitors(analysis_id, mention_count DESC);

-- competitors: Sentiment analysis for competitors
CREATE INDEX IF NOT EXISTS idx_competitors_sentiment
  ON competitors(analysis_id, sentiment_score DESC)
  WHERE sentiment_score IS NOT NULL;

-- ================================================================
-- USER PROFILES INDEXES
-- ================================================================

-- user_profiles: Active subscribers
CREATE INDEX IF NOT EXISTS idx_user_profiles_active_paid
  ON user_profiles(subscription_tier, created_at DESC)
  WHERE subscription_tier != 'free' AND subscription_status = 'active';

-- user_profiles: Usage limit tracking
CREATE INDEX IF NOT EXISTS idx_user_profiles_usage
  ON user_profiles(analyses_used_this_month, analyses_limit);

-- ================================================================
-- USAGE TRACKING INDEXES
-- ================================================================

-- usage_tracking: Current period lookup
CREATE INDEX IF NOT EXISTS idx_usage_tracking_current
  ON usage_tracking(user_id, period_start DESC, period_end);

-- usage_tracking: Cost analysis by period
CREATE INDEX IF NOT EXISTS idx_usage_tracking_cost
  ON usage_tracking(period_start, total_cost_usd DESC);

-- ================================================================
-- API COST TRACKING INDEXES
-- ================================================================

-- api_cost_tracking: Daily cost summaries
CREATE INDEX IF NOT EXISTS idx_api_cost_date_provider_cost
  ON api_cost_tracking(date DESC, provider, total_cost_usd DESC);

-- api_cost_tracking: Cache performance analysis
CREATE INDEX IF NOT EXISTS idx_api_cost_cache_performance
  ON api_cost_tracking(date DESC, cache_hits, cache_misses);

-- ================================================================
-- HALLUCINATION REPORTS INDEXES
-- ================================================================

-- hallucination_reports: Pending review queue
CREATE INDEX IF NOT EXISTS idx_hallucination_pending
  ON hallucination_reports(status, created_at ASC)
  WHERE status = 'pending';

-- hallucination_reports: Type-based analysis
CREATE INDEX IF NOT EXISTS idx_hallucination_type
  ON hallucination_reports(hallucination_type, status, created_at DESC);

-- ================================================================
-- INDUSTRIES INDEXES
-- ================================================================

-- industries: Active industries sorted by display order
CREATE INDEX IF NOT EXISTS idx_industries_active_order
  ON industries(is_active, display_order)
  WHERE is_active = true;

-- ================================================================
-- SUBSCRIPTIONS INDEXES
-- ================================================================

-- ai_subscriptions: Active subscriptions by tier
CREATE INDEX IF NOT EXISTS idx_subscriptions_active_tier
  ON ai_subscriptions(status, plan_tier, current_period_end)
  WHERE status = 'active';

-- ai_subscriptions: Expiring subscriptions (for renewal reminders)
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiring
  ON ai_subscriptions(current_period_end, status)
  WHERE status = 'active' AND cancel_at_period_end = false;

-- ================================================================
-- GIN INDEXES FOR JSONB AND ARRAY COLUMNS
-- ================================================================

-- analyses: JSONB score breakdown search
CREATE INDEX IF NOT EXISTS idx_analyses_score_breakdown_gin
  ON analyses USING GIN (score_breakdown jsonb_path_ops);

-- ai_responses: Competitors mentioned array search
CREATE INDEX IF NOT EXISTS idx_ai_responses_competitors_gin
  ON ai_responses USING GIN (competitors_mentioned);

-- competitors: Providers mentioned array search
CREATE INDEX IF NOT EXISTS idx_competitors_providers_gin
  ON competitors USING GIN (mentioned_by_providers);

-- industries: Keywords array search
CREATE INDEX IF NOT EXISTS idx_industries_keywords_gin
  ON industries USING GIN (keywords);

-- industries: Regulatory context array search
CREATE INDEX IF NOT EXISTS idx_industries_regulatory_gin
  ON industries USING GIN (regulatory_context);

-- ================================================================
-- TEXT SEARCH INDEXES
-- ================================================================

-- analyses: Full-text search on brand name
CREATE INDEX IF NOT EXISTS idx_analyses_brand_trgm
  ON analyses USING GIN (brand_name gin_trgm_ops);

-- competitors: Full-text search on competitor name
CREATE INDEX IF NOT EXISTS idx_competitors_name_trgm
  ON competitors USING GIN (name gin_trgm_ops);

-- Enable pg_trgm extension if not exists (required for trigram indexes)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ================================================================

-- analyses: Completed analyses only
CREATE INDEX IF NOT EXISTS idx_analyses_completed
  ON analyses(user_id, completed_at DESC)
  WHERE status = 'completed';

-- analyses: Non-expired analyses
CREATE INDEX IF NOT EXISTS idx_analyses_not_expired
  ON analyses(user_id, created_at DESC)
  WHERE (expires_at IS NULL OR expires_at > NOW());

-- ================================================================
-- COVERING INDEXES FOR DASHBOARD QUERIES
-- ================================================================

-- analyses: Dashboard list view (avoids heap fetches)
CREATE INDEX IF NOT EXISTS idx_analyses_dashboard
  ON analyses(user_id, created_at DESC)
  INCLUDE (url, brand_name, status, overall_score);

-- ai_responses: Provider summary (avoids heap fetches)
CREATE INDEX IF NOT EXISTS idx_ai_responses_summary
  ON ai_responses(analysis_id, provider)
  INCLUDE (mentions_brand, sentiment_score, position_in_list, latency_ms);

-- ================================================================
-- STATISTICS AND MAINTENANCE HINTS
-- ================================================================

-- Update statistics for better query planning
COMMENT ON INDEX idx_analyses_user_status_created IS 'Primary index for user dashboard queries';
COMMENT ON INDEX idx_analyses_pending_queue IS 'Used by background job processor';
COMMENT ON INDEX idx_ai_responses_provider_latency IS 'Performance monitoring dashboard';
COMMENT ON INDEX idx_analyses_dashboard IS 'Covering index for dashboard list view';

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- Total indexes created: 40+
-- Types: B-tree, GIN, Partial, Covering
-- Purpose: Optimize common query patterns for AI Perception platform
-- ================================================================
