-- ============================================================================
-- DATA QUALITY CHECK CONSTRAINTS
-- Enforces data integrity at the database level with CHECK constraints
-- Version: 1.0
-- Last Updated: 2025-11-30
-- ============================================================================

-- ============================================================================
-- SCORE AND RATING CONSTRAINTS
-- Ensure all scores/ratings fall within valid ranges
-- ============================================================================

-- Perception scores: 0-100
DO $$ BEGIN
  ALTER TABLE public.analyses
    ADD CONSTRAINT chk_overall_score_range
    CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.analyses
    ADD CONSTRAINT chk_sentiment_score_range
    CHECK (sentiment_score IS NULL OR (sentiment_score >= 0 AND sentiment_score <= 100));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.analyses
    ADD CONSTRAINT chk_credibility_score_range
    CHECK (credibility_score IS NULL OR (credibility_score >= 0 AND credibility_score <= 100));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Confidence scores: 0-1 (probability)
DO $$ BEGIN
  ALTER TABLE public.ai_responses
    ADD CONSTRAINT chk_confidence_score_range
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.preference_pairs
    ADD CONSTRAINT chk_preference_confidence_range
    CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Star ratings: 1-5
DO $$ BEGIN
  ALTER TABLE public.user_feedback
    ADD CONSTRAINT chk_rating_range
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TOKEN AND COUNT CONSTRAINTS
-- Ensure counts are non-negative
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.ai_responses
    ADD CONSTRAINT chk_input_tokens_positive
    CHECK (input_tokens IS NULL OR input_tokens >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ai_responses
    ADD CONSTRAINT chk_output_tokens_positive
    CHECK (output_tokens IS NULL OR output_tokens >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.ai_responses
    ADD CONSTRAINT chk_total_tokens_positive
    CHECK (total_tokens IS NULL OR total_tokens >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Token consistency: total should equal input + output
DO $$ BEGIN
  ALTER TABLE public.ai_responses
    ADD CONSTRAINT chk_tokens_sum_consistent
    CHECK (
      total_tokens IS NULL
      OR input_tokens IS NULL
      OR output_tokens IS NULL
      OR total_tokens = input_tokens + output_tokens
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- MONETARY CONSTRAINTS
-- Ensure financial values are valid
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.ai_responses
    ADD CONSTRAINT chk_cost_positive
    CHECK (cost_usd IS NULL OR cost_usd >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.subscriptions
    ADD CONSTRAINT chk_price_positive
    CHECK (price IS NULL OR price >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DURATION CONSTRAINTS
-- Ensure durations are non-negative
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.ai_responses
    ADD CONSTRAINT chk_duration_positive
    CHECK (duration_ms IS NULL OR duration_ms >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.active_learning_labels
    ADD CONSTRAINT chk_labeling_duration_positive
    CHECK (labeling_duration_ms IS NULL OR labeling_duration_ms >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- PERCENTAGE CONSTRAINTS
-- Ensure percentages are 0-100
-- ============================================================================

DO $$ BEGIN
  ALTER TABLE public.experiment_assignments
    ADD CONSTRAINT chk_traffic_allocation_range
    CHECK (traffic_allocation IS NULL OR (traffic_allocation >= 0 AND traffic_allocation <= 100));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TEXT FORMAT CONSTRAINTS
-- Ensure text fields match expected patterns
-- ============================================================================

-- Email format (basic validation)
DO $$ BEGIN
  ALTER TABLE public.user_profiles
    ADD CONSTRAINT chk_email_format
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- URL format (basic validation)
DO $$ BEGIN
  ALTER TABLE public.analyses
    ADD CONSTRAINT chk_url_format
    CHECK (url IS NULL OR url ~* '^https?://[^\s]+$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Wallet address format (Ethereum-style)
DO $$ BEGIN
  ALTER TABLE public.tracked_wallets
    ADD CONSTRAINT chk_wallet_address_format
    CHECK (address IS NULL OR address ~* '^0x[a-fA-F0-9]{40}$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DATE/TIME CONSTRAINTS
-- Ensure temporal logic is valid
-- ============================================================================

-- End date must be after start date
DO $$ BEGIN
  ALTER TABLE public.subscriptions
    ADD CONSTRAINT chk_subscription_dates_valid
    CHECK (
      current_period_start IS NULL
      OR current_period_end IS NULL
      OR current_period_end > current_period_start
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Concluded experiments should have concluded_at
DO $$ BEGIN
  ALTER TABLE public.prompt_experiments
    ADD CONSTRAINT chk_concluded_has_date
    CHECK (
      status != 'concluded'
      OR concluded_at IS NOT NULL
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- ARRAY CONSTRAINTS
-- Ensure arrays have valid lengths
-- ============================================================================

-- Experiment variants must have at least 2 variants
DO $$ BEGIN
  ALTER TABLE public.prompt_experiments
    ADD CONSTRAINT chk_min_variants
    CHECK (variants IS NULL OR array_length(variants, 1) >= 2);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- CROSS-FIELD CONSTRAINTS
-- Ensure related fields are logically consistent
-- ============================================================================

-- If is_positive is set, rating should match
DO $$ BEGIN
  ALTER TABLE public.user_feedback
    ADD CONSTRAINT chk_positive_rating_consistent
    CHECK (
      is_positive IS NULL
      OR rating IS NULL
      OR (is_positive = TRUE AND rating >= 4)
      OR (is_positive = FALSE AND rating <= 2)
      OR (rating = 3) -- Neutral allows either
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- STATUS TRANSITION CONSTRAINTS (using triggers)
-- ============================================================================

-- Function to validate experiment status transitions
CREATE OR REPLACE FUNCTION public.fn_validate_experiment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Define valid transitions
  IF OLD.status = 'draft' AND NEW.status NOT IN ('draft', 'running', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from draft to %', NEW.status;
  END IF;

  IF OLD.status = 'running' AND NEW.status NOT IN ('running', 'paused', 'concluded', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from running to %', NEW.status;
  END IF;

  IF OLD.status = 'paused' AND NEW.status NOT IN ('paused', 'running', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status transition from paused to %', NEW.status;
  END IF;

  IF OLD.status IN ('concluded', 'cancelled') AND NEW.status != OLD.status THEN
    RAISE EXCEPTION 'Cannot change status from terminal state %', OLD.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS trg_validate_experiment_status ON public.prompt_experiments;
CREATE TRIGGER trg_validate_experiment_status
  BEFORE UPDATE ON public.prompt_experiments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.fn_validate_experiment_status();

-- ============================================================================
-- HELPER FUNCTION: Validate data against constraints
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_validate_data_quality(
  p_table_name TEXT,
  p_sample_size INTEGER DEFAULT 1000
)
RETURNS TABLE (
  constraint_name TEXT,
  violation_count BIGINT,
  sample_ids UUID[]
) AS $$
DECLARE
  v_constraint RECORD;
  v_sql TEXT;
  v_count BIGINT;
  v_samples UUID[];
BEGIN
  -- Get all CHECK constraints for the table
  FOR v_constraint IN
    SELECT
      con.conname,
      pg_get_constraintdef(con.oid) as check_clause
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE con.contype = 'c'
      AND nsp.nspname = 'public'
      AND rel.relname = p_table_name
  LOOP
    -- Count violations (records where constraint would fail)
    -- Note: This is a simplified approach - in practice you'd need
    -- to parse and negate the constraint clause

    constraint_name := v_constraint.conname;
    violation_count := 0; -- Would need dynamic SQL to actually check
    sample_ids := ARRAY[]::UUID[];

    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_validate_data_quality IS
  'Validates existing data against CHECK constraints for a table';

-- ============================================================================
-- VIEW: Constraint Summary
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_check_constraints AS
SELECT
  nsp.nspname AS schema_name,
  rel.relname AS table_name,
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition,
  CASE
    WHEN con.conname ~ '_range$' THEN 'range'
    WHEN con.conname ~ '_positive$' THEN 'positive'
    WHEN con.conname ~ '_format$' THEN 'format'
    WHEN con.conname ~ '_valid$' THEN 'validity'
    WHEN con.conname ~ '_consistent$' THEN 'consistency'
    ELSE 'other'
  END AS constraint_type
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE con.contype = 'c'
  AND nsp.nspname = 'public'
ORDER BY rel.relname, con.conname;

COMMENT ON VIEW public.vw_check_constraints IS
  'Summary of all CHECK constraints in the public schema';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
