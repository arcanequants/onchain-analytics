-- ============================================================================
-- CHECK Constraints Migration
-- Phase 4, Week 8 Extended - Semantic Audit Checklist
--
-- This migration adds CHECK constraints to ensure data integrity for:
-- - Score columns (0-100)
-- - Confidence scores (0.0-1.0)
-- - Non-negative values (costs, tokens, durations)
-- - Temporal constraints (end > start)
-- ============================================================================

-- ============================================================================
-- 1. SCORE COLUMN CONSTRAINTS (0-100)
-- ============================================================================

-- Note: These ALTER TABLE commands use IF NOT EXISTS pattern via DO blocks
-- to make the migration idempotent

-- analyses.perception_score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_analyses_perception_score_range'
  ) THEN
    ALTER TABLE analyses
    ADD CONSTRAINT chk_analyses_perception_score_range
    CHECK (perception_score IS NULL OR (perception_score >= 0 AND perception_score <= 100));
  END IF;
END $$;

-- analyses.visibility_score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_analyses_visibility_score_range'
  ) THEN
    ALTER TABLE analyses
    ADD CONSTRAINT chk_analyses_visibility_score_range
    CHECK (visibility_score IS NULL OR (visibility_score >= 0 AND visibility_score <= 100));
  END IF;
END $$;

-- analyses.sentiment_score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_analyses_sentiment_score_range'
  ) THEN
    ALTER TABLE analyses
    ADD CONSTRAINT chk_analyses_sentiment_score_range
    CHECK (sentiment_score IS NULL OR (sentiment_score >= 0 AND sentiment_score <= 100));
  END IF;
END $$;

-- recommendations.impact_score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_recommendations_impact_score_range'
  ) THEN
    ALTER TABLE recommendations
    ADD CONSTRAINT chk_recommendations_impact_score_range
    CHECK (impact_score IS NULL OR (impact_score >= 0 AND impact_score <= 100));
  END IF;
END $$;

-- recommendations.priority_score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_recommendations_priority_score_range'
  ) THEN
    ALTER TABLE recommendations
    ADD CONSTRAINT chk_recommendations_priority_score_range
    CHECK (priority_score IS NULL OR (priority_score >= 0 AND priority_score <= 100));
  END IF;
END $$;

-- ============================================================================
-- 2. CONFIDENCE SCORE CONSTRAINTS (0.0-1.0)
-- ============================================================================

-- ai_responses.confidence
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_ai_responses_confidence_range'
  ) THEN
    ALTER TABLE ai_responses
    ADD CONSTRAINT chk_ai_responses_confidence_range
    CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0));
  END IF;
END $$;

-- hallucination_checks.confidence_score
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_hallucination_confidence_range'
  ) THEN
    ALTER TABLE hallucination_checks
    ADD CONSTRAINT chk_hallucination_confidence_range
    CHECK (confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- calibration_curves.confidence_bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_calibration_confidence_bucket_range'
  ) THEN
    ALTER TABLE calibration_curves
    ADD CONSTRAINT chk_calibration_confidence_bucket_range
    CHECK (confidence_bucket IS NULL OR (confidence_bucket >= 0.0 AND confidence_bucket <= 1.0));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 3. NON-NEGATIVE CONSTRAINTS (costs, tokens, durations)
-- ============================================================================

-- ai_responses.cost_usd
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_ai_responses_cost_non_negative'
  ) THEN
    ALTER TABLE ai_responses
    ADD CONSTRAINT chk_ai_responses_cost_non_negative
    CHECK (cost_usd IS NULL OR cost_usd >= 0);
  END IF;
END $$;

-- ai_responses.tokens_used
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_ai_responses_tokens_non_negative'
  ) THEN
    ALTER TABLE ai_responses
    ADD CONSTRAINT chk_ai_responses_tokens_non_negative
    CHECK (tokens_used IS NULL OR tokens_used >= 0);
  END IF;
END $$;

-- ai_responses.input_tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_ai_responses_input_tokens_non_negative'
  ) THEN
    ALTER TABLE ai_responses
    ADD CONSTRAINT chk_ai_responses_input_tokens_non_negative
    CHECK (input_tokens IS NULL OR input_tokens >= 0);
  END IF;
END $$;

-- ai_responses.output_tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_ai_responses_output_tokens_non_negative'
  ) THEN
    ALTER TABLE ai_responses
    ADD CONSTRAINT chk_ai_responses_output_tokens_non_negative
    CHECK (output_tokens IS NULL OR output_tokens >= 0);
  END IF;
END $$;

-- ai_responses.response_time_ms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_ai_responses_response_time_non_negative'
  ) THEN
    ALTER TABLE ai_responses
    ADD CONSTRAINT chk_ai_responses_response_time_non_negative
    CHECK (response_time_ms IS NULL OR response_time_ms >= 0);
  END IF;
END $$;

-- analyses.total_cost_usd
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_analyses_total_cost_non_negative'
  ) THEN
    ALTER TABLE analyses
    ADD CONSTRAINT chk_analyses_total_cost_non_negative
    CHECK (total_cost_usd IS NULL OR total_cost_usd >= 0);
  END IF;
END $$;

-- analyses.processing_time_ms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_analyses_processing_time_non_negative'
  ) THEN
    ALTER TABLE analyses
    ADD CONSTRAINT chk_analyses_processing_time_non_negative
    CHECK (processing_time_ms IS NULL OR processing_time_ms >= 0);
  END IF;
END $$;

