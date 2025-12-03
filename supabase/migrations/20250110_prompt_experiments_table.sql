-- ============================================================================
-- Prompt Experiments Table with Variants
-- Phase 4, Week 8 Extended - RLHF & Feedback Loop Checklist
--
-- This migration creates:
-- 1. prompt_experiments table for A/B testing prompts
-- 2. prompt_variants table for experiment variations
-- 3. prompt_experiment_results for tracking outcomes
-- 4. Helper functions for experiment management
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Experiment status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experiment_status') THEN
    CREATE TYPE experiment_status AS ENUM (
      'draft',      -- Being configured
      'scheduled',  -- Scheduled to start
      'running',    -- Currently active
      'paused',     -- Temporarily stopped
      'completed',  -- Finished normally
      'stopped',    -- Stopped early (winner found or issue)
      'archived'    -- Historical, no longer relevant
    );
  END IF;
END $$;

-- Experiment winner determination method
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'winner_method') THEN
    CREATE TYPE winner_method AS ENUM (
      'statistical',    -- Based on p-value threshold
      'bayesian',       -- Based on probability of being best
      'manual',         -- Human decision
      'timeout',        -- Experiment ended without clear winner
      'none'            -- No winner determined yet
    );
  END IF;
END $$;

-- ============================================================================
-- 2. PROMPT EXPERIMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  hypothesis TEXT,                            -- What we're testing

  -- Configuration
  experiment_type VARCHAR(100) NOT NULL,      -- e.g., 'perception_prompt', 'recommendation_prompt'
  target_metric VARCHAR(100) NOT NULL,        -- Primary metric to optimize
  secondary_metrics TEXT[] DEFAULT '{}',      -- Other metrics to track

  -- Status
  status experiment_status NOT NULL DEFAULT 'draft',

  -- Traffic allocation
  traffic_percentage INTEGER NOT NULL DEFAULT 100  -- % of eligible traffic
    CHECK (traffic_percentage > 0 AND traffic_percentage <= 100),

  -- Statistical configuration
  significance_level DECIMAL(4,3) NOT NULL DEFAULT 0.05
    CHECK (significance_level > 0 AND significance_level < 1),
  statistical_power DECIMAL(4,3) NOT NULL DEFAULT 0.80
    CHECK (statistical_power > 0 AND statistical_power < 1),
  minimum_detectable_effect DECIMAL(5,3) NOT NULL DEFAULT 0.05
    CHECK (minimum_detectable_effect > 0),
  required_sample_size INTEGER,               -- Calculated or manual

  -- Scheduling
  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Results
  winning_variant_id UUID,                    -- FK set after table creation
  winner_method winner_method DEFAULT 'none',
  final_p_value DECIMAL(10,8),
  final_confidence DECIMAL(5,4),
  conclusion TEXT,

  -- Targeting (who sees this experiment)
  targeting_rules JSONB DEFAULT '{}'::JSONB,  -- User/context criteria
  exclusion_rules JSONB DEFAULT '{}'::JSONB,  -- Who to exclude

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_prompt_experiments_updated_at
  BEFORE UPDATE ON prompt_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE prompt_experiments IS
'A/B testing framework for prompt variations with statistical significance';

-- ============================================================================
-- 3. PROMPT VARIANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent experiment
  experiment_id UUID NOT NULL REFERENCES prompt_experiments(id) ON DELETE CASCADE,

  -- Variant identification
  name VARCHAR(100) NOT NULL,                 -- e.g., 'control', 'variant_a'
  description TEXT,
  is_control BOOLEAN NOT NULL DEFAULT false,  -- Is this the baseline?

  -- The actual prompt
  prompt_template TEXT NOT NULL,              -- The prompt text with placeholders
  prompt_version VARCHAR(50),                 -- Version identifier
  system_prompt TEXT,                         -- Optional system prompt override
  model_override VARCHAR(100),                -- Optional model override

  -- Configuration
  weight INTEGER NOT NULL DEFAULT 1           -- Relative weight for traffic split
    CHECK (weight >= 0),
  max_tokens_override INTEGER,
  temperature_override DECIMAL(3,2)
    CHECK (temperature_override IS NULL OR (temperature_override >= 0 AND temperature_override <= 2)),

  -- Statistics (denormalized for performance)
  impressions INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(10,6) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0
      THEN conversions::DECIMAL / impressions
      ELSE 0
    END
  ) STORED,

  -- Metrics aggregates (updated periodically)
  metrics_aggregate JSONB DEFAULT '{}'::JSONB,  -- Sum/avg of tracked metrics
  last_metrics_update TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (experiment_id, name)
);

