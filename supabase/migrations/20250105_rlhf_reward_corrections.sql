-- ============================================================================
-- RLHF Reward Models & Corrections Tables
-- Phase 4, Week 8 Extended - RLHF & Feedback Loop Checklist
--
-- This migration creates tables for:
-- - Reward model version tracking
-- - Brand corrections with approval workflow
-- - Score disputes with resolution tracking
-- ============================================================================

-- ============================================================================
-- 1. REWARD MODEL VERSIONS TABLE
-- ============================================================================

-- Model type enum
CREATE TYPE reward_model_type AS ENUM (
  'satisfaction_predictor',  -- Predicts user satisfaction
  'score_calibrator',        -- Calibrates perception scores
  'recommendation_ranker',   -- Ranks recommendation quality
  'feedback_quality',        -- Assesses feedback quality
  'preference_model'         -- Bradley-Terry preference model
);

-- Model status enum
CREATE TYPE model_status AS ENUM (
  'training',      -- Currently being trained
  'validating',    -- Being validated on test set
  'staged',        -- Ready for deployment
  'production',    -- Active in production
  'deprecated',    -- No longer in use
  'failed'         -- Training/validation failed
);

CREATE TABLE IF NOT EXISTS reward_model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model identification
  model_name VARCHAR(100) NOT NULL,
  version VARCHAR(50) NOT NULL,
  model_type reward_model_type NOT NULL,
  description TEXT,

  -- Status tracking
  status model_status NOT NULL DEFAULT 'training',
  is_current BOOLEAN DEFAULT false,

  -- Training configuration
  training_config JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "learning_rate": 0.001,
  --   "epochs": 100,
  --   "batch_size": 32,
  --   "optimizer": "adamw",
  --   "early_stopping_patience": 10
  -- }

  -- Training data
  training_samples INTEGER DEFAULT 0,
  validation_samples INTEGER DEFAULT 0,
  preference_pairs_used INTEGER DEFAULT 0,
  feedback_items_used INTEGER DEFAULT 0,

  -- Performance metrics
  metrics JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "accuracy": 0.82,
  --   "precision": 0.85,
  --   "recall": 0.79,
  --   "f1": 0.82,
  --   "auc_roc": 0.89,
  --   "mae": 0.12,
  --   "mse": 0.023
  -- }

  -- Validation metrics (on held-out test set)
  validation_metrics JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "accuracy": 0.78,
  --   "loss": 0.34
  -- }

  -- Comparison with previous version
  improvement_over_previous JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "accuracy_delta": 0.03,
  --   "f1_delta": 0.02
  -- }

  -- Model artifacts
  model_path TEXT,  -- Path to model weights/checkpoint
  checkpoint_path TEXT,
  model_size_bytes BIGINT,

  -- A/B test results (if deployed in experiment)
  ab_test_id UUID,
  ab_test_results JSONB DEFAULT '{}'::jsonb,
  -- {
  --   "variant": "treatment",
  --   "sample_size": 5000,
  --   "satisfaction_lift": 0.05,
  --   "p_value": 0.02
  -- }

  -- Deployment tracking
  deployed_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  deprecation_reason TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  training_started_at TIMESTAMPTZ,
  training_completed_at TIMESTAMPTZ,
  training_duration_seconds INTEGER,

  -- Constraints
  CONSTRAINT uq_reward_model_version UNIQUE (model_name, version),
  CONSTRAINT chk_samples_non_negative CHECK (
    training_samples >= 0 AND
    validation_samples >= 0 AND
    preference_pairs_used >= 0 AND
    feedback_items_used >= 0
  )
);