-- cron_executions.execution_time_ms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_cron_exec_time_non_negative'
  ) THEN
    ALTER TABLE cron_executions
    ADD CONSTRAINT chk_cron_exec_time_non_negative
    CHECK (execution_time_ms IS NULL OR execution_time_ms >= 0);
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 4. TEMPORAL CONSTRAINTS (completed_at >= created_at)
-- ============================================================================

-- analyses: completed_at must be after created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_analyses_completed_after_created'
  ) THEN
    ALTER TABLE analyses
    ADD CONSTRAINT chk_analyses_completed_after_created
    CHECK (completed_at IS NULL OR completed_at >= created_at);
  END IF;
END $$;

-- analyses: updated_at must be after or equal to created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_analyses_updated_after_created'
  ) THEN
    ALTER TABLE analyses
    ADD CONSTRAINT chk_analyses_updated_after_created
    CHECK (updated_at IS NULL OR updated_at >= created_at);
  END IF;
END $$;

-- user_profiles: updated_at must be after or equal to created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_profiles_updated_after_created'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT chk_user_profiles_updated_after_created
    CHECK (updated_at IS NULL OR updated_at >= created_at);
  END IF;
END $$;

-- subscriptions: end_date must be after start_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_subscriptions_end_after_start'
  ) THEN
    ALTER TABLE subscriptions
    ADD CONSTRAINT chk_subscriptions_end_after_start
    CHECK (end_date IS NULL OR end_date >= start_date);
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 5. RATING/PRIORITY CONSTRAINTS
-- ============================================================================

-- user_feedback.rating (1-5 scale)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_feedback_rating_range'
  ) THEN
    ALTER TABLE user_feedback
    ADD CONSTRAINT chk_user_feedback_rating_range
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- cron_job_definitions.priority (1-10 scale)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_cron_job_priority_range'
  ) THEN
    ALTER TABLE cron_job_definitions
    ADD CONSTRAINT chk_cron_job_priority_range
    CHECK (priority IS NULL OR (priority >= 1 AND priority <= 10));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- recommendations.effort_level (1-5 scale)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_recommendations_effort_range'
  ) THEN
    ALTER TABLE recommendations
    ADD CONSTRAINT chk_recommendations_effort_range
    CHECK (effort_level IS NULL OR (effort_level >= 1 AND effort_level <= 5));
  END IF;
END $$;

-- ============================================================================
-- 6. PERCENTAGE CONSTRAINTS (0-100 as decimal or percentage)
-- ============================================================================

-- cron_job_definitions.success_rate (0-100%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_cron_job_success_rate_range'
  ) THEN
    ALTER TABLE cron_job_definitions
    ADD CONSTRAINT chk_cron_job_success_rate_range
    CHECK (success_rate IS NULL OR (success_rate >= 0 AND success_rate <= 100));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- feature_flag_overrides.rollout_percentage (0-100%)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_feature_flag_rollout_range'
  ) THEN
    ALTER TABLE feature_flag_overrides
    ADD CONSTRAINT chk_feature_flag_rollout_range
    CHECK (rollout_percentage IS NULL OR (rollout_percentage >= 0 AND rollout_percentage <= 100));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 7. COUNT CONSTRAINTS (non-negative integers)
-- ============================================================================

-- user_profiles.analyses_count
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_profiles_analyses_count_non_negative'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT chk_user_profiles_analyses_count_non_negative
    CHECK (analyses_count IS NULL OR analyses_count >= 0);
  END IF;
END $$;

-- user_profiles.monthly_analyses_count
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_profiles_monthly_count_non_negative'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT chk_user_profiles_monthly_count_non_negative
    CHECK (monthly_analyses_count IS NULL OR monthly_analyses_count >= 0);
  END IF;
END $$;

-- cron_job_definitions.total_runs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_cron_job_total_runs_non_negative'
  ) THEN
    ALTER TABLE cron_job_definitions
    ADD CONSTRAINT chk_cron_job_total_runs_non_negative
    CHECK (total_runs IS NULL OR total_runs >= 0);
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- cron_job_definitions.total_failures
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_cron_job_total_failures_non_negative'
  ) THEN
    ALTER TABLE cron_job_definitions
    ADD CONSTRAINT chk_cron_job_total_failures_non_negative
    CHECK (total_failures IS NULL OR total_failures >= 0);
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT chk_analyses_perception_score_range ON analyses IS 'Perception score must be 0-100';
COMMENT ON CONSTRAINT chk_ai_responses_confidence_range ON ai_responses IS 'Confidence must be 0.0-1.0';
COMMENT ON CONSTRAINT chk_ai_responses_cost_non_negative ON ai_responses IS 'Cost cannot be negative';
COMMENT ON CONSTRAINT chk_analyses_completed_after_created ON analyses IS 'Completion time must be >= creation time';

-- ============================================================================
-- 9. CREATE VIEW FOR CONSTRAINT DOCUMENTATION
-- ============================================================================

CREATE OR REPLACE VIEW v_check_constraints AS
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause,
  CASE
    WHEN tc.constraint_name LIKE '%_range' THEN 'range'
    WHEN tc.constraint_name LIKE '%_non_negative' THEN 'non_negative'
    WHEN tc.constraint_name LIKE '%_after_%' THEN 'temporal'
    ELSE 'other'
  END as constraint_type,
  pg_catalog.obj_description(pgc.oid, 'pg_constraint') as description
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
JOIN pg_catalog.pg_constraint pgc
  ON pgc.conname = tc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND tc.constraint_name LIKE 'chk_%'
ORDER BY tc.table_name, tc.constraint_name;

COMMENT ON VIEW v_check_constraints IS 'Documents all custom CHECK constraints in the database';
