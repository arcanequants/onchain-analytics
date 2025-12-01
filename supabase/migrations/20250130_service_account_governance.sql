-- ================================================================
-- Service Account Governance Schema
-- CISO Week 4 - Service Account Management and Audit
-- ================================================================

-- ================================================================
-- ENUMS
-- ================================================================

CREATE TYPE service_account_type AS ENUM (
  'api_key',
  'service_role',
  'integration',
  'automation',
  'monitoring',
  'backup',
  'deployment',
  'ci_cd'
);

CREATE TYPE service_account_status AS ENUM (
  'active',
  'inactive',
  'suspended',
  'expired',
  'revoked',
  'pending_review'
);

CREATE TYPE permission_level AS ENUM (
  'read_only',
  'read_write',
  'admin',
  'super_admin'
);

CREATE TYPE rotation_frequency AS ENUM (
  'never',        -- Not recommended
  'yearly',
  'quarterly',
  'monthly',
  'weekly',
  'on_demand'
);

-- ================================================================
-- SERVICE ACCOUNTS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS service_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Account identification
  account_name VARCHAR(255) NOT NULL,
  account_type service_account_type NOT NULL,
  description TEXT,

  -- Owner information
  owner_id UUID REFERENCES auth.users(id),
  owner_team VARCHAR(100),
  owner_email VARCHAR(255) NOT NULL,

  -- Access configuration
  permission_level permission_level NOT NULL DEFAULT 'read_only',
  allowed_scopes TEXT[] DEFAULT '{}',
  allowed_ips CIDR[] DEFAULT '{}',
  allowed_endpoints TEXT[] DEFAULT '{}',

  -- Secret management
  secret_hash VARCHAR(255), -- Hashed secret, never store plaintext
  secret_prefix VARCHAR(10), -- First few chars for identification
  last_secret_rotation TIMESTAMPTZ,
  rotation_frequency rotation_frequency DEFAULT 'quarterly',
  next_rotation_due TIMESTAMPTZ,

  -- Status and lifecycle
  status service_account_status DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,

  -- Risk assessment
  risk_level VARCHAR(20) DEFAULT 'medium',
  sensitive_data_access BOOLEAN DEFAULT false,
  production_access BOOLEAN DEFAULT false,

  -- Compliance
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  compliance_notes TEXT,
  last_review_at TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(account_name)
);

-- ================================================================
-- API KEYS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Key identification
  key_name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL, -- e.g., "pk_live_" or "sk_test_"
  key_hash VARCHAR(255) NOT NULL,

  -- Association
  service_account_id UUID REFERENCES service_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Permissions
  scopes TEXT[] DEFAULT '{}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,

  -- Status
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,

  -- Security
  allowed_origins TEXT[] DEFAULT '{}',
  allowed_ips CIDR[] DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),
  revoke_reason TEXT,

  CHECK (service_account_id IS NOT NULL OR user_id IS NOT NULL)
);

-- ================================================================
-- SERVICE ACCOUNT USAGE LOG
-- ================================================================

CREATE TABLE IF NOT EXISTS service_account_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  service_account_id UUID REFERENCES service_accounts(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,

  -- Request details
  endpoint VARCHAR(500) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_ip INET,
  user_agent TEXT,

  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Metadata
  request_id VARCHAR(100),
  correlation_id VARCHAR(100),

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- SECRET ROTATION LOG
-- ================================================================

CREATE TABLE IF NOT EXISTS secret_rotation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  service_account_id UUID REFERENCES service_accounts(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,

  -- Rotation details
  rotation_type VARCHAR(50) NOT NULL, -- 'scheduled', 'manual', 'security_incident', 'automated'
  old_secret_prefix VARCHAR(10),
  new_secret_prefix VARCHAR(10),

  -- Status
  status VARCHAR(20) DEFAULT 'completed',
  error_message TEXT,

  -- Audit
  rotated_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_by UUID REFERENCES auth.users(id),
  rotation_reason TEXT
);

-- ================================================================
-- SERVICE ACCOUNT REVIEWS
-- ================================================================

CREATE TABLE IF NOT EXISTS service_account_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  service_account_id UUID REFERENCES service_accounts(id) ON DELETE CASCADE,

  -- Review details
  review_type VARCHAR(50) NOT NULL, -- 'periodic', 'security_audit', 'access_request', 'deprovisioning'
  reviewer_id UUID REFERENCES auth.users(id) NOT NULL,

  -- Findings
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'requires_changes', 'revoked'
  risk_assessment VARCHAR(20),
  findings JSONB DEFAULT '{}'::jsonb,
  recommendations TEXT[],

  -- Actions
  actions_required TEXT[],
  actions_completed TEXT[],

  -- Timeline
  review_started_at TIMESTAMPTZ DEFAULT NOW(),
  review_completed_at TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ,

  -- Comments
  reviewer_notes TEXT,
  owner_response TEXT
);

