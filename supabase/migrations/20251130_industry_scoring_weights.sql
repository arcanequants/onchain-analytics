-- ================================================================
-- Industry Scoring Weights Migration
-- Phase 1, Week 2, Day 6 - Domain Tasks
--
-- Defines scoring weights for each industry vertical to customize
-- brand/competitor evaluation criteria.
-- ================================================================

-- Industry scoring weights table
CREATE TABLE IF NOT EXISTS industry_scoring_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_slug VARCHAR(50) NOT NULL,
  industry_name VARCHAR(100) NOT NULL,

  -- Scoring dimensions and their weights (must sum to 1.0)
  weights JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Weight descriptions for UI
  weight_descriptions JSONB DEFAULT '{}'::jsonb,

  -- Minimum scores by dimension (floor values)
  minimum_scores JSONB DEFAULT '{}'::jsonb,

  -- Weight modifiers based on context
  context_modifiers JSONB DEFAULT '{}'::jsonb,

  -- Industry-specific evaluation notes
  evaluation_notes TEXT,

  -- Version for tracking changes
  version INTEGER DEFAULT 1,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_industry_weights UNIQUE (industry_slug),
  CONSTRAINT valid_weights CHECK (
    weights IS NOT NULL AND
    jsonb_typeof(weights) = 'object'
  )
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_industry_scoring_weights_slug
ON industry_scoring_weights(industry_slug);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_industry_scoring_weights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_industry_scoring_weights_timestamp
BEFORE UPDATE ON industry_scoring_weights
FOR EACH ROW
EXECUTE FUNCTION update_industry_scoring_weights_timestamp();

-- ================================================================
-- SEED DATA: 10 Priority Industry Verticals
-- ================================================================

INSERT INTO industry_scoring_weights (
  industry_slug,
  industry_name,
  weights,
  weight_descriptions,
  minimum_scores,
  context_modifiers,
  evaluation_notes
) VALUES
-- 1. SaaS / Software
(
  'saas',
  'SaaS / Software',
  '{
    "features": 0.30,
    "reliability": 0.25,
    "price": 0.20,
    "support": 0.15,
    "innovation": 0.10
  }'::jsonb,
  '{
    "features": "Breadth and depth of functionality, API capabilities, integrations",
    "reliability": "Uptime, SLA adherence, security certifications (SOC 2, etc.)",
    "price": "Value for money, pricing transparency, scalability of pricing",
    "support": "Response time, documentation quality, onboarding experience",
    "innovation": "Product roadmap, feature velocity, market leadership"
  }'::jsonb,
  '{
    "features": 0.3,
    "reliability": 0.5,
    "price": 0.2,
    "support": 0.3,
    "innovation": 0.2
  }'::jsonb,
  '{
    "enterprise": {"reliability": 0.05, "support": 0.05, "price": -0.05},
    "startup": {"price": 0.05, "innovation": 0.05, "features": -0.05},
    "regulated": {"reliability": 0.10, "innovation": -0.05}
  }'::jsonb,
  'SaaS evaluations prioritize reliability and features for enterprise buyers, while startups may weight price and innovation higher. Integration ecosystem is increasingly important.'
),

-- 2. Fintech / Financial Services
(
  'fintech',
  'Fintech / Financial Services',
  '{
    "trust": 0.35,
    "security": 0.25,
    "features": 0.20,
    "price": 0.15,
    "innovation": 0.05
  }'::jsonb,
  '{
    "trust": "Brand reputation, regulatory compliance, financial stability",
    "security": "PCI-DSS compliance, fraud prevention, encryption standards",
    "features": "Payment methods, reporting, API capabilities",
    "price": "Transaction fees, monthly costs, hidden fees transparency",
    "innovation": "New payment methods, blockchain integration, AI features"
  }'::jsonb,
  '{
    "trust": 0.6,
    "security": 0.6,
    "features": 0.3,
    "price": 0.2,
    "innovation": 0.1
  }'::jsonb,
  '{
    "high_volume": {"price": 0.10, "features": 0.05, "trust": -0.05},
    "international": {"features": 0.05, "trust": 0.05, "price": -0.05},
    "regulated": {"trust": 0.10, "security": 0.10, "innovation": -0.10}
  }'::jsonb,
  'Financial services evaluation heavily weights trust and security. Regulatory compliance is non-negotiable. Price becomes more important at higher transaction volumes.'
),

