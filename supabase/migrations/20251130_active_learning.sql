-- ============================================================================
-- ACTIVE LEARNING FRAMEWORK
-- Tables for managing sample selection and labeling for model improvement
-- Version: 1.0
-- Last Updated: 2025-11-30
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Selection strategy types
CREATE TYPE selection_strategy AS ENUM (
  'uncertainty',    -- Select samples with lowest model confidence
  'diversity',      -- Select diverse samples across feature space
  'error_based',    -- Select samples similar to previous errors
  'hybrid',         -- Combination of strategies
  'random'          -- Random baseline
);

-- Batch status
CREATE TYPE batch_status AS ENUM (
  'pending',        -- Awaiting labeling
  'in_progress',    -- Being labeled
  'completed',      -- All labels collected
  'expired',        -- Batch timeout exceeded
  'cancelled'       -- Cancelled before completion
);

-- Label quality levels
CREATE TYPE label_quality AS ENUM (
  'gold',           -- Expert labeler, high confidence
  'silver',         -- Experienced user, medium confidence
  'bronze',         -- New user, lower confidence
  'unverified'      -- Not yet validated
);

-- ============================================================================
-- TABLE: active_learning_batches
-- ============================================================================

CREATE TABLE public.active_learning_batches (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Strategy
  strategy selection_strategy NOT NULL,

  -- Sample References
  sample_ids UUID[] NOT NULL,
  sample_type TEXT NOT NULL DEFAULT 'analysis',

  -- Status
  status batch_status NOT NULL DEFAULT 'pending',

  -- Statistics
  stats JSONB DEFAULT '{}',
  -- {
  --   "totalCandidates": 500,
  --   "selectedCount": 20,
  --   "avgConfidence": 0.45,
  --   "diversityScore": 0.72
  -- }

  -- Progress
  labels_collected INTEGER DEFAULT 0,
  labels_required INTEGER NOT NULL DEFAULT 0,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES public.user_profiles(id),

  -- Constraints
  CONSTRAINT chk_samples_not_empty
    CHECK (array_length(sample_ids, 1) > 0),
  CONSTRAINT chk_labels_valid
    CHECK (labels_collected >= 0 AND labels_collected <= labels_required)
);

-- Indexes
CREATE INDEX idx_al_batches_status ON public.active_learning_batches(status);
CREATE INDEX idx_al_batches_strategy ON public.active_learning_batches(strategy);
CREATE INDEX idx_al_batches_created_at ON public.active_learning_batches(created_at DESC);
CREATE INDEX idx_al_batches_pending ON public.active_learning_batches(created_at)
  WHERE status = 'pending';

-- RLS
ALTER TABLE public.active_learning_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage batches"
  ON public.active_learning_batches
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.active_learning_batches IS 'Batches of samples selected for human labeling';

-- ============================================================================
-- TABLE: active_learning_labels
-- ============================================================================

CREATE TABLE public.active_learning_labels (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  batch_id UUID REFERENCES public.active_learning_batches(id) ON DELETE SET NULL,
  sample_id UUID NOT NULL,
  sample_type TEXT NOT NULL DEFAULT 'analysis',

  -- Labeler
  labeled_by UUID REFERENCES public.user_profiles(id),
  labeler_expertise TEXT,

  -- Label Data
  label JSONB NOT NULL,
  -- For feedback: { "thumbs": "up", "rating": 4, "correction": "..." }
  -- For preference: { "preferred": "A", "confidence": 0.9 }
  -- For score: { "score": 75, "adjustments": {...} }

  -- Quality
  label_quality label_quality NOT NULL DEFAULT 'unverified',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Context
  context JSONB DEFAULT '{}',
  -- { "time_of_day": "morning", "device": "desktop", "session_duration": 1200 }

  -- Timing
  labeling_duration_ms INTEGER,
  started_at TIMESTAMPTZ,
  labeled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validation
  validated BOOLEAN DEFAULT FALSE,
  validated_by UUID REFERENCES public.user_profiles(id),
  validated_at TIMESTAMPTZ,
  validation_result JSONB,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_labeling_duration
    CHECK (labeling_duration_ms IS NULL OR labeling_duration_ms >= 0)
);

-- Indexes
CREATE INDEX idx_al_labels_batch ON public.active_learning_labels(batch_id);
CREATE INDEX idx_al_labels_sample ON public.active_learning_labels(sample_id, sample_type);
CREATE INDEX idx_al_labels_labeler ON public.active_learning_labels(labeled_by);
CREATE INDEX idx_al_labels_quality ON public.active_learning_labels(label_quality);
CREATE INDEX idx_al_labels_created_at ON public.active_learning_labels(created_at DESC);
CREATE INDEX idx_al_labels_unvalidated ON public.active_learning_labels(created_at)
  WHERE validated = FALSE;

