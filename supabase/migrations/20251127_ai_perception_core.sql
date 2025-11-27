-- ================================================================
-- AI PERCEPTION ENGINEERING AGENCY - CORE SCHEMA
-- Version: 1.0
-- Date: 2025-11-27
-- Phase 1, Week 1, Day 1
-- Based on EXECUTIVE-ROADMAP-BCG.md Section 2.2
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- TABLE 1: user_profiles (extends Supabase auth.users)
-- ================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  company_url TEXT,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  analyses_used_this_month INTEGER NOT NULL DEFAULT 0,
  analyses_limit INTEGER NOT NULL DEFAULT 3, -- Free tier: 3 analyses/month
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe ON user_profiles(stripe_customer_id);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 2: industries (taxonomy of 20 base categories)
-- ================================================================
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES industries(id),
  description TEXT,
  keywords TEXT[], -- For prompt context
  regulatory_context TEXT[], -- HIPAA, PCI-DSS, etc.
  seasonality_factors JSONB, -- Q1-Q4 adjustments
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for industries
CREATE INDEX IF NOT EXISTS idx_industries_slug ON industries(slug);
CREATE INDEX IF NOT EXISTS idx_industries_parent ON industries(parent_id);
CREATE INDEX IF NOT EXISTS idx_industries_active ON industries(is_active);

-- RLS for industries (public read)
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON industries
  FOR SELECT USING (true);

CREATE POLICY "Service role write" ON industries
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 3: analyses (core analysis records)
-- ================================================================
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Input
  url TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  industry_id UUID REFERENCES industries(id),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'expired'
  )),

  -- Results (populated after completion)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  score_breakdown JSONB, -- {visibility: 80, sentiment: 75, authority: 70, recency: 85}
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Metadata
  providers_queried TEXT[] NOT NULL DEFAULT '{}',
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  processing_time_ms INTEGER,

  -- Sharing
  share_token TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- For free tier: results expire after 7 days

  -- Constraints
  CONSTRAINT chk_url_protocol CHECK (url ~ '^https?://'),
  CONSTRAINT chk_completed_after_created CHECK (completed_at IS NULL OR completed_at >= created_at)
);

-- Indexes for analyses
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_url ON analyses(url);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_share_token ON analyses(share_token) WHERE share_token IS NOT NULL;

-- RLS for analyses
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analyses" ON analyses
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_public = true
    OR share_token IS NOT NULL
  );

CREATE POLICY "Users can create analyses" ON analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own analyses" ON analyses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON analyses
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 4: ai_responses (individual AI provider responses)
-- ================================================================
CREATE TABLE IF NOT EXISTS ai_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'perplexity')),
  model TEXT NOT NULL,
  model_version TEXT,

  -- Query
  prompt_template TEXT NOT NULL,
  prompt_variables JSONB,
  query_type TEXT NOT NULL CHECK (query_type IN (
    'recommendation', 'comparison', 'sentiment', 'authority', 'features'
  )),

  -- Response
  raw_response TEXT NOT NULL,
  parsed_response JSONB NOT NULL,

  -- Metrics
  mentions_brand BOOLEAN NOT NULL DEFAULT false,
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  position_in_list INTEGER, -- If brand is mentioned, what position?
  competitors_mentioned TEXT[],

  -- Performance
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  latency_ms INTEGER,

  -- Quality
  was_cached BOOLEAN NOT NULL DEFAULT false,
  cache_key TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_latency_positive CHECK (latency_ms IS NULL OR latency_ms > 0),
  CONSTRAINT chk_tokens_positive CHECK (tokens_input >= 0 AND tokens_output >= 0)
);

-- Indexes for ai_responses
CREATE INDEX IF NOT EXISTS idx_ai_responses_analysis ON ai_responses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_provider ON ai_responses(provider);
CREATE INDEX IF NOT EXISTS idx_ai_responses_cache ON ai_responses(cache_key) WHERE cache_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_responses_created ON ai_responses(created_at DESC);

-- RLS for ai_responses
ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analysis responses" ON ai_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = ai_responses.analysis_id
      AND (analyses.user_id = auth.uid() OR analyses.is_public = true)
    )
  );

CREATE POLICY "Service role full access" ON ai_responses
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 5: competitors (detected competitors per analysis)
-- ================================================================
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

  -- Competitor info
  name TEXT NOT NULL,
  url TEXT,

  -- Mention metrics
  mention_count INTEGER NOT NULL DEFAULT 0,
  average_position DECIMAL(4,2),
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),

  -- Provider breakdown
  mentioned_by_providers TEXT[] NOT NULL DEFAULT '{}',

  -- Classification
  tier TEXT CHECK (tier IN ('enterprise', 'mid-market', 'smb', 'local')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for competitors
CREATE INDEX IF NOT EXISTS idx_competitors_analysis ON competitors(analysis_id);
CREATE INDEX IF NOT EXISTS idx_competitors_name ON competitors(name);

-- RLS for competitors
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analysis competitors" ON competitors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = competitors.analysis_id
      AND (analyses.user_id = auth.uid() OR analyses.is_public = true)
    )
  );

