-- =====================================================
-- REASONING TRACES SCHEMA
-- Migration: 20250130_reasoning_traces.sql
-- Purpose: Store human-readable AI reasoning traces
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SECTION 1: ENUMS
-- =====================================================

-- Reasoning step types
CREATE TYPE reasoning_step_type AS ENUM (
  'observation',     -- What the AI observed
  'inference',       -- Logical inference made
  'rule_application', -- Rule or policy applied
  'comparison',      -- Comparison between options
  'calculation',     -- Numeric calculation
  'pattern_match',   -- Pattern recognition
  'external_lookup', -- External data consulted
  'assumption',      -- Assumption made
  'conclusion',      -- Final conclusion
  'uncertainty'      -- Noted uncertainty
);

-- Confidence levels
CREATE TYPE confidence_level AS ENUM (
  'very_high',       -- 90-100% confidence
  'high',            -- 75-90%
  'moderate',        -- 50-75%
  'low',             -- 25-50%
  'very_low'         -- 0-25%
);

-- Trace detail level
CREATE TYPE trace_detail_level AS ENUM (
  'summary',         -- Brief overview
  'standard',        -- Normal detail
  'verbose',         -- Full detail
  'debug'            -- Technical debug info
);

-- =====================================================
-- SECTION 2: REASONING TRACES TABLE
-- =====================================================

