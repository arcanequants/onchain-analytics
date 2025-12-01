-- Kill Switch Events Table Migration
-- Phase 1, Week 3, Day 5 - Governance Tasks
--
-- Stores kill switch activation/deactivation events for audit trail

-- ================================================================
-- ENUMS
-- ================================================================

-- Kill switch scope types
CREATE TYPE kill_switch_scope AS ENUM (
  'global',
  'agent',
  'domain',
  'client',
  'feature'
);

-- Kill switch reasons
CREATE TYPE kill_switch_reason AS ENUM (
  'safety_concern',
  'performance_degradation',
  'security_incident',
  'regulatory_compliance',
  'user_request',
  'scheduled_maintenance',
  'anomaly_detected',
  'manual_override',
  'test_mode'
);

-- Kill switch status
CREATE TYPE kill_switch_status AS ENUM (
  'active',
  'inactive',
  'pending',
  'expired'
);

-- ================================================================
-- MAIN TABLE
-- ================================================================

CREATE TABLE kill_switch_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event identification
  event_code VARCHAR(50) NOT NULL UNIQUE,

  -- Scope information
  scope kill_switch_scope NOT NULL,
  scope_target VARCHAR(255),

  -- Event details
  reason kill_switch_reason NOT NULL,
  status kill_switch_status NOT NULL DEFAULT 'pending',
  description TEXT NOT NULL,

  -- Activation info
  activated_by VARCHAR(255) NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Deactivation info
  deactivated_by VARCHAR(255),
  deactivated_at TIMESTAMPTZ,

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Approval workflow
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by VARCHAR(255),
  approved_at TIMESTAMPTZ,
  rejected_by VARCHAR(255),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Affected operations
  affected_operations TEXT[] DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================

-- Index for active events lookup
CREATE INDEX idx_kill_switch_events_status
  ON kill_switch_events(status);

-- Index for scope-based queries
CREATE INDEX idx_kill_switch_events_scope
  ON kill_switch_events(scope, scope_target);

-- Index for time-based queries
CREATE INDEX idx_kill_switch_events_activated_at
  ON kill_switch_events(activated_at DESC);

-- Index for expiring events
CREATE INDEX idx_kill_switch_events_expires_at
  ON kill_switch_events(expires_at)
  WHERE status = 'active' AND expires_at IS NOT NULL;

-- Index for pending approvals
CREATE INDEX idx_kill_switch_events_pending
  ON kill_switch_events(scope, created_at DESC)
  WHERE status = 'pending';

-- Index for global events (most critical)
CREATE INDEX idx_kill_switch_events_global
  ON kill_switch_events(activated_at DESC)
  WHERE scope = 'global';

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_kill_switch_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kill_switch_events_updated_at
  BEFORE UPDATE ON kill_switch_events
  FOR EACH ROW
  EXECUTE FUNCTION update_kill_switch_events_updated_at();

-- Validate status transitions
CREATE OR REPLACE FUNCTION validate_kill_switch_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow valid transitions
  IF OLD.status = 'active' AND NEW.status NOT IN ('inactive', 'expired') THEN
    RAISE EXCEPTION 'Invalid status transition from active to %', NEW.status;
  END IF;

  IF OLD.status = 'pending' AND NEW.status NOT IN ('active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status transition from pending to %', NEW.status;
  END IF;

  IF OLD.status = 'inactive' AND NEW.status != 'inactive' THEN
    RAISE EXCEPTION 'Cannot change status of inactive event';
  END IF;

  IF OLD.status = 'expired' AND NEW.status != 'expired' THEN
    RAISE EXCEPTION 'Cannot change status of expired event';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_kill_switch_status_validation
  BEFORE UPDATE ON kill_switch_events
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_kill_switch_status_transition();

-- ================================================================
-- VIEWS
-- ================================================================

-- Active kill switches view
CREATE VIEW v_active_kill_switches AS
SELECT
  id,
  event_code,
  scope,
  scope_target,
  reason,
  description,
  activated_by,
  activated_at,
  expires_at,
  CASE
    WHEN expires_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (expires_at - NOW())) / 60
    ELSE NULL
  END AS minutes_remaining,
  affected_operations,
  metadata
