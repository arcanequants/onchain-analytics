-- =====================================================
-- HARM REGISTRY SCHEMA
-- Migration: 20250130_harm_registry.sql
-- Purpose: Track and document harms caused by AI decisions
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SECTION 1: ENUMS
-- =====================================================

-- Harm categories
CREATE TYPE harm_category AS ENUM (
  'financial',         -- Monetary loss
  'reputational',      -- Damage to reputation
  'operational',       -- Service disruption
  'privacy',           -- Privacy violation
  'discrimination',    -- Biased treatment
  'psychological',     -- Stress, anxiety
  'opportunity',       -- Missed opportunities
  'legal',             -- Legal consequences
  'regulatory',        -- Regulatory issues
  'other'
);

-- Harm verification status
CREATE TYPE harm_verification_status AS ENUM (
  'reported',          -- User reported
  'under_review',      -- Being investigated
  'verified',          -- Confirmed as valid
  'partially_verified', -- Some aspects confirmed
  'disputed',          -- Company disputes claim
  'rejected',          -- Not a valid harm
  'resolved'           -- Addressed and closed
);

-- Harm source
CREATE TYPE harm_source AS ENUM (
  'user_report',       -- User reported the harm
  'internal_audit',    -- Found during internal review
  'automated_detection', -- System detected anomaly
  'regulatory_inquiry', -- Regulator identified
  'legal_claim',       -- Legal action filed
  'media_report',      -- Media coverage
  'third_party'        -- Third party reported
);

-- =====================================================
-- SECTION 2: HARM REGISTRY TABLE
-- =====================================================

