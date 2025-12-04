-- ============================================================================
-- Brand Corrections & Score Disputes Tables
-- Phase 4: Chaos Engineering - Persistence Layer for RLHF Corrections
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE correction_type AS ENUM (
  'score_too_high',
  'score_too_low',
  'wrong_sentiment',
  'wrong_category',
  'factual_error',
  'hallucination',
  'outdated_info',
  'missing_info',
  'competitor_confusion',
  'other'
);

CREATE TYPE correction_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected',
  'applied',
  'disputed'
);

CREATE TYPE correction_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE sentiment_type AS ENUM (
  'positive',
  'neutral',
  'negative'
);

CREATE TYPE dispute_category AS ENUM (
  'inaccurate_score',
  'missing_data',
  'competitor_bias',
  'outdated_info',
  'technical_error',
  'other'
);

CREATE TYPE dispute_status AS ENUM (
  'open',
  'investigating',
  'resolved_accepted',
  'resolved_rejected',
  'closed'
);

-- ============================================================================
-- BRAND CORRECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS brand_corrections (
  id TEXT PRIMARY KEY DEFAULT ('corr_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 8)),

  -- Brand reference
  brand_id TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  brand_domain TEXT,

  -- Original AI assessment
  original_score NUMERIC(5,2) NOT NULL CHECK (original_score >= 0 AND original_score <= 100),
  original_sentiment sentiment_type NOT NULL,
  original_category TEXT,
  original_summary TEXT,

  -- Correction details
  corrected_score NUMERIC(5,2) CHECK (corrected_score >= 0 AND corrected_score <= 100),
  corrected_sentiment sentiment_type,
  corrected_category TEXT,
  corrected_summary TEXT,
  correction_reason TEXT NOT NULL,
  correction_type correction_type NOT NULL,

  -- Metadata
  submitted_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  status correction_status NOT NULL DEFAULT 'pending',
  priority correction_priority NOT NULL DEFAULT 'low',

  -- Evidence
  evidence_urls TEXT[],
  attachments TEXT[],
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCORE DISPUTES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS score_disputes (
  id TEXT PRIMARY KEY DEFAULT ('disp_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 8)),

  -- References
  analysis_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,

  -- Dispute details
  disputed_score NUMERIC(5,2) NOT NULL CHECK (disputed_score >= 0 AND disputed_score <= 100),
  expected_score NUMERIC(5,2) NOT NULL CHECK (expected_score >= 0 AND expected_score <= 100),
  reason TEXT NOT NULL,
  category dispute_category NOT NULL,

  -- Evidence
  evidence_description TEXT,
  evidence_urls TEXT[],

  -- Resolution
  status dispute_status NOT NULL DEFAULT 'open',
  resolution TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  final_score NUMERIC(5,2) CHECK (final_score >= 0 AND final_score <= 100),

  -- Priority
  priority correction_priority NOT NULL DEFAULT 'medium',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- FEEDBACK INCENTIVES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_incentives (
  user_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  points INTEGER NOT NULL DEFAULT 0,
  badges JSONB NOT NULL DEFAULT '[]'::jsonb,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_contribution_date DATE,
  total_contributions INTEGER NOT NULL DEFAULT 0,
  accepted_corrections INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Brand corrections indexes
CREATE INDEX idx_brand_corrections_status ON brand_corrections(status);
CREATE INDEX idx_brand_corrections_priority ON brand_corrections(priority);
CREATE INDEX idx_brand_corrections_brand_id ON brand_corrections(brand_id);
CREATE INDEX idx_brand_corrections_submitted_by ON brand_corrections(submitted_by);
CREATE INDEX idx_brand_corrections_submitted_at ON brand_corrections(submitted_at DESC);
CREATE INDEX idx_brand_corrections_type ON brand_corrections(correction_type);

-- Score disputes indexes
CREATE INDEX idx_score_disputes_status ON score_disputes(status);
CREATE INDEX idx_score_disputes_user_id ON score_disputes(user_id);
CREATE INDEX idx_score_disputes_analysis_id ON score_disputes(analysis_id);
CREATE INDEX idx_score_disputes_created_at ON score_disputes(created_at DESC);

-- Feedback incentives indexes
CREATE INDEX idx_feedback_incentives_tier ON feedback_incentives(tier);
CREATE INDEX idx_feedback_incentives_points ON feedback_incentives(points DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brand_corrections_updated_at
  BEFORE UPDATE ON brand_corrections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_score_disputes_updated_at
  BEFORE UPDATE ON score_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_incentives_updated_at
  BEFORE UPDATE ON feedback_incentives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE brand_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_incentives ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to brand_corrections"
  ON brand_corrections FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to score_disputes"
  ON score_disputes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to feedback_incentives"
  ON feedback_incentives FOR ALL
  USING (auth.role() = 'service_role');

-- Users can view their own corrections
CREATE POLICY "Users can view own corrections"
  ON brand_corrections FOR SELECT
  USING (submitted_by = auth.uid()::text);

-- Users can insert corrections
CREATE POLICY "Users can insert corrections"
  ON brand_corrections FOR INSERT
  WITH CHECK (submitted_by = auth.uid()::text);

-- Users can view their own disputes
CREATE POLICY "Users can view own disputes"
  ON score_disputes FOR SELECT
  USING (user_id = auth.uid()::text);

-- Users can insert disputes
CREATE POLICY "Users can insert disputes"
  ON score_disputes FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Users can view their own incentives
CREATE POLICY "Users can view own incentives"
  ON feedback_incentives FOR SELECT
  USING (user_id = auth.uid()::text);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get correction queue with priority sorting
CREATE OR REPLACE FUNCTION get_correction_queue(
  p_status correction_status DEFAULT NULL,
  p_priority correction_priority DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  correction_id TEXT,
  brand_name TEXT,
  correction_type correction_type,
  priority correction_priority,
  status correction_status,
  submitted_at TIMESTAMPTZ,
  queue_position BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bc.id,
    bc.brand_name,
    bc.correction_type,
    bc.priority,
    bc.status,
    bc.submitted_at,
    ROW_NUMBER() OVER (
      ORDER BY
        CASE bc.priority
          WHEN 'critical' THEN 0
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END,
        bc.submitted_at ASC
    ) as queue_position
  FROM brand_corrections bc
  WHERE
    (p_status IS NULL OR bc.status = p_status)
    AND (p_priority IS NULL OR bc.priority = p_priority)
  ORDER BY queue_position
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get correction statistics
CREATE OR REPLACE FUNCTION get_correction_stats()
RETURNS TABLE (
  total_corrections BIGINT,
  pending BIGINT,
  approved BIGINT,
  rejected BIGINT,
  applied BIGINT,
  avg_review_time_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_corrections,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending,
    COUNT(*) FILTER (WHERE status = 'approved')::BIGINT as approved,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT as rejected,
    COUNT(*) FILTER (WHERE status = 'applied')::BIGINT as applied,
    COALESCE(
      AVG(EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 60)
      FILTER (WHERE reviewed_at IS NOT NULL),
      0
    )::NUMERIC as avg_review_time_minutes
  FROM brand_corrections;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user incentive points
CREATE OR REPLACE FUNCTION update_user_points(
  p_user_id TEXT,
  p_points_to_add INTEGER,
  p_is_accepted BOOLEAN DEFAULT false
)
RETURNS feedback_incentives AS $$
DECLARE
  v_incentive feedback_incentives;
  v_new_tier TEXT;
BEGIN
  -- Upsert incentive record
  INSERT INTO feedback_incentives (user_id, points, total_contributions, accepted_corrections)
  VALUES (p_user_id, p_points_to_add, 1, CASE WHEN p_is_accepted THEN 1 ELSE 0 END)
  ON CONFLICT (user_id) DO UPDATE SET
    points = feedback_incentives.points + p_points_to_add,
    total_contributions = feedback_incentives.total_contributions + 1,
    accepted_corrections = feedback_incentives.accepted_corrections + CASE WHEN p_is_accepted THEN 1 ELSE 0 END,
    accuracy = CASE
      WHEN feedback_incentives.total_contributions > 0
      THEN ((feedback_incentives.accepted_corrections + CASE WHEN p_is_accepted THEN 1 ELSE 0 END)::NUMERIC /
            (feedback_incentives.total_contributions + 1)::NUMERIC * 100)
      ELSE 0
    END,
    last_contribution_date = CURRENT_DATE,
    streak_days = CASE
      WHEN feedback_incentives.last_contribution_date = CURRENT_DATE - 1
      THEN feedback_incentives.streak_days + 1
      WHEN feedback_incentives.last_contribution_date = CURRENT_DATE
      THEN feedback_incentives.streak_days
      ELSE 1
    END
  RETURNING * INTO v_incentive;

  -- Calculate tier
  v_new_tier := CASE
    WHEN v_incentive.points >= 1000 THEN 'platinum'
    WHEN v_incentive.points >= 500 THEN 'gold'
    WHEN v_incentive.points >= 100 THEN 'silver'
    ELSE 'bronze'
  END;

  -- Update tier if changed
  IF v_new_tier != v_incentive.tier THEN
    UPDATE feedback_incentives SET tier = v_new_tier WHERE user_id = p_user_id
    RETURNING * INTO v_incentive;
  END IF;

  RETURN v_incentive;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE brand_corrections IS 'Human corrections to AI-generated brand assessments for RLHF';
COMMENT ON TABLE score_disputes IS 'User disputes of AI perception scores';
COMMENT ON TABLE feedback_incentives IS 'Gamification incentives for user contributions';

COMMENT ON FUNCTION get_correction_queue IS 'Get prioritized queue of corrections for review';
COMMENT ON FUNCTION get_correction_stats IS 'Get aggregated statistics for corrections';
COMMENT ON FUNCTION update_user_points IS 'Update user incentive points after correction review';