FROM kill_switch_events
WHERE status = 'active'
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY
  CASE scope
    WHEN 'global' THEN 1
    WHEN 'agent' THEN 2
    WHEN 'domain' THEN 3
    WHEN 'client' THEN 4
    WHEN 'feature' THEN 5
  END,
  activated_at DESC;

-- Pending approvals view
CREATE VIEW v_pending_kill_switch_approvals AS
SELECT
  id,
  event_code,
  scope,
  scope_target,
  reason,
  description,
  activated_by AS requested_by,
  created_at AS requested_at,
  metadata
FROM kill_switch_events
WHERE status = 'pending'
ORDER BY
  CASE scope
    WHEN 'global' THEN 1
    WHEN 'client' THEN 2
    ELSE 3
  END,
  created_at ASC;

-- Recent events view (for audit)
CREATE VIEW v_recent_kill_switch_events AS
SELECT
  id,
  event_code,
  scope,
  scope_target,
  reason,
  status,
  description,
  activated_by,
  activated_at,
  deactivated_by,
  deactivated_at,
  CASE
    WHEN deactivated_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (deactivated_at - activated_at)) / 60
    ELSE NULL
  END AS duration_minutes,
  metadata
FROM kill_switch_events
ORDER BY COALESCE(deactivated_at, activated_at) DESC
LIMIT 100;

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Check if system is globally halted
CREATE OR REPLACE FUNCTION is_system_halted()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM kill_switch_events
    WHERE scope = 'global'
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Check if specific scope/target is halted
CREATE OR REPLACE FUNCTION is_scope_halted(
  p_scope kill_switch_scope,
  p_target VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check global first
  IF is_system_halted() THEN
    RETURN TRUE;
  END IF;

  -- Check specific scope
  RETURN EXISTS (
    SELECT 1 FROM kill_switch_events
    WHERE scope = p_scope
      AND (scope_target = p_target OR scope_target = '*')
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Activate kill switch
CREATE OR REPLACE FUNCTION activate_kill_switch(
  p_scope kill_switch_scope,
  p_scope_target VARCHAR,
  p_reason kill_switch_reason,
  p_description TEXT,
  p_activated_by VARCHAR,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS kill_switch_events AS $$
DECLARE
  v_event_code VARCHAR(50);
  v_expires_at TIMESTAMPTZ;
  v_requires_approval BOOLEAN;
  v_status kill_switch_status;
  v_result kill_switch_events;
BEGIN
  -- Generate event code
  v_event_code := 'KS-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' ||
                  UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));

  -- Calculate expiration
  IF p_duration_minutes IS NOT NULL THEN
    v_expires_at := NOW() + (p_duration_minutes || ' minutes')::INTERVAL;
  END IF;

  -- Determine if approval is required
  v_requires_approval := (p_scope IN ('global', 'client'));
  v_status := CASE WHEN v_requires_approval THEN 'pending' ELSE 'active' END;

  -- Insert event
  INSERT INTO kill_switch_events (
    event_code,
    scope,
    scope_target,
    reason,
    status,
    description,
    activated_by,
    expires_at,
    requires_approval,
    affected_operations,
    metadata
  ) VALUES (
    v_event_code,
    p_scope,
    p_scope_target,
    p_reason,
    v_status,
    p_description,
    p_activated_by,
    v_expires_at,
    v_requires_approval,
    CASE p_scope
      WHEN 'global' THEN ARRAY['*']
      ELSE ARRAY[p_scope::TEXT || ':' || COALESCE(p_scope_target, '*')]
    END,
    p_metadata
  ) RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Approve kill switch
CREATE OR REPLACE FUNCTION approve_kill_switch(
  p_event_id UUID,
  p_approver VARCHAR
)
RETURNS kill_switch_events AS $$
DECLARE
  v_result kill_switch_events;
BEGIN
  UPDATE kill_switch_events
  SET
    status = 'active',
    approved_by = p_approver,
    approved_at = NOW(),
    activated_at = NOW()
  WHERE id = p_event_id
    AND status = 'pending'
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Event not found or not pending';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Reject kill switch
CREATE OR REPLACE FUNCTION reject_kill_switch(
  p_event_id UUID,
  p_rejector VARCHAR,
  p_reason TEXT
)
RETURNS kill_switch_events AS $$
DECLARE
  v_result kill_switch_events;
BEGIN
  UPDATE kill_switch_events
  SET
    status = 'inactive',
    rejected_by = p_rejector,
    rejected_at = NOW(),
    rejection_reason = p_reason,
    deactivated_at = NOW(),
    deactivated_by = p_rejector
  WHERE id = p_event_id
    AND status = 'pending'
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Event not found or not pending';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Deactivate kill switch
CREATE OR REPLACE FUNCTION deactivate_kill_switch(
  p_event_id UUID,
  p_deactivator VARCHAR,
  p_reason TEXT DEFAULT NULL
)
RETURNS kill_switch_events AS $$
DECLARE
  v_result kill_switch_events;
BEGIN
  UPDATE kill_switch_events
  SET
    status = 'inactive',
    deactivated_by = p_deactivator,
    deactivated_at = NOW(),
    metadata = metadata || jsonb_build_object('deactivation_reason', p_reason)
  WHERE id = p_event_id
    AND status = 'active'
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Event not found or not active';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Expire old events
CREATE OR REPLACE FUNCTION expire_kill_switch_events()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE kill_switch_events
    SET
      status = 'expired',
      deactivated_at = NOW(),
      metadata = metadata || jsonb_build_object('expired_automatically', true)
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Get kill switch statistics
CREATE OR REPLACE FUNCTION get_kill_switch_statistics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_events BIGINT,
  active_count BIGINT,
  pending_count BIGINT,
  expired_count BIGINT,
  deactivated_count BIGINT,
  avg_duration_minutes NUMERIC,
  by_scope JSONB,
  by_reason JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      k.status,
      k.scope,
      k.reason,
      EXTRACT(EPOCH FROM (
        COALESCE(k.deactivated_at, NOW()) - k.activated_at
      )) / 60 AS duration_minutes
    FROM kill_switch_events k
    WHERE k.created_at >= NOW() - (p_days || ' days')::INTERVAL
  )
  SELECT
    COUNT(*)::BIGINT AS total_events,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_count,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_count,
    COUNT(*) FILTER (WHERE status = 'expired')::BIGINT AS expired_count,
    COUNT(*) FILTER (WHERE status = 'inactive')::BIGINT AS deactivated_count,
    ROUND(AVG(duration_minutes), 2) AS avg_duration_minutes,
    jsonb_object_agg(
      scope::TEXT,
      (SELECT COUNT(*) FROM stats s2 WHERE s2.scope = stats.scope)
    ) AS by_scope,
    jsonb_object_agg(
      reason::TEXT,
      (SELECT COUNT(*) FROM stats s2 WHERE s2.reason = stats.reason)
    ) AS by_reason
  FROM stats;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE kill_switch_events ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE POLICY kill_switch_events_read_policy
  ON kill_switch_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to insert/update
CREATE POLICY kill_switch_events_admin_policy
  ON kill_switch_events
  FOR ALL
  TO authenticated
  USING (
    -- Check if user is admin via metadata or claims
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin')
  );

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE kill_switch_events IS
  'Audit trail for AI system kill switch activations and deactivations';

COMMENT ON COLUMN kill_switch_events.scope IS
  'The scope of the kill switch (global, agent, domain, client, feature)';

COMMENT ON COLUMN kill_switch_events.scope_target IS
  'Specific target within scope (e.g., agent ID, domain name)';

COMMENT ON COLUMN kill_switch_events.reason IS
  'Reason for kill switch activation';

COMMENT ON COLUMN kill_switch_events.affected_operations IS
  'List of operations affected by this kill switch';

COMMENT ON FUNCTION is_system_halted() IS
  'Returns true if there is an active global kill switch';

COMMENT ON FUNCTION is_scope_halted(kill_switch_scope, VARCHAR) IS
  'Returns true if the given scope/target is halted (includes global check)';
