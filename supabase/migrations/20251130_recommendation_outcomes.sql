-- ============================================================================
-- RECOMMENDATION OUTCOMES TABLE
-- Tracks user responses to recommendations and their actual outcomes
-- Version: 1.0
-- Last Updated: 2025-11-30
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Initial response to recommendation
CREATE TYPE recommendation_response AS ENUM (
  'will_implement',    -- User intends to implement
  'wont_implement',    -- User decided not to implement
  'need_help',         -- User needs assistance
  'already_done',      -- Already implemented before seeing recommendation
  'not_applicable',    -- Doesn't apply to their situation
  'skipped'            -- User skipped without responding
);

-- Reported outcome after implementation
CREATE TYPE recommendation_impact AS ENUM (
  'significant_improvement',  -- Major positive impact
  'some_improvement',         -- Minor positive impact
  'no_change',               -- No noticeable change
  'negative_impact',         -- Made things worse
  'unable_to_measure'        -- Can't determine impact
);

-- ============================================================================
-- TABLE: recommendation_outcomes
-- ============================================================================

CREATE TABLE public.recommendation_outcomes (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,

  -- Initial Response
  initial_response recommendation_response NOT NULL,
  response_reason TEXT, -- Why they made this choice
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Implementation Status
  implemented BOOLEAN,
  implemented_at TIMESTAMPTZ,
  implementation_notes TEXT,

  -- Outcome Tracking
  outcome_reported BOOLEAN DEFAULT FALSE,
  outcome_impact recommendation_impact,
  outcome_notes TEXT,
  outcome_reported_at TIMESTAMPTZ,

  -- Score Tracking (before/after)
  score_before INTEGER,
  score_after INTEGER,
  score_change INTEGER GENERATED ALWAYS AS (
    CASE WHEN score_before IS NOT NULL AND score_after IS NOT NULL
         THEN score_after - score_before
         ELSE NULL
    END
  ) STORED,

  -- Re-analysis Reference
  reanalysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  days_to_reanalysis INTEGER,

  -- Follow-up Tracking
  follow_up_scheduled_at TIMESTAMPTZ,
  follow_up_sent_at TIMESTAMPTZ,
  follow_up_responded_at TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,

  -- Metadata
  context JSONB DEFAULT '{}',
  -- e.g., { "recommendation_category": "technical", "priority": "high" }

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_implemented_timing
    CHECK (implemented_at IS NULL OR implemented_at >= responded_at),
  CONSTRAINT chk_outcome_timing
    CHECK (outcome_reported_at IS NULL OR outcome_reported_at >= responded_at),
  CONSTRAINT chk_score_range
    CHECK (
      (score_before IS NULL OR (score_before >= 0 AND score_before <= 100)) AND
      (score_after IS NULL OR (score_after >= 0 AND score_after <= 100))
    )
);

-- Indexes
CREATE INDEX idx_recommendation_outcomes_rec ON public.recommendation_outcomes(recommendation_id);
CREATE INDEX idx_recommendation_outcomes_user ON public.recommendation_outcomes(user_id);
CREATE INDEX idx_recommendation_outcomes_analysis ON public.recommendation_outcomes(analysis_id);
CREATE INDEX idx_recommendation_outcomes_response ON public.recommendation_outcomes(initial_response);
CREATE INDEX idx_recommendation_outcomes_implemented ON public.recommendation_outcomes(implemented)
  WHERE implemented = TRUE;
CREATE INDEX idx_recommendation_outcomes_outcome ON public.recommendation_outcomes(outcome_impact)
  WHERE outcome_reported = TRUE;
CREATE INDEX idx_recommendation_outcomes_followup ON public.recommendation_outcomes(follow_up_scheduled_at)
  WHERE follow_up_scheduled_at IS NOT NULL AND follow_up_sent_at IS NULL;
