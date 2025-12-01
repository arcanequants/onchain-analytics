-- =====================================================
-- AI LIABILITY FRAMEWORK SCHEMA
-- Migration: 20250130_ai_liability_framework.sql
-- Purpose: Track AI decision accountability and liability
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SECTION 1: ENUMS
-- =====================================================

-- Liability severity levels
CREATE TYPE liability_severity AS ENUM (
  'negligible',      -- No material impact
  'minor',           -- Small inconvenience
  'moderate',        -- Noticeable impact
  'significant',     -- Serious impact
  'critical'         -- Severe/irreversible impact
);

-- Decision actor types
CREATE TYPE decision_actor AS ENUM (
  'ai_autonomous',   -- AI made decision alone
  'ai_recommended',  -- AI recommended, human approved
  'human_override',  -- Human overrode AI
  'human_primary',   -- Human primary, AI assisted
  'hybrid'           -- Joint human-AI decision
);

-- Liability status
CREATE TYPE liability_status AS ENUM (
  'unassessed',
  'assessed',
  'disputed',
  'accepted',
  'transferred',
  'resolved'
);

-- Responsibility party
CREATE TYPE responsible_party AS ENUM (
  'company',           -- Platform/company responsible
  'model_provider',    -- AI model provider (OpenAI, Anthropic, etc.)
  'data_provider',     -- External data source
  'user',              -- User action/input
  'third_party',       -- Third-party integration
  'shared'             -- Multiple parties
);

-- =====================================================
-- SECTION 2: LIABILITY MATRIX TABLE
-- =====================================================

CREATE TABLE liability_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Decision reference
  decision_id UUID NOT NULL,
  decision_type VARCHAR(100) NOT NULL,
  decision_outcome VARCHAR(255) NOT NULL,
  decision_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor information
  actor_type decision_actor NOT NULL,
  model_id VARCHAR(100),
  model_version VARCHAR(50),
  human_reviewer_id UUID REFERENCES auth.users(id),

  -- Affected party
  affected_user_id UUID REFERENCES auth.users(id),
  affected_entity_type VARCHAR(100),
  affected_entity_id UUID,

  -- Liability assessment
  severity liability_severity NOT NULL DEFAULT 'unassessed',
  status liability_status NOT NULL DEFAULT 'unassessed',
  primary_responsible responsible_party,
  secondary_responsible responsible_party,

  -- Impact details
  impact_description TEXT,
  financial_impact_usd NUMERIC(15,2),
  reputational_impact_score INTEGER CHECK (reputational_impact_score >= 0 AND reputational_impact_score <= 100),

  -- Chain of responsibility
  responsibility_chain JSONB DEFAULT '[]', -- [{party, role, percentage}]

  -- Mitigation
  mitigation_taken TEXT,
  mitigation_timestamp TIMESTAMPTZ,

  -- Resolution
  resolution_notes TEXT,
  resolution_timestamp TIMESTAMPTZ,
  compensation_provided NUMERIC(15,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_liability_decision ON liability_matrix(decision_id);
CREATE INDEX idx_liability_type ON liability_matrix(decision_type);
CREATE INDEX idx_liability_affected ON liability_matrix(affected_user_id);
CREATE INDEX idx_liability_status ON liability_matrix(status);
CREATE INDEX idx_liability_severity ON liability_matrix(severity);
CREATE INDEX idx_liability_created ON liability_matrix(created_at DESC);

-- =====================================================
-- SECTION 3: LIABILITY POLICIES TABLE
-- =====================================================

CREATE TABLE liability_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Policy identification
  policy_name VARCHAR(100) UNIQUE NOT NULL,
  decision_type VARCHAR(100) NOT NULL,

  -- Default liability assignment
  default_actor_type decision_actor,
  default_responsible responsible_party,

  -- Severity thresholds
  minor_threshold JSONB, -- {metric: value} that triggers minor severity
  moderate_threshold JSONB,
  significant_threshold JSONB,
  critical_threshold JSONB,

  -- Automatic escalation rules
  auto_escalate_on TEXT[], -- Array of conditions
  escalation_contact TEXT,

  -- Insurance requirements
  requires_insurance BOOLEAN DEFAULT false,
  insurance_coverage_type VARCHAR(100),
  minimum_coverage_usd NUMERIC(15,2),

  -- Active status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ
);

CREATE INDEX idx_liability_policy_type ON liability_policies(decision_type);

-- =====================================================
-- SECTION 4: ACCOUNTABILITY LOG TABLE
-- =====================================================

CREATE TABLE accountability_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  liability_id UUID REFERENCES liability_matrix(id) ON DELETE SET NULL,
  decision_id UUID NOT NULL,

  -- Action taken
  action_type VARCHAR(100) NOT NULL,
  action_description TEXT NOT NULL,
  action_by UUID REFERENCES auth.users(id),
  action_by_role VARCHAR(100),

  -- Before/after state
  previous_state JSONB,
  new_state JSONB,

  -- Justification
  justification TEXT,
  evidence_links TEXT[],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accountability_liability ON accountability_log(liability_id);
