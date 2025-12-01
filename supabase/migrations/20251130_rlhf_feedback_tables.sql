-- ============================================================================
-- RLHF FEEDBACK TABLES
-- Tables for collecting user feedback and implicit signals for RLHF
-- Version: 1.0
-- Last Updated: 2025-11-30
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Feedback type enum
CREATE TYPE feedback_type AS ENUM (
  'thumbs_up',
  'thumbs_down',
  'rating',
  'text',
  'correction',
  'dispute'
);

-- Feedback target enum (what the feedback is about)
CREATE TYPE feedback_target AS ENUM (
  'analysis_score',
  'recommendation',
  'ai_response',
  'category_score',
  'overall_experience'
);

-- Implicit event type enum
CREATE TYPE implicit_event_type AS ENUM (
  'page_view',
  'scroll_depth',
  'dwell_time',
  'click',
  'hover',
  'copy',
  'share',
  'expand',
  'collapse',
  'tab_switch',
  'search',
  'filter'
);

-- ============================================================================
-- TABLE: user_feedback
-- Explicit user feedback on analyses and recommendations
-- ============================================================================

CREATE TABLE public.user_feedback (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  recommendation_id UUID, -- References recommendations if applicable
  ai_response_id UUID, -- References ai_responses if applicable

  -- Feedback Data
  feedback_type feedback_type NOT NULL,
  target feedback_target NOT NULL,

  -- Rating (1-5 scale, nullable for non-rating feedback)
  rating INTEGER,

  -- Binary feedback
  is_positive BOOLEAN,

  -- Text feedback
  comment TEXT,

  -- Correction data (for score disputes)
  original_value JSONB,
  suggested_value JSONB,
  correction_reason TEXT,

  -- Context
  context JSONB DEFAULT '{}',
  session_id TEXT,
  page_url TEXT,
  user_agent TEXT,

  -- Processing status
  is_processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,

  -- Quality indicators
  is_spam BOOLEAN DEFAULT FALSE,
  quality_score DECIMAL(3,2), -- 0.0 to 1.0

  -- Audit Columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_user_feedback_rating_range
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  CONSTRAINT chk_user_feedback_quality_score_range
    CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1)),
  CONSTRAINT chk_user_feedback_has_content
    CHECK (
      rating IS NOT NULL OR
      is_positive IS NOT NULL OR
      comment IS NOT NULL OR
      suggested_value IS NOT NULL
    )
);

-- Indexes
CREATE INDEX idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX idx_user_feedback_analysis_id ON public.user_feedback(analysis_id);
CREATE INDEX idx_user_feedback_type ON public.user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_target ON public.user_feedback(target);
CREATE INDEX idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
CREATE INDEX idx_user_feedback_unprocessed ON public.user_feedback(created_at)
  WHERE is_processed = FALSE;

-- Updated_at Trigger
CREATE TRIGGER trg_user_feedback_updated_at
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON public.user_feedback
  FOR SELECT
  USING (auth.uid()::text = user_id::text OR user_id IS NULL);

CREATE POLICY "Anyone can create feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Service role has full access to feedback"
  ON public.user_feedback
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.user_feedback IS 'Explicit user feedback for RLHF training';
COMMENT ON COLUMN public.user_feedback.feedback_type IS 'Type of feedback (thumbs, rating, text, etc.)';
COMMENT ON COLUMN public.user_feedback.target IS 'What the feedback is about';
COMMENT ON COLUMN public.user_feedback.quality_score IS 'ML-derived quality score for feedback';

-- ============================================================================
-- TABLE: implicit_feedback_events
-- Implicit behavioral signals from user interactions
-- ============================================================================

CREATE TABLE public.implicit_feedback_events (
  -- Use BIGSERIAL for high-volume event table
  id BIGSERIAL PRIMARY KEY,

  -- Session and user identification
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,

  -- Event data
  event_type implicit_event_type NOT NULL,

  -- Target element
  element_id TEXT,
  element_type TEXT, -- 'button', 'card', 'section', etc.
  element_label TEXT, -- Human-readable label

  -- Numeric value (context-dependent)
  -- For scroll_depth: 0-100 percentage
  -- For dwell_time: milliseconds
  -- For click: 1
  value DECIMAL(10,2),

  -- Page context
  page_url TEXT NOT NULL,
  page_type TEXT, -- 'results', 'analysis', 'recommendations'

  -- Analysis context
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,

  -- Additional context
  metadata JSONB DEFAULT '{}',

  -- Client info
  viewport_width INTEGER,
  viewport_height INTEGER,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for querying
CREATE INDEX idx_implicit_events_session_id ON public.implicit_feedback_events(session_id);
CREATE INDEX idx_implicit_events_user_id ON public.implicit_feedback_events(user_id);
CREATE INDEX idx_implicit_events_analysis_id ON public.implicit_feedback_events(analysis_id);
CREATE INDEX idx_implicit_events_type ON public.implicit_feedback_events(event_type);
CREATE INDEX idx_implicit_events_created_at ON public.implicit_feedback_events(created_at DESC);

-- Composite index for common queries
CREATE INDEX idx_implicit_events_session_type
  ON public.implicit_feedback_events(session_id, event_type);

-- RLS
ALTER TABLE public.implicit_feedback_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (anonymous tracking)
CREATE POLICY "Anyone can create implicit events"
  ON public.implicit_feedback_events
  FOR INSERT
  WITH CHECK (TRUE);

-- Only service role can read (for ML processing)
CREATE POLICY "Service role can read events"
  ON public.implicit_feedback_events
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.implicit_feedback_events IS 'Implicit behavioral signals for RLHF';
COMMENT ON COLUMN public.implicit_feedback_events.value IS 'Numeric value (scroll %, dwell ms, etc.)';
COMMENT ON COLUMN public.implicit_feedback_events.element_id IS 'DOM element ID or data-testid';

-- ============================================================================
-- TABLE: recommendation_outcomes
-- Track if users implemented recommendations and results
-- ============================================================================

CREATE TABLE public.recommendation_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL,

  -- Outcome tracking
  was_implemented BOOLEAN,
  implementation_date TIMESTAMPTZ,

  -- Score change after implementation
  score_before INTEGER,
  score_after INTEGER,
  score_change INTEGER GENERATED ALWAYS AS (score_after - score_before) STORED,

  -- User's assessment
  was_helpful BOOLEAN,
  difficulty_rating INTEGER, -- 1-5 (1=easy, 5=hard)
  time_to_implement_hours DECIMAL(6,1),

  -- Comments
  user_notes TEXT,

  -- Follow-up tracking
  follow_up_sent_at TIMESTAMPTZ,
  follow_up_responded_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_outcomes_score_range
    CHECK (
      (score_before IS NULL OR (score_before >= 0 AND score_before <= 100)) AND
      (score_after IS NULL OR (score_after >= 0 AND score_after <= 100))
    ),
  CONSTRAINT chk_outcomes_difficulty_range
    CHECK (difficulty_rating IS NULL OR (difficulty_rating >= 1 AND difficulty_rating <= 5))
);

