-- ================================================================
-- Competitor Tracker Schema Migration
-- Phase 1, Week 2, Day 6 - Domain Tasks
--
-- Creates tables for tracking competitors and share of voice history.
-- ================================================================

-- ================================================================
-- COMPETITOR PROFILES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS competitor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Brand identification
  brand_name VARCHAR(200) NOT NULL,
  brand_slug VARCHAR(100) NOT NULL,
  website_url TEXT,
  logo_url TEXT,

  -- Industry classification
  industry_slug VARCHAR(50) NOT NULL,
  sub_industry VARCHAR(100),

  -- Competitor tier (from competitor-tiers module)
  tier VARCHAR(20) DEFAULT 'mid-market'
    CHECK (tier IN ('enterprise', 'mid-market', 'smb', 'local')),
  tier_confidence NUMERIC(3, 2) DEFAULT 0.5,
  tier_indicators JSONB DEFAULT '[]'::jsonb,

  -- Company details
  description TEXT,
  founding_year INTEGER,
  headquarters_country VARCHAR(3),
  headquarters_city VARCHAR(100),
  employee_count_range VARCHAR(50),
  estimated_revenue_range VARCHAR(50),

  -- Market position
  market_share_percent NUMERIC(5, 2),
  market_position INTEGER, -- 1 = leader, 2 = challenger, etc.

  -- Moat analysis (from moat-extractor module)
  moat_score INTEGER CHECK (moat_score >= 0 AND moat_score <= 100),
  moats JSONB DEFAULT '[]'::jsonb,
  competitive_position VARCHAR(20)
    CHECK (competitive_position IN ('dominant', 'strong', 'moderate', 'weak', 'vulnerable')),

  -- Key metrics
  metrics JSONB DEFAULT '{}'::jsonb,
  -- Example: {"customers": 50000, "integrations": 200, "funding_total": 100000000}

  -- Differentiation
  key_differentiators TEXT[],
  target_segments TEXT[],
  pricing_model VARCHAR(50),
  pricing_tier VARCHAR(20), -- low, medium, high, enterprise

  -- Tracking metadata
  is_active BOOLEAN DEFAULT true,
  last_analyzed_at TIMESTAMPTZ,
  analysis_quality_score INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_competitor_brand_industry UNIQUE (brand_slug, industry_slug)
);

-- Indexes for competitor_profiles
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_industry
ON competitor_profiles(industry_slug);

CREATE INDEX IF NOT EXISTS idx_competitor_profiles_tier
ON competitor_profiles(tier);

CREATE INDEX IF NOT EXISTS idx_competitor_profiles_active
ON competitor_profiles(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_competitor_profiles_market_position
ON competitor_profiles(industry_slug, market_position);

-- Full text search on competitor names and descriptions
CREATE INDEX IF NOT EXISTS idx_competitor_profiles_search
ON competitor_profiles USING gin(
  to_tsvector('english', coalesce(brand_name, '') || ' ' || coalesce(description, ''))
);

-- ================================================================
-- SHARE OF VOICE HISTORY TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS sov_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to competitor
  competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(20) NOT NULL DEFAULT 'weekly'
    CHECK (period_type IN ('daily', 'weekly', 'monthly', 'quarterly')),

  -- Share of Voice metrics
  sov_score NUMERIC(5, 2) NOT NULL CHECK (sov_score >= 0 AND sov_score <= 100),
  sov_rank INTEGER,
  total_competitors_in_period INTEGER,

  -- SOV breakdown by channel
  channel_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: {"organic": 25.5, "paid": 15.2, "social": 10.8, "pr": 5.3}

  -- SOV breakdown by query type
  query_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Example: {"brand": 80, "category": 45, "comparison": 35, "reviews": 20}

  -- Mention metrics
  total_mentions INTEGER DEFAULT 0,
  positive_mentions INTEGER DEFAULT 0,
  negative_mentions INTEGER DEFAULT 0,
  neutral_mentions INTEGER DEFAULT 0,

  -- Sentiment analysis
  avg_sentiment_score NUMERIC(4, 3) CHECK (avg_sentiment_score >= -1 AND avg_sentiment_score <= 1),

  -- Comparison to previous period
  sov_change_percent NUMERIC(6, 2),
  mentions_change_percent NUMERIC(6, 2),
  rank_change INTEGER,

  -- Data quality
  data_completeness NUMERIC(3, 2) DEFAULT 1.0,
  sources_count INTEGER DEFAULT 0,

  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_sov_period UNIQUE (competitor_id, period_start, period_type)
);

-- Indexes for sov_history
CREATE INDEX IF NOT EXISTS idx_sov_history_competitor
ON sov_history(competitor_id);

