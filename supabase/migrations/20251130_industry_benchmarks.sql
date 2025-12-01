-- ================================================================
-- INDUSTRY BENCHMARKS TABLE - Baseline Performance Metrics
-- Version: 1.0
-- Date: 2025-11-30
-- Phase 1, Week 2, Day 5
-- Based on EXECUTIVE-ROADMAP-BCG.md Domain Tasks
-- ================================================================

-- ================================================================
-- TABLE: industry_benchmarks
-- Industry-specific benchmark data for scoring and comparison
-- ================================================================
CREATE TABLE IF NOT EXISTS industry_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Industry reference
  industry_id UUID NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  industry_slug TEXT NOT NULL,

  -- Benchmark category
  metric_category TEXT NOT NULL CHECK (metric_category IN (
    'visibility', 'sentiment', 'authority', 'engagement',
    'conversion', 'satisfaction', 'trust', 'innovation'
  )),
  metric_name TEXT NOT NULL,
  metric_description TEXT,

  -- Benchmark values (percentiles)
  p10_value DECIMAL(10,4), -- 10th percentile (poor)
  p25_value DECIMAL(10,4), -- 25th percentile (below average)
  p50_value DECIMAL(10,4), -- 50th percentile (average)
  p75_value DECIMAL(10,4), -- 75th percentile (above average)
  p90_value DECIMAL(10,4), -- 90th percentile (excellent)

  -- Value metadata
  value_unit TEXT NOT NULL DEFAULT 'score', -- score, percentage, count, rating
  value_range_min DECIMAL(10,4),
  value_range_max DECIMAL(10,4),
  higher_is_better BOOLEAN NOT NULL DEFAULT true,

  -- Weighting
  weight_in_category DECIMAL(3,2) DEFAULT 1.0, -- 0.00 to 1.00
  is_primary_metric BOOLEAN NOT NULL DEFAULT false,

  -- Data source and quality
  data_source TEXT, -- Where benchmark data comes from
  sample_size INTEGER, -- Number of companies in benchmark
  last_updated DATE NOT NULL DEFAULT CURRENT_DATE,
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(industry_slug, metric_category, metric_name, version)
);

-- ================================================================
-- INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_industry ON industry_benchmarks(industry_id);
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_slug ON industry_benchmarks(industry_slug);
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_category ON industry_benchmarks(metric_category);
CREATE INDEX IF NOT EXISTS idx_industry_benchmarks_active ON industry_benchmarks(is_active) WHERE is_active = true;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE industry_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active benchmarks" ON industry_benchmarks
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access" ON industry_benchmarks
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TRIGGER: Auto-update updated_at
-- ================================================================
CREATE TRIGGER update_industry_benchmarks_updated_at
  BEFORE UPDATE ON industry_benchmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE: benchmark_scores
-- Store calculated scores for analyses against benchmarks
-- ================================================================
CREATE TABLE IF NOT EXISTS benchmark_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  benchmark_id UUID NOT NULL REFERENCES industry_benchmarks(id) ON DELETE CASCADE,

  -- Score data
  raw_value DECIMAL(10,4) NOT NULL,
  percentile_rank INTEGER CHECK (percentile_rank >= 0 AND percentile_rank <= 100),
  normalized_score DECIMAL(5,2) CHECK (normalized_score >= 0 AND normalized_score <= 100),

  -- Comparison
  vs_industry_average DECIMAL(5,2), -- +/- percentage vs P50
  trend_direction TEXT CHECK (trend_direction IN ('improving', 'stable', 'declining')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(analysis_id, benchmark_id)
);

-- Indexes for benchmark_scores
CREATE INDEX IF NOT EXISTS idx_benchmark_scores_analysis ON benchmark_scores(analysis_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_scores_benchmark ON benchmark_scores(benchmark_id);

-- RLS for benchmark_scores
ALTER TABLE benchmark_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analysis scores" ON benchmark_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM analyses
      WHERE analyses.id = benchmark_scores.analysis_id
      AND (analyses.user_id = auth.uid() OR analyses.is_public = true)
    )
  );

CREATE POLICY "Service role full access" ON benchmark_scores
  FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Function: Calculate percentile rank for a value
