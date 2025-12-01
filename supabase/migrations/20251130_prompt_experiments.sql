-- ============================================================================
-- PROMPT A/B TESTING FRAMEWORK
-- Tables for managing prompt experiments and assignments
-- Version: 1.0
-- Last Updated: 2025-11-30
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Experiment status
CREATE TYPE experiment_status AS ENUM (
  'draft',      -- Not yet started
  'running',    -- Currently active
  'paused',     -- Temporarily stopped
  'concluded',  -- Finished with result
  'cancelled'   -- Stopped without conclusion
);

-- ============================================================================
-- TABLE: prompt_experiments
-- ============================================================================

CREATE TABLE public.prompt_experiments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  hypothesis TEXT, -- What we're testing

  -- Status
  status experiment_status NOT NULL DEFAULT 'draft',

  -- Prompt Configuration
  prompt_type TEXT NOT NULL,
  -- e.g., 'recommendation', 'analysis', 'competitor'

  -- Variants (array of variant configs)
  variants JSONB NOT NULL DEFAULT '[]',
  -- [{ "id": "control", "name": "Control", "prompt_version": "v1.0", "traffic_pct": 50 }]

  -- Metrics Configuration
  primary_metric TEXT NOT NULL,
  -- e.g., 'thumbs_up_rate', 'click_rate', 'satisfaction'
  secondary_metrics TEXT[] DEFAULT '{}',
  guardrail_metrics JSONB DEFAULT '{}',
  -- { "error_rate": { "max": 0.05 }, "latency_p95": { "max": 5000 } }

  -- Statistical Settings
  min_sample_size INTEGER NOT NULL DEFAULT 100,
  significance_threshold DECIMAL(4,3) NOT NULL DEFAULT 0.95,
  min_detectable_effect DECIMAL(4,3) DEFAULT 0.05,

  -- Traffic Allocation
  traffic_percentage INTEGER NOT NULL DEFAULT 100,
  -- What percentage of eligible traffic enters the experiment

  -- Targeting (optional filters)
  targeting_rules JSONB DEFAULT '{}',
  -- { "industries": ["tech", "finance"], "tiers": ["pro", "enterprise"] }

  -- Timing
  started_at TIMESTAMPTZ,
  concluded_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,

  -- Results
  result JSONB,
  -- { "winner": "treatment", "lift": 0.12, "confidence": 0.97, "metrics": {...} }
  conclusion_notes TEXT,

  -- Audit
  created_by UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_traffic_percentage
    CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
  CONSTRAINT chk_significance_threshold
    CHECK (significance_threshold > 0 AND significance_threshold < 1),
  CONSTRAINT chk_variants_not_empty
    CHECK (jsonb_array_length(variants) >= 2)
);

-- Indexes
CREATE INDEX idx_prompt_experiments_status ON public.prompt_experiments(status);
CREATE INDEX idx_prompt_experiments_type ON public.prompt_experiments(prompt_type);
CREATE INDEX idx_prompt_experiments_running ON public.prompt_experiments(prompt_type)
  WHERE status = 'running';