CREATE TRIGGER trigger_prompt_variants_updated_at
  BEFORE UPDATE ON prompt_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add FK for winning variant
ALTER TABLE prompt_experiments
  ADD CONSTRAINT fk_winning_variant
  FOREIGN KEY (winning_variant_id)
  REFERENCES prompt_variants(id)
  ON DELETE SET NULL;

COMMENT ON TABLE prompt_variants IS
'Individual variants within a prompt experiment';

-- ============================================================================
-- 4. PROMPT EXPERIMENT RESULTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS prompt_experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  experiment_id UUID NOT NULL REFERENCES prompt_experiments(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES prompt_variants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  analysis_id UUID,                           -- If tied to an analysis

  -- Assignment
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assignment_hash VARCHAR(64),                -- Deterministic assignment key

  -- Outcome
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10,4),             -- If conversion has a value
  converted_at TIMESTAMPTZ,

  -- Metrics
  primary_metric_value DECIMAL(10,4),
  secondary_metrics JSONB DEFAULT '{}'::JSONB,

  -- Context
  context JSONB DEFAULT '{}'::JSONB,          -- Request context at assignment time

  -- Timing
  response_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,6),

  -- Feedback
  user_rating INTEGER CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 5)),
  user_feedback TEXT,

  -- Quality signals
  was_cached BOOLEAN DEFAULT false,
  had_error BOOLEAN DEFAULT false,
  error_type VARCHAR(100),

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint to prevent duplicate assignments in same session
CREATE UNIQUE INDEX idx_experiment_results_unique_assignment
  ON prompt_experiment_results (experiment_id, user_id, DATE(assigned_at))
  WHERE user_id IS NOT NULL;

COMMENT ON TABLE prompt_experiment_results IS
'Individual results/impressions from prompt experiments';

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

-- Experiments
CREATE INDEX idx_experiments_status ON prompt_experiments (status);
CREATE INDEX idx_experiments_type ON prompt_experiments (experiment_type, status);
CREATE INDEX idx_experiments_dates ON prompt_experiments (started_at, ended_at)
  WHERE status IN ('running', 'completed');

-- Variants
CREATE INDEX idx_variants_experiment ON prompt_variants (experiment_id, is_active);
CREATE INDEX idx_variants_control ON prompt_variants (experiment_id)
  WHERE is_control = true;

