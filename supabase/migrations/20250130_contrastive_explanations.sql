-- =====================================================
-- CONTRASTIVE EXPLANATIONS SCHEMA
-- Migration: 20250130_contrastive_explanations.sql
-- Purpose: Enable "Why X not Y?" explanations for AI decisions
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SECTION 1: ENUMS
-- =====================================================

-- Contrastive explanation types
CREATE TYPE contrastive_explanation_type AS ENUM (
  'classification',      -- Why classified as A not B
  'recommendation',      -- Why recommended X not Y
  'scoring',            -- Why score is high not low
  'threshold',          -- Why above/below threshold
  'ranking',            -- Why ranked higher/lower
  'selection',          -- Why selected/rejected
  'prediction'          -- Why predicted outcome A not B
);

-- Factor influence direction
CREATE TYPE factor_influence AS ENUM (
  'strongly_supports',
  'moderately_supports',
  'weakly_supports',
  'neutral',
  'weakly_opposes',
  'moderately_opposes',
  'strongly_opposes'
);

-- =====================================================
-- SECTION 2: CONTRASTIVE EXPLANATIONS TABLE
-- =====================================================

CREATE TABLE contrastive_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to original decision
  decision_id UUID NOT NULL,
  decision_type VARCHAR(100) NOT NULL,
  model_id VARCHAR(100),
  model_version VARCHAR(50),

  -- The actual outcome
  actual_outcome JSONB NOT NULL,
  actual_outcome_label VARCHAR(255) NOT NULL,
  actual_confidence NUMERIC(5,4) CHECK (actual_confidence >= 0 AND actual_confidence <= 1),

  -- The counterfactual/contrast outcome
  contrast_outcome JSONB NOT NULL,
  contrast_outcome_label VARCHAR(255) NOT NULL,
  contrast_confidence NUMERIC(5,4) CHECK (contrast_confidence >= 0 AND contrast_confidence <= 1),

  -- Explanation type
  explanation_type contrastive_explanation_type NOT NULL,

  -- Key differentiating factors (JSON array)
  -- Each factor: {name, actual_value, contrast_value, influence, weight, explanation}
  differentiating_factors JSONB NOT NULL DEFAULT '[]',

  -- Human-readable summary
  explanation_summary TEXT NOT NULL,
  explanation_details TEXT,

  -- Technical details for audit
  feature_importance JSONB DEFAULT '{}',
  decision_boundary_info JSONB DEFAULT '{}',

  -- Input data snapshot (for reproducibility)
  input_snapshot JSONB,

  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100),
  entity_id UUID,

  -- Feedback
  user_found_helpful BOOLEAN,
  user_feedback TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_contrastive_decision_id ON contrastive_explanations(decision_id);
CREATE INDEX idx_contrastive_decision_type ON contrastive_explanations(decision_type);
CREATE INDEX idx_contrastive_user ON contrastive_explanations(user_id);
CREATE INDEX idx_contrastive_created ON contrastive_explanations(created_at DESC);
CREATE INDEX idx_contrastive_type ON contrastive_explanations(explanation_type);

-- =====================================================
-- SECTION 3: COUNTERFACTUAL EXAMPLES TABLE
-- =====================================================

-- Store "what would need to change" scenarios
CREATE TABLE counterfactual_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to contrastive explanation
  contrastive_id UUID REFERENCES contrastive_explanations(id) ON DELETE CASCADE,

  -- Original input
  original_input JSONB NOT NULL,

  -- Modified input that would produce contrast outcome
  modified_input JSONB NOT NULL,

  -- What changed
  changes_required JSONB NOT NULL, -- [{feature, from, to, change_difficulty}]

  -- Is this counterfactual feasible?
  is_actionable BOOLEAN DEFAULT true,
  feasibility_score NUMERIC(5,4) CHECK (feasibility_score >= 0 AND feasibility_score <= 1),

  -- Human-readable description
  description TEXT NOT NULL,

  -- How much would outcome change?
  predicted_outcome JSONB,
  outcome_confidence NUMERIC(5,4),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_counterfactual_contrastive ON counterfactual_examples(contrastive_id);

-- =====================================================
-- SECTION 4: EXPLANATION TEMPLATES TABLE
-- =====================================================

CREATE TABLE explanation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  template_name VARCHAR(100) UNIQUE NOT NULL,
  decision_type VARCHAR(100) NOT NULL,
  explanation_type contrastive_explanation_type NOT NULL,

  -- Template patterns
  summary_template TEXT NOT NULL,
  detail_template TEXT,

  -- Factor explanation templates
  factor_templates JSONB DEFAULT '{}',

  -- Localization
  language VARCHAR(10) DEFAULT 'en',

  -- Active flag
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_explanation_template_type ON explanation_templates(decision_type, explanation_type);

