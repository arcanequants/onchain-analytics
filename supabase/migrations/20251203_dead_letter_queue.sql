-- ============================================================================
-- Dead Letter Queue Table
-- Phase 4: Chaos Engineering - Failed Job Management
--
-- Purpose: Store failed jobs for retry and investigation
-- Created: 2024-12-03
-- ============================================================================

-- Drop existing if needed (for development)
DROP TABLE IF EXISTS dead_letter_queue CASCADE;

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE dlq_status AS ENUM (
        'pending',
        'retrying',
        'exhausted',
        'resolved',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dlq_failure_category AS ENUM (
        'network_error',
        'rate_limit',
        'timeout',
        'provider_error',
        'validation_error',
        'internal_error',
        'unknown'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- MAIN TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dead_letter_queue (
    -- Primary Key
    id TEXT PRIMARY KEY,

    -- Job Identification
    job_type TEXT NOT NULL,
    original_id TEXT NOT NULL,

    -- Payload & Error
    payload JSONB NOT NULL DEFAULT '{}',
    error JSONB NOT NULL,

    -- Categorization
    category TEXT NOT NULL DEFAULT 'unknown',
    status TEXT NOT NULL DEFAULT 'pending',

    -- Retry Configuration
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 5,
    next_retry_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Additional Metadata
    metadata JSONB,

    -- Constraints
    CONSTRAINT dlq_valid_status CHECK (status IN ('pending', 'retrying', 'exhausted', 'resolved', 'expired')),
    CONSTRAINT dlq_valid_category CHECK (category IN ('network_error', 'rate_limit', 'timeout', 'provider_error', 'validation_error', 'internal_error', 'unknown')),
    CONSTRAINT dlq_retry_count_positive CHECK (retry_count >= 0),
    CONSTRAINT dlq_max_retries_positive CHECK (max_retries > 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup: jobs ready for retry
CREATE INDEX IF NOT EXISTS idx_dlq_ready_for_retry
    ON dead_letter_queue(next_retry_at)
    WHERE status = 'pending';

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_dlq_status
    ON dead_letter_queue(status);

-- Job type filtering
CREATE INDEX IF NOT EXISTS idx_dlq_job_type
    ON dead_letter_queue(job_type);

-- Category analysis
CREATE INDEX IF NOT EXISTS idx_dlq_category
    ON dead_letter_queue(category);

-- Cleanup by expiration
CREATE INDEX IF NOT EXISTS idx_dlq_expires_at
    ON dead_letter_queue(expires_at);

-- Original job lookup
CREATE INDEX IF NOT EXISTS idx_dlq_original_id
    ON dead_letter_queue(original_id);

-- Composite for dashboard queries
CREATE INDEX IF NOT EXISTS idx_dlq_status_created
    ON dead_letter_queue(status, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dlq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dlq_updated_at ON dead_letter_queue;
CREATE TRIGGER trigger_dlq_updated_at
    BEFORE UPDATE ON dead_letter_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_dlq_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access
DROP POLICY IF EXISTS "Service role full access to DLQ" ON dead_letter_queue;
CREATE POLICY "Service role full access to DLQ"
    ON dead_letter_queue
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get jobs ready for retry
CREATE OR REPLACE FUNCTION get_dlq_ready_for_retry(p_limit INTEGER DEFAULT 10)
RETURNS SETOF dead_letter_queue AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM dead_letter_queue
    WHERE status = 'pending'
      AND next_retry_at <= NOW()
    ORDER BY next_retry_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get DLQ statistics
CREATE OR REPLACE FUNCTION get_dlq_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'by_status', json_build_object(
            'pending', COUNT(*) FILTER (WHERE status = 'pending'),
            'retrying', COUNT(*) FILTER (WHERE status = 'retrying'),
            'exhausted', COUNT(*) FILTER (WHERE status = 'exhausted'),
            'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
            'expired', COUNT(*) FILTER (WHERE status = 'expired')
        ),
        'by_category', json_build_object(
            'network_error', COUNT(*) FILTER (WHERE category = 'network_error'),
            'rate_limit', COUNT(*) FILTER (WHERE category = 'rate_limit'),
            'timeout', COUNT(*) FILTER (WHERE category = 'timeout'),
            'provider_error', COUNT(*) FILTER (WHERE category = 'provider_error'),
            'validation_error', COUNT(*) FILTER (WHERE category = 'validation_error'),
            'internal_error', COUNT(*) FILTER (WHERE category = 'internal_error'),
            'unknown', COUNT(*) FILTER (WHERE category = 'unknown')
        ),
        'oldest_pending', (
            SELECT created_at FROM dead_letter_queue
            WHERE status = 'pending'
            ORDER BY created_at ASC LIMIT 1
        ),
        'newest_pending', (
            SELECT created_at FROM dead_letter_queue
            WHERE status = 'pending'
            ORDER BY created_at DESC LIMIT 1
        )
    ) INTO result
    FROM dead_letter_queue;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired jobs
CREATE OR REPLACE FUNCTION cleanup_expired_dlq_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM dead_letter_queue
        WHERE expires_at < NOW()
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA DICTIONARY ENTRY
-- ============================================================================

COMMENT ON TABLE dead_letter_queue IS 'Dead Letter Queue for failed job management - stores failed operations for retry and investigation';
COMMENT ON COLUMN dead_letter_queue.id IS 'Unique job identifier (format: dlq_<timestamp>_<random>)';
COMMENT ON COLUMN dead_letter_queue.job_type IS 'Type of job (e.g., analysis, provider-call)';
COMMENT ON COLUMN dead_letter_queue.original_id IS 'ID of the original operation that failed';
COMMENT ON COLUMN dead_letter_queue.payload IS 'Original job payload for retry';
COMMENT ON COLUMN dead_letter_queue.error IS 'Error details including message, code, and stack trace';
COMMENT ON COLUMN dead_letter_queue.category IS 'Categorized failure type for analysis';
COMMENT ON COLUMN dead_letter_queue.status IS 'Current job status in the retry lifecycle';
COMMENT ON COLUMN dead_letter_queue.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN dead_letter_queue.max_retries IS 'Maximum allowed retry attempts';
COMMENT ON COLUMN dead_letter_queue.next_retry_at IS 'Scheduled time for next retry attempt';
COMMENT ON COLUMN dead_letter_queue.expires_at IS 'TTL expiration timestamp';
COMMENT ON COLUMN dead_letter_queue.metadata IS 'Additional context (source, provider, etc.)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON dead_letter_queue TO service_role;
GRANT EXECUTE ON FUNCTION get_dlq_ready_for_retry TO service_role;
GRANT EXECUTE ON FUNCTION get_dlq_stats TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_dlq_jobs TO service_role;