-- Indexes
CREATE INDEX idx_reward_models_name ON reward_model_versions(model_name);
CREATE INDEX idx_reward_models_type ON reward_model_versions(model_type);
CREATE INDEX idx_reward_models_status ON reward_model_versions(status);
CREATE INDEX idx_reward_models_current ON reward_model_versions(model_name, is_current) WHERE is_current = true;
CREATE INDEX idx_reward_models_production ON reward_model_versions(model_name) WHERE status = 'production';
CREATE INDEX idx_reward_models_created ON reward_model_versions(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_reward_model_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reward_model_versions_updated_at
  BEFORE UPDATE ON reward_model_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_reward_model_versions_updated_at();

-- ============================================================================
-- 2. BRAND CORRECTIONS TABLE
-- ============================================================================

-- Correction status enum
CREATE TYPE correction_status AS ENUM (
  'pending',       -- Awaiting review
  'under_review',  -- Being reviewed
  'approved',      -- Approved and applied
  'rejected',      -- Rejected by reviewer
  'needs_info',    -- More information needed
  'withdrawn'      -- Withdrawn by submitter
);

-- Correction type enum
CREATE TYPE correction_type AS ENUM (
  'brand_name',           -- Incorrect brand name
  'industry',             -- Wrong industry classification
  'competitor',           -- Wrong competitor association
  'contact_info',         -- Wrong contact information
  'description',          -- Incorrect description
  'headquarters',         -- Wrong location
  'social_links',         -- Incorrect social media links
  'factual_error',        -- General factual error
  'outdated_info',        -- Information is outdated
  'other'                 -- Other correction
);

CREATE TABLE IF NOT EXISTS brand_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  brand_name VARCHAR(255) NOT NULL,
  brand_url TEXT,

  -- Submitter
  submitted_by UUID,
  submitter_email VARCHAR(255),
  submitter_role VARCHAR(50),  -- 'brand_owner', 'user', 'admin', 'system'
  is_verified_brand_owner BOOLEAN DEFAULT false,

  -- Correction details
  correction_type correction_type NOT NULL,
  field_name VARCHAR(100),  -- Specific field being corrected

  -- Values
  original_value TEXT,
  corrected_value TEXT NOT NULL,
  correction_reason TEXT NOT NULL,

  -- Evidence
  evidence_urls TEXT[],  -- Supporting URLs
  evidence_files JSONB DEFAULT '[]'::jsonb,  -- Uploaded files
  evidence_description TEXT,

  -- Status
  status correction_status NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Review process
  reviewer_id UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,

  -- Application tracking
  applied_at TIMESTAMPTZ,
  applied_by UUID,
  rollback_at TIMESTAMPTZ,
  rollback_reason TEXT,

  -- Quality metrics
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brand_corrections_status ON brand_corrections(status);
CREATE INDEX idx_brand_corrections_type ON brand_corrections(correction_type);
CREATE INDEX idx_brand_corrections_brand ON brand_corrections(brand_name);
CREATE INDEX idx_brand_corrections_submitter ON brand_corrections(submitted_by);
CREATE INDEX idx_brand_corrections_analysis ON brand_corrections(analysis_id);
CREATE INDEX idx_brand_corrections_pending ON brand_corrections(created_at) WHERE status = 'pending';
CREATE INDEX idx_brand_corrections_priority ON brand_corrections(priority, created_at) WHERE status IN ('pending', 'under_review');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_brand_corrections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brand_corrections_updated_at
  BEFORE UPDATE ON brand_corrections
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_corrections_updated_at();

-- ============================================================================
-- 3. SCORE DISPUTES TABLE
-- ============================================================================

-- Dispute status enum
CREATE TYPE dispute_status AS ENUM (
  'open',           -- Newly submitted
  'investigating',  -- Under investigation
  'resolved',       -- Resolved (score may or may not change)
  'rejected',       -- Dispute rejected
  'escalated',      -- Escalated to higher review
  'closed'          -- Closed without resolution
);

-- Dispute resolution enum
CREATE TYPE dispute_resolution AS ENUM (
  'score_adjusted',      -- Score was changed
  'score_unchanged',     -- Score maintained after review
  'partial_adjustment',  -- Some aspects adjusted
  'recalculated',        -- Full recalculation performed
  'no_action'            -- No action taken
);

CREATE TABLE IF NOT EXISTS score_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  user_id UUID,

  -- Disputed scores
  disputed_score_type VARCHAR(50) NOT NULL,  -- 'perception', 'visibility', 'sentiment', etc.
  original_score INTEGER NOT NULL CHECK (original_score >= 0 AND original_score <= 100),
  expected_score INTEGER CHECK (expected_score >= 0 AND expected_score <= 100),
  final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100),

  -- Dispute details
  dispute_reason TEXT NOT NULL,
  detailed_explanation TEXT,
  supporting_evidence TEXT[],

  -- Category of dispute
  dispute_category VARCHAR(50) CHECK (dispute_category IN (
    'too_low',            -- Score is too low
    'too_high',           -- Score is too high
    'methodology',        -- Disagree with methodology
    'missing_data',       -- Important data was missed
    'incorrect_data',     -- Data used was incorrect
    'competitor_bias',    -- Perceived competitor bias
    'industry_context',   -- Industry context not considered
    'recent_changes',     -- Recent changes not reflected
    'technical_error',    -- Technical/calculation error
    'other'
  )),

  -- Status tracking
  status dispute_status NOT NULL DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),

  -- Investigation
  assigned_to UUID,
  investigation_notes TEXT,
  investigation_findings JSONB DEFAULT '{}'::jsonb,

  -- Resolution
  resolution dispute_resolution,
  resolution_notes TEXT,
  score_adjustment INTEGER,  -- How much the score changed (+/-)
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,

  -- Escalation
  escalation_level INTEGER DEFAULT 0,
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,

  -- User communication
  user_notified_at TIMESTAMPTZ,
  user_response TEXT,
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  internal_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_score_disputes_status ON score_disputes(status);
CREATE INDEX idx_score_disputes_analysis ON score_disputes(analysis_id);
CREATE INDEX idx_score_disputes_user ON score_disputes(user_id);
CREATE INDEX idx_score_disputes_assigned ON score_disputes(assigned_to) WHERE status IN ('open', 'investigating');
CREATE INDEX idx_score_disputes_open ON score_disputes(created_at) WHERE status = 'open';
CREATE INDEX idx_score_disputes_priority ON score_disputes(priority, created_at) WHERE status IN ('open', 'investigating', 'escalated');
CREATE INDEX idx_score_disputes_resolution ON score_disputes(resolution) WHERE resolution IS NOT NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_score_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_score_disputes_updated_at
  BEFORE UPDATE ON score_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_score_disputes_updated_at();

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