CREATE POLICY "Service role full access" ON competitors
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 6: recommendations (actionable insights)
-- ================================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,

  -- Recommendation content
  category TEXT NOT NULL CHECK (category IN (
    'content', 'technical', 'authority', 'visibility', 'competitive'
  )),
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Impact estimation
  estimated_score_impact INTEGER CHECK (estimated_score_impact >= 0 AND estimated_score_impact <= 20),
  effort_level TEXT CHECK (effort_level IN ('quick-win', 'moderate', 'significant')),

  -- Tracking
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_analysis ON recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);

-- RLS for recommendations
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analysis recommendations" ON recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = recommendations.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own recommendations" ON recommendations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = recommendations.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access" ON recommendations
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 7: subscriptions (Stripe billing)
-- ================================================================
CREATE TABLE IF NOT EXISTS ai_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Stripe IDs
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,

  -- Plan info
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('starter', 'pro', 'enterprise')),
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),

  -- Status
  status TEXT NOT NULL CHECK (status IN (
    'active', 'cancelled', 'past_due', 'unpaid', 'trialing', 'paused'
  )),

  -- Periods
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,

  -- Cancellation
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_ai_subscriptions_user ON ai_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_subscriptions_stripe ON ai_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_ai_subscriptions_status ON ai_subscriptions(status);

-- RLS for subscriptions
ALTER TABLE ai_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" ON ai_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON ai_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 8: usage_tracking (monthly usage per user)
-- ================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Usage counts
  analyses_count INTEGER NOT NULL DEFAULT 0,
  ai_calls_count INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,

  -- Limits
  analyses_limit INTEGER NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint per user per period
  UNIQUE(user_id, period_start)
);

-- Indexes for usage_tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_period ON usage_tracking(user_id, period_start DESC);

-- RLS for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 9: hallucination_reports (AI accuracy tracking)
-- ================================================================
CREATE TABLE IF NOT EXISTS hallucination_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ai_response_id UUID NOT NULL REFERENCES ai_responses(id) ON DELETE CASCADE,

  -- Report details
  reported_by UUID REFERENCES user_profiles(id),
  hallucination_type TEXT NOT NULL CHECK (hallucination_type IN (
    'factual_error', 'outdated_info', 'fabricated_entity',
    'wrong_attribution', 'contradictory', 'other'
  )),
  description TEXT NOT NULL,
  evidence_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'rejected', 'fixed'
  )),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES user_profiles(id),
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for hallucination_reports
CREATE INDEX IF NOT EXISTS idx_hallucination_reports_response ON hallucination_reports(ai_response_id);
CREATE INDEX IF NOT EXISTS idx_hallucination_reports_status ON hallucination_reports(status);

-- RLS for hallucination_reports
ALTER TABLE hallucination_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON hallucination_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can read own reports" ON hallucination_reports
  FOR SELECT USING (auth.uid() = reported_by);

CREATE POLICY "Service role full access" ON hallucination_reports
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 10: api_cost_tracking (daily cost monitoring)
-- ================================================================
CREATE TABLE IF NOT EXISTS api_cost_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Date and provider
  date DATE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'perplexity')),
  model TEXT NOT NULL,

  -- Costs
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_tokens_input INTEGER NOT NULL DEFAULT 0,
  total_tokens_output INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,

  -- Cache metrics
  cache_hits INTEGER NOT NULL DEFAULT 0,
  cache_misses INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique per day/provider/model
  UNIQUE(date, provider, model)
);

-- Indexes for api_cost_tracking
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_date ON api_cost_tracking(date DESC);
CREATE INDEX IF NOT EXISTS idx_api_cost_tracking_provider ON api_cost_tracking(provider, date DESC);

-- RLS for api_cost_tracking
ALTER TABLE api_cost_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON api_cost_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 11: daily_cost_summary (aggregated daily costs)
-- ================================================================
CREATE TABLE IF NOT EXISTS daily_cost_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  date DATE UNIQUE NOT NULL,

  -- Aggregated metrics
  total_analyses INTEGER NOT NULL DEFAULT 0,
  total_ai_calls INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,

  -- Averages
  avg_cost_per_analysis DECIMAL(10,6),
  avg_tokens_per_analysis INTEGER,

  -- Cache performance
  cache_hit_rate DECIMAL(5,2) CHECK (cache_hit_rate >= 0 AND cache_hit_rate <= 100),

  -- Budget tracking ($100/month = ~$3.33/day)
  daily_budget_usd DECIMAL(10,2) NOT NULL DEFAULT 3.33,
  budget_remaining_usd DECIMAL(10,2),
  is_over_budget BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for daily_cost_summary