CREATE TABLE reasoning_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Decision reference
  decision_id UUID NOT NULL,
  decision_type VARCHAR(100) NOT NULL,
  model_id VARCHAR(100),
  model_version VARCHAR(50),

  -- Outcome summary
  final_outcome VARCHAR(255) NOT NULL,
  final_confidence confidence_level NOT NULL,
  final_confidence_score NUMERIC(5,4) CHECK (final_confidence_score >= 0 AND final_confidence_score <= 1),

  -- Human-readable summary
  summary_text TEXT NOT NULL,
  summary_bullet_points TEXT[], -- Array of key points

  -- Detail level of this trace
  detail_level trace_detail_level DEFAULT 'standard',

  -- Timing
  reasoning_start_at TIMESTAMPTZ,
  reasoning_end_at TIMESTAMPTZ,
  total_reasoning_ms INTEGER,

  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type VARCHAR(100),
  entity_id UUID,

  -- User engagement
  was_viewed BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  avg_view_duration_seconds NUMERIC(8,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_reasoning_decision ON reasoning_traces(decision_id);
CREATE INDEX idx_reasoning_type ON reasoning_traces(decision_type);
CREATE INDEX idx_reasoning_user ON reasoning_traces(user_id);
CREATE INDEX idx_reasoning_created ON reasoning_traces(created_at DESC);

-- =====================================================
-- SECTION 3: REASONING STEPS TABLE
-- =====================================================

CREATE TABLE reasoning_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent trace
  trace_id UUID NOT NULL REFERENCES reasoning_traces(id) ON DELETE CASCADE,

  -- Step ordering
  step_number INTEGER NOT NULL,
  parent_step_id UUID REFERENCES reasoning_steps(id), -- For nested reasoning

  -- Step type
  step_type reasoning_step_type NOT NULL,

  -- Human-readable content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  -- Evidence/data used
  input_data JSONB,
  input_summary TEXT, -- Human-readable summary of input

  -- Output of this step
  output_data JSONB,
  output_summary TEXT,

  -- Confidence in this step
  step_confidence confidence_level,
  confidence_score NUMERIC(5,4),

  -- Visual representation
  visual_type VARCHAR(50), -- 'chart', 'table', 'tree', 'timeline', etc.
  visual_data JSONB,

  -- Alternatives considered (for transparency)
  alternatives_considered JSONB, -- [{option, score, why_not}]

  -- Timing
  step_duration_ms INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_step_trace ON reasoning_steps(trace_id);
CREATE INDEX idx_step_number ON reasoning_steps(trace_id, step_number);
CREATE INDEX idx_step_type ON reasoning_steps(step_type);

-- =====================================================
-- SECTION 4: REASONING TEMPLATES TABLE
-- =====================================================

CREATE TABLE reasoning_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identification
  template_name VARCHAR(100) UNIQUE NOT NULL,
  decision_type VARCHAR(100) NOT NULL,

  -- Structure
  summary_template TEXT NOT NULL,
  step_templates JSONB NOT NULL, -- Array of step templates

  -- Configuration
  default_detail_level trace_detail_level DEFAULT 'standard',

  -- Active flag
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reasoning_template_type ON reasoning_templates(decision_type);

-- =====================================================
-- SECTION 5: CREATE REASONING TRACE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_reasoning_trace(
  p_decision_id UUID,
  p_decision_type VARCHAR(100),
  p_final_outcome VARCHAR(255),
  p_final_confidence confidence_level,
  p_final_confidence_score NUMERIC,
  p_summary_text TEXT,
  p_summary_points TEXT[] DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_model_id VARCHAR(100) DEFAULT NULL,
  p_detail_level trace_detail_level DEFAULT 'standard'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trace_id UUID;
BEGIN
  INSERT INTO reasoning_traces (
    decision_id,
    decision_type,
    model_id,
    final_outcome,
    final_confidence,
    final_confidence_score,
    summary_text,
    summary_bullet_points,
    detail_level,
    user_id,
    reasoning_start_at,
    expires_at
  ) VALUES (
    p_decision_id,
    p_decision_type,
    p_model_id,
    p_final_outcome,
    p_final_confidence,
    p_final_confidence_score,
    p_summary_text,
    p_summary_points,
    p_detail_level,
    p_user_id,
    NOW(),
    NOW() + INTERVAL '90 days'
  )
  RETURNING id INTO v_trace_id;

  RETURN v_trace_id;
END;
$$;

-- =====================================================
-- SECTION 6: ADD REASONING STEP FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION add_reasoning_step(
  p_trace_id UUID,
  p_step_number INTEGER,
  p_step_type reasoning_step_type,
  p_title VARCHAR(255),
  p_description TEXT,
  p_input_summary TEXT DEFAULT NULL,
  p_output_summary TEXT DEFAULT NULL,
  p_confidence confidence_level DEFAULT NULL,
  p_alternatives JSONB DEFAULT NULL,
  p_parent_step_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_step_id UUID;
BEGIN
  INSERT INTO reasoning_steps (
    trace_id,
    step_number,
    parent_step_id,
    step_type,
    title,
    description,
    input_summary,
    output_summary,
    step_confidence,
    alternatives_considered
  ) VALUES (
    p_trace_id,
    p_step_number,
    p_parent_step_id,
    p_step_type,
    p_title,
    p_description,
    p_input_summary,
    p_output_summary,
    p_confidence,
    p_alternatives
  )
  RETURNING id INTO v_step_id;

  RETURN v_step_id;
END;
$$;

-- =====================================================
-- SECTION 7: FINALIZE REASONING TRACE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION finalize_reasoning_trace(
  p_trace_id UUID,
  p_total_duration_ms INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE reasoning_traces
  SET
    reasoning_end_at = NOW(),
    total_reasoning_ms = COALESCE(
      p_total_duration_ms,
      EXTRACT(EPOCH FROM (NOW() - reasoning_start_at)) * 1000
    )::INTEGER
  WHERE id = p_trace_id;

  RETURN FOUND;
END;
$$;

-- =====================================================
-- SECTION 8: GET REASONING TRACE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_reasoning_trace(
  p_decision_id UUID,
  p_detail_level trace_detail_level DEFAULT 'standard'
)
RETURNS TABLE (
  trace_id UUID,
  summary_text TEXT,
  summary_points TEXT[],
  final_outcome VARCHAR(255),
  confidence confidence_level,
  steps JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rt.id,
    rt.summary_text,
    rt.summary_bullet_points,
    rt.final_outcome,
    rt.final_confidence,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'step_number', rs.step_number,
          'type', rs.step_type,
          'title', rs.title,
          'description', rs.description,
          'input', rs.input_summary,
          'output', rs.output_summary,
          'confidence', rs.step_confidence,
          'alternatives', rs.alternatives_considered
        ) ORDER BY rs.step_number
      )
      FROM reasoning_steps rs
      WHERE rs.trace_id = rt.id),
      '[]'::jsonb
    ),
    rt.created_at
  FROM reasoning_traces rt
  WHERE rt.decision_id = p_decision_id
    AND rt.detail_level = p_detail_level
  ORDER BY rt.created_at DESC
  LIMIT 1;
END;
$$;

-- =====================================================
-- SECTION 9: RECORD TRACE VIEW FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION record_trace_view(
  p_trace_id UUID,
  p_view_duration_seconds NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE reasoning_traces
  SET
    was_viewed = true,
    view_count = view_count + 1,
    avg_view_duration_seconds = CASE
      WHEN avg_view_duration_seconds IS NULL THEN p_view_duration_seconds
      WHEN p_view_duration_seconds IS NOT NULL THEN
        (avg_view_duration_seconds * (view_count - 1) + p_view_duration_seconds) / view_count
      ELSE avg_view_duration_seconds
    END
  WHERE id = p_trace_id;

  RETURN FOUND;
END;
$$;

-- =====================================================
-- SECTION 10: DEFAULT REASONING TEMPLATES
-- =====================================================

INSERT INTO reasoning_templates (
  template_name,
  decision_type,
  summary_template,
  step_templates
) VALUES
(
  'wallet_risk_assessment',
  'risk_assessment',
  'After analyzing {{entity_count}} data points, the wallet was assessed as {{outcome}} with {{confidence}} confidence.',
  '[
    {"type": "observation", "title": "Data Collection", "template": "Gathered {{count}} on-chain transactions and {{metrics}} behavioral metrics."},
    {"type": "pattern_match", "title": "Pattern Analysis", "template": "Identified {{patterns}} patterns matching {{outcome}} behavior profiles."},
    {"type": "calculation", "title": "Risk Score Calculation", "template": "Computed weighted risk score of {{score}} from {{factors}} factors."},
    {"type": "comparison", "title": "Threshold Comparison", "template": "Score {{comparison}} threshold of {{threshold}}."},
    {"type": "conclusion", "title": "Final Assessment", "template": "Concluded {{outcome}} classification with {{confidence}} confidence."}
  ]'::jsonb
),
(
  'token_recommendation',
  'recommendation',
  'Based on your portfolio and preferences, we recommend {{outcome}} as the best match.',
  '[
    {"type": "observation", "title": "Profile Analysis", "template": "Analyzed your risk tolerance ({{risk}}) and investment goals ({{goals}})."},
    {"type": "external_lookup", "title": "Market Data", "template": "Retrieved current market data for {{token_count}} tokens."},
    {"type": "calculation", "title": "Scoring", "template": "Scored each token on {{criteria_count}} criteria."},
    {"type": "comparison", "title": "Ranking", "template": "{{outcome}} scored highest with {{score}}/100."},
    {"type": "conclusion", "title": "Recommendation", "template": "{{outcome}} best matches your profile with {{confidence}} confidence."}
  ]'::jsonb
),
(
  'alert_decision',
  'alert_trigger',
  'Alert {{outcome}} after detecting {{trigger}} exceeding configured thresholds.',
  '[
    {"type": "observation", "title": "Metric Monitoring", "template": "Monitored {{metric}} with current value of {{value}}."},
    {"type": "rule_application", "title": "Threshold Check", "template": "Applied rule: {{rule}}. Threshold: {{threshold}}."},
    {"type": "comparison", "title": "Comparison", "template": "Value {{value}} is {{comparison}} threshold {{threshold}}."},
    {"type": "conclusion", "title": "Alert Decision", "template": "{{outcome}} alert with severity {{severity}}."}
  ]'::jsonb
);