ALTER TABLE reward_model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_disputes ENABLE ROW LEVEL SECURITY;

-- Reward models: Service role only
CREATE POLICY "Service role full access to reward_models" ON reward_model_versions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admin can view reward_models" ON reward_model_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Brand corrections: Users can submit, admins can manage
CREATE POLICY "Users can view own corrections" ON brand_corrections
  FOR SELECT USING (auth.uid()::text = submitted_by::text);

CREATE POLICY "Users can submit corrections" ON brand_corrections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can manage corrections" ON brand_corrections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Service role full access to corrections" ON brand_corrections
  FOR ALL USING (auth.role() = 'service_role');

-- Score disputes: Users can dispute their analyses
CREATE POLICY "Users can view own disputes" ON score_disputes
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can submit disputes" ON score_disputes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can manage disputes" ON score_disputes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Service role full access to disputes" ON score_disputes
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 5. VIEWS
-- ============================================================================

-- View: Current production models
CREATE OR REPLACE VIEW v_current_reward_models AS
SELECT
  rm.id,
  rm.model_name,
  rm.version,
  rm.model_type,
  rm.status,
  rm.training_samples,
  rm.metrics->>'accuracy' as accuracy,
  rm.metrics->>'f1' as f1_score,
  rm.validation_metrics->>'accuracy' as validation_accuracy,
  rm.deployed_at,
  rm.created_at
FROM reward_model_versions rm
WHERE rm.is_current = true OR rm.status = 'production'
ORDER BY rm.model_name, rm.deployed_at DESC;