-- ================================================================
-- PERMISSION GRANTS
-- ================================================================

CREATE TABLE IF NOT EXISTS service_account_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  service_account_id UUID REFERENCES service_accounts(id) ON DELETE CASCADE,

  -- Permission details
  resource_type VARCHAR(100) NOT NULL, -- 'table', 'api', 'function', 'service'
  resource_name VARCHAR(255) NOT NULL,
  permission_type VARCHAR(50) NOT NULL, -- 'read', 'write', 'delete', 'execute'

  -- Constraints
  conditions JSONB DEFAULT '{}'::jsonb, -- Time-based, IP-based, etc.
  max_requests_per_day INTEGER,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),

  UNIQUE(service_account_id, resource_type, resource_name, permission_type)
);

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX idx_service_accounts_status ON service_accounts(status);
CREATE INDEX idx_service_accounts_type ON service_accounts(account_type);
CREATE INDEX idx_service_accounts_owner ON service_accounts(owner_id);
CREATE INDEX idx_service_accounts_rotation_due ON service_accounts(next_rotation_due)
  WHERE status = 'active';
CREATE INDEX idx_service_accounts_review_due ON service_accounts(next_review_due)
  WHERE status = 'active';

CREATE INDEX idx_api_keys_service_account ON api_keys(service_account_id);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

CREATE INDEX idx_usage_service_account ON service_account_usage(service_account_id);
CREATE INDEX idx_usage_api_key ON service_account_usage(api_key_id);
CREATE INDEX idx_usage_created ON service_account_usage(created_at DESC);
CREATE INDEX idx_usage_endpoint ON service_account_usage(endpoint);

CREATE INDEX idx_rotation_log_account ON secret_rotation_log(service_account_id);
CREATE INDEX idx_rotation_log_date ON secret_rotation_log(rotated_at DESC);

CREATE INDEX idx_reviews_account ON service_account_reviews(service_account_id);
CREATE INDEX idx_reviews_status ON service_account_reviews(status);