-- 3. Healthcare / Medical
(
  'healthcare',
  'Healthcare / Medical',
  '{
    "trust": 0.35,
    "outcomes": 0.30,
    "compliance": 0.25,
    "innovation": 0.10
  }'::jsonb,
  '{
    "trust": "Credentials, accreditations, patient reviews, reputation",
    "outcomes": "Clinical outcomes, success rates, quality metrics",
    "compliance": "HIPAA compliance, certifications, licensing",
    "innovation": "Technology adoption, telehealth capabilities, research"
  }'::jsonb,
  '{
    "trust": 0.6,
    "outcomes": 0.5,
    "compliance": 0.7,
    "innovation": 0.2
  }'::jsonb,
  '{
    "telehealth": {"innovation": 0.10, "compliance": 0.05, "outcomes": -0.05},
    "specialist": {"outcomes": 0.10, "trust": 0.05, "innovation": -0.05},
    "emergency": {"trust": 0.15, "outcomes": 0.10, "innovation": -0.15}
  }'::jsonb,
  'Healthcare evaluation prioritizes patient safety and clinical outcomes above all. Compliance is mandatory, not optional. Trust signals are critical for patient decisions.'
),

-- 4. E-commerce / Retail
(
  'ecommerce',
  'E-commerce / Retail',
  '{
    "product_quality": 0.30,
    "price": 0.25,
    "shipping": 0.20,
    "customer_service": 0.15,
    "selection": 0.10
  }'::jsonb,
  '{
    "product_quality": "Product authenticity, quality consistency, returns rate",
    "price": "Competitive pricing, value for money, promotions",
    "shipping": "Delivery speed, reliability, shipping costs, tracking",
    "customer_service": "Support responsiveness, return policy, resolution rate",
    "selection": "Product variety, availability, exclusive items"
  }'::jsonb,
  '{
    "product_quality": 0.4,
    "price": 0.2,
    "shipping": 0.3,
    "customer_service": 0.3,
    "selection": 0.2
  }'::jsonb,
  '{
    "luxury": {"product_quality": 0.15, "customer_service": 0.10, "price": -0.15},
    "fast_fashion": {"price": 0.10, "shipping": 0.10, "product_quality": -0.10},
    "b2b": {"price": 0.10, "selection": 0.10, "shipping": -0.05}
  }'::jsonb,
  'E-commerce evaluation balances product quality with price and convenience. Shipping speed has become increasingly important. Customer service matters most for high-value purchases.'
),

-- 5. Marketing & Advertising
(
  'marketing',
  'Marketing & Advertising',
  '{
    "results": 0.35,
    "creativity": 0.25,
    "strategy": 0.20,
    "price": 0.15,
    "communication": 0.05
  }'::jsonb,
  '{
    "results": "ROI, ROAS, case study outcomes, measurable impact",
    "creativity": "Creative quality, innovation, brand alignment",
    "strategy": "Strategic thinking, market understanding, data-driven approach",
    "price": "Value for spend, pricing transparency, budget efficiency",
    "communication": "Reporting frequency, responsiveness, proactive updates"
  }'::jsonb,
  '{
    "results": 0.4,
    "creativity": 0.3,
    "strategy": 0.3,
    "price": 0.2,
    "communication": 0.3
  }'::jsonb,
  '{
    "performance": {"results": 0.15, "strategy": 0.05, "creativity": -0.10},
    "brand": {"creativity": 0.15, "strategy": 0.05, "results": -0.10},
    "startup": {"price": 0.10, "results": 0.05, "creativity": -0.05}
  }'::jsonb,
  'Marketing evaluation prioritizes measurable results but creativity matters for brand campaigns. Strategy alignment is key for long-term partnerships.'
),

-- 6. Real Estate
(
  'real-estate',
  'Real Estate',
  '{
    "market_knowledge": 0.30,
    "responsiveness": 0.25,
    "track_record": 0.25,
    "fees": 0.15,
    "technology": 0.05
  }'::jsonb,
  '{
    "market_knowledge": "Local expertise, neighborhood knowledge, market timing",
    "responsiveness": "Communication speed, availability, proactive updates",
    "track_record": "Sales history, list-to-sale ratio, days on market",
    "fees": "Commission rates, fee transparency, negotiation willingness",
    "technology": "Online presence, virtual tours, digital marketing"
  }'::jsonb,
  '{
    "market_knowledge": 0.5,
    "responsiveness": 0.4,
    "track_record": 0.4,
    "fees": 0.2,
    "technology": 0.2
  }'::jsonb,
  '{
    "luxury": {"market_knowledge": 0.10, "track_record": 0.10, "fees": -0.10},
    "first_time_buyer": {"responsiveness": 0.10, "fees": 0.05, "track_record": -0.05},
    "investment": {"market_knowledge": 0.10, "track_record": 0.05, "responsiveness": -0.05}
  }'::jsonb,
  'Real estate is hyperlocal - market knowledge and responsiveness are paramount. Track record matters but varies by market conditions. Technology is table stakes but not differentiating.'
),

