-- =====================================================
-- RLHF (Reinforcement Learning from Human Feedback) Tables
-- Phase 4, Week 9 - Complete RLHF System
-- =====================================================

-- 1. User Feedback Table
-- Stores thumbs up/down and ratings from users on AI outputs
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was rated
  analysis_id UUID,  -- Reference to the analysis if applicable
  brand_name VARCHAR(255),
  brand_domain VARCHAR(255),

  -- The feedback
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'rating', 'correction')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),  -- 1-5 star rating

  -- Context
  ai_score INTEGER,  -- The AI score that was shown
  user_expected_score INTEGER,  -- What user thinks it should be
  feedback_reason TEXT,  -- Optional explanation

  -- User info (anonymous or authenticated)
  user_id UUID,  -- NULL for anonymous feedback
  session_id VARCHAR(255),  -- For anonymous tracking

  -- Metadata
  page_context VARCHAR(100),  -- Where feedback was given (results, dashboard, etc)
  ai_model_version VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT valid_feedback CHECK (
    (feedback_type = 'rating' AND rating IS NOT NULL) OR
    (feedback_type IN ('thumbs_up', 'thumbs_down')) OR
    (feedback_type = 'correction' AND user_expected_score IS NOT NULL)
  )
);

-- 2. Score Corrections Table
-- Detailed corrections submitted by users or admins
CREATE TABLE IF NOT EXISTS score_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Brand info
  brand_name VARCHAR(255) NOT NULL,
  brand_domain VARCHAR(255) NOT NULL,
  industry VARCHAR(100),

  -- Score correction
  original_score INTEGER NOT NULL,
  corrected_score INTEGER,

  -- Correction details
  correction_type VARCHAR(50) NOT NULL CHECK (correction_type IN (
    'score_too_high', 'score_too_low', 'wrong_sentiment', 'wrong_category',
    'factual_error', 'hallucination', 'outdated_info', 'missing_info',
    'competitor_confusion', 'other'
  )),
  correction_reason TEXT NOT NULL,
  evidence_urls TEXT[],  -- Array of supporting URLs

  -- Status workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'rejected', 'applied', 'disputed'
  )),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),

  -- Submitter
  submitted_by UUID,
  submitted_by_email VARCHAR(255),

  -- Reviewer
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Preference Pairs Table
-- For training reward models - pairs of outputs with preference
CREATE TABLE IF NOT EXISTS preference_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The comparison
  brand_name VARCHAR(255) NOT NULL,
  prompt_context TEXT,  -- The query/context

  -- Output A
  output_a_score INTEGER NOT NULL,
  output_a_reasoning TEXT,
  output_a_model VARCHAR(50),

  -- Output B
  output_b_score INTEGER NOT NULL,
  output_b_reasoning TEXT,
  output_b_model VARCHAR(50),

  -- Preference
  preferred VARCHAR(1) CHECK (preferred IN ('A', 'B', 'T')),  -- T = tie
  preference_strength VARCHAR(10) CHECK (preference_strength IN ('slight', 'moderate', 'strong')),
  preference_reason TEXT,

  -- Source
  pair_type VARCHAR(20) DEFAULT 'explicit' CHECK (pair_type IN ('explicit', 'implicit', 'synthetic')),
  annotator_id UUID,

  -- Quality control
  confidence_score DECIMAL(3,2),  -- 0.00 to 1.00
  validated BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Calibration Data Table
-- Stores calibration metrics per industry
CREATE TABLE IF NOT EXISTS calibration_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Industry
  industry VARCHAR(100) NOT NULL,

  -- Calibration point
  predicted_score INTEGER NOT NULL,
  actual_score DECIMAL(5,2) NOT NULL,
  sample_count INTEGER DEFAULT 1,

  -- Metrics (calculated periodically)
  mae DECIMAL(5,2),  -- Mean Absolute Error
  rmse DECIMAL(5,2),  -- Root Mean Square Error
  r2_score DECIMAL(4,3),  -- R-squared
  brier_score DECIMAL(4,3),

  -- Adjustment
  adjustment_factor DECIMAL(4,3) DEFAULT 1.000,

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per industry and period
  UNIQUE (industry, period_start, period_end, predicted_score)
);