-- RLS
ALTER TABLE public.active_learning_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own labels"
  ON public.active_learning_labels
  FOR SELECT
  USING (auth.uid()::text = labeled_by::text);

CREATE POLICY "Users can create labels"
  ON public.active_learning_labels
  FOR INSERT
  WITH CHECK (auth.uid()::text = labeled_by::text OR labeled_by IS NULL);

CREATE POLICY "Service role has full access to labels"
  ON public.active_learning_labels
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.active_learning_labels IS 'Human-provided labels for active learning samples';
COMMENT ON COLUMN public.active_learning_labels.label IS 'Structured label data specific to the task type';

-- ============================================================================
-- TABLE: labeler_stats
-- Track labeler performance for quality weighting
-- ============================================================================

CREATE TABLE public.labeler_stats (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Labeler
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,

  -- Aggregate Stats
  total_labels INTEGER DEFAULT 0,
  validated_labels INTEGER DEFAULT 0,
  agreement_rate DECIMAL(4,3),
  -- Agreement with other labelers or gold standard

  avg_duration_ms DECIMAL(10,2),
  -- Average time per label

  -- Quality Metrics
  accuracy_score DECIMAL(4,3),
  -- Compared to gold standard or consensus

  consistency_score DECIMAL(4,3),
  -- How consistent across similar samples

  current_level label_quality DEFAULT 'bronze',

  -- By Category
  stats_by_type JSONB DEFAULT '{}',
  -- { "analysis": { "count": 50, "accuracy": 0.92 }, "recommendation": { "count": 30, "accuracy": 0.88 } }

  -- Timing
  first_label_at TIMESTAMPTZ,
  last_label_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique per user
  CONSTRAINT uq_labeler_stats_user UNIQUE (user_id)
);

-- Indexes
CREATE INDEX idx_labeler_stats_level ON public.labeler_stats(current_level);
CREATE INDEX idx_labeler_stats_accuracy ON public.labeler_stats(accuracy_score DESC NULLS LAST);
CREATE INDEX idx_labeler_stats_total ON public.labeler_stats(total_labels DESC);

-- Updated_at trigger
CREATE TRIGGER trg_labeler_stats_updated_at
  BEFORE UPDATE ON public.labeler_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_updated_at();

-- RLS
ALTER TABLE public.labeler_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
  ON public.labeler_stats
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role has full access to labeler stats"
  ON public.labeler_stats
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.labeler_stats IS 'Aggregate statistics for labeler quality tracking';

-- ============================================================================
-- TABLE: model_training_runs
-- Track when active learning data is used for training
-- ============================================================================

CREATE TABLE public.model_training_runs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Model Info
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  model_type TEXT NOT NULL,
  -- 'scoring', 'recommendation', 'competitor', etc.

  -- Data Used
  batch_ids UUID[],
  label_ids UUID[],
  training_samples INTEGER NOT NULL,
  validation_samples INTEGER DEFAULT 0,

  -- Training Config
  config JSONB DEFAULT '{}',
  -- { "learning_rate": 0.001, "epochs": 10, "batch_size": 32 }

  -- Results
  metrics_before JSONB,
  -- { "accuracy": 0.85, "f1": 0.82 }

  metrics_after JSONB,
  -- { "accuracy": 0.89, "f1": 0.87 }

  improvement JSONB,
  -- { "accuracy_delta": 0.04, "f1_delta": 0.05 }

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending', 'running', 'completed', 'failed'

  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.user_profiles(id),

  -- Constraints
  CONSTRAINT chk_training_samples
    CHECK (training_samples > 0)
);

-- Indexes
CREATE INDEX idx_training_runs_model ON public.model_training_runs(model_name, model_version);
CREATE INDEX idx_training_runs_status ON public.model_training_runs(status);
CREATE INDEX idx_training_runs_created_at ON public.model_training_runs(created_at DESC);

-- RLS
ALTER TABLE public.model_training_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage training runs"
  ON public.model_training_runs
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.model_training_runs IS 'Record of model training runs using active learning data';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Batch progress
CREATE VIEW public.vw_active_learning_batch_progress AS
SELECT
  b.id AS batch_id,
  b.strategy,
  b.status,
  b.sample_type,
  array_length(b.sample_ids, 1) AS total_samples,
  b.labels_collected,
  b.labels_required,
  ROUND(
    CASE WHEN b.labels_required > 0
         THEN (b.labels_collected::DECIMAL / b.labels_required) * 100
         ELSE 0
    END,
    1
  ) AS completion_pct,
  COUNT(DISTINCT l.labeled_by) AS unique_labelers,
  AVG(l.labeling_duration_ms) AS avg_labeling_time_ms,
  b.created_at,
  b.started_at,
  b.completed_at
FROM public.active_learning_batches b
LEFT JOIN public.active_learning_labels l ON b.id = l.batch_id
GROUP BY b.id;

COMMENT ON VIEW public.vw_active_learning_batch_progress IS 'Progress tracking for active learning batches';

