-- ============================================================================
-- RLHF PREFERENCE PAIRS & CALIBRATION TABLES
-- Tables for preference learning and score calibration
-- Version: 1.0
-- Last Updated: 2025-11-30
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Preference source enum
CREATE TYPE preference_source AS ENUM (
  'explicit_comparison',  -- User directly compared two analyses
  'implicit_behavior',    -- Inferred from user behavior (clicks, dwell time)
  'expert_labeling',      -- Domain expert labeled the pair
  'automated_mining'      -- Auto-generated from signals
);

-- Calibration scope enum
CREATE TYPE calibration_scope AS ENUM (
  'global',     -- Applies to all analyses
  'industry',   -- Industry-specific calibration
  'user',       -- User-specific calibration
  'brand'       -- Brand-specific calibration
);

-- ============================================================================
-- TABLE: preference_pairs
-- Stores A > B preference pairs for RLHF training
-- ============================================================================

CREATE TABLE public.preference_pairs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The two analyses being compared
  analysis_a_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  analysis_b_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,

  -- Which analysis was preferred (a, b, or tie)
  preferred TEXT NOT NULL CHECK (preferred IN ('a', 'b', 'tie', 'skip')),

  -- Confidence/strength of preference (0-1)
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,

  -- Source of the preference
  source preference_source NOT NULL DEFAULT 'implicit_behavior',

  -- Who made the preference (null for implicit)
  labeler_user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  labeler_type TEXT CHECK (labeler_type IN ('user', 'expert', 'system')),

  -- Context for the comparison
  comparison_context JSONB DEFAULT '{}',
  -- e.g., { "prompt_shown": "Which analysis is more helpful?", "time_shown_ms": 5000 }

  -- Signals used for implicit preference
  signals JSONB DEFAULT '{}',
  -- e.g., { "a_dwell_time_ms": 45000, "b_dwell_time_ms": 12000, "a_clicked": true, "b_clicked": false }

  -- Industry context (for industry-specific training)
  industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL,

  -- Quality indicators
  is_high_quality BOOLEAN DEFAULT FALSE,
  quality_score DECIMAL(3,2), -- 0-1, based on labeler reliability + context

  -- Processing status
  is_used_in_training BOOLEAN DEFAULT FALSE,
  training_batch_id TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_different_analyses
    CHECK (analysis_a_id != analysis_b_id),
  CONSTRAINT chk_confidence_range
    CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT chk_quality_score_range
    CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1))
);

-- Indexes
CREATE INDEX idx_preference_pairs_analysis_a ON public.preference_pairs(analysis_a_id);
CREATE INDEX idx_preference_pairs_analysis_b ON public.preference_pairs(analysis_b_id);
CREATE INDEX idx_preference_pairs_labeler ON public.preference_pairs(labeler_user_id);
CREATE INDEX idx_preference_pairs_source ON public.preference_pairs(source);
CREATE INDEX idx_preference_pairs_industry ON public.preference_pairs(industry_id);
CREATE INDEX idx_preference_pairs_created_at ON public.preference_pairs(created_at DESC);
CREATE INDEX idx_preference_pairs_untrained ON public.preference_pairs(created_at)
  WHERE is_used_in_training = FALSE;
CREATE INDEX idx_preference_pairs_high_quality ON public.preference_pairs(created_at)
  WHERE is_high_quality = TRUE;

-- Composite index for finding pairs by analyses
CREATE INDEX idx_preference_pairs_analyses
  ON public.preference_pairs(analysis_a_id, analysis_b_id);

-- RLS
ALTER TABLE public.preference_pairs ENABLE ROW LEVEL SECURITY;

-- Users can view their own preference pairs
CREATE POLICY "Users can view own preference pairs"
  ON public.preference_pairs
  FOR SELECT
  USING (auth.uid()::text = labeler_user_id::text OR labeler_user_id IS NULL);

-- Anyone can create preference pairs (for implicit signals)
CREATE POLICY "Anyone can create preference pairs"
  ON public.preference_pairs
  FOR INSERT
  WITH CHECK (TRUE);

-- Service role has full access
CREATE POLICY "Service role has full access to preference_pairs"
  ON public.preference_pairs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.preference_pairs IS 'RLHF preference pairs for training reward models';
COMMENT ON COLUMN public.preference_pairs.preferred IS 'Which analysis was preferred: a, b, tie, or skip';
COMMENT ON COLUMN public.preference_pairs.confidence IS 'Strength of preference (0-1)';
COMMENT ON COLUMN public.preference_pairs.signals IS 'Behavioral signals used for implicit preferences';

-- ============================================================================
-- TABLE: calibration_curves
-- Industry-specific score calibration parameters
-- ============================================================================