CREATE INDEX idx_recommendation_outcomes_created_at ON public.recommendation_outcomes(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER trg_recommendation_outcomes_updated_at
  BEFORE UPDATE ON public.recommendation_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- RLS
ALTER TABLE public.recommendation_outcomes ENABLE ROW LEVEL SECURITY;

-- Users can view their own outcomes
CREATE POLICY "Users can view own recommendation outcomes"
  ON public.recommendation_outcomes
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Users can create outcomes for their analyses
CREATE POLICY "Users can create recommendation outcomes"
  ON public.recommendation_outcomes
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Users can update their own outcomes
CREATE POLICY "Users can update own recommendation outcomes"
  ON public.recommendation_outcomes
  FOR UPDATE
  USING (auth.uid()::text = user_id::text);

-- Service role has full access
CREATE POLICY "Service role has full access to recommendation outcomes"
  ON public.recommendation_outcomes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.recommendation_outcomes IS 'Tracks user responses to recommendations and their outcomes';
COMMENT ON COLUMN public.recommendation_outcomes.initial_response IS 'User''s initial response when seeing the recommendation';
COMMENT ON COLUMN public.recommendation_outcomes.implemented IS 'Whether the user actually implemented the recommendation';
COMMENT ON COLUMN public.recommendation_outcomes.outcome_impact IS 'Reported impact after implementation';
COMMENT ON COLUMN public.recommendation_outcomes.score_change IS 'Computed change in score (after - before)';

-- ============================================================================
-- TABLE: recommendation_follow_ups
-- Track scheduled follow-up emails/notifications
-- ============================================================================

CREATE TABLE public.recommendation_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  outcome_id UUID NOT NULL REFERENCES public.recommendation_outcomes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  follow_up_type TEXT NOT NULL DEFAULT 'email',
  -- 'email', 'in_app', 'push'

  -- Status
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,

  -- Content
  message_template TEXT NOT NULL,
  message_data JSONB DEFAULT '{}',

  -- Result
  response_data JSONB, -- User's response if any

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_follow_up_sequence
    CHECK (
      (sent_at IS NULL OR sent_at >= scheduled_for) AND
      (opened_at IS NULL OR opened_at >= sent_at) AND
      (clicked_at IS NULL OR clicked_at >= opened_at) AND
      (responded_at IS NULL OR responded_at >= sent_at)
    )
);

-- Indexes
CREATE INDEX idx_recommendation_follow_ups_outcome ON public.recommendation_follow_ups(outcome_id);
CREATE INDEX idx_recommendation_follow_ups_user ON public.recommendation_follow_ups(user_id);
CREATE INDEX idx_recommendation_follow_ups_scheduled ON public.recommendation_follow_ups(scheduled_for)
  WHERE sent_at IS NULL;
CREATE INDEX idx_recommendation_follow_ups_pending ON public.recommendation_follow_ups(sent_at)
  WHERE sent_at IS NOT NULL AND responded_at IS NULL;

-- RLS
ALTER TABLE public.recommendation_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follow ups"
  ON public.recommendation_follow_ups
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role has full access to follow ups"
  ON public.recommendation_follow_ups
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.recommendation_follow_ups IS 'Scheduled follow-up messages for recommendation outcomes';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Recommendation effectiveness by category
CREATE VIEW public.vw_recommendation_effectiveness AS
SELECT
  r.category,
  r.priority,
  COUNT(ro.id) AS total_outcomes,
  COUNT(*) FILTER (WHERE ro.initial_response = 'will_implement') AS will_implement,
  COUNT(*) FILTER (WHERE ro.initial_response = 'wont_implement') AS wont_implement,
  COUNT(*) FILTER (WHERE ro.implemented = TRUE) AS actually_implemented,
  COUNT(*) FILTER (WHERE ro.outcome_reported = TRUE) AS outcomes_reported,
  COUNT(*) FILTER (WHERE ro.outcome_impact IN ('significant_improvement', 'some_improvement')) AS positive_outcomes,
  COUNT(*) FILTER (WHERE ro.outcome_impact = 'no_change') AS no_change_outcomes,
  COUNT(*) FILTER (WHERE ro.outcome_impact = 'negative_impact') AS negative_outcomes,
  AVG(ro.score_change) FILTER (WHERE ro.score_change IS NOT NULL) AS avg_score_change,
  ROUND(
    COUNT(*) FILTER (WHERE ro.implemented = TRUE)::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE ro.initial_response = 'will_implement'), 0) * 100,
    1
  ) AS implementation_rate,
  ROUND(
    COUNT(*) FILTER (WHERE ro.outcome_impact IN ('significant_improvement', 'some_improvement'))::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE ro.outcome_reported = TRUE), 0) * 100,
    1
  ) AS success_rate