-- =====================================================
-- SECTION 11: RLS POLICIES
-- =====================================================

ALTER TABLE reasoning_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_templates ENABLE ROW LEVEL SECURITY;

-- Users can view traces for their decisions
CREATE POLICY traces_view_own ON reasoning_traces
  FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can view steps of visible traces
CREATE POLICY steps_view ON reasoning_steps
  FOR SELECT
  USING (
    trace_id IN (
      SELECT id FROM reasoning_traces
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Templates readable by all
CREATE POLICY templates_view ON reasoning_templates
  FOR SELECT
  USING (is_active = true);

-- Admin policies
CREATE POLICY traces_admin ON reasoning_traces
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY steps_admin ON reasoning_steps
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY templates_admin ON reasoning_templates
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECTION 12: CLEANUP FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_traces()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM reasoning_traces
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN v_deleted;
END;
$$;

-- =====================================================
-- SECTION 13: COMMENTS
-- =====================================================

COMMENT ON TABLE reasoning_traces IS 'Stores human-readable reasoning traces for AI decisions';
COMMENT ON TABLE reasoning_steps IS 'Individual steps within a reasoning trace';
COMMENT ON TABLE reasoning_templates IS 'Templates for generating reasoning traces';
COMMENT ON FUNCTION create_reasoning_trace IS 'Creates a new reasoning trace for a decision';
COMMENT ON FUNCTION add_reasoning_step IS 'Adds a step to an existing reasoning trace';
COMMENT ON FUNCTION get_reasoning_trace IS 'Retrieves a reasoning trace with all steps';