-- Indexes
CREATE INDEX idx_outcomes_user_id ON public.recommendation_outcomes(user_id);
CREATE INDEX idx_outcomes_analysis_id ON public.recommendation_outcomes(analysis_id);
CREATE INDEX idx_outcomes_recommendation_id ON public.recommendation_outcomes(recommendation_id);
CREATE INDEX idx_outcomes_implemented ON public.recommendation_outcomes(was_implemented)
  WHERE was_implemented = TRUE;

-- Updated_at Trigger
CREATE TRIGGER trg_recommendation_outcomes_updated_at
  BEFORE UPDATE ON public.recommendation_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- RLS
ALTER TABLE public.recommendation_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own outcomes"
  ON public.recommendation_outcomes
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own outcomes"
  ON public.recommendation_outcomes
  FOR ALL
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role has full access to outcomes"
  ON public.recommendation_outcomes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.recommendation_outcomes IS 'Track recommendation implementation and results';
COMMENT ON COLUMN public.recommendation_outcomes.score_change IS 'Auto-calculated score difference';

-- ============================================================================
-- VIEW: Feedback Summary
-- Aggregated feedback metrics per analysis
-- ============================================================================

CREATE VIEW public.vw_feedback_summary AS
SELECT
  analysis_id,
  COUNT(*) AS total_feedback,
  COUNT(*) FILTER (WHERE is_positive = TRUE) AS positive_count,
  COUNT(*) FILTER (WHERE is_positive = FALSE) AS negative_count,
  AVG(rating) AS avg_rating,
  COUNT(*) FILTER (WHERE feedback_type = 'correction') AS correction_count,
  MIN(created_at) AS first_feedback_at,
  MAX(created_at) AS last_feedback_at
FROM public.user_feedback
GROUP BY analysis_id;

COMMENT ON VIEW public.vw_feedback_summary IS 'Aggregated feedback metrics per analysis';

-- ============================================================================
-- VIEW: Session Engagement
-- Aggregated implicit signals per session
-- ============================================================================

CREATE VIEW public.vw_session_engagement AS
SELECT
  session_id,
  analysis_id,
  user_id,
  COUNT(*) AS total_events,
  MAX(value) FILTER (WHERE event_type = 'scroll_depth') AS max_scroll_depth,
  SUM(value) FILTER (WHERE event_type = 'dwell_time') AS total_dwell_time_ms,
  COUNT(*) FILTER (WHERE event_type = 'click') AS click_count,
  COUNT(*) FILTER (WHERE event_type = 'share') AS share_count,
  COUNT(*) FILTER (WHERE event_type = 'copy') AS copy_count,
  MIN(created_at) AS session_start,
  MAX(created_at) AS session_end,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) AS session_duration_seconds
FROM public.implicit_feedback_events
GROUP BY session_id, analysis_id, user_id;

COMMENT ON VIEW public.vw_session_engagement IS 'Aggregated engagement metrics per session';

-- ============================================================================
-- FUNCTION: Calculate feedback quality score
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_calculate_feedback_quality(
  p_feedback_id UUID
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_score DECIMAL(3,2) := 0.5; -- Start neutral
  v_feedback RECORD;
BEGIN
  SELECT * INTO v_feedback FROM public.user_feedback WHERE id = p_feedback_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Boost for having a comment
  IF v_feedback.comment IS NOT NULL AND LENGTH(v_feedback.comment) > 20 THEN
    v_score := v_score + 0.2;
  END IF;

  -- Boost for corrections with reasons
  IF v_feedback.feedback_type = 'correction' AND v_feedback.correction_reason IS NOT NULL THEN
    v_score := v_score + 0.2;
  END IF;

  -- Boost for logged-in users
  IF v_feedback.user_id IS NOT NULL THEN
    v_score := v_score + 0.1;
  END IF;

  -- Cap at 1.0
  RETURN LEAST(v_score, 1.0);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_calculate_feedback_quality IS 'Calculate quality score for feedback (0-1)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