-- 7. Legal Services
(
  'legal',
  'Legal Services',
  '{
    "expertise": 0.40,
    "track_record": 0.30,
    "reputation": 0.20,
    "accessibility": 0.10
  }'::jsonb,
  '{
    "expertise": "Specialization depth, relevant case experience, credentials",
    "track_record": "Case outcomes, settlement amounts, win rates",
    "reputation": "Peer recognition, bar standing, client testimonials",
    "accessibility": "Communication style, fee structure clarity, responsiveness"
  }'::jsonb,
  '{
    "expertise": 0.6,
    "track_record": 0.4,
    "reputation": 0.4,
    "accessibility": 0.3
  }'::jsonb,
  '{
    "litigation": {"track_record": 0.15, "expertise": 0.05, "accessibility": -0.10},
    "transactional": {"expertise": 0.10, "accessibility": 0.10, "track_record": -0.10},
    "small_business": {"accessibility": 0.15, "reputation": -0.05, "expertise": -0.05}
  }'::jsonb,
  'Legal evaluation heavily weights expertise and track record. For litigation, outcomes matter most. For transactional work, expertise and efficiency dominate.'
),

-- 8. Education & EdTech
(
  'education',
  'Education & EdTech',
  '{
    "quality": 0.35,
    "outcomes": 0.30,
    "price": 0.20,
    "flexibility": 0.10,
    "support": 0.05
  }'::jsonb,
  '{
    "quality": "Curriculum rigor, instructor credentials, content depth",
    "outcomes": "Job placement, skill acquisition, certification value",
    "price": "Tuition cost, ROI, financial aid availability",
    "flexibility": "Schedule options, self-pacing, format variety",
    "support": "Career services, mentorship, student community"
  }'::jsonb,
  '{
    "quality": 0.5,
    "outcomes": 0.4,
    "price": 0.2,
    "flexibility": 0.3,
    "support": 0.3
  }'::jsonb,
  '{
    "career_change": {"outcomes": 0.15, "flexibility": 0.05, "quality": -0.10},
    "upskilling": {"flexibility": 0.10, "price": 0.05, "outcomes": -0.05},
    "degree": {"quality": 0.10, "outcomes": 0.05, "flexibility": -0.10}
  }'::jsonb,
  'Education evaluation balances quality with outcomes. Career changers prioritize job placement; professionals prioritize flexibility. ROI consciousness is increasing.'
),

-- 9. Hospitality & Travel
(
  'hospitality',
  'Hospitality & Travel',
  '{
    "location": 0.30,
    "service": 0.25,
    "amenities": 0.20,
    "price": 0.20,
    "cleanliness": 0.05
  }'::jsonb,
  '{
    "location": "Proximity to attractions, neighborhood safety, accessibility",
    "service": "Staff friendliness, responsiveness, personalization",
    "amenities": "Room quality, facilities, dining options, technology",
    "price": "Value for money, rate transparency, loyalty program value",
    "cleanliness": "Room cleanliness, common areas, safety protocols"
  }'::jsonb,
  '{
    "location": 0.5,
    "service": 0.4,
    "amenities": 0.3,
    "price": 0.2,
    "cleanliness": 0.6
  }'::jsonb,
  '{
    "business": {"location": 0.10, "amenities": 0.05, "price": -0.05},
    "leisure": {"amenities": 0.10, "price": 0.05, "service": -0.05},
    "luxury": {"service": 0.15, "amenities": 0.10, "price": -0.15}
  }'::jsonb,
  'Hospitality evaluation varies significantly by travel purpose. Location is paramount for business travel; amenities matter more for leisure. Cleanliness is baseline expectation post-pandemic.'
),

-- 10. Restaurant & Food Service
(
  'restaurant',
  'Restaurant & Food Service',
  '{
    "food_quality": 0.35,
    "service": 0.25,
    "ambiance": 0.20,
    "value": 0.15,
    "cleanliness": 0.05
  }'::jsonb,
  '{
    "food_quality": "Taste, freshness, consistency, presentation",
    "service": "Attentiveness, friendliness, efficiency, knowledge",
    "ambiance": "Atmosphere, noise level, decor, comfort",
    "value": "Portion size, price point, special offers",
    "cleanliness": "Dining area, restrooms, visible kitchen"
  }'::jsonb,
  '{
    "food_quality": 0.5,
    "service": 0.4,
    "ambiance": 0.3,
    "value": 0.3,
    "cleanliness": 0.6
  }'::jsonb,
  '{
    "fine_dining": {"service": 0.15, "ambiance": 0.10, "value": -0.15},
    "casual": {"value": 0.10, "food_quality": 0.05, "ambiance": -0.10},
    "takeout": {"food_quality": 0.10, "value": 0.05, "ambiance": -0.20, "service": -0.05}
  }'::jsonb,
  'Restaurant evaluation centers on food quality but context matters. Fine dining emphasizes service and ambiance; casual dining prioritizes value. Health scores are increasingly visible.'
)
ON CONFLICT (industry_slug) DO UPDATE SET
  industry_name = EXCLUDED.industry_name,
  weights = EXCLUDED.weights,
  weight_descriptions = EXCLUDED.weight_descriptions,
  minimum_scores = EXCLUDED.minimum_scores,
  context_modifiers = EXCLUDED.context_modifiers,
  evaluation_notes = EXCLUDED.evaluation_notes;

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Get scoring weights for an industry
CREATE OR REPLACE FUNCTION get_industry_weights(p_industry_slug VARCHAR)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT weights INTO result
  FROM industry_scoring_weights
  WHERE industry_slug = p_industry_slug;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Get modified weights based on context