-- =====================================================
-- SECTION 5: GENERATE CONTRASTIVE EXPLANATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_contrastive_explanation(
  p_decision_id UUID,
  p_decision_type VARCHAR(100),
  p_actual_outcome JSONB,
  p_actual_label VARCHAR(255),
  p_actual_confidence NUMERIC,
  p_contrast_outcome JSONB,
  p_contrast_label VARCHAR(255),
  p_contrast_confidence NUMERIC,
  p_explanation_type contrastive_explanation_type,
  p_differentiating_factors JSONB,
  p_input_snapshot JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_model_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_explanation_id UUID;
  v_summary TEXT;
  v_template RECORD;
  v_factor JSONB;
  v_factor_text TEXT := '';
BEGIN
  -- Try to find template
  SELECT * INTO v_template
  FROM explanation_templates
  WHERE decision_type = p_decision_type
    AND explanation_type = p_explanation_type
    AND is_active = true
  LIMIT 1;

  -- Generate summary
  IF v_template IS NOT NULL THEN
    -- Use template
    v_summary := v_template.summary_template;
    v_summary := REPLACE(v_summary, '{{actual_label}}', p_actual_label);
    v_summary := REPLACE(v_summary, '{{contrast_label}}', p_contrast_label);
    v_summary := REPLACE(v_summary, '{{actual_confidence}}', ROUND(p_actual_confidence * 100)::TEXT || '%');
    v_summary := REPLACE(v_summary, '{{contrast_confidence}}', ROUND(p_contrast_confidence * 100)::TEXT || '%');
  ELSE
    -- Generate default summary
    v_summary := format(
      'The outcome was "%s" (confidence: %s%%) rather than "%s" (confidence: %s%%).',
      p_actual_label,
      ROUND(p_actual_confidence * 100),
      p_contrast_label,
      ROUND(p_contrast_confidence * 100)
    );

    -- Add factor explanations
    FOR v_factor IN SELECT * FROM jsonb_array_elements(p_differentiating_factors)
    LOOP
      v_factor_text := v_factor_text || format(
        E'\n• %s: Your value of %s %s the outcome, while %s would have %s it.',
        v_factor->>'name',
        v_factor->>'actual_value',
        CASE
          WHEN (v_factor->>'influence') LIKE '%supports%' THEN 'supported'
          WHEN (v_factor->>'influence') LIKE '%opposes%' THEN 'opposed'
          ELSE 'influenced'
        END,
        v_factor->>'contrast_value',
        CASE
          WHEN (v_factor->>'influence') LIKE '%supports%' THEN 'opposed'
          ELSE 'supported'
        END
      );
    END LOOP;

    IF v_factor_text != '' THEN
      v_summary := v_summary || E'\n\nKey differentiating factors:' || v_factor_text;
    END IF;
  END IF;

  -- Insert explanation
  INSERT INTO contrastive_explanations (
    decision_id,
    decision_type,
    model_id,
    actual_outcome,
    actual_outcome_label,
    actual_confidence,
    contrast_outcome,
    contrast_outcome_label,
    contrast_confidence,
    explanation_type,
    differentiating_factors,
    explanation_summary,
    input_snapshot,
    user_id,
    expires_at
  ) VALUES (
    p_decision_id,
    p_decision_type,
    p_model_id,
    p_actual_outcome,
    p_actual_label,
    p_actual_confidence,
    p_contrast_outcome,
    p_contrast_label,
    p_contrast_confidence,
    p_explanation_type,
    p_differentiating_factors,
    v_summary,
    p_input_snapshot,
    p_user_id,
    NOW() + INTERVAL '90 days'
  )
  RETURNING id INTO v_explanation_id;

  RETURN v_explanation_id;
END;
$$;

-- =====================================================
-- SECTION 6: GET CONTRASTIVE EXPLANATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_contrastive_explanation(
  p_decision_id UUID,
  p_contrast_with VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
  explanation_id UUID,
  actual_outcome_label VARCHAR(255),
  contrast_outcome_label VARCHAR(255),
  explanation_summary TEXT,
  differentiating_factors JSONB,
  counterfactuals JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ce.id,
    ce.actual_outcome_label,
    ce.contrast_outcome_label,
    ce.explanation_summary,
    ce.differentiating_factors,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'description', cf.description,
        'changes_required', cf.changes_required,
        'is_actionable', cf.is_actionable,
        'feasibility_score', cf.feasibility_score
      ))
      FROM counterfactual_examples cf
      WHERE cf.contrastive_id = ce.id),
      '[]'::jsonb
    ),
    ce.created_at
  FROM contrastive_explanations ce
  WHERE ce.decision_id = p_decision_id
    AND (p_contrast_with IS NULL OR ce.contrast_outcome_label = p_contrast_with)
  ORDER BY ce.created_at DESC;
END;
$$;