CREATE OR REPLACE FUNCTION calculate_percentile_rank(
  p_industry_slug TEXT,
  p_metric_category TEXT,
  p_metric_name TEXT,
  p_value DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_benchmark industry_benchmarks%ROWTYPE;
  v_percentile INTEGER;
BEGIN
  -- Get benchmark
  SELECT * INTO v_benchmark
  FROM industry_benchmarks
  WHERE industry_slug = p_industry_slug
    AND metric_category = p_metric_category
    AND metric_name = p_metric_name
    AND is_active = true
  ORDER BY version DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Calculate percentile based on value position
  IF v_benchmark.higher_is_better THEN
    IF p_value <= v_benchmark.p10_value THEN
      v_percentile := 5 + (p_value / NULLIF(v_benchmark.p10_value, 0) * 5)::INTEGER;
    ELSIF p_value <= v_benchmark.p25_value THEN
      v_percentile := 10 + ((p_value - v_benchmark.p10_value) / NULLIF(v_benchmark.p25_value - v_benchmark.p10_value, 0) * 15)::INTEGER;
    ELSIF p_value <= v_benchmark.p50_value THEN
      v_percentile := 25 + ((p_value - v_benchmark.p25_value) / NULLIF(v_benchmark.p50_value - v_benchmark.p25_value, 0) * 25)::INTEGER;
    ELSIF p_value <= v_benchmark.p75_value THEN
      v_percentile := 50 + ((p_value - v_benchmark.p50_value) / NULLIF(v_benchmark.p75_value - v_benchmark.p50_value, 0) * 25)::INTEGER;
    ELSIF p_value <= v_benchmark.p90_value THEN
      v_percentile := 75 + ((p_value - v_benchmark.p75_value) / NULLIF(v_benchmark.p90_value - v_benchmark.p75_value, 0) * 15)::INTEGER;
    ELSE
      v_percentile := 90 + LEAST(((p_value - v_benchmark.p90_value) / NULLIF(v_benchmark.p90_value, 0) * 10)::INTEGER, 10);
    END IF;
  ELSE
    -- Lower is better (invert logic)
    IF p_value >= v_benchmark.p10_value THEN
      v_percentile := 5;
    ELSIF p_value >= v_benchmark.p25_value THEN
      v_percentile := 10 + ((v_benchmark.p10_value - p_value) / NULLIF(v_benchmark.p10_value - v_benchmark.p25_value, 0) * 15)::INTEGER;
    ELSIF p_value >= v_benchmark.p50_value THEN
      v_percentile := 25 + ((v_benchmark.p25_value - p_value) / NULLIF(v_benchmark.p25_value - v_benchmark.p50_value, 0) * 25)::INTEGER;
    ELSIF p_value >= v_benchmark.p75_value THEN
      v_percentile := 50 + ((v_benchmark.p50_value - p_value) / NULLIF(v_benchmark.p50_value - v_benchmark.p75_value, 0) * 25)::INTEGER;
    ELSIF p_value >= v_benchmark.p90_value THEN
      v_percentile := 75 + ((v_benchmark.p75_value - p_value) / NULLIF(v_benchmark.p75_value - v_benchmark.p90_value, 0) * 15)::INTEGER;
    ELSE
      v_percentile := 95;
    END IF;
  END IF;

  RETURN GREATEST(1, LEAST(99, v_percentile));
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get benchmark summary for industry
CREATE OR REPLACE FUNCTION get_industry_benchmark_summary(p_industry_slug TEXT)
RETURNS TABLE(
  metric_category TEXT,
  metric_count INTEGER,
  avg_p50_value DECIMAL,
  primary_metrics TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ib.metric_category,
    COUNT(*)::INTEGER as metric_count,
    AVG(ib.p50_value) as avg_p50_value,
    ARRAY_AGG(ib.metric_name) FILTER (WHERE ib.is_primary_metric) as primary_metrics
  FROM industry_benchmarks ib
  WHERE ib.industry_slug = p_industry_slug
    AND ib.is_active = true
  GROUP BY ib.metric_category
  ORDER BY metric_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ================================================================
-- SEED DATA: Initial 10-Vertical Benchmarks
-- ================================================================

DO $$
DECLARE
  v_saas_id UUID;
  v_fintech_id UUID;
  v_healthcare_id UUID;
  v_ecommerce_id UUID;
  v_marketing_id UUID;
  v_real_estate_id UUID;
  v_legal_id UUID;
  v_education_id UUID;
  v_hospitality_id UUID;
  v_restaurant_id UUID;
BEGIN
  -- Get industry IDs
  SELECT id INTO v_saas_id FROM industries WHERE slug = 'saas' LIMIT 1;
  SELECT id INTO v_fintech_id FROM industries WHERE slug = 'fintech' LIMIT 1;
  SELECT id INTO v_healthcare_id FROM industries WHERE slug IN ('healthcare', 'healthtech') LIMIT 1;
  SELECT id INTO v_ecommerce_id FROM industries WHERE slug = 'ecommerce' LIMIT 1;
  SELECT id INTO v_marketing_id FROM industries WHERE slug = 'marketing' LIMIT 1;
  SELECT id INTO v_real_estate_id FROM industries WHERE slug = 'real-estate' LIMIT 1;
  SELECT id INTO v_legal_id FROM industries WHERE slug IN ('legal', 'professional-services') LIMIT 1;
  SELECT id INTO v_education_id FROM industries WHERE slug IN ('education', 'edtech') LIMIT 1;
  SELECT id INTO v_hospitality_id FROM industries WHERE slug IN ('hospitality', 'travel') LIMIT 1;
  SELECT id INTO v_restaurant_id FROM industries WHERE slug IN ('restaurant', 'food-beverage') LIMIT 1;

  -- ================================================================
  -- SaaS Benchmarks
  -- ================================================================
  IF v_saas_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_saas_id, 'saas', 'visibility', 'AI Mention Rate', 'Frequency of brand mentions in AI responses', 5, 15, 30, 50, 70, 'percentage', true, true, 'Internal analysis'),
      (v_saas_id, 'saas', 'visibility', 'Search Position', 'Average position in AI recommendations', 8, 6, 4, 2, 1, 'position', false, false, 'Internal analysis'),
      (v_saas_id, 'saas', 'sentiment', 'Positive Mention Rate', 'Percentage of positive brand mentions', 40, 55, 70, 82, 92, 'percentage', true, true, 'Internal analysis'),
      (v_saas_id, 'saas', 'sentiment', 'Feature Satisfaction', 'AI-reported feature satisfaction score', 3.0, 3.5, 4.0, 4.3, 4.7, 'rating', true, false, 'Internal analysis'),
      (v_saas_id, 'saas', 'authority', 'Industry Leadership Score', 'Recognition as industry leader', 20, 35, 50, 68, 85, 'score', true, true, 'Internal analysis'),
      (v_saas_id, 'saas', 'trust', 'Security Compliance Score', 'Certification and security recognition', 30, 50, 70, 85, 95, 'score', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- Fintech Benchmarks
  -- ================================================================
  IF v_fintech_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_fintech_id, 'fintech', 'visibility', 'AI Mention Rate', 'Frequency of brand mentions in AI responses', 3, 10, 25, 45, 65, 'percentage', true, true, 'Internal analysis'),
      (v_fintech_id, 'fintech', 'trust', 'Regulatory Compliance Score', 'Recognition of compliance status', 50, 65, 80, 90, 98, 'score', true, true, 'Internal analysis'),
      (v_fintech_id, 'fintech', 'trust', 'Security Perception', 'AI-assessed security reputation', 40, 55, 72, 85, 95, 'score', true, true, 'Internal analysis'),
      (v_fintech_id, 'fintech', 'sentiment', 'User Trust Score', 'Positive trust indicators mentioned', 35, 50, 65, 78, 90, 'score', true, false, 'Internal analysis'),
      (v_fintech_id, 'fintech', 'authority', 'Financial Authority Score', 'Recognition as trusted financial service', 25, 40, 55, 72, 88, 'score', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- Healthcare Benchmarks
  -- ================================================================
  IF v_healthcare_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_healthcare_id, 'healthcare', 'visibility', 'AI Mention Rate', 'Frequency of brand mentions in AI responses', 5, 12, 28, 48, 68, 'percentage', true, true, 'Internal analysis'),
      (v_healthcare_id, 'healthcare', 'trust', 'Clinical Trust Score', 'Recognition of clinical quality', 45, 60, 75, 88, 96, 'score', true, true, 'Internal analysis'),
      (v_healthcare_id, 'healthcare', 'trust', 'HIPAA Compliance Recognition', 'Acknowledgment of compliance', 60, 75, 85, 92, 98, 'score', true, true, 'Internal analysis'),
      (v_healthcare_id, 'healthcare', 'authority', 'Medical Authority Score', 'Recognition as healthcare authority', 30, 45, 62, 78, 90, 'score', true, false, 'Internal analysis'),
      (v_healthcare_id, 'healthcare', 'satisfaction', 'Patient Satisfaction Proxy', 'AI-inferred patient satisfaction', 3.2, 3.6, 4.0, 4.4, 4.8, 'rating', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- E-commerce Benchmarks
  -- ================================================================
  IF v_ecommerce_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_ecommerce_id, 'ecommerce', 'visibility', 'AI Recommendation Rate', 'Frequency of product recommendations', 8, 18, 35, 55, 75, 'percentage', true, true, 'Internal analysis'),
      (v_ecommerce_id, 'ecommerce', 'sentiment', 'Product Quality Score', 'AI-assessed product quality perception', 3.0, 3.5, 4.0, 4.4, 4.8, 'rating', true, true, 'Internal analysis'),
      (v_ecommerce_id, 'ecommerce', 'trust', 'Buyer Trust Score', 'Trust indicators for online shopping', 40, 55, 70, 82, 92, 'score', true, false, 'Internal analysis'),
      (v_ecommerce_id, 'ecommerce', 'satisfaction', 'Shipping Reliability Score', 'Perceived shipping/delivery reliability', 50, 65, 78, 88, 95, 'score', true, false, 'Internal analysis'),
      (v_ecommerce_id, 'ecommerce', 'authority', 'Category Leadership', 'Recognition as category leader', 15, 30, 48, 68, 85, 'score', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- Marketing Benchmarks
  -- ================================================================
  IF v_marketing_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_marketing_id, 'marketing', 'visibility', 'AI Mention Rate', 'Frequency of tool/agency mentions', 5, 15, 32, 52, 72, 'percentage', true, true, 'Internal analysis'),
      (v_marketing_id, 'marketing', 'authority', 'Industry Expertise Score', 'Recognition of marketing expertise', 25, 40, 58, 75, 88, 'score', true, true, 'Internal analysis'),
      (v_marketing_id, 'marketing', 'trust', 'ROI Credibility Score', 'Trust in reported results', 30, 45, 62, 78, 90, 'score', true, false, 'Internal analysis'),
      (v_marketing_id, 'marketing', 'innovation', 'Innovation Score', 'Recognition for innovation', 20, 35, 50, 68, 85, 'score', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- Real Estate Benchmarks
  -- ================================================================
  IF v_real_estate_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_real_estate_id, 'real-estate', 'visibility', 'AI Mention Rate', 'Frequency of agent/company mentions', 5, 12, 28, 48, 68, 'percentage', true, true, 'Internal analysis'),
      (v_real_estate_id, 'real-estate', 'authority', 'Local Market Authority', 'Recognition as local expert', 25, 42, 60, 78, 90, 'score', true, true, 'Internal analysis'),
      (v_real_estate_id, 'real-estate', 'trust', 'Transaction Trust Score', 'Trust for property transactions', 40, 55, 70, 83, 93, 'score', true, false, 'Internal analysis'),
      (v_real_estate_id, 'real-estate', 'satisfaction', 'Client Satisfaction Proxy', 'AI-inferred client satisfaction', 3.2, 3.6, 4.1, 4.5, 4.8, 'rating', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- Legal Benchmarks
  -- ================================================================
  IF v_legal_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_legal_id, 'legal', 'visibility', 'AI Mention Rate', 'Frequency of firm/lawyer mentions', 3, 10, 25, 45, 65, 'percentage', true, true, 'Internal analysis'),
      (v_legal_id, 'legal', 'authority', 'Legal Expertise Score', 'Recognition of legal expertise', 30, 48, 65, 80, 92, 'score', true, true, 'Internal analysis'),
      (v_legal_id, 'legal', 'trust', 'Professional Trust Score', 'Trust in professional services', 45, 60, 75, 87, 95, 'score', true, true, 'Internal analysis'),
      (v_legal_id, 'legal', 'authority', 'Specialization Recognition', 'Known for practice area expertise', 25, 40, 58, 75, 88, 'score', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- Education Benchmarks
  -- ================================================================
  IF v_education_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_education_id, 'education', 'visibility', 'AI Recommendation Rate', 'Frequency of program recommendations', 5, 15, 30, 50, 70, 'percentage', true, true, 'Internal analysis'),
      (v_education_id, 'education', 'authority', 'Academic Authority Score', 'Recognition of educational quality', 35, 50, 68, 82, 93, 'score', true, true, 'Internal analysis'),
      (v_education_id, 'education', 'trust', 'Accreditation Trust Score', 'Recognition of accreditation status', 50, 68, 82, 92, 98, 'score', true, true, 'Internal analysis'),
      (v_education_id, 'education', 'satisfaction', 'Student Outcome Score', 'AI-assessed graduation/placement perception', 40, 55, 70, 82, 92, 'score', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- Hospitality Benchmarks
  -- ================================================================
  IF v_hospitality_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_hospitality_id, 'hospitality', 'visibility', 'AI Recommendation Rate', 'Frequency of property recommendations', 8, 18, 35, 55, 75, 'percentage', true, true, 'Internal analysis'),
      (v_hospitality_id, 'hospitality', 'sentiment', 'Guest Experience Score', 'AI-assessed guest experience quality', 3.2, 3.7, 4.1, 4.5, 4.8, 'rating', true, true, 'Internal analysis'),
      (v_hospitality_id, 'hospitality', 'trust', 'Booking Trust Score', 'Trust for booking/reservations', 45, 60, 75, 85, 93, 'score', true, false, 'Internal analysis'),
      (v_hospitality_id, 'hospitality', 'satisfaction', 'Amenity Satisfaction', 'Perceived amenity quality', 3.0, 3.5, 4.0, 4.4, 4.7, 'rating', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

  -- ================================================================
  -- Restaurant Benchmarks
  -- ================================================================
  IF v_restaurant_id IS NOT NULL THEN
    INSERT INTO industry_benchmarks (industry_id, industry_slug, metric_category, metric_name, metric_description, p10_value, p25_value, p50_value, p75_value, p90_value, value_unit, higher_is_better, is_primary_metric, data_source)
    VALUES
      (v_restaurant_id, 'restaurant', 'visibility', 'AI Recommendation Rate', 'Frequency of restaurant recommendations', 5, 15, 32, 52, 72, 'percentage', true, true, 'Internal analysis'),
      (v_restaurant_id, 'restaurant', 'sentiment', 'Food Quality Score', 'AI-assessed food quality perception', 3.2, 3.7, 4.1, 4.5, 4.8, 'rating', true, true, 'Internal analysis'),
      (v_restaurant_id, 'restaurant', 'trust', 'Hygiene Trust Score', 'Trust in food safety/hygiene', 50, 65, 80, 90, 97, 'score', true, true, 'Internal analysis'),
      (v_restaurant_id, 'restaurant', 'satisfaction', 'Service Quality Score', 'Perceived service quality', 3.0, 3.5, 4.0, 4.4, 4.7, 'rating', true, false, 'Internal analysis'),
      (v_restaurant_id, 'restaurant', 'authority', 'Culinary Authority', 'Recognition for culinary excellence', 20, 35, 52, 70, 85, 'score', true, false, 'Internal analysis')
    ON CONFLICT (industry_slug, metric_category, metric_name, version) DO NOTHING;
  END IF;

END $$;

-- ================================================================
-- DEPLOYMENT COMPLETE
-- ================================================================
-- Tables created: 2 (industry_benchmarks, benchmark_scores)
-- Functions created: 2 (calculate_percentile_rank, get_industry_benchmark_summary)
-- Seed data: ~45 benchmark metrics across 10 verticals
-- ================================================================