-- 5. Calibration Adjustments Log
-- Tracks changes to calibration factors
CREATE TABLE IF NOT EXISTS calibration_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  industry VARCHAR(100) NOT NULL,
  old_factor DECIMAL(4,3) NOT NULL,
  new_factor DECIMAL(4,3) NOT NULL,
  reason TEXT NOT NULL,

  -- Who made the change
  adjusted_by UUID,
  adjustment_type VARCHAR(20) DEFAULT 'manual' CHECK (adjustment_type IN ('manual', 'automatic', 'scheduled')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLHF Training Runs Table
-- Tracks model training runs using RLHF data
CREATE TABLE IF NOT EXISTS rlhf_training_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model info
  model_version VARCHAR(50) NOT NULL,
  base_model VARCHAR(100),

  -- Training data stats
  feedback_samples INTEGER DEFAULT 0,
  preference_pairs INTEGER DEFAULT 0,
  corrections_applied INTEGER DEFAULT 0,

  -- Results
  accuracy_before DECIMAL(4,3),
  accuracy_after DECIMAL(4,3),
  precision_score DECIMAL(4,3),
  recall_score DECIMAL(4,3),
  f1_score DECIMAL(4,3),

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- User feedback indexes
CREATE INDEX IF NOT EXISTS idx_user_feedback_brand ON user_feedback(brand_domain);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created ON user_feedback(created_at DESC);

-- Score corrections indexes
CREATE INDEX IF NOT EXISTS idx_score_corrections_status ON score_corrections(status);
CREATE INDEX IF NOT EXISTS idx_score_corrections_priority ON score_corrections(priority);
CREATE INDEX IF NOT EXISTS idx_score_corrections_brand ON score_corrections(brand_domain);
CREATE INDEX IF NOT EXISTS idx_score_corrections_created ON score_corrections(created_at DESC);

-- Preference pairs indexes
CREATE INDEX IF NOT EXISTS idx_preference_pairs_brand ON preference_pairs(brand_name);
CREATE INDEX IF NOT EXISTS idx_preference_pairs_type ON preference_pairs(pair_type);
CREATE INDEX IF NOT EXISTS idx_preference_pairs_created ON preference_pairs(created_at DESC);

-- Calibration indexes
CREATE INDEX IF NOT EXISTS idx_calibration_data_industry ON calibration_data(industry);
CREATE INDEX IF NOT EXISTS idx_calibration_data_period ON calibration_data(period_start, period_end);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at on score_corrections
CREATE OR REPLACE FUNCTION update_score_corrections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_score_corrections_updated_at ON score_corrections;
CREATE TRIGGER trigger_score_corrections_updated_at
  BEFORE UPDATE ON score_corrections
  FOR EACH ROW
  EXECUTE FUNCTION update_score_corrections_updated_at();

-- Update updated_at on calibration_data
CREATE OR REPLACE FUNCTION update_calibration_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calibration_data_updated_at ON calibration_data;
CREATE TRIGGER trigger_calibration_data_updated_at
  BEFORE UPDATE ON calibration_data
  FOR EACH ROW
  EXECUTE FUNCTION update_calibration_data_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE preference_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rlhf_training_runs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert feedback
CREATE POLICY "Users can insert feedback" ON user_feedback
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Allow authenticated users to insert corrections
CREATE POLICY "Users can insert corrections" ON score_corrections
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- Service role can do everything
CREATE POLICY "Service role full access on user_feedback" ON user_feedback
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on score_corrections" ON score_corrections
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on preference_pairs" ON preference_pairs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on calibration_data" ON calibration_data
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on calibration_adjustments" ON calibration_adjustments
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on rlhf_training_runs" ON rlhf_training_runs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE user_feedback IS 'Stores user feedback (thumbs up/down, ratings) on AI outputs';
COMMENT ON TABLE score_corrections IS 'Detailed score corrections submitted by users for review';
COMMENT ON TABLE preference_pairs IS 'Pairs of AI outputs with human preference for reward model training';
COMMENT ON TABLE calibration_data IS 'Calibration metrics per industry for score adjustment';
COMMENT ON TABLE calibration_adjustments IS 'Log of calibration factor changes';
COMMENT ON TABLE rlhf_training_runs IS 'Tracks RLHF model training runs and results';