CREATE INDEX idx_permissions_account ON service_account_permissions(service_account_id);
CREATE INDEX idx_permissions_resource ON service_account_permissions(resource_type, resource_name);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Create service account
CREATE OR REPLACE FUNCTION create_service_account(
  p_account_name VARCHAR,
  p_account_type service_account_type,
  p_owner_email VARCHAR,
  p_permission_level permission_level,
  p_description TEXT DEFAULT NULL,
  p_rotation_frequency rotation_frequency DEFAULT 'quarterly',
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_owner_team VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_account_id UUID;
  v_next_rotation TIMESTAMPTZ;
  v_next_review TIMESTAMPTZ;
BEGIN
  -- Calculate rotation dates
  v_next_rotation := CASE p_rotation_frequency
    WHEN 'monthly' THEN NOW() + INTERVAL '30 days'
    WHEN 'quarterly' THEN NOW() + INTERVAL '90 days'
    WHEN 'yearly' THEN NOW() + INTERVAL '365 days'
    WHEN 'weekly' THEN NOW() + INTERVAL '7 days'
    ELSE NULL
  END;

  -- Review due in 6 months for standard accounts
  v_next_review := NOW() + INTERVAL '180 days';

  INSERT INTO service_accounts (
    account_name, account_type, description,
    owner_email, owner_team, permission_level,
    rotation_frequency, next_rotation_due, next_review_due,
    expires_at, created_by
  ) VALUES (
    p_account_name, p_account_type, p_description,
    p_owner_email, p_owner_team, p_permission_level,
    p_rotation_frequency, v_next_rotation, v_next_review,
    p_expires_at, auth.uid()
  ) RETURNING id INTO v_account_id;

  -- Log creation
  INSERT INTO audit_log (
    action, entity_type, entity_id,
    actor_id, details
  ) VALUES (
    'service_account_created', 'service_account', v_account_id,
    auth.uid(), jsonb_build_object(
      'account_name', p_account_name,
      'account_type', p_account_type,
      'permission_level', p_permission_level
    )
  );

  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
  p_service_account_id UUID,
  p_key_name VARCHAR,
  p_scopes TEXT[] DEFAULT '{}',
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(key_id UUID, full_key TEXT, key_prefix_out VARCHAR) AS $$
DECLARE
  v_key_id UUID;
  v_random_bytes BYTEA;
  v_full_key TEXT;
  v_key_prefix VARCHAR(10);
  v_key_hash VARCHAR(255);
  v_account RECORD;
BEGIN
  -- Get service account
  SELECT * INTO v_account
  FROM service_accounts
  WHERE id = p_service_account_id
  AND status = 'active';

  IF v_account IS NULL THEN
    RAISE EXCEPTION 'Service account not found or not active';
  END IF;

  -- Generate random key
  v_random_bytes := gen_random_bytes(32);
  v_key_prefix := CASE v_account.account_type
    WHEN 'api_key' THEN 'pk_'
    WHEN 'service_role' THEN 'sr_'
    WHEN 'integration' THEN 'int_'
    WHEN 'automation' THEN 'auto_'
    ELSE 'svc_'
  END || CASE WHEN v_account.production_access THEN 'live_' ELSE 'test_' END;

  v_full_key := v_key_prefix || encode(v_random_bytes, 'base64');
  v_full_key := replace(replace(v_full_key, '+', '-'), '/', '_');
  v_key_hash := encode(sha256(v_full_key::bytea), 'hex');

  -- Insert API key
  INSERT INTO api_keys (
    key_name, key_prefix, key_hash,
    service_account_id, scopes, expires_at
  ) VALUES (
    p_key_name, v_key_prefix, v_key_hash,
    p_service_account_id, p_scopes, p_expires_at
  ) RETURNING id INTO v_key_id;

  -- Update service account
  UPDATE service_accounts
  SET secret_prefix = v_key_prefix,
      secret_hash = v_key_hash,
      last_secret_rotation = NOW(),
      updated_at = NOW()
  WHERE id = p_service_account_id;

  -- Log key generation
  INSERT INTO secret_rotation_log (
    service_account_id, api_key_id,
    rotation_type, new_secret_prefix,
    rotated_by
  ) VALUES (
    p_service_account_id, v_key_id,
    'initial', v_key_prefix,
    auth.uid()
  );

  RETURN QUERY SELECT v_key_id, v_full_key, v_key_prefix;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Validate API key
CREATE OR REPLACE FUNCTION validate_api_key(
  p_key TEXT,
  p_endpoint VARCHAR DEFAULT NULL,
  p_ip INET DEFAULT NULL
)
RETURNS TABLE(
  is_valid BOOLEAN,
  service_account_id UUID,
  scopes TEXT[],
  rate_limit_remaining INTEGER
) AS $$
DECLARE
  v_key_hash VARCHAR(255);
  v_api_key RECORD;
  v_service_account RECORD;
  v_today_usage INTEGER;
BEGIN
  v_key_hash := encode(sha256(p_key::bytea), 'hex');

  -- Find API key
  SELECT * INTO v_api_key
  FROM api_keys
  WHERE key_hash = v_key_hash;

  IF v_api_key IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT[], 0;
    RETURN;
  END IF;

  -- Check if active
  IF NOT v_api_key.is_active THEN
    RETURN QUERY SELECT false, v_api_key.service_account_id, NULL::TEXT[], 0;
    RETURN;
  END IF;

  -- Check expiration
  IF v_api_key.expires_at IS NOT NULL AND v_api_key.expires_at < NOW() THEN
    RETURN QUERY SELECT false, v_api_key.service_account_id, NULL::TEXT[], 0;
    RETURN;
  END IF;

  -- Get service account
  SELECT * INTO v_service_account
  FROM service_accounts
  WHERE id = v_api_key.service_account_id;

  -- Check service account status
  IF v_service_account.status != 'active' THEN
    RETURN QUERY SELECT false, v_api_key.service_account_id, NULL::TEXT[], 0;
    RETURN;
  END IF;

  -- Check IP restriction
  IF v_api_key.allowed_ips IS NOT NULL
     AND array_length(v_api_key.allowed_ips, 1) > 0
     AND p_ip IS NOT NULL THEN
    IF NOT p_ip <<= ANY(v_api_key.allowed_ips) THEN
      RETURN QUERY SELECT false, v_api_key.service_account_id, NULL::TEXT[], 0;
      RETURN;
    END IF;
  END IF;

  -- Calculate daily usage
  SELECT COUNT(*) INTO v_today_usage
  FROM service_account_usage
  WHERE api_key_id = v_api_key.id
  AND created_at >= CURRENT_DATE;

  -- Update usage stats
  UPDATE api_keys
  SET last_used_at = NOW(),
      usage_count = usage_count + 1
  WHERE id = v_api_key.id;

  UPDATE service_accounts
  SET last_used_at = NOW(),
      usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = v_api_key.service_account_id;

  RETURN QUERY SELECT
    true,
    v_api_key.service_account_id,
    v_api_key.scopes,
    GREATEST(0, v_api_key.rate_limit_per_day - v_today_usage);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rotate secret
CREATE OR REPLACE FUNCTION rotate_service_account_secret(
  p_service_account_id UUID,
  p_rotation_reason TEXT DEFAULT 'scheduled'
)
RETURNS TABLE(new_key TEXT, key_prefix_out VARCHAR) AS $$
DECLARE
  v_result RECORD;
  v_old_prefix VARCHAR;
BEGIN
  -- Get old prefix
  SELECT secret_prefix INTO v_old_prefix
  FROM service_accounts
  WHERE id = p_service_account_id;

  -- Revoke old keys
  UPDATE api_keys
  SET is_active = false,
      revoked_at = NOW(),
      revoked_by = auth.uid(),
      revoke_reason = 'Secret rotation: ' || p_rotation_reason
  WHERE service_account_id = p_service_account_id
  AND is_active = true;

  -- Generate new key
  SELECT * INTO v_result
  FROM generate_api_key(
    p_service_account_id,
    'Rotated key - ' || NOW()::TEXT,
    (SELECT scopes FROM api_keys WHERE service_account_id = p_service_account_id ORDER BY created_at DESC LIMIT 1)
  );

  -- Update rotation schedule
  UPDATE service_accounts
  SET last_secret_rotation = NOW(),
      next_rotation_due = CASE rotation_frequency
        WHEN 'monthly' THEN NOW() + INTERVAL '30 days'
        WHEN 'quarterly' THEN NOW() + INTERVAL '90 days'
        WHEN 'yearly' THEN NOW() + INTERVAL '365 days'
        WHEN 'weekly' THEN NOW() + INTERVAL '7 days'
        ELSE next_rotation_due
      END,
      updated_at = NOW()
  WHERE id = p_service_account_id;

  -- Log rotation
  INSERT INTO secret_rotation_log (
    service_account_id,
    rotation_type, old_secret_prefix, new_secret_prefix,
    rotated_by, rotation_reason
  ) VALUES (
    p_service_account_id,
    'scheduled', v_old_prefix, v_result.key_prefix_out,
    auth.uid(), p_rotation_reason
  );

  RETURN QUERY SELECT v_result.full_key, v_result.key_prefix_out;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get accounts needing rotation
CREATE OR REPLACE FUNCTION get_accounts_needing_rotation()
RETURNS TABLE(
  account_id UUID,
  account_name VARCHAR,
  owner_email VARCHAR,
  days_overdue INTEGER,
  last_rotation TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.account_name,
    sa.owner_email,
    EXTRACT(DAY FROM NOW() - sa.next_rotation_due)::INTEGER,
    sa.last_secret_rotation
  FROM service_accounts sa
  WHERE sa.status = 'active'
  AND sa.next_rotation_due IS NOT NULL
  AND sa.next_rotation_due <= NOW()
  ORDER BY sa.next_rotation_due ASC;
END;
$$ LANGUAGE plpgsql;

-- Get accounts needing review
CREATE OR REPLACE FUNCTION get_accounts_needing_review()
RETURNS TABLE(
  account_id UUID,
  account_name VARCHAR,
  owner_email VARCHAR,
  days_overdue INTEGER,
  last_review TIMESTAMPTZ,
  risk_level VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.account_name,
    sa.owner_email,
    EXTRACT(DAY FROM NOW() - sa.next_review_due)::INTEGER,
    sa.last_review_at,
    sa.risk_level
  FROM service_accounts sa
  WHERE sa.status = 'active'
  AND sa.next_review_due IS NOT NULL
  AND sa.next_review_due <= NOW()
  ORDER BY sa.next_review_due ASC;
END;
$$ LANGUAGE plpgsql;

-- Suspend inactive accounts
CREATE OR REPLACE FUNCTION suspend_inactive_accounts(
  p_inactive_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE service_accounts
  SET status = 'suspended',
      updated_at = NOW()
  WHERE status = 'active'
  AND (
    last_used_at IS NULL
    OR last_used_at < NOW() - (p_inactive_days || ' days')::INTERVAL
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log suspensions
  INSERT INTO audit_log (
    action, entity_type, actor_id, details
  )
  SELECT
    'service_account_suspended',
    'service_account',
    NULL, -- System action
    jsonb_build_object(
      'account_id', id,
      'account_name', account_name,
      'reason', 'Inactive for ' || p_inactive_days || ' days'
    )
  FROM service_accounts
  WHERE status = 'suspended'
  AND updated_at >= NOW() - INTERVAL '1 minute';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- VIEWS
-- ================================================================

-- Service account dashboard view
CREATE OR REPLACE VIEW service_account_dashboard AS
SELECT
  sa.id,
  sa.account_name,
  sa.account_type,
  sa.status,
  sa.permission_level,
  sa.owner_email,
  sa.owner_team,
  sa.last_used_at,
  sa.usage_count,
  sa.risk_level,
  sa.production_access,
  sa.sensitive_data_access,
  CASE
    WHEN sa.next_rotation_due < NOW() THEN 'overdue'
    WHEN sa.next_rotation_due < NOW() + INTERVAL '7 days' THEN 'due_soon'
    ELSE 'ok'
  END AS rotation_status,
  CASE
    WHEN sa.next_review_due < NOW() THEN 'overdue'
    WHEN sa.next_review_due < NOW() + INTERVAL '30 days' THEN 'due_soon'
    ELSE 'ok'
  END AS review_status,
  (SELECT COUNT(*) FROM api_keys WHERE service_account_id = sa.id AND is_active = true) AS active_keys
FROM service_accounts sa;

-- ================================================================
-- RLS POLICIES
-- ================================================================

ALTER TABLE service_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_account_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_rotation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_account_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_account_permissions ENABLE ROW LEVEL SECURITY;

-- Admin/Security team access
CREATE POLICY admin_service_accounts ON service_accounts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'security', 'ciso')
    )
  );

-- Owners can view their accounts
CREATE POLICY owner_view_service_accounts ON service_accounts
  FOR SELECT
  USING (owner_id = auth.uid());

-- API keys - similar policies
CREATE POLICY admin_api_keys ON api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'security', 'ciso')
    )
  );