COMMENT ON VIEW v_current_reward_models IS 'Currently active reward models in production';

-- View: Correction queue for reviewers
CREATE OR REPLACE VIEW v_correction_queue AS
SELECT
  bc.id,
  bc.brand_name,
  bc.correction_type,
  bc.field_name,
  bc.status,
  bc.priority,
  bc.is_verified_brand_owner,
  bc.created_at,
  EXTRACT(EPOCH FROM (NOW() - bc.created_at)) / 3600 as hours_pending,
  bc.submitter_email
FROM brand_corrections bc
WHERE bc.status IN ('pending', 'under_review', 'needs_info')
ORDER BY
  CASE bc.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    WHEN 'low' THEN 4
  END,
  bc.created_at;

COMMENT ON VIEW v_correction_queue IS 'Queue of brand corrections awaiting review';

-- View: Dispute statistics
CREATE OR REPLACE VIEW v_dispute_stats AS
SELECT
  dispute_category,
  COUNT(*) as total_disputes,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
  COUNT(*) FILTER (WHERE resolution = 'score_adjusted') as adjusted,
  AVG(score_adjustment) FILTER (WHERE score_adjustment IS NOT NULL) as avg_adjustment,
  AVG(user_satisfaction) FILTER (WHERE user_satisfaction IS NOT NULL) as avg_satisfaction,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
    FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours
FROM score_disputes
GROUP BY dispute_category;

COMMENT ON VIEW v_dispute_stats IS 'Statistics on score disputes by category';

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get latest model version
CREATE OR REPLACE FUNCTION get_latest_model_version(p_model_name VARCHAR)
RETURNS TABLE (
  id UUID,
  version VARCHAR,
  status model_status,
  accuracy DECIMAL,
  deployed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rm.id,
    rm.version,
    rm.status,
    (rm.metrics->>'accuracy')::DECIMAL as accuracy,
    rm.deployed_at
  FROM reward_model_versions rm
  WHERE rm.model_name = p_model_name
  ORDER BY rm.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate dispute resolution rate
CREATE OR REPLACE FUNCTION get_dispute_resolution_stats(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_disputes BIGINT,
  resolved_disputes BIGINT,
  avg_resolution_hours DECIMAL,
  satisfaction_rate DECIMAL,
  adjustment_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_disputes,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_disputes,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)
      FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours,
    AVG(user_satisfaction) FILTER (WHERE user_satisfaction IS NOT NULL) as satisfaction_rate,
    (COUNT(*) FILTER (WHERE resolution = 'score_adjusted')::DECIMAL /
      NULLIF(COUNT(*) FILTER (WHERE status = 'resolved'), 0)) * 100 as adjustment_rate
  FROM score_disputes
  WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. SEED DATA: Initial reward model version
-- ============================================================================

INSERT INTO reward_model_versions (
  model_name,
  version,
  model_type,
  description,
  status,
  is_current,
  training_config,
  metrics,
  training_samples
) VALUES (
  'satisfaction_predictor_v1',
  '1.0.0',
  'satisfaction_predictor',
  'Initial satisfaction prediction model based on implicit signals',
  'production',
  true,
  '{"learning_rate": 0.001, "epochs": 50, "batch_size": 32}'::jsonb,
  '{"accuracy": 0.78, "precision": 0.82, "recall": 0.74, "f1": 0.78}'::jsonb,
  1000
);

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE reward_model_versions IS 'Version tracking for RLHF reward models with performance metrics';
COMMENT ON TABLE brand_corrections IS 'User-submitted corrections for brand information with approval workflow';
COMMENT ON TABLE score_disputes IS 'User disputes of perception scores with investigation tracking';

COMMENT ON COLUMN reward_model_versions.is_current IS 'Whether this is the currently deployed version for this model';
COMMENT ON COLUMN brand_corrections.is_verified_brand_owner IS 'Whether submitter verified as brand owner';
COMMENT ON COLUMN score_disputes.escalation_level IS 'Number of times dispute has been escalated';