CREATE TABLE public.calibration_curves (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope of calibration
  scope calibration_scope NOT NULL DEFAULT 'global',

  -- Reference (depends on scope)
  industry_id UUID REFERENCES public.industries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  brand_id UUID, -- Reference to brands table if exists

  -- Calibration parameters
  -- Using polynomial: calibrated = a0 + a1*raw + a2*raw^2 + a3*raw^3
  coefficients DECIMAL[] NOT NULL DEFAULT ARRAY[0, 1, 0, 0]::DECIMAL[],
  -- [a0, a1, a2, a3] - default is identity (calibrated = raw)

  -- Alternative: piecewise linear calibration points
  calibration_points JSONB DEFAULT '[]',
  -- e.g., [{"raw": 0, "calibrated": 0}, {"raw": 50, "calibrated": 45}, {"raw": 100, "calibrated": 100}]

  -- Statistics from training data
  sample_size INTEGER NOT NULL DEFAULT 0,
  mean_raw_score DECIMAL(5,2),
  std_raw_score DECIMAL(5,2),
  mean_satisfaction DECIMAL(3,2), -- Average user satisfaction (0-1)

  -- Model performance metrics
  mae DECIMAL(5,3), -- Mean Absolute Error
  rmse DECIMAL(5,3), -- Root Mean Square Error
  r_squared DECIMAL(4,3), -- R-squared

  -- Confidence in the calibration
  confidence_level DECIMAL(3,2) DEFAULT 0.5,
  -- Based on sample size and consistency

  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id),

  -- Constraints
  CONSTRAINT chk_scope_reference CHECK (
    (scope = 'global' AND industry_id IS NULL AND user_id IS NULL AND brand_id IS NULL) OR
    (scope = 'industry' AND industry_id IS NOT NULL) OR
    (scope = 'user' AND user_id IS NOT NULL) OR
    (scope = 'brand' AND brand_id IS NOT NULL)
  ),
  CONSTRAINT chk_confidence_level_range
    CHECK (confidence_level >= 0 AND confidence_level <= 1),
  CONSTRAINT chk_sample_size_positive
    CHECK (sample_size >= 0)
);

-- Indexes
CREATE INDEX idx_calibration_curves_scope ON public.calibration_curves(scope);
CREATE INDEX idx_calibration_curves_industry ON public.calibration_curves(industry_id)
  WHERE industry_id IS NOT NULL;
CREATE INDEX idx_calibration_curves_user ON public.calibration_curves(user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_calibration_curves_active ON public.calibration_curves(is_active, scope)
  WHERE is_active = TRUE;

-- Unique constraint: only one active curve per scope/reference
CREATE UNIQUE INDEX uidx_calibration_curves_active_global
  ON public.calibration_curves(scope)
  WHERE scope = 'global' AND is_active = TRUE;

CREATE UNIQUE INDEX uidx_calibration_curves_active_industry
  ON public.calibration_curves(industry_id)
  WHERE scope = 'industry' AND is_active = TRUE AND industry_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER trg_calibration_curves_updated_at
  BEFORE UPDATE ON public.calibration_curves
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- RLS
ALTER TABLE public.calibration_curves ENABLE ROW LEVEL SECURITY;

-- Anyone can read calibration curves
CREATE POLICY "Anyone can read calibration curves"
  ON public.calibration_curves
  FOR SELECT
  USING (TRUE);

-- Only service role can modify
CREATE POLICY "Service role can modify calibration curves"
  ON public.calibration_curves
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.calibration_curves IS 'Score calibration parameters by scope (global, industry, user, brand)';
COMMENT ON COLUMN public.calibration_curves.coefficients IS 'Polynomial coefficients [a0, a1, a2, a3] for calibration';
COMMENT ON COLUMN public.calibration_curves.calibration_points IS 'Piecewise linear calibration points';

-- ============================================================================
-- TABLE: calibration_feedback
-- User feedback on calibrated scores for continuous improvement
-- ============================================================================

CREATE TABLE public.calibration_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  calibration_curve_id UUID REFERENCES public.calibration_curves(id) ON DELETE SET NULL,

  -- Scores
  raw_score INTEGER NOT NULL,
  calibrated_score INTEGER NOT NULL,

  -- User assessment
  perceived_accuracy TEXT CHECK (perceived_accuracy IN (
    'way_too_low', 'too_low', 'accurate', 'too_high', 'way_too_high'
  )),
  expected_score INTEGER, -- What user expected
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),

  -- Context
  feedback_context JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_scores_range
    CHECK (raw_score >= 0 AND raw_score <= 100 AND calibrated_score >= 0 AND calibrated_score <= 100),
  CONSTRAINT chk_expected_score_range
    CHECK (expected_score IS NULL OR (expected_score >= 0 AND expected_score <= 100))
);

-- Indexes
CREATE INDEX idx_calibration_feedback_analysis ON public.calibration_feedback(analysis_id);
CREATE INDEX idx_calibration_feedback_user ON public.calibration_feedback(user_id);
CREATE INDEX idx_calibration_feedback_curve ON public.calibration_feedback(calibration_curve_id);
CREATE INDEX idx_calibration_feedback_created_at ON public.calibration_feedback(created_at DESC);

