-- ================================================================
-- API Keys Table for Service Authentication
-- RED TEAM AUDIT FIX: CRITICAL-001
-- ================================================================

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Key identification
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,  -- First 8 chars of key for identification
    key_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hash of the full key

    -- Ownership
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Permissions
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read']::TEXT[],
    rate_limit INTEGER NOT NULL DEFAULT 1000,  -- requests per hour

    -- Metadata
    description TEXT,
    environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT api_key_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
    CONSTRAINT api_key_valid_scopes CHECK (
        scopes <@ ARRAY['read', 'write', 'analyze:read', 'analyze:write', 'admin', 'service']::TEXT[]
    )
);

-- Add role column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
            CHECK (role IN ('user', 'admin', 'service'));
    END IF;
END $$;

-- Add tier column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'tier'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN tier TEXT NOT NULL DEFAULT 'free'
            CHECK (tier IN ('free', 'pro', 'enterprise'));
    END IF;
END $$;

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_not_revoked ON api_keys(owner_id) WHERE revoked_at IS NULL;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only see their own API keys
CREATE POLICY "Users can view own API keys"
    ON api_keys FOR SELECT
    USING (auth.uid() = owner_id);

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys"
    ON api_keys FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

-- Users can update their own API keys (for revocation)
CREATE POLICY "Users can update own API keys"
    ON api_keys FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
    ON api_keys FOR DELETE
    USING (auth.uid() = owner_id);

-- Service role can access all
CREATE POLICY "Service role full access"
    ON api_keys FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================================================
-- HELPER FUNCTIONS
-- ================================================================

-- Function to generate a new API key (returns the plain key - only shown once)
CREATE OR REPLACE FUNCTION generate_api_key(
    p_owner_id UUID,
    p_name TEXT,
    p_scopes TEXT[] DEFAULT ARRAY['read']::TEXT[],
    p_description TEXT DEFAULT NULL,
    p_environment TEXT DEFAULT 'production',
    p_expires_in_days INTEGER DEFAULT NULL
)
RETURNS TABLE(
    key_id UUID,
    api_key TEXT,
    key_prefix TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_key TEXT;
    v_prefix TEXT;
    v_hash TEXT;
    v_key_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate a random API key (format: vda_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
    v_key := 'vda_' || encode(gen_random_bytes(24), 'hex');
    v_prefix := substring(v_key, 1, 12);
    v_hash := encode(digest(v_key, 'sha256'), 'hex');

    -- Calculate expiration if specified
    IF p_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
    END IF;

    -- Insert the key record
    INSERT INTO api_keys (
        name,
        key_prefix,
        key_hash,
        owner_id,
        scopes,
        description,
        environment,
        expires_at
    ) VALUES (
        p_name,
        v_prefix,
        v_hash,
        p_owner_id,
        p_scopes,
        p_description,
        p_environment,
        v_expires_at
    )
    RETURNING id INTO v_key_id;

    -- Return the key (this is the only time it's available in plain text)
    RETURN QUERY SELECT v_key_id, v_key, v_prefix;
END;
$$;

-- Function to revoke an API key
CREATE OR REPLACE FUNCTION revoke_api_key(p_key_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE api_keys
    SET revoked_at = NOW()
    WHERE id = p_key_id
      AND owner_id = auth.uid()
      AND revoked_at IS NULL;

    RETURN FOUND;
END;
$$;

-- Function to check API key validity (for use in authentication)
CREATE OR REPLACE FUNCTION check_api_key(p_key_hash TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    key_id UUID,
    owner_id UUID,
    scopes TEXT[],
    rate_limit INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT
        k.id,
        k.owner_id,
        k.scopes,
        k.rate_limit,
        k.expires_at,
        k.revoked_at
    INTO v_record
    FROM api_keys k
    WHERE k.key_hash = p_key_hash;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT[], NULL::INTEGER;
        RETURN;
    END IF;

    -- Check if revoked
    IF v_record.revoked_at IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, v_record.id, v_record.owner_id, v_record.scopes, v_record.rate_limit;
        RETURN;
    END IF;

    -- Check if expired
    IF v_record.expires_at IS NOT NULL AND v_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, v_record.id, v_record.owner_id, v_record.scopes, v_record.rate_limit;
        RETURN;
    END IF;

    -- Valid key
    RETURN QUERY SELECT TRUE, v_record.id, v_record.owner_id, v_record.scopes, v_record.rate_limit;
END;
$$;

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE api_keys IS 'API keys for programmatic access to the platform';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 12 characters of the key for identification in logs';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the full API key - the plain key is never stored';
COMMENT ON COLUMN api_keys.scopes IS 'Permissions granted to this key: read, write, analyze:read, analyze:write, admin, service';
COMMENT ON COLUMN api_keys.rate_limit IS 'Maximum requests per hour for this key';