-- View: Labeler leaderboard
CREATE VIEW public.vw_labeler_leaderboard AS
SELECT
  ls.user_id,
  up.email,
  ls.total_labels,
  ls.validated_labels,
  ls.accuracy_score,
  ls.consistency_score,
  ls.current_level,
  ls.avg_duration_ms,
  ls.last_label_at,
  RANK() OVER (ORDER BY ls.total_labels DESC) AS labels_rank,
  RANK() OVER (ORDER BY ls.accuracy_score DESC NULLS LAST) AS accuracy_rank
FROM public.labeler_stats ls
JOIN public.user_profiles up ON ls.user_id = up.id
WHERE ls.total_labels > 0
ORDER BY ls.total_labels DESC;

COMMENT ON VIEW public.vw_labeler_leaderboard IS 'Labeler performance leaderboard';

-- View: Training effectiveness
CREATE VIEW public.vw_training_effectiveness AS
SELECT
  model_name,
  model_type,
  COUNT(*) AS training_runs,
  SUM(training_samples) AS total_samples_used,
  AVG((improvement->>'accuracy_delta')::DECIMAL) AS avg_accuracy_improvement,
  AVG((improvement->>'f1_delta')::DECIMAL) AS avg_f1_improvement,
  MAX((metrics_after->>'accuracy')::DECIMAL) AS best_accuracy,
  MAX(completed_at) AS last_training
FROM public.model_training_runs
WHERE status = 'completed' AND improvement IS NOT NULL
GROUP BY model_name, model_type
ORDER BY avg_accuracy_improvement DESC;

COMMENT ON VIEW public.vw_training_effectiveness IS 'Effectiveness of training runs by model';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Update batch progress when label is added
CREATE OR REPLACE FUNCTION public.fn_update_batch_on_label()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_id IS NOT NULL THEN
    UPDATE public.active_learning_batches
    SET
      labels_collected = (
        SELECT COUNT(*) FROM public.active_learning_labels
        WHERE batch_id = NEW.batch_id
      ),
      status = CASE
        WHEN (
          SELECT COUNT(*) FROM public.active_learning_labels
          WHERE batch_id = NEW.batch_id
        ) >= labels_required THEN 'completed'::batch_status
        WHEN status = 'pending' THEN 'in_progress'::batch_status
        ELSE status
      END,
      started_at = COALESCE(started_at, NOW()),
      completed_at = CASE
        WHEN (
          SELECT COUNT(*) FROM public.active_learning_labels
          WHERE batch_id = NEW.batch_id
        ) >= labels_required THEN NOW()
        ELSE completed_at
      END
    WHERE id = NEW.batch_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_batch_on_label
  AFTER INSERT ON public.active_learning_labels
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_update_batch_on_label();

COMMENT ON FUNCTION public.fn_update_batch_on_label IS 'Update batch progress when a label is added';

-- Function: Update labeler stats on new label
CREATE OR REPLACE FUNCTION public.fn_update_labeler_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.labeler_stats (
    user_id,
    total_labels,
    first_label_at,
    last_label_at
  ) VALUES (
    NEW.labeled_by,
    1,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_labels = labeler_stats.total_labels + 1,
    last_label_at = NOW(),
    avg_duration_ms = (
      labeler_stats.avg_duration_ms * labeler_stats.total_labels + COALESCE(NEW.labeling_duration_ms, 0)
    ) / (labeler_stats.total_labels + 1);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_labeler_stats
  AFTER INSERT ON public.active_learning_labels
  FOR EACH ROW
  WHEN (NEW.labeled_by IS NOT NULL)
  EXECUTE FUNCTION public.fn_update_labeler_stats();

COMMENT ON FUNCTION public.fn_update_labeler_stats IS 'Update labeler statistics on new label';

-- Function: Get next batch for labeling
CREATE OR REPLACE FUNCTION public.fn_get_next_labeling_batch(
  p_user_id UUID,
  p_sample_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  batch_id UUID,
  sample_ids UUID[],
  strategy selection_strategy,
  samples_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS batch_id,
    b.sample_ids,
    b.strategy,
    (b.labels_required - b.labels_collected)::INTEGER AS samples_remaining
  FROM public.active_learning_batches b
  WHERE b.status IN ('pending', 'in_progress')
    AND (p_sample_type IS NULL OR b.sample_type = p_sample_type)
    AND (b.expires_at IS NULL OR b.expires_at > NOW())
    -- Exclude batches this user has already labeled
    AND NOT EXISTS (
      SELECT 1 FROM public.active_learning_labels l
      WHERE l.batch_id = b.id AND l.labeled_by = p_user_id
    )
  ORDER BY
    CASE b.status WHEN 'in_progress' THEN 0 ELSE 1 END,
    b.created_at
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_get_next_labeling_batch IS 'Get the next batch available for a user to label';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
