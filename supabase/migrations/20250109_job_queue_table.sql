-- ============================================================================
-- Job Queue Table with Priority Levels
-- Phase 4, Week 8 Extended - Internal Tools & DX Checklist
--
-- This migration creates:
-- 1. job_queue table with priority levels
-- 2. Queue status enums
-- 3. Helper functions for queue operations
-- 4. Indexes for efficient queue processing
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Job status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM (
      'pending',      -- Waiting to be processed
      'running',      -- Currently being processed
      'completed',    -- Successfully finished
      'failed',       -- Failed, may be retried
      'dead',         -- Failed permanently, no more retries
      'cancelled',    -- Manually cancelled
      'scheduled'     -- Scheduled for future execution
    );
  END IF;
END $$;

-- Job priority enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_priority') THEN
    CREATE TYPE job_priority AS ENUM (
      'critical',   -- Process immediately, bypass normal queue (1)
      'high',       -- Process before normal jobs (2)
      'normal',     -- Standard priority (3)
      'low',        -- Process when queue is clear (4)
      'background'  -- Process during off-peak only (5)
    );
  END IF;
END $$;

-- ============================================================================
-- 2. JOB QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job identification
  job_type VARCHAR(100) NOT NULL,          -- e.g., 'analysis', 'monitoring', 'email'
  job_name VARCHAR(255) NOT NULL,          -- Human-readable name
  queue_name VARCHAR(100) NOT NULL DEFAULT 'default',  -- Queue partition

  -- Priority
  priority job_priority NOT NULL DEFAULT 'normal',
  priority_score INTEGER NOT NULL DEFAULT 50,  -- 1-100, higher = more priority

  -- Status
  status job_status NOT NULL DEFAULT 'pending',

  -- Payload
  payload JSONB NOT NULL DEFAULT '{}',     -- Job-specific data
  result JSONB,                            -- Result after completion
  error_message TEXT,                      -- Error details if failed
  error_stack TEXT,                        -- Full stack trace

  -- Timing
  scheduled_at TIMESTAMPTZ,                -- When to run (for scheduled jobs)
  started_at TIMESTAMPTZ,                  -- When processing began
  completed_at TIMESTAMPTZ,                -- When processing finished
  timeout_at TIMESTAMPTZ,                  -- When job should be considered stuck

  -- Retry logic
  max_retries INTEGER NOT NULL DEFAULT 3,
  retry_count INTEGER NOT NULL DEFAULT 0,
  retry_delay_ms INTEGER NOT NULL DEFAULT 1000,  -- Delay between retries
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- Processing metadata
  worker_id VARCHAR(100),                  -- Which worker is processing
  lock_key VARCHAR(255),                   -- Optional lock for deduplication
  idempotency_key VARCHAR(255) UNIQUE,     -- Prevent duplicate jobs

  -- Progress tracking
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  progress_message TEXT,

  -- Relations
  parent_job_id UUID REFERENCES job_queue(id) ON DELETE SET NULL,  -- For job chains
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,       -- Who triggered
  entity_type VARCHAR(100),                -- Related entity type
  entity_id UUID,                          -- Related entity ID

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Add updated_at trigger
CREATE TRIGGER trigger_job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE job_queue IS
'Persistent job queue with priority levels, retries, and scheduling support';

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Primary queue index for fetching next job
CREATE INDEX idx_job_queue_pending ON job_queue (
  priority_score DESC,
  created_at ASC
) WHERE status = 'pending';

-- Scheduled jobs index
CREATE INDEX idx_job_queue_scheduled ON job_queue (
  scheduled_at ASC
) WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- Running jobs for timeout detection
CREATE INDEX idx_job_queue_running ON job_queue (
  started_at ASC
) WHERE status = 'running';

-- Failed jobs for retry
CREATE INDEX idx_job_queue_retry ON job_queue (
  next_retry_at ASC
) WHERE status = 'failed' AND retry_count < max_retries;

-- Queue partitioning
CREATE INDEX idx_job_queue_queue_name ON job_queue (queue_name, status);

-- Job type filtering
CREATE INDEX idx_job_queue_type ON job_queue (job_type, status);