CREATE POLICY user_own_api_keys ON api_keys
  FOR SELECT
  USING (user_id = auth.uid());

-- Usage logs - read only for admins
CREATE POLICY admin_read_usage ON service_account_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'security', 'ciso', 'auditor')
    )
  );

-- Rotation log - admin only
CREATE POLICY admin_rotation_log ON secret_rotation_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'security', 'ciso')
    )
  );

-- Reviews - admin and reviewers
CREATE POLICY admin_reviews ON service_account_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'security', 'ciso')
    )
    OR reviewer_id = auth.uid()
  );

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Update timestamps
CREATE TRIGGER update_service_accounts_timestamp
  BEFORE UPDATE ON service_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE service_accounts IS
  'Registry of all service accounts and their configurations';

COMMENT ON TABLE api_keys IS
  'API keys associated with service accounts or users';

COMMENT ON TABLE service_account_usage IS
  'Usage log for service account activity monitoring';

COMMENT ON TABLE secret_rotation_log IS
  'Audit trail of all secret rotations';

COMMENT ON TABLE service_account_reviews IS
  'Periodic review records for service accounts';

COMMENT ON FUNCTION validate_api_key IS
  'Validate API key and return permissions, updates usage stats';

COMMENT ON FUNCTION rotate_service_account_secret IS
  'Rotate service account secret and revoke old keys';