CREATE INDEX IF NOT EXISTS idx_daily_cost_summary_date ON daily_cost_summary(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_cost_summary_over_budget ON daily_cost_summary(is_over_budget) WHERE is_over_budget = true;

-- RLS for daily_cost_summary
ALTER TABLE daily_cost_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON daily_cost_summary
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_subscriptions_updated_at
  BEFORE UPDATE ON ai_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create profile on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function: Increment usage tracking
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_tokens INTEGER,
  p_cost DECIMAL
)
RETURNS void AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_limit INTEGER;
BEGIN
  -- Get current period (first of month to last of month)
  v_period_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_period_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Get user's limit
  SELECT analyses_limit INTO v_limit FROM user_profiles WHERE id = p_user_id;

  -- Upsert usage tracking
  INSERT INTO usage_tracking (user_id, period_start, period_end, analyses_count, ai_calls_count, total_tokens, total_cost_usd, analyses_limit)
  VALUES (p_user_id, v_period_start, v_period_end, 1, 1, p_tokens, p_cost, COALESCE(v_limit, 3))
  ON CONFLICT (user_id, period_start) DO UPDATE SET
    analyses_count = usage_tracking.analyses_count + 1,
    ai_calls_count = usage_tracking.ai_calls_count + 1,
    total_tokens = usage_tracking.total_tokens + p_tokens,
    total_cost_usd = usage_tracking.total_cost_usd + p_cost,
    updated_at = NOW();

  -- Update user's monthly usage count
  UPDATE user_profiles
  SET analyses_used_this_month = analyses_used_this_month + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- SEED DATA: Industries (20 base categories)
-- ================================================================
INSERT INTO industries (slug, name, description, keywords, display_order) VALUES
  ('saas', 'SaaS / Software', 'Software as a Service and enterprise software', ARRAY['software', 'app', 'platform', 'tool', 'SaaS'], 1),
  ('ecommerce', 'E-commerce / Retail', 'Online retail and e-commerce platforms', ARRAY['shop', 'store', 'buy', 'retail', 'ecommerce'], 2),
  ('healthcare', 'Healthcare / Medical', 'Healthcare providers and medical services', ARRAY['health', 'medical', 'doctor', 'hospital', 'clinic'], 3),
  ('fintech', 'Fintech / Finance', 'Financial technology and banking services', ARRAY['finance', 'banking', 'payment', 'investment', 'fintech'], 4),
  ('legal', 'Legal Services', 'Law firms and legal technology', ARRAY['lawyer', 'attorney', 'law firm', 'legal'], 5),
  ('real-estate', 'Real Estate', 'Real estate agencies and property services', ARRAY['real estate', 'property', 'home', 'apartment', 'realtor'], 6),
  ('restaurant', 'Restaurant / Food', 'Restaurants and food services', ARRAY['restaurant', 'food', 'dining', 'cuisine', 'eat'], 7),
  ('hospitality', 'Hospitality / Travel', 'Hotels, travel, and tourism', ARRAY['hotel', 'travel', 'vacation', 'tourism', 'booking'], 8),
  ('education', 'Education / EdTech', 'Educational institutions and learning platforms', ARRAY['education', 'learning', 'school', 'course', 'training'], 9),
  ('marketing', 'Marketing / Advertising', 'Marketing agencies and advertising services', ARRAY['marketing', 'advertising', 'agency', 'branding', 'digital'], 10),
  ('consulting', 'Consulting / Professional Services', 'Business consulting and professional services', ARRAY['consulting', 'advisor', 'strategy', 'management'], 11),
  ('manufacturing', 'Manufacturing / Industrial', 'Manufacturing and industrial companies', ARRAY['manufacturing', 'industrial', 'production', 'factory'], 12),
  ('logistics', 'Logistics / Supply Chain', 'Logistics and supply chain services', ARRAY['logistics', 'shipping', 'delivery', 'supply chain'], 13),
  ('media', 'Media / Entertainment', 'Media companies and entertainment', ARRAY['media', 'entertainment', 'content', 'streaming', 'news'], 14),
  ('nonprofit', 'Nonprofit / NGO', 'Nonprofit organizations and charities', ARRAY['nonprofit', 'charity', 'foundation', 'NGO'], 15),
  ('automotive', 'Automotive', 'Automotive dealers and services', ARRAY['car', 'auto', 'vehicle', 'dealer', 'automotive'], 16),
  ('insurance', 'Insurance', 'Insurance providers and brokers', ARRAY['insurance', 'policy', 'coverage', 'claim'], 17),
  ('telecom', 'Telecommunications', 'Telecom providers and services', ARRAY['telecom', 'phone', 'internet', 'mobile', 'broadband'], 18),
  ('energy', 'Energy / Utilities', 'Energy companies and utilities', ARRAY['energy', 'power', 'utility', 'electricity', 'solar'], 19),
  ('other', 'Other', 'Other industries not listed', ARRAY[], 20)
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- DEPLOYMENT COMPLETE
-- ================================================================
-- Tables created: 11
-- Functions created: 3
-- Triggers created: 4
-- Seed data: 20 industries
-- ================================================================