CREATE INDEX idx_accountability_decision ON accountability_log(decision_id);
CREATE INDEX idx_accountability_created ON accountability_log(created_at DESC);

-- =====================================================
-- SECTION 5: CREATE LIABILITY ENTRY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_liability_entry(
  p_decision_id UUID,
  p_decision_type VARCHAR(100),
  p_decision_outcome VARCHAR(255),
  p_actor_type decision_actor,
  p_affected_user_id UUID DEFAULT NULL,
  p_model_id VARCHAR(100) DEFAULT NULL,
  p_human_reviewer_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_liability_id UUID;
  v_policy RECORD;
BEGIN
  -- Check for applicable policy
  SELECT * INTO v_policy
  FROM liability_policies
  WHERE decision_type = p_decision_type
    AND is_active = true
    AND (effective_until IS NULL OR effective_until > NOW())
  LIMIT 1;

  -- Create liability entry
  INSERT INTO liability_matrix (
    decision_id,
    decision_type,
    decision_outcome,
    actor_type,
    model_id,
    human_reviewer_id,
    affected_user_id,
    severity,
    status,
    primary_responsible
  ) VALUES (
    p_decision_id,
    p_decision_type,
    p_decision_outcome,
    p_actor_type,
    p_model_id,
    p_human_reviewer_id,
    p_affected_user_id,
    'negligible', -- Default, will be assessed
    'unassessed',
    COALESCE(v_policy.default_responsible, 'company')
  )
  RETURNING id INTO v_liability_id;

  -- Log creation
  INSERT INTO accountability_log (
    liability_id,
    decision_id,
    action_type,
    action_description
  ) VALUES (
    v_liability_id,
    p_decision_id,
    'liability_created',
    'Liability entry created for decision'
  );

  RETURN v_liability_id;
END;
$$;

-- =====================================================
-- SECTION 6: ASSESS LIABILITY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION assess_liability(
  p_liability_id UUID,
  p_severity liability_severity,
  p_primary_responsible responsible_party,
  p_impact_description TEXT DEFAULT NULL,
  p_financial_impact NUMERIC DEFAULT NULL,
  p_responsibility_chain JSONB DEFAULT NULL,
  p_assessor_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_state JSONB;
  v_decision_id UUID;
BEGIN
  -- Get current state
  SELECT
    decision_id,
    jsonb_build_object(
      'severity', severity,
      'status', status,
      'primary_responsible', primary_responsible
    )
  INTO v_decision_id, v_previous_state
  FROM liability_matrix
  WHERE id = p_liability_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Update liability
  UPDATE liability_matrix
  SET
    severity = p_severity,
    status = 'assessed',
    primary_responsible = p_primary_responsible,
    impact_description = COALESCE(p_impact_description, impact_description),
    financial_impact_usd = p_financial_impact,
    responsibility_chain = COALESCE(p_responsibility_chain, responsibility_chain),
    updated_at = NOW()
  WHERE id = p_liability_id;

  -- Log assessment
  INSERT INTO accountability_log (
    liability_id,
    decision_id,
    action_type,
    action_description,
    action_by,
    previous_state,
    new_state
  ) VALUES (
    p_liability_id,
    v_decision_id,
    'liability_assessed',
    format('Assessed as %s severity, %s responsible', p_severity, p_primary_responsible),
    p_assessor_id,
    v_previous_state,
    jsonb_build_object(
      'severity', p_severity,
      'status', 'assessed',
      'primary_responsible', p_primary_responsible
    )
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 7: RECORD MITIGATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION record_mitigation(
  p_liability_id UUID,
  p_mitigation_description TEXT,
  p_mitigator_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_decision_id UUID;
BEGIN
  SELECT decision_id INTO v_decision_id
  FROM liability_matrix
  WHERE id = p_liability_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE liability_matrix
  SET
    mitigation_taken = p_mitigation_description,
    mitigation_timestamp = NOW(),
    updated_at = NOW()
  WHERE id = p_liability_id;

  INSERT INTO accountability_log (
    liability_id,
    decision_id,
    action_type,
    action_description,
    action_by
  ) VALUES (
    p_liability_id,
    v_decision_id,
    'mitigation_recorded',
    p_mitigation_description,
    p_mitigator_id
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 8: RESOLVE LIABILITY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION resolve_liability(
  p_liability_id UUID,
  p_resolution_notes TEXT,
  p_compensation_usd NUMERIC DEFAULT NULL,
  p_resolver_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_decision_id UUID;
BEGIN
  SELECT decision_id INTO v_decision_id
  FROM liability_matrix
  WHERE id = p_liability_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE liability_matrix
  SET
    status = 'resolved',
    resolution_notes = p_resolution_notes,
    resolution_timestamp = NOW(),
    compensation_provided = p_compensation_usd,
    updated_at = NOW()
  WHERE id = p_liability_id;

  INSERT INTO accountability_log (
    liability_id,
    decision_id,
    action_type,
    action_description,
    action_by
  ) VALUES (
    p_liability_id,
    v_decision_id,
    'liability_resolved',
    format('Resolved: %s. Compensation: $%s', p_resolution_notes, COALESCE(p_compensation_usd::TEXT, '0')),
    p_resolver_id
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 9: GET LIABILITY REPORT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_liability_report(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_entries INTEGER,
  by_severity JSONB,
  by_actor_type JSONB,
  by_responsible_party JSONB,
  total_financial_impact NUMERIC,
  total_compensation NUMERIC,
  unresolved_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    jsonb_object_agg(severity::TEXT, severity_count),
    jsonb_object_agg(actor_type::TEXT, actor_count),
    jsonb_object_agg(primary_responsible::TEXT, responsible_count),
    COALESCE(SUM(lm.financial_impact_usd), 0),
    COALESCE(SUM(lm.compensation_provided), 0),
    COUNT(*) FILTER (WHERE lm.status != 'resolved')::INTEGER
  FROM (
    SELECT
      lm.severity,
      lm.actor_type,
      lm.primary_responsible,
      lm.financial_impact_usd,
      lm.compensation_provided,
      lm.status,
      COUNT(*) OVER (PARTITION BY lm.severity) as severity_count,
      COUNT(*) OVER (PARTITION BY lm.actor_type) as actor_count,
      COUNT(*) OVER (PARTITION BY lm.primary_responsible) as responsible_count
    FROM liability_matrix lm
    WHERE lm.created_at BETWEEN p_start_date AND p_end_date
  ) lm
  GROUP BY ();
END;
$$;

-- =====================================================
-- SECTION 10: DEFAULT POLICIES
-- =====================================================

INSERT INTO liability_policies (
  policy_name,
  decision_type,
  default_actor_type,
  default_responsible,
  minor_threshold,
  moderate_threshold,
  significant_threshold,
  critical_threshold,
  auto_escalate_on,
  requires_insurance
) VALUES
(
  'risk_assessment_liability',
  'risk_assessment',
  'ai_autonomous',
  'company',
  '{"false_positive_rate": 0.05}',
  '{"false_positive_rate": 0.10, "financial_impact_usd": 1000}',
  '{"false_positive_rate": 0.20, "financial_impact_usd": 10000}',
  '{"false_positive_rate": 0.30, "financial_impact_usd": 100000}',
  ARRAY['user_dispute', 'regulatory_inquiry'],
  true
),
(
  'wallet_classification_liability',
  'wallet_classification',
  'ai_autonomous',
  'company',
  '{"misclassification_rate": 0.05}',
  '{"misclassification_rate": 0.10}',
  '{"misclassification_rate": 0.15, "user_complaint": true}',
  '{"misclassification_rate": 0.20, "legal_action": true}',
  ARRAY['discrimination_concern'],
  false
),
(
  'recommendation_liability',
  'token_recommendation',
  'ai_recommended',
  'shared',
  '{"user_loss_pct": 5}',
  '{"user_loss_pct": 15}',
  '{"user_loss_pct": 30}',
  '{"user_loss_pct": 50}',
  ARRAY['user_complaint', 'significant_loss'],
  true
),
(
  'alert_liability',
  'alert_trigger',
  'ai_autonomous',
  'company',
  '{"false_alarm_rate": 0.10}',
  '{"false_alarm_rate": 0.20, "missed_event": true}',
  '{"missed_event": true, "financial_impact_usd": 5000}',
  '{"missed_event": true, "financial_impact_usd": 50000}',
  ARRAY['missed_critical_event'],
  false
);

-- =====================================================
-- SECTION 11: RLS POLICIES
-- =====================================================

ALTER TABLE liability_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE liability_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own liability entries
CREATE POLICY liability_view_own ON liability_matrix
  FOR SELECT
  USING (affected_user_id = auth.uid());

-- Users can view accountability log for their entries
CREATE POLICY accountability_view_own ON accountability_log
  FOR SELECT
  USING (
    decision_id IN (
      SELECT decision_id FROM liability_matrix
      WHERE affected_user_id = auth.uid()
    )
  );

-- Policies are readable by all authenticated
CREATE POLICY policies_view ON liability_policies
  FOR SELECT
  USING (is_active = true);

-- Admin policies
CREATE POLICY liability_admin ON liability_matrix
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY accountability_admin ON accountability_log
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY policies_admin ON liability_policies
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECTION 12: COMMENTS
-- =====================================================

COMMENT ON TABLE liability_matrix IS 'Tracks AI decision liability and accountability';
COMMENT ON TABLE liability_policies IS 'Defines liability policies by decision type';
COMMENT ON TABLE accountability_log IS 'Audit trail of all liability-related actions';
COMMENT ON FUNCTION create_liability_entry IS 'Creates a new liability entry for an AI decision';
COMMENT ON FUNCTION assess_liability IS 'Assesses severity and assigns responsibility';
COMMENT ON FUNCTION resolve_liability IS 'Marks a liability entry as resolved';
