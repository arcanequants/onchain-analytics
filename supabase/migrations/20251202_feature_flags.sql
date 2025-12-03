-- ============================================================================
-- Feature Flags Table
-- Phase 4, Week 8 - Admin Panel Real Data Implementation
--
-- This table stores feature flags for gradual rollouts and kill switches:
-- - Percentage-based rollouts
-- - Environment-specific flags
-- - Kill switches for emergency disables
-- ============================================================================

-- Create enum for flag status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_status') THEN
        CREATE TYPE flag_status AS ENUM ('enabled', 'disabled', 'rollout');
    END IF;
END$$;

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Flag identifier (used in code)
    key TEXT NOT NULL UNIQUE,

    -- Display info
    name TEXT NOT NULL,
    description TEXT,

    -- Status
    status flag_status NOT NULL DEFAULT 'disabled',
    rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

    -- Environments where this flag applies
    environments TEXT[] NOT NULL DEFAULT ARRAY['development'],

    -- Targeting rules (JSON array)
    -- Format: [{type: 'percentage'|'user_ids'|'plan'|'segment', value: any, enabled: boolean}]
    target_rules JSONB NOT NULL DEFAULT '[]',

    -- Kill switch flag (for critical features)
    is_kill_switch BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT NOT NULL DEFAULT 'system',
    updated_by TEXT,

    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON feature_flags(status);
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_kill_switch ON feature_flags(is_kill_switch);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environments ON feature_flags USING GIN(environments);
CREATE INDEX IF NOT EXISTS idx_feature_flags_deleted_at ON feature_flags(deleted_at) WHERE deleted_at IS NULL;

-- Enable Row Level Security
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Create policy for service role (admin access)
DROP POLICY IF EXISTS "Service role can do all on feature_flags" ON feature_flags;
CREATE POLICY "Service role can do all on feature_flags"
    ON feature_flags
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create read-only policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read feature_flags" ON feature_flags;
CREATE POLICY "Authenticated users can read feature_flags"
    ON feature_flags
    FOR SELECT
    TO authenticated
    USING (deleted_at IS NULL);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER trigger_update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();

-- Add comments for documentation
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollouts and kill switches';
COMMENT ON COLUMN feature_flags.key IS 'Unique identifier used in application code';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users to receive this feature (0-100)';
COMMENT ON COLUMN feature_flags.environments IS 'Array of environments: production, staging, development';
COMMENT ON COLUMN feature_flags.target_rules IS 'JSON array of targeting rules for advanced rollouts';
COMMENT ON COLUMN feature_flags.is_kill_switch IS 'If true, this is a critical kill switch flag';

-- Create view for feature flag statistics
CREATE OR REPLACE VIEW feature_flags_stats AS
SELECT
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total,
    COUNT(*) FILTER (WHERE status = 'enabled' AND deleted_at IS NULL) AS enabled,
    COUNT(*) FILTER (WHERE status = 'rollout' AND deleted_at IS NULL) AS in_rollout,
    COUNT(*) FILTER (WHERE status = 'disabled' AND deleted_at IS NULL) AS disabled,
    COUNT(*) FILTER (WHERE is_kill_switch = true AND deleted_at IS NULL) AS kill_switches
FROM feature_flags;

-- Grant select on the view
GRANT SELECT ON feature_flags_stats TO service_role;
GRANT SELECT ON feature_flags_stats TO authenticated;

-- Function to check if a flag is enabled for a user
CREATE OR REPLACE FUNCTION is_flag_enabled(
    p_flag_key TEXT,
    p_user_id TEXT DEFAULT NULL,
    p_environment TEXT DEFAULT 'production'
) RETURNS BOOLEAN AS $$
DECLARE
    v_flag feature_flags%ROWTYPE;
    v_hash BIGINT;
BEGIN
    -- Get the flag
    SELECT * INTO v_flag
    FROM feature_flags
    WHERE key = p_flag_key
      AND deleted_at IS NULL
      AND p_environment = ANY(environments);

    -- Flag doesn't exist or not in environment
    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Check status
    IF v_flag.status = 'disabled' THEN
        RETURN false;
    END IF;

    IF v_flag.status = 'enabled' THEN
        RETURN true;
    END IF;

    -- Status is 'rollout' - use percentage-based check
    IF p_user_id IS NOT NULL THEN
        -- Deterministic hash for consistent user experience
        v_hash := abs(hashtext(p_flag_key || ':' || p_user_id) % 100);
        RETURN v_hash < v_flag.rollout_percentage;
    END IF;

    -- No user ID, use random
    RETURN random() * 100 < v_flag.rollout_percentage;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_flag_enabled TO service_role;
GRANT EXECUTE ON FUNCTION is_flag_enabled TO authenticated;

-- Insert some default feature flags
INSERT INTO feature_flags (key, name, description, status, rollout_percentage, environments, is_kill_switch, created_by)
VALUES
    ('new_scoring_algorithm', 'New Scoring Algorithm', 'Use the improved v2 scoring algorithm with better accuracy', 'rollout', 25, ARRAY['production', 'staging'], false, 'system'),
    ('ai_recommendations_v2', 'AI Recommendations V2', 'Enhanced AI-powered recommendations with industry context', 'enabled', 100, ARRAY['production', 'staging', 'development'], false, 'system'),
    ('competitor_analysis', 'Competitor Analysis', 'Show competitor comparison in results page', 'rollout', 50, ARRAY['production'], false, 'system'),
    ('stripe_payments', 'Stripe Payments', 'Enable Stripe payment processing (KILL SWITCH)', 'enabled', 100, ARRAY['production', 'staging'], true, 'system'),
    ('dark_mode', 'Dark Mode', 'Enable dark mode theme toggle', 'disabled', 0, ARRAY['development'], false, 'system'),
    ('ai_provider_fallback', 'AI Provider Fallback', 'Automatic fallback to secondary AI provider (KILL SWITCH)', 'enabled', 100, ARRAY['production', 'staging', 'development'], true, 'system')
ON CONFLICT (key) DO NOTHING;