-- RLS
ALTER TABLE public.calibration_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calibration feedback"
  ON public.calibration_feedback
  FOR SELECT
  USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Anyone can create calibration feedback"
  ON public.calibration_feedback
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role has full access to calibration feedback"
  ON public.calibration_feedback
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.calibration_feedback IS 'User feedback on score calibration accuracy';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Preference pair statistics by source
CREATE VIEW public.vw_preference_stats AS
SELECT
  source,
  COUNT(*) AS total_pairs,
  COUNT(*) FILTER (WHERE preferred = 'a') AS preferred_a,
  COUNT(*) FILTER (WHERE preferred = 'b') AS preferred_b,
  COUNT(*) FILTER (WHERE preferred = 'tie') AS ties,
  COUNT(*) FILTER (WHERE preferred = 'skip') AS skips,
  AVG(confidence) AS avg_confidence,
  COUNT(*) FILTER (WHERE is_high_quality) AS high_quality_count,
  COUNT(*) FILTER (WHERE is_used_in_training) AS used_in_training,
  MIN(created_at) AS first_pair_at,
  MAX(created_at) AS last_pair_at
FROM public.preference_pairs
GROUP BY source;

COMMENT ON VIEW public.vw_preference_stats IS 'Aggregated statistics on preference pairs by source';

-- View: Active calibration curves with details
CREATE VIEW public.vw_active_calibrations AS
SELECT
  cc.id,
  cc.scope,
  COALESCE(i.name, 'Global') AS scope_name,
  cc.coefficients,
  cc.sample_size,
  cc.mean_satisfaction,
  cc.mae,
  cc.r_squared,
  cc.confidence_level,
  cc.valid_from,
  cc.valid_until,
  cc.created_at
FROM public.calibration_curves cc
LEFT JOIN public.industries i ON cc.industry_id = i.id
WHERE cc.is_active = TRUE
ORDER BY cc.scope, i.name;

COMMENT ON VIEW public.vw_active_calibrations IS 'Currently active calibration curves with readable names';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Apply calibration to a raw score
CREATE OR REPLACE FUNCTION public.fn_calibrate_score(
  p_raw_score INTEGER,
  p_industry_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_curve RECORD;
  v_calibrated DECIMAL;
  v_raw DECIMAL := p_raw_score;
BEGIN
  -- First try industry-specific calibration
  IF p_industry_id IS NOT NULL THEN
    SELECT * INTO v_curve
    FROM public.calibration_curves
    WHERE scope = 'industry'
      AND industry_id = p_industry_id
      AND is_active = TRUE
      AND NOW() BETWEEN valid_from AND COALESCE(valid_until, NOW() + INTERVAL '1 year')
    LIMIT 1;
  END IF;

  -- Fall back to global calibration
  IF v_curve IS NULL THEN
    SELECT * INTO v_curve
    FROM public.calibration_curves
    WHERE scope = 'global'
      AND is_active = TRUE
      AND NOW() BETWEEN valid_from AND COALESCE(valid_until, NOW() + INTERVAL '1 year')
    LIMIT 1;
  END IF;

  -- If no calibration found, return raw score
  IF v_curve IS NULL THEN
    RETURN p_raw_score;
  END IF;

  -- Apply polynomial calibration: a0 + a1*x + a2*x^2 + a3*x^3
  v_calibrated := v_curve.coefficients[1]
    + v_curve.coefficients[2] * v_raw
    + v_curve.coefficients[3] * v_raw * v_raw
    + v_curve.coefficients[4] * v_raw * v_raw * v_raw;

  -- Clamp to valid range
  RETURN GREATEST(0, LEAST(100, ROUND(v_calibrated)));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.fn_calibrate_score IS 'Apply industry-specific or global calibration to a raw score';

-- Function: Calculate preference quality score
CREATE OR REPLACE FUNCTION public.fn_calculate_preference_quality(
  p_preference_id UUID
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_pref RECORD;
  v_quality DECIMAL := 0.5;
BEGIN
  SELECT * INTO v_pref FROM public.preference_pairs WHERE id = p_preference_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Base quality from source
  CASE v_pref.source
    WHEN 'expert_labeling' THEN v_quality := 0.9;
    WHEN 'explicit_comparison' THEN v_quality := 0.7;
    WHEN 'implicit_behavior' THEN v_quality := 0.5;
    WHEN 'automated_mining' THEN v_quality := 0.3;
  END CASE;

  -- Boost for high confidence
  IF v_pref.confidence >= 0.8 THEN
    v_quality := v_quality + 0.1;
  END IF;

  -- Boost for logged-in user
  IF v_pref.labeler_user_id IS NOT NULL THEN
    v_quality := v_quality + 0.1;
  END IF;

  -- Penalize ties and skips (less informative)
  IF v_pref.preferred IN ('tie', 'skip') THEN
    v_quality := v_quality - 0.2;
  END IF;

  RETURN GREATEST(0, LEAST(1, v_quality));
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.fn_calculate_preference_quality IS 'Calculate quality score for a preference pair';

-- ============================================================================
-- SEED DATA: Default global calibration (identity)
-- ============================================================================

INSERT INTO public.calibration_curves (
  scope,
  coefficients,
  sample_size,
  confidence_level,
  is_active
) VALUES (
  'global',
  ARRAY[0, 1, 0, 0]::DECIMAL[],
  0,
  0.5,
  TRUE
);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