-- User's jobs
CREATE INDEX idx_job_queue_user ON job_queue (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Lock key for deduplication
CREATE INDEX idx_job_queue_lock_key ON job_queue (lock_key)
  WHERE lock_key IS NOT NULL;

-- Parent job lookups
CREATE INDEX idx_job_queue_parent ON job_queue (parent_job_id)
  WHERE parent_job_id IS NOT NULL;

-- Entity relation lookups
CREATE INDEX idx_job_queue_entity ON job_queue (entity_type, entity_id)
  WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;

-- Tags search
CREATE INDEX idx_job_queue_tags ON job_queue USING GIN (tags);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Enqueue a new job
CREATE OR REPLACE FUNCTION enqueue_job(
  p_job_type VARCHAR(100),
  p_job_name VARCHAR(255),
  p_payload JSONB DEFAULT '{}',
  p_priority job_priority DEFAULT 'normal',
  p_queue_name VARCHAR(100) DEFAULT 'default',
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_max_retries INTEGER DEFAULT 3,
  p_idempotency_key VARCHAR(255) DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_lock_key VARCHAR(255) DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_priority_score INTEGER;
  v_status job_status;
BEGIN
  -- Calculate priority score
  v_priority_score := CASE p_priority
    WHEN 'critical' THEN 100
    WHEN 'high' THEN 75
    WHEN 'normal' THEN 50
    WHEN 'low' THEN 25
    WHEN 'background' THEN 10
    ELSE 50
  END;

  -- Determine initial status
  v_status := CASE
    WHEN p_scheduled_at IS NOT NULL AND p_scheduled_at > CURRENT_TIMESTAMP THEN 'scheduled'
    ELSE 'pending'
  END;

  INSERT INTO job_queue (
    job_type, job_name, queue_name, priority, priority_score, status,
    payload, scheduled_at, max_retries, idempotency_key, user_id,
    lock_key, tags, created_by
  ) VALUES (
    p_job_type, p_job_name, p_queue_name, p_priority, v_priority_score, v_status,
    p_payload, p_scheduled_at, p_max_retries, p_idempotency_key, p_user_id,
    p_lock_key, p_tags, p_user_id
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION enqueue_job IS 'Enqueues a new job with the given parameters';

-- Fetch and lock the next job for processing
CREATE OR REPLACE FUNCTION fetch_next_job(
  p_queue_name VARCHAR(100) DEFAULT 'default',
  p_worker_id VARCHAR(100) DEFAULT NULL,
  p_job_types VARCHAR(100)[] DEFAULT NULL,
  p_timeout_seconds INTEGER DEFAULT 300
) RETURNS job_queue AS $$
DECLARE
  v_job job_queue;
BEGIN
  -- First, move scheduled jobs that are due to pending
  UPDATE job_queue
  SET status = 'pending'
  WHERE status = 'scheduled'
    AND scheduled_at <= CURRENT_TIMESTAMP
    AND queue_name = p_queue_name;

  -- Fetch and lock the highest priority pending job
  UPDATE job_queue
  SET
    status = 'running',
    started_at = CURRENT_TIMESTAMP,
    worker_id = p_worker_id,
    timeout_at = CURRENT_TIMESTAMP + (p_timeout_seconds || ' seconds')::INTERVAL,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = (
    SELECT id FROM job_queue
    WHERE status = 'pending'
      AND queue_name = p_queue_name
      AND (p_job_types IS NULL OR job_type = ANY(p_job_types))
      AND (lock_key IS NULL OR NOT EXISTS (
        SELECT 1 FROM job_queue jq2
        WHERE jq2.lock_key = job_queue.lock_key
          AND jq2.status = 'running'
      ))
    ORDER BY priority_score DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fetch_next_job IS 'Fetches and locks the next available job from the queue';

-- Complete a job successfully
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE job_queue
  SET
    status = 'completed',
    result = p_result,
    completed_at = CURRENT_TIMESTAMP,
    progress = 100,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_job_id
    AND status = 'running';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION complete_job IS 'Marks a job as completed with optional result';

-- Fail a job
CREATE OR REPLACE FUNCTION fail_job(
  p_job_id UUID,
  p_error_message TEXT,
  p_error_stack TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_job job_queue;
BEGIN
  SELECT * INTO v_job FROM job_queue WHERE id = p_job_id FOR UPDATE;

  IF v_job.retry_count < v_job.max_retries THEN
    -- Schedule for retry
    UPDATE job_queue
    SET
      status = 'failed',
      error_message = p_error_message,
      error_stack = p_error_stack,
      retry_count = retry_count + 1,
      last_retry_at = CURRENT_TIMESTAMP,
      next_retry_at = CURRENT_TIMESTAMP + (v_job.retry_delay_ms * POWER(2, v_job.retry_count) || ' milliseconds')::INTERVAL,
      completed_at = NULL,
      worker_id = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;
  ELSE
    -- Mark as dead
    UPDATE job_queue
    SET
      status = 'dead',
      error_message = p_error_message,
      error_stack = p_error_stack,
      completed_at = CURRENT_TIMESTAMP,
      worker_id = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = p_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fail_job IS 'Marks a job as failed, schedules retry if retries remain';

-- Retry failed jobs that are due
CREATE OR REPLACE FUNCTION retry_failed_jobs(
  p_queue_name VARCHAR(100) DEFAULT 'default'
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE job_queue
  SET
    status = 'pending',
    next_retry_at = NULL,
    worker_id = NULL,
    started_at = NULL,
    timeout_at = NULL,
    updated_at = CURRENT_TIMESTAMP
  WHERE status = 'failed'
    AND queue_name = p_queue_name
    AND retry_count < max_retries
    AND next_retry_at <= CURRENT_TIMESTAMP;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION retry_failed_jobs IS 'Moves failed jobs that are due for retry back to pending';

-- Detect and handle stuck jobs
CREATE OR REPLACE FUNCTION recover_stuck_jobs(
  p_queue_name VARCHAR(100) DEFAULT 'default'
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Jobs that exceeded their timeout
  UPDATE job_queue
  SET
    status = 'failed',
    error_message = 'Job timed out (worker may have crashed)',
    retry_count = retry_count + 1,
    last_retry_at = CURRENT_TIMESTAMP,
    next_retry_at = CURRENT_TIMESTAMP + (retry_delay_ms || ' milliseconds')::INTERVAL,
    worker_id = NULL,
    started_at = NULL,
    updated_at = CURRENT_TIMESTAMP
  WHERE status = 'running'
    AND queue_name = p_queue_name
    AND timeout_at < CURRENT_TIMESTAMP
    AND retry_count < max_retries;

  -- Mark permanently stuck jobs as dead
  UPDATE job_queue
  SET
    status = 'dead',
    error_message = 'Job timed out permanently after max retries',
    completed_at = CURRENT_TIMESTAMP,
    worker_id = NULL,
    updated_at = CURRENT_TIMESTAMP
  WHERE status = 'running'
    AND queue_name = p_queue_name
    AND timeout_at < CURRENT_TIMESTAMP
    AND retry_count >= max_retries;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recover_stuck_jobs IS 'Recovers jobs that have exceeded their timeout';

-- Update job progress
CREATE OR REPLACE FUNCTION update_job_progress(
  p_job_id UUID,
  p_progress INTEGER,
  p_message TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  UPDATE job_queue
  SET
    progress = LEAST(99, GREATEST(0, p_progress)),  -- Cap at 99 until complete
    progress_message = COALESCE(p_message, progress_message),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_job_id
    AND status = 'running';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_job_progress IS 'Updates job progress percentage and message';

-- Cancel a job
CREATE OR REPLACE FUNCTION cancel_job(
  p_job_id UUID,
  p_reason TEXT DEFAULT 'Cancelled by user'
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE job_queue
  SET
    status = 'cancelled',
    error_message = p_reason,
    completed_at = CURRENT_TIMESTAMP,
    worker_id = NULL,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_job_id
    AND status IN ('pending', 'scheduled', 'failed');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancel_job IS 'Cancels a pending, scheduled, or failed job';

-- ============================================================================
-- 5. QUEUE STATISTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_queue_stats AS
SELECT
  queue_name,
  status,
  priority,
  COUNT(*) as job_count,
  AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, CURRENT_TIMESTAMP) - created_at))) as avg_duration_seconds,
  MAX(created_at) as newest_job,
  MIN(created_at) FILTER (WHERE status IN ('pending', 'scheduled')) as oldest_pending,
  COUNT(*) FILTER (WHERE status = 'running') as running_count,
  COUNT(*) FILTER (WHERE status = 'failed' AND retry_count < max_retries) as retry_pending,
  COUNT(*) FILTER (WHERE status = 'dead') as dead_count
FROM job_queue
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY queue_name, status, priority
ORDER BY queue_name, status, priority;

COMMENT ON VIEW v_queue_stats IS 'Real-time statistics for job queues';

-- ============================================================================
-- 6. CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_jobs(
  p_retain_days INTEGER DEFAULT 30,
  p_keep_failed_days INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Delete completed jobs older than retention period
  DELETE FROM job_queue
  WHERE status = 'completed'
    AND completed_at < CURRENT_TIMESTAMP - (p_retain_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Delete dead/cancelled jobs older than failed retention
  DELETE FROM job_queue
  WHERE status IN ('dead', 'cancelled')
    AND completed_at < CURRENT_TIMESTAMP - (p_keep_failed_days || ' days')::INTERVAL;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_jobs IS 'Removes old completed and dead jobs to maintain table size';

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access on job_queue"
  ON job_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view their own jobs
CREATE POLICY "Users can view their own jobs"
  ON job_queue
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR created_by = auth.uid()
  );

-- ============================================================================
-- 8. GRANTS
-- ============================================================================

GRANT SELECT ON v_queue_stats TO authenticated;

-- Functions for service role only
REVOKE ALL ON FUNCTION enqueue_job FROM PUBLIC;
REVOKE ALL ON FUNCTION fetch_next_job FROM PUBLIC;
REVOKE ALL ON FUNCTION complete_job FROM PUBLIC;
REVOKE ALL ON FUNCTION fail_job FROM PUBLIC;
REVOKE ALL ON FUNCTION retry_failed_jobs FROM PUBLIC;
REVOKE ALL ON FUNCTION recover_stuck_jobs FROM PUBLIC;
REVOKE ALL ON FUNCTION cancel_job FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_old_jobs FROM PUBLIC;

-- Update progress can be called from API
GRANT EXECUTE ON FUNCTION update_job_progress TO authenticated;