CREATE OR REPLACE FUNCTION get_modified_weights(
  p_industry_slug VARCHAR,
  p_context VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  base_weights JSONB;
  modifiers JSONB;
  context_mod JSONB;
  result JSONB;
  key TEXT;
  val NUMERIC;
BEGIN
  -- Get base weights
  SELECT weights, context_modifiers
  INTO base_weights, modifiers
  FROM industry_scoring_weights
  WHERE industry_slug = p_industry_slug;

  IF base_weights IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  -- If no context, return base weights
  IF p_context IS NULL THEN
    RETURN base_weights;
  END IF;

  -- Get context-specific modifiers
  context_mod := modifiers->p_context;

  IF context_mod IS NULL THEN
    RETURN base_weights;
  END IF;

  -- Apply modifiers to base weights
  result := base_weights;
  FOR key, val IN SELECT * FROM jsonb_each_text(context_mod)
  LOOP
    IF result ? key THEN
      result := jsonb_set(
        result,
        ARRAY[key],
        to_jsonb((result->>key)::numeric + val::numeric)
      );
    END IF;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Calculate weighted score
CREATE OR REPLACE FUNCTION calculate_weighted_score(
  p_industry_slug VARCHAR,
  p_dimension_scores JSONB,
  p_context VARCHAR DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  weights JSONB;
  minimums JSONB;
  key TEXT;
  weight_val NUMERIC;
  score_val NUMERIC;
  total_score NUMERIC := 0;
  dimension_count INTEGER := 0;
BEGIN
  -- Get weights (potentially modified by context)
  weights := get_modified_weights(p_industry_slug, p_context);

  -- Get minimums
  SELECT minimum_scores INTO minimums
  FROM industry_scoring_weights
  WHERE industry_slug = p_industry_slug;

  IF weights IS NULL OR weights = '{}'::jsonb THEN
    RETURN NULL;
  END IF;

  -- Calculate weighted sum
  FOR key, weight_val IN SELECT * FROM jsonb_each_text(weights)
  LOOP
    IF p_dimension_scores ? key THEN
      score_val := (p_dimension_scores->>key)::numeric;

      -- Apply minimum if score is below threshold
      IF minimums ? key AND score_val < (minimums->>key)::numeric THEN
        -- Score below minimum triggers penalty
        score_val := score_val * 0.5;
      END IF;

      total_score := total_score + (score_val * weight_val::numeric);
      dimension_count := dimension_count + 1;
    END IF;
  END LOOP;

  IF dimension_count = 0 THEN
    RETURN NULL;
  END IF;

  RETURN ROUND(total_score, 2);
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE industry_scoring_weights ENABLE ROW LEVEL SECURITY;

-- Anyone can read scoring weights
CREATE POLICY "Anyone can view scoring weights"
ON industry_scoring_weights FOR SELECT
USING (true);

-- Only authenticated users with admin role can modify
CREATE POLICY "Admins can modify scoring weights"
ON industry_scoring_weights FOR ALL
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE industry_scoring_weights IS 'Scoring weights by industry for brand/competitor evaluation';
COMMENT ON COLUMN industry_scoring_weights.weights IS 'JSON object with dimension names and their weights (must sum to 1.0)';
COMMENT ON COLUMN industry_scoring_weights.weight_descriptions IS 'Human-readable descriptions of each scoring dimension';
COMMENT ON COLUMN industry_scoring_weights.minimum_scores IS 'Minimum acceptable scores per dimension (floor values)';
COMMENT ON COLUMN industry_scoring_weights.context_modifiers IS 'Weight adjustments based on evaluation context (enterprise, startup, etc.)';
COMMENT ON FUNCTION get_industry_weights IS 'Get base scoring weights for an industry';
COMMENT ON FUNCTION get_modified_weights IS 'Get scoring weights with context-specific adjustments';
COMMENT ON FUNCTION calculate_weighted_score IS 'Calculate overall weighted score from dimension scores';