-- Results
CREATE INDEX idx_results_experiment ON prompt_experiment_results (experiment_id, assigned_at DESC);
CREATE INDEX idx_results_variant ON prompt_experiment_results (variant_id, converted);
CREATE INDEX idx_results_user ON prompt_experiment_results (user_id, assigned_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_results_conversion ON prompt_experiment_results (experiment_id, converted, assigned_at)
  WHERE converted = true;

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Get active experiment for a given type
CREATE OR REPLACE FUNCTION get_active_experiment(
  p_experiment_type VARCHAR(100)
) RETURNS prompt_experiments AS $$
  SELECT * FROM prompt_experiments
  WHERE experiment_type = p_experiment_type
    AND status = 'running'
    AND (scheduled_start_at IS NULL OR scheduled_start_at <= CURRENT_TIMESTAMP)
    AND (scheduled_end_at IS NULL OR scheduled_end_at > CURRENT_TIMESTAMP)
  ORDER BY started_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_active_experiment IS
'Returns the currently active experiment for a given type';

-- Assign a variant to a user (deterministic)
CREATE OR REPLACE FUNCTION assign_variant(
  p_experiment_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_assignment_key TEXT DEFAULT NULL
) RETURNS prompt_variants AS $$
DECLARE
  v_experiment prompt_experiments;
  v_variant prompt_variants;
  v_hash_input TEXT;
  v_hash_value BIGINT;
  v_total_weight INTEGER;
  v_cumulative_weight INTEGER := 0;
  v_threshold INTEGER;
BEGIN
  -- Get experiment
  SELECT * INTO v_experiment
  FROM prompt_experiments
  WHERE id = p_experiment_id AND status = 'running';

  IF v_experiment IS NULL THEN
    RETURN NULL;
  END IF;

  -- Create deterministic hash input
  v_hash_input := COALESCE(p_assignment_key, COALESCE(p_user_id::TEXT, gen_random_uuid()::TEXT));

  -- Generate hash (using MD5 and converting first 8 bytes to bigint)
  v_hash_value := ('x' || substring(md5(p_experiment_id::TEXT || v_hash_input), 1, 8))::BIT(32)::BIGINT;
  v_hash_value := ABS(v_hash_value);

  -- Get total weight
  SELECT SUM(weight) INTO v_total_weight
  FROM prompt_variants
  WHERE experiment_id = p_experiment_id AND is_active = true;

  IF v_total_weight IS NULL OR v_total_weight = 0 THEN
    RETURN NULL;
  END IF;

  -- Calculate threshold
  v_threshold := v_hash_value % v_total_weight;

  -- Select variant based on weight
  FOR v_variant IN
    SELECT * FROM prompt_variants
    WHERE experiment_id = p_experiment_id AND is_active = true
    ORDER BY is_control DESC, name ASC
  LOOP
    v_cumulative_weight := v_cumulative_weight + v_variant.weight;
    IF v_threshold < v_cumulative_weight THEN
      RETURN v_variant;
    END IF;
  END LOOP;

  -- Fallback to first active variant
  SELECT * INTO v_variant
  FROM prompt_variants
  WHERE experiment_id = p_experiment_id AND is_active = true
  ORDER BY is_control DESC, name ASC
  LIMIT 1;

  RETURN v_variant;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION assign_variant IS
'Deterministically assigns a variant to a user based on weighted random selection';

-- Record an experiment result
CREATE OR REPLACE FUNCTION record_experiment_result(
  p_experiment_id UUID,
  p_variant_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_converted BOOLEAN DEFAULT false,
  p_primary_metric DECIMAL DEFAULT NULL,
  p_secondary_metrics JSONB DEFAULT '{}'::JSONB,
  p_context JSONB DEFAULT '{}'::JSONB,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT NULL,
  p_cost_usd DECIMAL DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_result_id UUID;
BEGIN
  INSERT INTO prompt_experiment_results (
    experiment_id, variant_id, user_id, converted,
    primary_metric_value, secondary_metrics, context,
    response_time_ms, tokens_used, cost_usd
  ) VALUES (
    p_experiment_id, p_variant_id, p_user_id, p_converted,
    p_primary_metric, p_secondary_metrics, p_context,
    p_response_time_ms, p_tokens_used, p_cost_usd
  )
  RETURNING id INTO v_result_id;

  -- Update variant counters
  UPDATE prompt_variants
  SET
    impressions = impressions + 1,
    conversions = conversions + CASE WHEN p_converted THEN 1 ELSE 0 END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_variant_id;

  RETURN v_result_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_experiment_result IS
'Records a result for an experiment and updates variant counters';

-- Calculate experiment statistics
CREATE OR REPLACE FUNCTION calculate_experiment_stats(
  p_experiment_id UUID
) RETURNS TABLE (
  variant_id UUID,
  variant_name VARCHAR,
  is_control BOOLEAN,
  impressions INTEGER,
  conversions INTEGER,
  conversion_rate DECIMAL,
  avg_primary_metric DECIMAL,
  vs_control_lift DECIMAL,
  p_value DECIMAL,
  is_significant BOOLEAN
) AS $$
DECLARE
  v_control_rate DECIMAL;
  v_control_count INTEGER;
  v_control_conversions INTEGER;
  v_significance_level DECIMAL;
BEGIN
  -- Get experiment settings
  SELECT significance_level INTO v_significance_level
  FROM prompt_experiments WHERE id = p_experiment_id;

  -- Get control stats
  SELECT pv.impressions, pv.conversions, pv.conversion_rate
  INTO v_control_count, v_control_conversions, v_control_rate
  FROM prompt_variants pv
  WHERE pv.experiment_id = p_experiment_id AND pv.is_control = true
  LIMIT 1;

  -- Return stats for all variants
  RETURN QUERY
  SELECT
    pv.id as variant_id,
    pv.name as variant_name,
    pv.is_control,
    pv.impressions,
    pv.conversions,
    pv.conversion_rate,
    (SELECT AVG(primary_metric_value)
     FROM prompt_experiment_results
     WHERE variant_id = pv.id AND primary_metric_value IS NOT NULL) as avg_primary_metric,
    CASE
      WHEN pv.is_control THEN 0
      WHEN v_control_rate > 0 THEN (pv.conversion_rate - v_control_rate) / v_control_rate
      ELSE NULL
    END as vs_control_lift,
    CASE
      WHEN pv.is_control THEN 1.0
      WHEN v_control_count > 0 AND pv.impressions > 0 THEN
        -- Simplified z-test p-value calculation
        (SELECT 2 * (1 - (
          1 / (1 + 0.2316419 * ABS(
            (pv.conversion_rate - v_control_rate) /
            NULLIF(SQRT(
              (v_control_rate * (1 - v_control_rate) / NULLIF(v_control_count, 0)) +
              (pv.conversion_rate * (1 - pv.conversion_rate) / NULLIF(pv.impressions, 0))
            ), 0)
          ))
        )))
      ELSE NULL
    END as p_value,
    CASE
      WHEN pv.is_control THEN false
      ELSE false  -- Will be calculated properly in app code
    END as is_significant
  FROM prompt_variants pv
  WHERE pv.experiment_id = p_experiment_id
  ORDER BY pv.is_control DESC, pv.conversion_rate DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_experiment_stats IS
'Calculates statistics for all variants in an experiment';

-- ============================================================================
-- 7. VIEWS
-- ============================================================================

-- Active experiments overview
CREATE OR REPLACE VIEW v_active_experiments AS
SELECT
  e.id,
  e.name,
  e.experiment_type,
  e.target_metric,
  e.status,
  e.traffic_percentage,
  e.started_at,
  COUNT(DISTINCT v.id) as variant_count,
  SUM(v.impressions) as total_impressions,
  SUM(v.conversions) as total_conversions,
  CASE
    WHEN SUM(v.impressions) > 0
    THEN SUM(v.conversions)::DECIMAL / SUM(v.impressions)
    ELSE 0
  END as overall_conversion_rate,
  e.required_sample_size,
  CASE
    WHEN e.required_sample_size > 0
    THEN LEAST(100, (SUM(v.impressions)::DECIMAL / e.required_sample_size * 100))
    ELSE NULL
  END as progress_percentage
FROM prompt_experiments e
LEFT JOIN prompt_variants v ON e.id = v.experiment_id AND v.is_active = true
WHERE e.status IN ('running', 'scheduled')
GROUP BY e.id
ORDER BY e.started_at DESC;

COMMENT ON VIEW v_active_experiments IS
'Overview of currently running or scheduled experiments';

-- Experiment results summary
CREATE OR REPLACE VIEW v_experiment_results_summary AS
SELECT
  e.id as experiment_id,
  e.name as experiment_name,
  v.id as variant_id,
  v.name as variant_name,
  v.is_control,
  v.impressions,
  v.conversions,
  v.conversion_rate,
  AVG(r.primary_metric_value) as avg_metric,
  STDDEV(r.primary_metric_value) as stddev_metric,
  AVG(r.response_time_ms) as avg_response_time_ms,
  AVG(r.cost_usd) as avg_cost,
  COUNT(DISTINCT r.user_id) as unique_users
FROM prompt_experiments e
JOIN prompt_variants v ON e.id = v.experiment_id
LEFT JOIN prompt_experiment_results r ON v.id = r.variant_id
GROUP BY e.id, e.name, v.id, v.name, v.is_control, v.impressions, v.conversions, v.conversion_rate
ORDER BY e.name, v.is_control DESC, v.name;

COMMENT ON VIEW v_experiment_results_summary IS
'Aggregated results summary for each experiment variant';

-- ============================================================================
-- 8. RLS POLICIES
-- ============================================================================

ALTER TABLE prompt_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_experiment_results ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access on experiments"
  ON prompt_experiments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on variants"
  ON prompt_variants FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on results"
  ON prompt_experiment_results FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users can view active experiments
CREATE POLICY "Users can view running experiments"
  ON prompt_experiments FOR SELECT TO authenticated
  USING (status IN ('running', 'completed'));

CREATE POLICY "Users can view active variants"
  ON prompt_variants FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM prompt_experiments e
    WHERE e.id = experiment_id AND e.status IN ('running', 'completed')
  ));

-- Users can view their own results
CREATE POLICY "Users can view own results"
  ON prompt_experiment_results FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 9. GRANTS
-- ============================================================================

GRANT SELECT ON v_active_experiments TO authenticated;
GRANT SELECT ON v_experiment_results_summary TO authenticated;

-- Functions
GRANT EXECUTE ON FUNCTION get_active_experiment TO authenticated;
GRANT EXECUTE ON FUNCTION assign_variant TO authenticated;
GRANT EXECUTE ON FUNCTION record_experiment_result TO service_role;
GRANT EXECUTE ON FUNCTION calculate_experiment_stats TO authenticated;
