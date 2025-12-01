-- =====================================================
-- REDRESS MECHANISM SCHEMA
-- Migration: 20250130_redress_mechanism.sql
-- Purpose: Provide compensation and remediation for AI-caused harms
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SECTION 1: ENUMS
-- =====================================================

-- Redress types
CREATE TYPE redress_type AS ENUM (
  'monetary',          -- Financial compensation
  'service_credit',    -- Account credits
  'feature_unlock',    -- Access to premium features
  'priority_support',  -- Enhanced support access
  'data_correction',   -- Correcting erroneous data
  'reputation_repair', -- Public correction/apology
  'process_change',    -- Policy/process modification
  'combination'        -- Multiple types
);

-- Redress status
CREATE TYPE redress_status AS ENUM (
  'pending',           -- Awaiting review
  'calculating',       -- Determining appropriate redress
  'proposed',          -- Offer made to user
  'negotiating',       -- User counter-proposal
  'accepted',          -- User accepted offer
  'rejected',          -- User rejected offer
  'in_progress',       -- Redress being delivered
  'completed',         -- Redress fully delivered
  'disputed',          -- User disputes fulfillment
  'cancelled'          -- Cancelled (e.g., invalid claim)
);

-- Eligibility status
CREATE TYPE eligibility_status AS ENUM (
  'pending_review',
  'eligible',
  'partially_eligible',
  'not_eligible',
  'requires_investigation'
);

-- =====================================================
-- SECTION 2: REDRESS CLAIMS TABLE
-- =====================================================

CREATE TABLE redress_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Claim identification
  claim_reference VARCHAR(50) UNIQUE NOT NULL DEFAULT ('RDR-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8))),

  -- Related records
  harm_id UUID REFERENCES harm_registry(id) ON DELETE SET NULL,
  decision_id UUID NOT NULL,
  liability_id UUID REFERENCES liability_matrix(id) ON DELETE SET NULL,

  -- Claimant
  claimant_id UUID NOT NULL REFERENCES auth.users(id),
  claimant_email VARCHAR(255),

  -- Claim details
  claim_description TEXT NOT NULL,
  claimed_amount_usd NUMERIC(15,2),
  claimed_redress_type redress_type DEFAULT 'monetary',

  -- Eligibility
  eligibility eligibility_status NOT NULL DEFAULT 'pending_review',
  eligibility_notes TEXT,
  eligibility_assessed_by UUID REFERENCES auth.users(id),
  eligibility_assessed_at TIMESTAMPTZ,

  -- Approved redress
  approved_amount_usd NUMERIC(15,2),
  approved_redress_type redress_type,
  approved_redress_details JSONB,

  -- Status tracking
  status redress_status NOT NULL DEFAULT 'pending',

  -- Delivery
  delivery_method VARCHAR(100),
  delivery_reference VARCHAR(255),
  delivered_at TIMESTAMPTZ,
  delivery_confirmed BOOLEAN DEFAULT false,

  -- User response
  user_response TEXT,
  user_satisfaction_score INTEGER CHECK (user_satisfaction_score >= 1 AND user_satisfaction_score <= 5),

  -- Deadlines
  response_deadline TIMESTAMPTZ,
  delivery_deadline TIMESTAMPTZ,

  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_redress_reference ON redress_claims(claim_reference);
CREATE INDEX idx_redress_claimant ON redress_claims(claimant_id);
CREATE INDEX idx_redress_harm ON redress_claims(harm_id);
CREATE INDEX idx_redress_status ON redress_claims(status);
CREATE INDEX idx_redress_eligibility ON redress_claims(eligibility);
CREATE INDEX idx_redress_submitted ON redress_claims(submitted_at DESC);

-- =====================================================
-- SECTION 3: REDRESS POLICIES TABLE
-- =====================================================

CREATE TABLE redress_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Policy identification
  policy_name VARCHAR(100) UNIQUE NOT NULL,
  harm_category harm_category,
  decision_type VARCHAR(100),

  -- Eligibility rules
  eligibility_criteria JSONB NOT NULL,
  automatic_eligibility_conditions JSONB,

  -- Compensation matrix
  base_compensation_usd NUMERIC(15,2) DEFAULT 0,
  severity_multipliers JSONB DEFAULT '{"negligible": 0, "minor": 0.5, "moderate": 1, "significant": 2, "critical": 5}',
  max_compensation_usd NUMERIC(15,2),

  -- Alternative redress options
  alternative_options JSONB, -- Array of non-monetary options
  default_redress_type redress_type DEFAULT 'monetary',

  -- SLA
  response_sla_hours INTEGER DEFAULT 72,
  resolution_sla_days INTEGER DEFAULT 30,

  -- Active status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ
);