CREATE INDEX IF NOT EXISTS idx_sov_history_period
ON sov_history(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_sov_history_type_period
ON sov_history(period_type, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_sov_history_score
ON sov_history(sov_score DESC);

-- ================================================================
-- COMPETITOR COMPARISONS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS competitor_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The base competitor being compared
  base_competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,

  -- The competitor being compared against
  compared_competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,

  -- Comparison context
  industry_slug VARCHAR(50) NOT NULL,
  comparison_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Overall comparison scores
  base_overall_score INTEGER CHECK (base_overall_score >= 0 AND base_overall_score <= 100),
  compared_overall_score INTEGER CHECK (compared_overall_score >= 0 AND compared_overall_score <= 100),

  -- Dimension-by-dimension comparison
  dimension_scores JSONB DEFAULT '{}'::jsonb,
  -- Example: {
  --   "features": {"base": 80, "compared": 75},
  --   "price": {"base": 60, "compared": 85},
  --   "support": {"base": 90, "compared": 70}
  -- }

  -- Winner by dimension
  dimension_winners JSONB DEFAULT '{}'::jsonb,
  -- Example: {"features": "base", "price": "compared", "support": "base"}

  -- Overall winner
  overall_winner VARCHAR(20) CHECK (overall_winner IN ('base', 'compared', 'tie')),

  -- AI-generated insights
  key_differentiators TEXT,
  recommendation TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT different_competitors CHECK (base_competitor_id != compared_competitor_id),
  CONSTRAINT unique_comparison UNIQUE (base_competitor_id, compared_competitor_id, comparison_date)
);

-- Index for comparisons
CREATE INDEX IF NOT EXISTS idx_competitor_comparisons_base
ON competitor_comparisons(base_competitor_id);

CREATE INDEX IF NOT EXISTS idx_competitor_comparisons_compared
ON competitor_comparisons(compared_competitor_id);

-- ================================================================
-- COMPETITOR TRACKING WATCHLIST
-- ================================================================

CREATE TABLE IF NOT EXISTS competitor_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User/organization tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID, -- For future multi-tenant support

  -- Competitor being watched
  competitor_id UUID NOT NULL REFERENCES competitor_profiles(id) ON DELETE CASCADE,

  -- Watch configuration
  priority VARCHAR(20) DEFAULT 'medium'
    CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  notes TEXT,

  -- Alert preferences
  alert_on_sov_change BOOLEAN DEFAULT true,
  alert_threshold_percent NUMERIC(4, 2) DEFAULT 5.0,
  alert_on_new_mentions BOOLEAN DEFAULT false,
  alert_on_sentiment_change BOOLEAN DEFAULT false,

  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_alert_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT unique_user_competitor UNIQUE (user_id, competitor_id)
);

