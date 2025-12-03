-- ============================================================================
-- Audit Log Table
-- Phase 4, Week 8 - Admin Panel Real Data Implementation
--
-- This table stores all audit trail events for the platform:
-- - User actions (login, logout, create, update, delete)
-- - System actions (cron jobs, automated tasks)
-- - API access (external API calls)
-- ============================================================================

-- Create enum for action types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action') THEN
        CREATE TYPE audit_action AS ENUM (
            'create', 'update', 'delete',
            'login', 'logout',
            'export', 'import',
            'approve', 'reject',
            'access', 'configure'
        );
    END IF;
END$$;

-- Create enum for actor types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'actor_type') THEN
        CREATE TYPE actor_type AS ENUM ('user', 'system', 'api');
    END IF;
END$$;

-- Create enum for entity types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type') THEN
        CREATE TYPE entity_type AS ENUM (
            'user', 'analysis', 'subscription',
            'api_key', 'webhook', 'setting',
            'correction', 'monitor', 'feature_flag',
            'cron_job', 'token_price', 'wallet',
            'protocol_tvl', 'gas_metrics'
        );
    END IF;
END$$;

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- When
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Who (Actor)
    actor_id TEXT NOT NULL,
    actor_type actor_type NOT NULL,
    actor_name TEXT NOT NULL,
    actor_email TEXT,
    actor_ip_address INET,

    -- What (Action)
    action audit_action NOT NULL,

    -- Target (Entity)
    entity_type entity_type NOT NULL,
    entity_id TEXT NOT NULL,
    entity_name TEXT,

    -- Details
    changes JSONB, -- Array of {field, before, after}
    metadata JSONB DEFAULT '{}',

    -- Request context
    request_id TEXT,
    user_agent TEXT,

    -- Outcome
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
    error_message TEXT,

    -- Indexes
    CONSTRAINT valid_failure_error CHECK (
        (status = 'failure' AND error_message IS NOT NULL) OR
        (status = 'success' AND error_message IS NULL)
    )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_type ON audit_log(actor_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_request_id ON audit_log(request_id);

-- Create composite index for date-based filtering
CREATE INDEX IF NOT EXISTS idx_audit_log_date_range ON audit_log(created_at, action, entity_type);

-- Enable Row Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (admin access)
DROP POLICY IF EXISTS "Service role can do all on audit_log" ON audit_log;
CREATE POLICY "Service role can do all on audit_log"
    ON audit_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create read-only policy for authenticated users (admins only)
-- Note: In production, you'd want to check for admin role
DROP POLICY IF EXISTS "Authenticated users can read audit_log" ON audit_log;
CREATE POLICY "Authenticated users can read audit_log"
    ON audit_log
    FOR SELECT
    TO authenticated
    USING (true);

-- Add comments for documentation
COMMENT ON TABLE audit_log IS 'Stores all audit trail events for compliance and security monitoring';
COMMENT ON COLUMN audit_log.actor_id IS 'ID of the user, system job, or API key that performed the action';
COMMENT ON COLUMN audit_log.actor_type IS 'Type of actor: user, system (cron), or api';
COMMENT ON COLUMN audit_log.changes IS 'JSON array of field changes: [{field, before, after}]';
COMMENT ON COLUMN audit_log.metadata IS 'Additional context-specific data';
COMMENT ON COLUMN audit_log.request_id IS 'Correlation ID for tracing requests across services';

-- Create function to log audit events easily
CREATE OR REPLACE FUNCTION log_audit_event(
    p_actor_id TEXT,
    p_actor_type actor_type,
    p_actor_name TEXT,
    p_action audit_action,
    p_entity_type entity_type,
    p_entity_id TEXT,
    p_entity_name TEXT DEFAULT NULL,
    p_changes JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_actor_email TEXT DEFAULT NULL,
    p_actor_ip TEXT DEFAULT NULL,
    p_request_id TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_status TEXT DEFAULT 'success',
    p_error_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO audit_log (
        actor_id, actor_type, actor_name, actor_email, actor_ip_address,
        action, entity_type, entity_id, entity_name,
        changes, metadata, request_id, user_agent,
        status, error_message
    ) VALUES (
        p_actor_id, p_actor_type, p_actor_name, p_actor_email,
        CASE WHEN p_actor_ip IS NOT NULL THEN p_actor_ip::inet ELSE NULL END,
        p_action, p_entity_type, p_entity_id, p_entity_name,
        p_changes, p_metadata, p_request_id, p_user_agent,
        p_status, p_error_message
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;

-- Create view for audit statistics
CREATE OR REPLACE VIEW audit_log_stats AS
SELECT
    COUNT(*) AS total_events,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today_events,
    COUNT(DISTINCT actor_id) AS unique_actors,
    COUNT(*) FILTER (WHERE status = 'failure') AS failed_events,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') AS last_hour_events,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h_events
FROM audit_log;

-- Grant select on the view
GRANT SELECT ON audit_log_stats TO service_role;
GRANT SELECT ON audit_log_stats TO authenticated;