CREATE INDEX idx_redress_policy_category ON redress_policies(harm_category);
CREATE INDEX idx_redress_policy_decision ON redress_policies(decision_type);

-- =====================================================
-- SECTION 4: REDRESS HISTORY TABLE
-- =====================================================

CREATE TABLE redress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  claim_id UUID NOT NULL REFERENCES redress_claims(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Actor
  actor_id UUID REFERENCES auth.users(id),
  actor_role VARCHAR(100),
  is_system_action BOOLEAN DEFAULT false,

  -- Data changes
  previous_state JSONB,
  new_state JSONB,

  -- Communication
  communication_sent BOOLEAN DEFAULT false,
  communication_type VARCHAR(50),
  communication_template VARCHAR(100),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_history_claim ON redress_history(claim_id);
CREATE INDEX idx_history_timestamp ON redress_history(event_timestamp DESC);

-- =====================================================
-- SECTION 5: SUBMIT REDRESS CLAIM FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION submit_redress_claim(
  p_decision_id UUID,
  p_claimant_id UUID,
  p_description TEXT,
  p_claimed_amount NUMERIC DEFAULT NULL,
  p_redress_type redress_type DEFAULT 'monetary',
  p_harm_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claim_id UUID;
  v_policy RECORD;
  v_response_deadline TIMESTAMPTZ;
BEGIN
  -- Find applicable policy
  SELECT * INTO v_policy
  FROM redress_policies rp
  WHERE rp.is_active = true
    AND (rp.effective_until IS NULL OR rp.effective_until > NOW())
  ORDER BY
    CASE WHEN rp.harm_category IS NOT NULL THEN 1 ELSE 2 END
  LIMIT 1;

  -- Calculate deadline
  v_response_deadline := NOW() + (COALESCE(v_policy.response_sla_hours, 72) || ' hours')::INTERVAL;

  -- Create claim
  INSERT INTO redress_claims (
    decision_id,
    harm_id,
    claimant_id,
    claim_description,
    claimed_amount_usd,
    claimed_redress_type,
    response_deadline,
    delivery_deadline
  ) VALUES (
    p_decision_id,
    p_harm_id,
    p_claimant_id,
    p_description,
    p_claimed_amount,
    p_redress_type,
    v_response_deadline,
    NOW() + (COALESCE(v_policy.resolution_sla_days, 30) || ' days')::INTERVAL
  )
  RETURNING id INTO v_claim_id;

  -- Add to history
  INSERT INTO redress_history (
    claim_id,
    event_type,
    event_description,
    actor_id,
    communication_sent,
    communication_type
  ) VALUES (
    v_claim_id,
    'claim_submitted',
    'Redress claim submitted',
    p_claimant_id,
    true,
    'email'
  );

  RETURN v_claim_id;
END;
$$;

-- =====================================================
-- SECTION 6: ASSESS ELIGIBILITY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION assess_eligibility(
  p_claim_id UUID,
  p_eligibility eligibility_status,
  p_notes TEXT,
  p_assessor_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_status eligibility_status;
BEGIN
  SELECT eligibility INTO v_previous_status
  FROM redress_claims
  WHERE id = p_claim_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE redress_claims
  SET
    eligibility = p_eligibility,
    eligibility_notes = p_notes,
    eligibility_assessed_by = p_assessor_id,
    eligibility_assessed_at = NOW(),
    status = CASE
      WHEN p_eligibility = 'eligible' THEN 'calculating'
      WHEN p_eligibility = 'not_eligible' THEN 'cancelled'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_claim_id;

  INSERT INTO redress_history (
    claim_id,
    event_type,
    event_description,
    actor_id,
    previous_state,
    new_state
  ) VALUES (
    p_claim_id,
    'eligibility_assessed',
    format('Eligibility: %s - %s', p_eligibility, p_notes),
    p_assessor_id,
    jsonb_build_object('eligibility', v_previous_status),
    jsonb_build_object('eligibility', p_eligibility)
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 7: PROPOSE REDRESS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION propose_redress(
  p_claim_id UUID,
  p_amount NUMERIC,
  p_redress_type redress_type,
  p_details JSONB,
  p_proposer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE redress_claims
  SET
    approved_amount_usd = p_amount,
    approved_redress_type = p_redress_type,
    approved_redress_details = p_details,
    status = 'proposed',
    updated_at = NOW()
  WHERE id = p_claim_id
    AND eligibility IN ('eligible', 'partially_eligible');

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO redress_history (
    claim_id,
    event_type,
    event_description,
    actor_id,
    new_state,
    communication_sent,
    communication_type
  ) VALUES (
    p_claim_id,
    'redress_proposed',
    format('Proposed: $%s (%s)', p_amount, p_redress_type),
    p_proposer_id,
    jsonb_build_object(
      'amount', p_amount,
      'type', p_redress_type,
      'details', p_details
    ),
    true,
    'email'
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 8: RESPOND TO PROPOSAL FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION respond_to_proposal(
  p_claim_id UUID,
  p_accepted BOOLEAN,
  p_response TEXT DEFAULT NULL,
  p_counter_amount NUMERIC DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claimant_id UUID;
BEGIN
  SELECT claimant_id INTO v_claimant_id
  FROM redress_claims
  WHERE id = p_claim_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF p_accepted THEN
    UPDATE redress_claims
    SET
      status = 'accepted',
      user_response = p_response,
      updated_at = NOW()
    WHERE id = p_claim_id;

    INSERT INTO redress_history (
      claim_id,
      event_type,
      event_description,
      actor_id
    ) VALUES (
      p_claim_id,
      'proposal_accepted',
      COALESCE(p_response, 'User accepted the proposal'),
      v_claimant_id
    );
  ELSE
    UPDATE redress_claims
    SET
      status = 'negotiating',
      user_response = p_response,
      claimed_amount_usd = COALESCE(p_counter_amount, claimed_amount_usd),
      updated_at = NOW()
    WHERE id = p_claim_id;

    INSERT INTO redress_history (
      claim_id,
      event_type,
      event_description,
      actor_id
    ) VALUES (
      p_claim_id,
      'counter_proposal',
      format('Counter-proposal: $%s - %s', p_counter_amount, p_response),
      v_claimant_id
    );
  END IF;

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 9: DELIVER REDRESS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION deliver_redress(
  p_claim_id UUID,
  p_delivery_method VARCHAR(100),
  p_delivery_reference VARCHAR(255),
  p_deliverer_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE redress_claims
  SET
    status = 'in_progress',
    delivery_method = p_delivery_method,
    delivery_reference = p_delivery_reference,
    delivered_at = NOW(),
    updated_at = NOW()
  WHERE id = p_claim_id
    AND status = 'accepted';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO redress_history (
    claim_id,
    event_type,
    event_description,
    actor_id,
    new_state
  ) VALUES (
    p_claim_id,
    'redress_delivered',
    format('Delivered via %s (ref: %s)', p_delivery_method, p_delivery_reference),
    p_deliverer_id,
    jsonb_build_object(
      'method', p_delivery_method,
      'reference', p_delivery_reference
    )
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 10: CONFIRM DELIVERY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION confirm_delivery(
  p_claim_id UUID,
  p_satisfaction_score INTEGER DEFAULT NULL,
  p_feedback TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_claimant_id UUID;
  v_harm_id UUID;
BEGIN
  SELECT claimant_id, harm_id
  INTO v_claimant_id, v_harm_id
  FROM redress_claims
  WHERE id = p_claim_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE redress_claims
  SET
    status = 'completed',
    delivery_confirmed = true,
    user_satisfaction_score = p_satisfaction_score,
    user_response = COALESCE(p_feedback, user_response),
    closed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_claim_id;

  -- Update harm registry if linked
  IF v_harm_id IS NOT NULL THEN
    UPDATE harm_registry
    SET
      redress_id = p_claim_id,
      redress_provided = true,
      updated_at = NOW()
    WHERE id = v_harm_id;
  END IF;

  INSERT INTO redress_history (
    claim_id,
    event_type,
    event_description,
    actor_id
  ) VALUES (
    p_claim_id,
    'delivery_confirmed',
    format('Delivery confirmed. Satisfaction: %s/5', COALESCE(p_satisfaction_score::TEXT, 'N/A')),
    v_claimant_id
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 11: CALCULATE COMPENSATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_compensation(
  p_harm_category harm_category,
  p_severity liability_severity,
  p_financial_impact NUMERIC DEFAULT NULL
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_policy RECORD;
  v_base NUMERIC;
  v_multiplier NUMERIC;
  v_calculated NUMERIC;
BEGIN
  -- Get applicable policy
  SELECT * INTO v_policy
  FROM redress_policies
  WHERE harm_category = p_harm_category
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    -- Default calculation
    v_base := 100;
    v_multiplier := CASE p_severity
      WHEN 'negligible' THEN 0
      WHEN 'minor' THEN 0.5
      WHEN 'moderate' THEN 1
      WHEN 'significant' THEN 2
      WHEN 'critical' THEN 5
      ELSE 1
    END;
  ELSE
    v_base := COALESCE(v_policy.base_compensation_usd, 100);
    v_multiplier := COALESCE(
      (v_policy.severity_multipliers ->> p_severity::TEXT)::NUMERIC,
      1
    );
  END IF;

  -- Calculate
  v_calculated := v_base * v_multiplier;

  -- If financial impact known, use higher of calculated or 50% of impact
  IF p_financial_impact IS NOT NULL AND p_financial_impact > 0 THEN
    v_calculated := GREATEST(v_calculated, p_financial_impact * 0.5);
  END IF;

  -- Apply maximum if policy exists
  IF v_policy IS NOT NULL AND v_policy.max_compensation_usd IS NOT NULL THEN
    v_calculated := LEAST(v_calculated, v_policy.max_compensation_usd);
  END IF;

  RETURN ROUND(v_calculated, 2);
END;
$$;

-- =====================================================
-- SECTION 12: DEFAULT REDRESS POLICIES
-- =====================================================

INSERT INTO redress_policies (
  policy_name,
  harm_category,
  decision_type,
  eligibility_criteria,
  base_compensation_usd,
  severity_multipliers,
  max_compensation_usd,
  alternative_options,
  response_sla_hours,
  resolution_sla_days
) VALUES
(
  'financial_harm_redress',
  'financial',
  NULL,
  '{"verified_harm": true, "financial_impact_documented": true}',
  100,
  '{"negligible": 0, "minor": 1, "moderate": 2, "significant": 3, "critical": 5}',
  10000,
  '[{"type": "service_credit", "multiplier": 1.5}, {"type": "fee_waiver", "duration_months": 6}]',
  48,
  21
),
(
  'discrimination_harm_redress',
  'discrimination',
  NULL,
  '{"verified_harm": true}',
  500,
  '{"negligible": 0, "minor": 2, "moderate": 4, "significant": 8, "critical": 20}',
  50000,
  '[{"type": "reputation_repair", "public_apology": true}, {"type": "priority_support", "duration_months": 12}]',
  24,
  14
),
(
  'operational_harm_redress',
  'operational',
  NULL,
  '{"service_disruption": true}',
  50,
  '{"negligible": 0, "minor": 0.5, "moderate": 1, "significant": 2, "critical": 4}',
  5000,
  '[{"type": "service_credit", "multiplier": 2}, {"type": "feature_unlock", "features": ["premium"]}]',
  72,
  30
),
(
  'recommendation_harm_redress',
  'financial',
  'token_recommendation',
  '{"recommendation_followed": true, "loss_documented": true, "risk_disclosure_shown": true}',
  0,
  '{"negligible": 0, "minor": 0, "moderate": 0.1, "significant": 0.2, "critical": 0.3}',
  1000,
  '[{"type": "service_credit", "multiplier": 1}, {"type": "priority_support", "duration_months": 3}]',
  72,
  30
);

-- =====================================================
-- SECTION 13: RLS POLICIES
-- =====================================================

ALTER TABLE redress_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE redress_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE redress_history ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own claims
CREATE POLICY claims_view_own ON redress_claims
  FOR SELECT
  USING (claimant_id = auth.uid());

CREATE POLICY claims_insert_own ON redress_claims
  FOR INSERT
  WITH CHECK (claimant_id = auth.uid());

CREATE POLICY claims_update_own ON redress_claims
  FOR UPDATE
  USING (claimant_id = auth.uid())
  WITH CHECK (claimant_id = auth.uid());

-- History visible for own claims
CREATE POLICY history_view ON redress_history
  FOR SELECT
  USING (
    claim_id IN (
      SELECT id FROM redress_claims
      WHERE claimant_id = auth.uid()
    )
  );

-- Policies readable by all authenticated
CREATE POLICY policies_view ON redress_policies
  FOR SELECT
  USING (is_active = true);

-- Admin policies
CREATE POLICY claims_admin ON redress_claims
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY history_admin ON redress_history
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY policies_admin ON redress_policies
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECTION 14: COMMENTS
-- =====================================================

COMMENT ON TABLE redress_claims IS 'User claims for compensation or remediation';
COMMENT ON TABLE redress_policies IS 'Policies governing redress calculations';
COMMENT ON TABLE redress_history IS 'Timeline of events for each claim';
COMMENT ON FUNCTION submit_redress_claim IS 'Submits a new redress claim';
COMMENT ON FUNCTION calculate_compensation IS 'Calculates appropriate compensation amount';
COMMENT ON FUNCTION deliver_redress IS 'Records delivery of redress';