-- Index for watchlist
CREATE INDEX IF NOT EXISTS idx_competitor_watchlist_user
ON competitor_watchlist(user_id);

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Get latest SOV for a competitor
CREATE OR REPLACE FUNCTION get_latest_sov(p_competitor_id UUID)
RETURNS TABLE (
  sov_score NUMERIC,
  sov_rank INTEGER,
  period_start DATE,
  period_end DATE,
  sov_change_percent NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.sov_score,
    s.sov_rank,
    s.period_start,
    s.period_end,
    s.sov_change_percent
  FROM sov_history s
  WHERE s.competitor_id = p_competitor_id
  ORDER BY s.period_end DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Get SOV trend for a competitor
CREATE OR REPLACE FUNCTION get_sov_trend(
  p_competitor_id UUID,
  p_periods INTEGER DEFAULT 12,
  p_period_type VARCHAR DEFAULT 'weekly'
)
RETURNS TABLE (
  period_start DATE,
  period_end DATE,
  sov_score NUMERIC,
  sov_rank INTEGER,
  total_mentions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.period_start,
    s.period_end,
    s.sov_score,
    s.sov_rank,
    s.total_mentions
  FROM sov_history s
  WHERE s.competitor_id = p_competitor_id
    AND s.period_type = p_period_type
  ORDER BY s.period_start DESC
  LIMIT p_periods;
END;
$$ LANGUAGE plpgsql;

-- Get top competitors by SOV in an industry
CREATE OR REPLACE FUNCTION get_top_competitors_by_sov(
  p_industry_slug VARCHAR,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  competitor_id UUID,
  brand_name VARCHAR,
  tier VARCHAR,
  latest_sov NUMERIC,
  sov_rank INTEGER,
  moat_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (cp.id)
    cp.id as competitor_id,
    cp.brand_name,
    cp.tier,
    sh.sov_score as latest_sov,
    sh.sov_rank,
    cp.moat_score
  FROM competitor_profiles cp
  LEFT JOIN sov_history sh ON cp.id = sh.competitor_id
  WHERE cp.industry_slug = p_industry_slug
    AND cp.is_active = true
  ORDER BY cp.id, sh.period_end DESC NULLS LAST, sh.sov_score DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Compare two competitors
CREATE OR REPLACE FUNCTION compare_competitors(
  p_competitor_1_id UUID,
  p_competitor_2_id UUID
)
RETURNS JSONB AS $$
DECLARE
  comp1 RECORD;
  comp2 RECORD;
  sov1 RECORD;
  sov2 RECORD;
  result JSONB;
BEGIN
  -- Get competitor profiles
  SELECT * INTO comp1 FROM competitor_profiles WHERE id = p_competitor_1_id;
  SELECT * INTO comp2 FROM competitor_profiles WHERE id = p_competitor_2_id;

  -- Get latest SOV
  SELECT * INTO sov1 FROM get_latest_sov(p_competitor_1_id);
  SELECT * INTO sov2 FROM get_latest_sov(p_competitor_2_id);

  result := jsonb_build_object(
    'competitor_1', jsonb_build_object(
      'id', comp1.id,
      'name', comp1.brand_name,
      'tier', comp1.tier,
      'moat_score', comp1.moat_score,
      'competitive_position', comp1.competitive_position,
      'market_share', comp1.market_share_percent,
      'latest_sov', sov1.sov_score,
      'sov_rank', sov1.sov_rank
    ),
    'competitor_2', jsonb_build_object(
      'id', comp2.id,
      'name', comp2.brand_name,
      'tier', comp2.tier,
      'moat_score', comp2.moat_score,
      'competitive_position', comp2.competitive_position,
      'market_share', comp2.market_share_percent,
      'latest_sov', sov2.sov_score,
      'sov_rank', sov2.sov_rank
    ),
    'comparison', jsonb_build_object(
      'moat_leader', CASE
        WHEN comp1.moat_score > comp2.moat_score THEN comp1.brand_name
        WHEN comp2.moat_score > comp1.moat_score THEN comp2.brand_name
        ELSE 'tie'
      END,
      'sov_leader', CASE
        WHEN sov1.sov_score > sov2.sov_score THEN comp1.brand_name
        WHEN sov2.sov_score > sov1.sov_score THEN comp2.brand_name
        ELSE 'tie'
      END,
      'market_leader', CASE
        WHEN comp1.market_share_percent > comp2.market_share_percent THEN comp1.brand_name
        WHEN comp2.market_share_percent > comp1.market_share_percent THEN comp2.brand_name
        ELSE 'tie'
      END
    )
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Update timestamp trigger for competitor_profiles
CREATE OR REPLACE FUNCTION update_competitor_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_competitor_profiles_timestamp
BEFORE UPDATE ON competitor_profiles
FOR EACH ROW
EXECUTE FUNCTION update_competitor_profiles_timestamp();

-- Update timestamp trigger for competitor_comparisons
CREATE TRIGGER trigger_update_competitor_comparisons_timestamp
BEFORE UPDATE ON competitor_comparisons
FOR EACH ROW
EXECUTE FUNCTION update_competitor_profiles_timestamp();

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE competitor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sov_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_watchlist ENABLE ROW LEVEL SECURITY;

-- Anyone can read competitor profiles and SOV history
CREATE POLICY "Anyone can view competitors"
ON competitor_profiles FOR SELECT
USING (true);

CREATE POLICY "Anyone can view SOV history"
ON sov_history FOR SELECT
USING (true);

CREATE POLICY "Anyone can view comparisons"
ON competitor_comparisons FOR SELECT
USING (true);

-- Only authenticated users can modify competitor data
CREATE POLICY "Authenticated users can create competitors"
ON competitor_profiles FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update competitors"
ON competitor_profiles FOR UPDATE
USING (auth.role() = 'authenticated');

-- Only admins can delete competitors
CREATE POLICY "Admins can delete competitors"
ON competitor_profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- Users can manage their own watchlist
CREATE POLICY "Users can view their watchlist"
ON competitor_watchlist FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can manage their watchlist"
ON competitor_watchlist FOR ALL
USING (user_id = auth.uid());

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE competitor_profiles IS 'Stores competitor brand profiles with moat analysis and market position';
COMMENT ON TABLE sov_history IS 'Historical share of voice data by time period';
COMMENT ON TABLE competitor_comparisons IS 'Head-to-head competitor comparison results';
COMMENT ON TABLE competitor_watchlist IS 'User-specific competitor tracking watchlist';

COMMENT ON FUNCTION get_latest_sov IS 'Get the most recent SOV data for a competitor';
COMMENT ON FUNCTION get_sov_trend IS 'Get SOV trend data over multiple periods';
COMMENT ON FUNCTION get_top_competitors_by_sov IS 'Get top competitors by share of voice in an industry';
COMMENT ON FUNCTION compare_competitors IS 'Generate a comparison object for two competitors';