CREATE INDEX idx_prompt_experiments_created_at ON public.prompt_experiments(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER trg_prompt_experiments_updated_at
  BEFORE UPDATE ON public.prompt_experiments
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- RLS
ALTER TABLE public.prompt_experiments ENABLE ROW LEVEL SECURITY;

-- Only admins can manage experiments
CREATE POLICY "Service role can manage experiments"
  ON public.prompt_experiments
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.prompt_experiments IS 'A/B test configurations for prompt variants';
COMMENT ON COLUMN public.prompt_experiments.variants IS 'Array of variant configurations with traffic splits';
COMMENT ON COLUMN public.prompt_experiments.primary_metric IS 'Main success metric for determining winner';

-- ============================================================================
-- TABLE: experiment_assignments
-- ============================================================================

CREATE TABLE public.experiment_assignments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  experiment_id UUID NOT NULL REFERENCES public.prompt_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
  session_id TEXT,

  -- Assignment
  variant_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Context at assignment time
  context JSONB DEFAULT '{}',
  -- { "industry": "tech", "tier": "pro", "user_segment": "power_user" }

  -- Unique per experiment-user or experiment-session
  CONSTRAINT uq_experiment_user UNIQUE (experiment_id, user_id),
  CONSTRAINT chk_has_identifier
    CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_experiment_assignments_experiment ON public.experiment_assignments(experiment_id);
CREATE INDEX idx_experiment_assignments_user ON public.experiment_assignments(user_id);
CREATE INDEX idx_experiment_assignments_analysis ON public.experiment_assignments(analysis_id);
CREATE INDEX idx_experiment_assignments_variant ON public.experiment_assignments(experiment_id, variant_id);

-- RLS
ALTER TABLE public.experiment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage assignments"
  ON public.experiment_assignments
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can see their own assignments
CREATE POLICY "Users can view own assignments"
  ON public.experiment_assignments
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Comments
COMMENT ON TABLE public.experiment_assignments IS 'User/session assignments to experiment variants';

-- ============================================================================
-- TABLE: experiment_events
-- ============================================================================

CREATE TABLE public.experiment_events (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  experiment_id UUID NOT NULL REFERENCES public.prompt_experiments(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.experiment_assignments(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,

  -- Event Details
  event_type TEXT NOT NULL,
  -- 'impression', 'click', 'thumbs_up', 'thumbs_down', 'conversion', etc.
  event_value DECIMAL,
  -- Numeric value if applicable (e.g., latency_ms, satisfaction_score)

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_experiment_events_experiment ON public.experiment_events(experiment_id);
CREATE INDEX idx_experiment_events_assignment ON public.experiment_events(assignment_id);
CREATE INDEX idx_experiment_events_type ON public.experiment_events(experiment_id, event_type);
CREATE INDEX idx_experiment_events_created_at ON public.experiment_events(created_at);

-- RLS
ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage events"
  ON public.experiment_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.experiment_events IS 'Events tracked for experiment analysis';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Experiment summary with metrics
CREATE VIEW public.vw_experiment_summary AS
SELECT
  e.id,
  e.name,
  e.status,
  e.prompt_type,
  e.primary_metric,
  e.min_sample_size,
  e.started_at,
  e.concluded_at,
  COUNT(DISTINCT a.id) AS total_assignments,
  COUNT(DISTINCT CASE WHEN a.variant_id = 'control' THEN a.id END) AS control_assignments,
  COUNT(DISTINCT CASE WHEN a.variant_id != 'control' THEN a.id END) AS treatment_assignments,
  COUNT(ev.id) AS total_events,
  e.result
FROM public.prompt_experiments e
LEFT JOIN public.experiment_assignments a ON e.id = a.experiment_id
LEFT JOIN public.experiment_events ev ON e.id = ev.experiment_id
GROUP BY e.id;

COMMENT ON VIEW public.vw_experiment_summary IS 'Summary of experiments with assignment counts';

-- View: Variant metrics
CREATE VIEW public.vw_variant_metrics AS
SELECT
  e.id AS experiment_id,
  e.name AS experiment_name,
  a.variant_id,
  COUNT(DISTINCT a.id) AS assignments,
  COUNT(ev.id) FILTER (WHERE ev.event_type = 'impression') AS impressions,
  COUNT(ev.id) FILTER (WHERE ev.event_type = 'click') AS clicks,
  COUNT(ev.id) FILTER (WHERE ev.event_type = 'thumbs_up') AS thumbs_up,
  COUNT(ev.id) FILTER (WHERE ev.event_type = 'thumbs_down') AS thumbs_down,
  COUNT(ev.id) FILTER (WHERE ev.event_type = 'conversion') AS conversions,
  AVG(ev.event_value) FILTER (WHERE ev.event_type = 'satisfaction') AS avg_satisfaction,
  AVG(ev.event_value) FILTER (WHERE ev.event_type = 'latency') AS avg_latency,
  ROUND(
    COUNT(ev.id) FILTER (WHERE ev.event_type = 'thumbs_up')::DECIMAL /
    NULLIF(COUNT(ev.id) FILTER (WHERE ev.event_type IN ('thumbs_up', 'thumbs_down')), 0) * 100,
    2
  ) AS thumbs_up_rate,
  ROUND(
    COUNT(ev.id) FILTER (WHERE ev.event_type = 'click')::DECIMAL /
    NULLIF(COUNT(ev.id) FILTER (WHERE ev.event_type = 'impression'), 0) * 100,
    2
  ) AS click_rate
FROM public.prompt_experiments e
JOIN public.experiment_assignments a ON e.id = a.experiment_id
LEFT JOIN public.experiment_events ev ON a.id = ev.assignment_id
GROUP BY e.id, e.name, a.variant_id;

COMMENT ON VIEW public.vw_variant_metrics IS 'Aggregated metrics per variant';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get variant assignment for a user/experiment
CREATE OR REPLACE FUNCTION public.fn_get_or_create_experiment_assignment(
  p_experiment_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'
)
RETURNS TEXT AS $$
DECLARE
  v_experiment RECORD;
  v_assignment RECORD;
  v_variant_id TEXT;
  v_random DECIMAL;
  v_cumulative DECIMAL := 0;
  v_variant JSONB;
BEGIN
  -- Get experiment
  SELECT * INTO v_experiment
  FROM public.prompt_experiments
  WHERE id = p_experiment_id AND status = 'running';

  IF NOT FOUND THEN
    RETURN NULL; -- Experiment not found or not running
  END IF;

  -- Check for existing assignment
  SELECT * INTO v_assignment
  FROM public.experiment_assignments
  WHERE experiment_id = p_experiment_id
    AND (
      (p_user_id IS NOT NULL AND user_id = p_user_id) OR
      (p_session_id IS NOT NULL AND session_id = p_session_id)
    );

  IF FOUND THEN
    RETURN v_assignment.variant_id;
  END IF;

  -- Check if user should be in experiment (traffic %)
  IF random() * 100 > v_experiment.traffic_percentage THEN
    RETURN NULL; -- User not in experiment
  END IF;

  -- Assign variant based on traffic split
  v_random := random() * 100;

  FOR v_variant IN SELECT * FROM jsonb_array_elements(v_experiment.variants)
  LOOP
    v_cumulative := v_cumulative + (v_variant->>'traffic_pct')::DECIMAL;
    IF v_random <= v_cumulative THEN
      v_variant_id := v_variant->>'id';
      EXIT;
    END IF;
  END LOOP;

  -- Create assignment
  INSERT INTO public.experiment_assignments (
    experiment_id,
    user_id,
    session_id,
    variant_id,
    context
  ) VALUES (
    p_experiment_id,
    p_user_id,
    p_session_id,
    v_variant_id,
    p_context
  )
  ON CONFLICT (experiment_id, user_id) DO NOTHING;

  RETURN v_variant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_get_or_create_experiment_assignment IS 'Get or create experiment variant assignment for a user';

-- Function: Record experiment event
CREATE OR REPLACE FUNCTION public.fn_record_experiment_event(
  p_experiment_id UUID,
  p_user_id UUID,
  p_event_type TEXT,
  p_event_value DECIMAL DEFAULT NULL,
  p_analysis_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
  v_event_id UUID;
BEGIN
  -- Get assignment
  SELECT id INTO v_assignment_id
  FROM public.experiment_assignments
  WHERE experiment_id = p_experiment_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN NULL; -- No assignment found
  END IF;

  -- Create event
  INSERT INTO public.experiment_events (
    experiment_id,
    assignment_id,
    analysis_id,
    event_type,
    event_value,
    metadata
  ) VALUES (
    p_experiment_id,
    v_assignment_id,
    p_analysis_id,
    p_event_type,
    p_event_value,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_record_experiment_event IS 'Record an event for experiment tracking';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