-- =====================================================
-- SECTION 7: RECORD USER FEEDBACK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION record_explanation_feedback(
  p_explanation_id UUID,
  p_found_helpful BOOLEAN,
  p_feedback TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE contrastive_explanations
  SET
    user_found_helpful = p_found_helpful,
    user_feedback = p_feedback
  WHERE id = p_explanation_id;

  RETURN FOUND;
END;
$$;

-- =====================================================
-- SECTION 8: GENERATE COUNTERFACTUAL FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_counterfactual(
  p_contrastive_id UUID,
  p_original_input JSONB,
  p_modified_input JSONB,
  p_changes_required JSONB,
  p_description TEXT,
  p_is_actionable BOOLEAN DEFAULT true,
  p_feasibility_score NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_counterfactual_id UUID;
BEGIN
  INSERT INTO counterfactual_examples (
    contrastive_id,
    original_input,
    modified_input,
    changes_required,
    description,
    is_actionable,
    feasibility_score
  ) VALUES (
    p_contrastive_id,
    p_original_input,
    p_modified_input,
    p_changes_required,
    p_description,
    p_is_actionable,
    p_feasibility_score
  )
  RETURNING id INTO v_counterfactual_id;

  RETURN v_counterfactual_id;
END;
$$;

-- =====================================================
-- SECTION 9: DEFAULT EXPLANATION TEMPLATES
-- =====================================================

INSERT INTO explanation_templates (
  template_name,
  decision_type,
  explanation_type,
  summary_template,
  detail_template,
  factor_templates
) VALUES
(
  'risk_score_high',
  'risk_assessment',
  'scoring',
  'Your risk score is {{actual_label}} rather than {{contrast_label}} because of the following key factors.',
  'The AI analyzed multiple data points and determined that your risk profile indicates {{actual_label}} ({{actual_confidence}} confidence). The alternative outcome of {{contrast_label}} was considered but assigned lower probability ({{contrast_confidence}}).',
  '{"transaction_volume": "Your transaction volume of {{actual_value}} is {{influence}} for {{actual_label}}. A volume of {{contrast_value}} would have resulted in {{contrast_label}}."}'
),
(
  'wallet_classification',
  'wallet_classification',
  'classification',
  'This wallet was classified as "{{actual_label}}" instead of "{{contrast_label}}" based on on-chain behavior patterns.',
  'Analysis of transaction patterns, token holdings, and interaction history led to the {{actual_label}} classification with {{actual_confidence}} confidence.',
  '{"holding_period": "Average holding period of {{actual_value}} indicates {{influence}} behavior, typical of {{actual_label}} wallets."}'
),
(
  'recommendation_scoring',
  'token_recommendation',
  'recommendation',
  'We recommended {{actual_label}} over {{contrast_label}} based on your portfolio and risk preferences.',
  'Given your investment profile and stated preferences, {{actual_label}} aligns better ({{actual_confidence}} match) than {{contrast_label}} ({{contrast_confidence}} match).',
  '{}'
),
(
  'threshold_alert',
  'alert_trigger',
  'threshold',
  'An alert was triggered ({{actual_label}}) rather than remaining silent ({{contrast_label}}) because the threshold was exceeded.',
  'The monitored metric exceeded the configured threshold, triggering the {{actual_label}} state with {{actual_confidence}} certainty.',
  '{"metric_value": "The value of {{actual_value}} exceeded the threshold. A value of {{contrast_value}} would not have triggered the alert."}'
);

-- =====================================================
-- SECTION 10: RLS POLICIES
-- =====================================================

ALTER TABLE contrastive_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterfactual_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanation_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own explanations
CREATE POLICY contrastive_view_own ON contrastive_explanations
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can provide feedback on their explanations
CREATE POLICY contrastive_update_feedback ON contrastive_explanations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Counterfactuals visible with parent explanation
CREATE POLICY counterfactual_view ON counterfactual_examples
  FOR SELECT
  USING (
    contrastive_id IN (
      SELECT id FROM contrastive_explanations
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Templates readable by all authenticated users
CREATE POLICY templates_view ON explanation_templates
  FOR SELECT
  USING (is_active = true);

-- Admin policies for service role
CREATE POLICY contrastive_admin ON contrastive_explanations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY counterfactual_admin ON counterfactual_examples
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY templates_admin ON explanation_templates
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECTION 11: CLEANUP FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_explanations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM contrastive_explanations
  WHERE expires_at < NOW()
  RETURNING 1 INTO v_deleted;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

-- =====================================================
-- SECTION 12: COMMENTS
-- =====================================================

COMMENT ON TABLE contrastive_explanations IS 'Stores "Why X not Y?" explanations for AI decisions';
COMMENT ON TABLE counterfactual_examples IS 'Stores actionable counterfactuals showing what changes would alter outcomes';
COMMENT ON TABLE explanation_templates IS 'Templates for generating human-readable explanations';
COMMENT ON FUNCTION generate_contrastive_explanation IS 'Creates a new contrastive explanation for a decision';
COMMENT ON FUNCTION get_contrastive_explanation IS 'Retrieves explanation with counterfactuals for a decision';
COMMENT ON FUNCTION generate_counterfactual IS 'Adds a counterfactual example to an explanation';