CREATE TABLE harm_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Harm identification
  harm_reference VARCHAR(50) UNIQUE NOT NULL DEFAULT ('HARM-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8))),

  -- Related decision
  decision_id UUID NOT NULL,
  decision_type VARCHAR(100) NOT NULL,
  decision_timestamp TIMESTAMPTZ,

  -- Affected party
  affected_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affected_entity_type VARCHAR(100),
  affected_entity_id UUID,
  affected_party_anonymous BOOLEAN DEFAULT false,

  -- Harm classification
  category harm_category NOT NULL,
  subcategory VARCHAR(100),
  severity liability_severity NOT NULL DEFAULT 'minor',

  -- Harm description
  description TEXT NOT NULL,
  evidence_summary TEXT,
  evidence_links TEXT[],
  evidence_files JSONB DEFAULT '[]',

  -- Verification
  verification_status harm_verification_status NOT NULL DEFAULT 'reported',
  source harm_source NOT NULL DEFAULT 'user_report',
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  -- Impact quantification
  financial_impact_usd NUMERIC(15,2),
  financial_impact_verified BOOLEAN DEFAULT false,
  non_financial_impact_score INTEGER CHECK (non_financial_impact_score >= 0 AND non_financial_impact_score <= 100),

  -- Root cause
  root_cause_identified BOOLEAN DEFAULT false,
  root_cause_description TEXT,
  root_cause_category VARCHAR(100),

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  related_harm_ids UUID[],
  pattern_identified BOOLEAN DEFAULT false,

  -- Remediation
  remediation_status VARCHAR(50) DEFAULT 'pending',
  remediation_plan TEXT,
  remediation_deadline TIMESTAMPTZ,
  remediation_completed_at TIMESTAMPTZ,

  -- Redress (linked to redress mechanism)
  redress_id UUID,
  redress_provided BOOLEAN DEFAULT false,

  -- Metadata
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_harm_reference ON harm_registry(harm_reference);
CREATE INDEX idx_harm_decision ON harm_registry(decision_id);
CREATE INDEX idx_harm_user ON harm_registry(affected_user_id);
CREATE INDEX idx_harm_category ON harm_registry(category);
CREATE INDEX idx_harm_severity ON harm_registry(severity);
CREATE INDEX idx_harm_status ON harm_registry(verification_status);
CREATE INDEX idx_harm_reported ON harm_registry(reported_at DESC);

-- =====================================================
-- SECTION 3: HARM TIMELINE TABLE
-- =====================================================

CREATE TABLE harm_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  harm_id UUID NOT NULL REFERENCES harm_registry(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Actor
  actor_id UUID REFERENCES auth.users(id),
  actor_role VARCHAR(100),

  -- Data changes
  previous_state JSONB,
  new_state JSONB,

  -- Evidence
  attachments JSONB DEFAULT '[]',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_harm ON harm_timeline(harm_id);
CREATE INDEX idx_timeline_timestamp ON harm_timeline(event_timestamp DESC);

-- =====================================================
-- SECTION 4: HARM PATTERNS TABLE
-- =====================================================

CREATE TABLE harm_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  pattern_name VARCHAR(255) NOT NULL,
  pattern_description TEXT NOT NULL,

  -- Classification
  harm_category harm_category NOT NULL,
  affected_decision_types TEXT[],

  -- Detection criteria
  detection_criteria JSONB NOT NULL, -- Rules for identifying pattern
  minimum_occurrences INTEGER DEFAULT 3,

  -- Associated harms
  harm_ids UUID[],
  occurrence_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  requires_investigation BOOLEAN DEFAULT true,
  investigation_status VARCHAR(50) DEFAULT 'pending',

  -- Response
  recommended_actions TEXT[],
  prevention_measures TEXT[],

  -- Metadata
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_occurrence_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pattern_category ON harm_patterns(harm_category);
CREATE INDEX idx_pattern_active ON harm_patterns(is_active);

-- =====================================================
-- SECTION 5: REGISTER HARM FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION register_harm(
  p_decision_id UUID,
  p_decision_type VARCHAR(100),
  p_category harm_category,
  p_description TEXT,
  p_affected_user_id UUID DEFAULT NULL,
  p_severity liability_severity DEFAULT 'minor',
  p_source harm_source DEFAULT 'user_report',
  p_evidence_summary TEXT DEFAULT NULL,
  p_financial_impact NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_harm_id UUID;
BEGIN
  INSERT INTO harm_registry (
    decision_id,
    decision_type,
    decision_timestamp,
    affected_user_id,
    category,
    severity,
    description,
    evidence_summary,
    source,
    financial_impact_usd
  ) VALUES (
    p_decision_id,
    p_decision_type,
    NOW(),
    p_affected_user_id,
    p_category,
    p_severity,
    p_description,
    p_evidence_summary,
    p_source,
    p_financial_impact
  )
  RETURNING id INTO v_harm_id;

  -- Add to timeline
  INSERT INTO harm_timeline (
    harm_id,
    event_type,
    event_description,
    actor_id
  ) VALUES (
    v_harm_id,
    'harm_reported',
    'Harm initially reported',
    p_affected_user_id
  );

  -- Check for patterns
  PERFORM check_harm_patterns(v_harm_id);

  RETURN v_harm_id;
END;
$$;

-- =====================================================
-- SECTION 6: VERIFY HARM FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION verify_harm(
  p_harm_id UUID,
  p_status harm_verification_status,
  p_verifier_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_root_cause TEXT DEFAULT NULL,
  p_financial_verified BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_status harm_verification_status;
BEGIN
  SELECT verification_status INTO v_previous_status
  FROM harm_registry
  WHERE id = p_harm_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE harm_registry
  SET
    verification_status = p_status,
    verified_by = p_verifier_id,
    verified_at = NOW(),
    root_cause_identified = (p_root_cause IS NOT NULL),
    root_cause_description = COALESCE(p_root_cause, root_cause_description),
    financial_impact_verified = COALESCE(p_financial_verified, financial_impact_verified),
    updated_at = NOW()
  WHERE id = p_harm_id;

  -- Add to timeline
  INSERT INTO harm_timeline (
    harm_id,
    event_type,
    event_description,
    actor_id,
    previous_state,
    new_state
  ) VALUES (
    p_harm_id,
    'verification_update',
    COALESCE(p_notes, format('Status changed to %s', p_status)),
    p_verifier_id,
    jsonb_build_object('status', v_previous_status),
    jsonb_build_object('status', p_status)
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 7: SET REMEDIATION PLAN FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION set_remediation_plan(
  p_harm_id UUID,
  p_plan TEXT,
  p_deadline TIMESTAMPTZ,
  p_planner_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE harm_registry
  SET
    remediation_status = 'planned',
    remediation_plan = p_plan,
    remediation_deadline = p_deadline,
    updated_at = NOW()
  WHERE id = p_harm_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO harm_timeline (
    harm_id,
    event_type,
    event_description,
    actor_id
  ) VALUES (
    p_harm_id,
    'remediation_planned',
    format('Remediation plan set with deadline: %s', p_deadline::DATE),
    p_planner_id
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 8: COMPLETE REMEDIATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION complete_remediation(
  p_harm_id UUID,
  p_notes TEXT,
  p_completer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE harm_registry
  SET
    remediation_status = 'completed',
    remediation_completed_at = NOW(),
    verification_status = 'resolved',
    closed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_harm_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO harm_timeline (
    harm_id,
    event_type,
    event_description,
    actor_id
  ) VALUES (
    p_harm_id,
    'remediation_completed',
    p_notes,
    p_completer_id
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 9: CHECK HARM PATTERNS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION check_harm_patterns(p_harm_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_harm RECORD;
  v_pattern RECORD;
  v_matches INTEGER;
BEGIN
  -- Get the new harm details
  SELECT * INTO v_harm
  FROM harm_registry
  WHERE id = p_harm_id;

  -- Check each active pattern
  FOR v_pattern IN
    SELECT * FROM harm_patterns WHERE is_active = true
  LOOP
    -- Simple pattern matching by category and decision type
    IF v_harm.category = v_pattern.harm_category AND
       (v_pattern.affected_decision_types IS NULL OR
        v_harm.decision_type = ANY(v_pattern.affected_decision_types)) THEN

      -- Count similar harms in last 30 days
      SELECT COUNT(*) INTO v_matches
      FROM harm_registry
      WHERE category = v_harm.category
        AND decision_type = v_harm.decision_type
        AND reported_at > NOW() - INTERVAL '30 days';

      IF v_matches >= v_pattern.minimum_occurrences THEN
        -- Update pattern
        UPDATE harm_patterns
        SET
          harm_ids = array_append(COALESCE(harm_ids, '{}'), p_harm_id),
          occurrence_count = v_matches,
          last_occurrence_at = NOW(),
          updated_at = NOW()
        WHERE id = v_pattern.id;

        -- Mark harm as part of pattern
        UPDATE harm_registry
        SET
          is_recurring = true,
          pattern_identified = true,
          updated_at = NOW()
        WHERE id = p_harm_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- SECTION 10: GET HARM STATISTICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_harm_statistics(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_harms INTEGER,
  verified_harms INTEGER,
  by_category JSONB,
  by_severity JSONB,
  total_financial_impact NUMERIC,
  avg_resolution_days NUMERIC,
  pattern_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE verification_status = 'verified')::INTEGER,
    jsonb_object_agg(
      category::TEXT,
      cat_count
    ),
    jsonb_object_agg(
      severity::TEXT,
      sev_count
    ),
    COALESCE(SUM(hr.financial_impact_usd), 0),
    COALESCE(
      AVG(EXTRACT(DAY FROM closed_at - reported_at))
      FILTER (WHERE closed_at IS NOT NULL),
      0
    ),
    (SELECT COUNT(*) FROM harm_patterns WHERE is_active = true)::INTEGER
  FROM (
    SELECT
      hr.category,
      hr.severity,
      hr.financial_impact_usd,
      hr.verification_status,
      hr.closed_at,
      hr.reported_at,
      COUNT(*) OVER (PARTITION BY hr.category) as cat_count,
      COUNT(*) OVER (PARTITION BY hr.severity) as sev_count
    FROM harm_registry hr
    WHERE hr.reported_at BETWEEN p_start_date AND p_end_date
  ) hr
  GROUP BY ();
END;
$$;

-- =====================================================
-- SECTION 11: DEFAULT HARM PATTERNS
-- =====================================================

INSERT INTO harm_patterns (
  pattern_name,
  pattern_description,
  harm_category,
  affected_decision_types,
  detection_criteria,
  minimum_occurrences,
  recommended_actions,
  prevention_measures
) VALUES
(
  'High Risk Misclassification',
  'Users incorrectly classified as high risk leading to service restrictions',
  'reputational',
  ARRAY['risk_assessment', 'wallet_classification'],
  '{"category": "reputational", "root_cause_category": "classification_error"}',
  3,
  ARRAY['Review classification thresholds', 'Audit recent decisions', 'Contact affected users'],
  ARRAY['Improve model training data', 'Add human review for borderline cases']
),
(
  'Recommendation Loss Pattern',
  'Users experiencing financial losses from AI recommendations',
  'financial',
  ARRAY['token_recommendation', 'portfolio_suggestion'],
  '{"category": "financial", "severity": ["moderate", "significant", "critical"]}',
  5,
  ARRAY['Suspend recommendations temporarily', 'Review risk disclosure', 'Assess compensation'],
  ARRAY['Enhance risk warnings', 'Add volatility indicators', 'Improve diversification advice']
),
(
  'False Positive Alerts',
  'Excessive false positive security alerts causing user disruption',
  'operational',
  ARRAY['alert_trigger', 'security_scan'],
  '{"category": "operational", "root_cause_category": "false_positive"}',
  10,
  ARRAY['Tune alert thresholds', 'Review detection rules', 'Apologize to affected users'],
  ARRAY['Implement graduated alerting', 'Add confirmation steps', 'Improve signal filtering']
),
(
  'Discrimination Pattern',
  'Evidence of biased treatment based on protected characteristics',
  'discrimination',
  NULL,
  '{"category": "discrimination"}',
  2,
  ARRAY['Immediate escalation to Ethics', 'Freeze affected model', 'Regulatory notification'],
  ARRAY['Bias audit', 'Fairness testing', 'Diverse training data']
);

-- =====================================================
-- SECTION 12: RLS POLICIES
-- =====================================================

ALTER TABLE harm_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE harm_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE harm_patterns ENABLE ROW LEVEL SECURITY;

-- Users can view their own harm entries
CREATE POLICY harm_view_own ON harm_registry
  FOR SELECT
  USING (affected_user_id = auth.uid());

-- Users can report harm
CREATE POLICY harm_insert_own ON harm_registry
  FOR INSERT
  WITH CHECK (affected_user_id = auth.uid());

-- Timeline visible for own harms
CREATE POLICY timeline_view ON harm_timeline
  FOR SELECT
  USING (
    harm_id IN (
      SELECT id FROM harm_registry
      WHERE affected_user_id = auth.uid()
    )
  );

-- Patterns readable by all authenticated
CREATE POLICY patterns_view ON harm_patterns
  FOR SELECT
  USING (is_active = true);

-- Admin policies
CREATE POLICY harm_admin ON harm_registry
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY timeline_admin ON harm_timeline
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY patterns_admin ON harm_patterns
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECTION 13: COMMENTS
-- =====================================================

COMMENT ON TABLE harm_registry IS 'Registry of all documented harms from AI decisions';
COMMENT ON TABLE harm_timeline IS 'Timeline of events for each harm entry';
COMMENT ON TABLE harm_patterns IS 'Identified patterns of recurring harms';
COMMENT ON FUNCTION register_harm IS 'Registers a new harm report';
COMMENT ON FUNCTION verify_harm IS 'Updates verification status of a harm';
COMMENT ON FUNCTION check_harm_patterns IS 'Checks if new harm matches existing patterns';
