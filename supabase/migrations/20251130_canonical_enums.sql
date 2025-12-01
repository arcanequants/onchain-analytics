-- ================================================================
-- CANONICAL ENUM TYPES
-- Version: 1.0
-- Date: 2025-11-30
-- Phase 3, Week 10 - Semantic Audit Backlog Item
--
-- This migration creates PostgreSQL ENUM types for all categorical
-- values used across the AI Perception platform. Using proper ENUMs
-- provides:
-- 1. Type safety at the database level
-- 2. Better performance than CHECK constraints
-- 3. Self-documenting schema
-- 4. Easier schema evolution with ADD VALUE
-- ================================================================

-- ================================================================
-- AI PROVIDER ENUMS
-- ================================================================

-- AI Provider (external AI services)
DO $$ BEGIN
  CREATE TYPE ai_provider AS ENUM (
    'openai',
    'anthropic',
    'google',
    'perplexity'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE ai_provider IS 'Supported AI/LLM providers for analysis queries';

-- AI Query Type (types of queries sent to AI)
DO $$ BEGIN
  CREATE TYPE ai_query_type AS ENUM (
    'recommendation',
    'comparison',
    'sentiment',
    'authority',
    'features',
    'ranking',
    'review',
    'use_case',
    'alternatives',
    'evaluation'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE ai_query_type IS 'Types of queries sent to AI providers for brand analysis';

-- ================================================================
-- ANALYSIS STATUS ENUMS
-- ================================================================

-- Analysis Status (lifecycle states)
DO $$ BEGIN
  CREATE TYPE analysis_status AS ENUM (
    'pending',
    'validating',
    'querying',
    'processing',
    'aggregating',
    'completed',
    'failed',
    'expired',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE analysis_status IS 'Lifecycle states for brand perception analyses';

-- ================================================================
-- SENTIMENT ENUMS
-- ================================================================

-- Sentiment Label (categorical sentiment)
DO $$ BEGIN
  CREATE TYPE sentiment_label AS ENUM (
    'very_positive',
    'positive',
    'neutral',
    'negative',
    'very_negative',
    'mixed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE sentiment_label IS 'Categorical sentiment classification for text analysis';

-- ================================================================
-- SEVERITY / PRIORITY ENUMS
-- ================================================================

-- Severity Level (for issues, errors, alerts)
DO $$ BEGIN
  CREATE TYPE severity_level AS ENUM (
    'critical',
    'high',
    'medium',
    'low',
    'info'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE severity_level IS 'Severity levels for issues, alerts, and recommendations';

-- Priority Level (for recommendations, tasks)
DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM (
    'urgent',
    'high',
    'medium',
    'low'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE priority_level IS 'Priority levels for recommendations and action items';

-- Effort Level (implementation effort)
DO $$ BEGIN
  CREATE TYPE effort_level AS ENUM (
    'quick_win',
    'moderate',
    'significant',
    'major'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE effort_level IS 'Effort estimation for implementing recommendations';

-- ================================================================
-- SUBSCRIPTION ENUMS
-- ================================================================

-- Subscription Tier
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM (
    'free',
    'starter',
    'pro',
    'enterprise'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE subscription_tier IS 'Subscription plan tiers for billing';

-- Subscription Status
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'active',
    'trialing',
    'past_due',
    'cancelled',
    'paused',
    'unpaid'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE subscription_status IS 'Payment/subscription status states';

-- Billing Interval
DO $$ BEGIN
  CREATE TYPE billing_interval AS ENUM (
    'month',
    'year'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE billing_interval IS 'Billing frequency for subscriptions';

-- ================================================================
-- COMPANY ENUMS
-- ================================================================

-- Company Size
DO $$ BEGIN
  CREATE TYPE company_size AS ENUM (
    'solo',
    'small',       -- 2-10
    'medium',      -- 11-50
    'large',       -- 51-200
    'enterprise',  -- 201-1000
    'corporate'    -- 1000+
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE company_size IS 'Company size categories for user profiles';

-- Competitor Tier
DO $$ BEGIN
  CREATE TYPE competitor_tier AS ENUM (
    'enterprise',
    'mid_market',
    'smb',
    'local',
    'startup'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE competitor_tier IS 'Competitor classification by market segment';

-- ================================================================
-- RECOMMENDATION ENUMS
-- ================================================================

-- Recommendation Category
DO $$ BEGIN
  CREATE TYPE recommendation_category AS ENUM (
    'content',
    'technical_seo',
    'authority',
    'entity_seo',
    'citations',
    'social_proof',
    'structured_data',
    'brand_mentions',
    'visibility',
    'competitive'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE recommendation_category IS 'Categories for AI perception improvement recommendations';

-- ================================================================
-- HALLUCINATION ENUMS
-- ================================================================

-- Hallucination Type
DO $$ BEGIN
  CREATE TYPE hallucination_type AS ENUM (
    'factual_error',
    'outdated_info',
    'fabricated_entity',
    'wrong_attribution',
    'contradictory',
    'exaggeration',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE hallucination_type IS 'Types of AI hallucinations/errors detected';

-- Review Status (for moderation)
DO $$ BEGIN
  CREATE TYPE review_status AS ENUM (
    'pending',
    'in_review',
    'confirmed',
    'rejected',
    'fixed',
    'wont_fix'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE review_status IS 'Status states for content/report reviews';

-- ================================================================
-- CERTAINTY / CONFIDENCE ENUMS
-- ================================================================

-- Certainty Level (for NLP hedge detection)
DO $$ BEGIN
  CREATE TYPE certainty_level AS ENUM (
    'very_high',
    'high',
    'medium',
    'low',
    'very_low',
    'uncertain'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE certainty_level IS 'Certainty/confidence levels for NLP text analysis';

-- ================================================================
-- SCORE ENUMS
-- ================================================================

-- Score Grade (categorical score interpretation)
DO $$ BEGIN
  CREATE TYPE score_grade AS ENUM (
    'excellent',   -- 80-100
    'good',        -- 60-79
    'average',     -- 40-59
    'poor',        -- 20-39
    'critical'     -- 0-19
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE score_grade IS 'Grade classification for perception scores (0-100 scale)';

-- Score Category (dimensions of perception score)
DO $$ BEGIN
  CREATE TYPE score_category AS ENUM (
    'visibility',
    'sentiment',
    'authority',
    'relevance',
    'competitive',
    'coverage',
    'recency',
    'consistency'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE score_category IS 'Score breakdown categories for perception analysis';

-- ================================================================
-- ENTITY ENUMS
-- ================================================================

-- Entity Type (for detected entities)
DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM (
    'organization',
    'product',
    'service',
    'person',
    'brand',
    'location',
    'event'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TYPE entity_type IS 'Types of entities detected in text analysis';

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to get all values of an enum as an array
CREATE OR REPLACE FUNCTION get_enum_values(enum_name TEXT)
RETURNS TEXT[] AS $$
DECLARE
  result TEXT[];
BEGIN
  EXECUTE format('SELECT array_agg(e::text) FROM unnest(enum_range(NULL::%I)) e', enum_name)
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_enum_values IS 'Returns all values of a PostgreSQL enum type as a text array';

-- Function to check if a value is valid for an enum
CREATE OR REPLACE FUNCTION is_valid_enum_value(enum_name TEXT, value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN value = ANY(get_enum_values(enum_name));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_valid_enum_value IS 'Checks if a value is valid for a given enum type';

-- ================================================================
-- MIGRATION NOTES
-- ================================================================
--
-- To add a new enum value in the future, use:
-- ALTER TYPE <enum_name> ADD VALUE '<new_value>';
--
-- Note: New values can only be added at the end or before/after
-- existing values. Values cannot be removed from enums.
--
-- Example:
-- ALTER TYPE ai_provider ADD VALUE 'cohere' AFTER 'perplexity';
--
-- ================================================================
-- ENUMS CREATED: 20
-- FUNCTIONS CREATED: 2
-- ================================================================