FROM public.recommendations r
LEFT JOIN public.recommendation_outcomes ro ON r.id = ro.recommendation_id
GROUP BY r.category, r.priority
ORDER BY total_outcomes DESC;

COMMENT ON VIEW public.vw_recommendation_effectiveness IS 'Aggregated effectiveness metrics by recommendation category';

-- View: User recommendation journey
CREATE VIEW public.vw_user_recommendation_journey AS
SELECT
  ro.user_id,
  ro.analysis_id,
  ro.recommendation_id,
  r.category,
  r.title,
  r.priority,
  ro.initial_response,
  ro.responded_at,
  ro.implemented,
  ro.implemented_at,
  ro.outcome_impact,
  ro.score_before,
  ro.score_after,
  ro.score_change,
  EXTRACT(DAYS FROM (ro.implemented_at - ro.responded_at)) AS days_to_implement,
  EXTRACT(DAYS FROM (ro.outcome_reported_at - ro.implemented_at)) AS days_to_outcome
FROM public.recommendation_outcomes ro
JOIN public.recommendations r ON ro.recommendation_id = r.id
ORDER BY ro.user_id, ro.responded_at;

COMMENT ON VIEW public.vw_user_recommendation_journey IS 'User journey through recommendation implementation';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Schedule follow-up for a recommendation outcome
CREATE OR REPLACE FUNCTION public.fn_schedule_recommendation_follow_up(
  p_outcome_id UUID,
  p_days_delay INTEGER DEFAULT 30,
  p_message_template TEXT DEFAULT 'default_follow_up'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_follow_up_id UUID;
BEGIN
  -- Get user from outcome
  SELECT user_id INTO v_user_id
  FROM public.recommendation_outcomes
  WHERE id = p_outcome_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot schedule follow-up: no user associated with outcome';
  END IF;

  -- Create follow-up
  INSERT INTO public.recommendation_follow_ups (
    outcome_id,
    user_id,
    scheduled_for,
    message_template
  ) VALUES (
    p_outcome_id,
    v_user_id,
    NOW() + (p_days_delay || ' days')::INTERVAL,
    p_message_template
  )
  RETURNING id INTO v_follow_up_id;

  -- Update outcome with scheduled time
  UPDATE public.recommendation_outcomes
  SET
    follow_up_scheduled_at = NOW() + (p_days_delay || ' days')::INTERVAL,
    follow_up_count = follow_up_count + 1
  WHERE id = p_outcome_id;

  RETURN v_follow_up_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_schedule_recommendation_follow_up IS 'Schedule a follow-up for a recommendation outcome';

-- Function: Record outcome from re-analysis
CREATE OR REPLACE FUNCTION public.fn_record_reanalysis_outcome(
  p_outcome_id UUID,
  p_reanalysis_id UUID,
  p_new_score INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_original_score INTEGER;
BEGIN
  -- Get original score
  SELECT score_before INTO v_original_score
  FROM public.recommendation_outcomes
  WHERE id = p_outcome_id;

  -- Update outcome with reanalysis data
  UPDATE public.recommendation_outcomes
  SET
    reanalysis_id = p_reanalysis_id,
    score_after = p_new_score,
    days_to_reanalysis = EXTRACT(DAYS FROM (NOW() - created_at))
  WHERE id = p_outcome_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_record_reanalysis_outcome IS 'Record score from a re-analysis for outcome tracking';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
