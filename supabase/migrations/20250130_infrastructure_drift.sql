-- Infrastructure Drift Table Migration
-- Phase 1, Week 3, Day 5 - DevSecOps Tasks
--
-- Tracks infrastructure drift between Terraform state and actual resources
-- Enables drift detection, severity tracking, and remediation workflow

-- ================================================================
-- ENUMS
-- ================================================================

-- Drift severity levels
CREATE TYPE drift_severity AS ENUM (
  'critical',   -- Immediate remediation required (security-impacting)
  'high',       -- Remediation within 24 hours
  'medium',     -- Remediation within 1 week
  'low',        -- Remediation during next maintenance window
  'info'        -- Informational, no action required
);

-- Drift status
CREATE TYPE drift_status AS ENUM (
  'detected',     -- Drift detected, not yet addressed
  'acknowledged', -- Team is aware, investigating
  'in_progress',  -- Remediation in progress
  'resolved',     -- Drift resolved
  'accepted',     -- Drift accepted as intentional
  'ignored'       -- Drift ignored (with reason)
);

-- Resource types
CREATE TYPE drift_resource_type AS ENUM (
  'vercel_project',
  'vercel_env_var',
  'vercel_domain',
  'vercel_deployment',
  'supabase_project',
  'supabase_function',
  'supabase_storage',
  'supabase_auth',
  'github_repo',
  'github_secret',
  'dns_record',
  'other'
);

-- Drift action types
CREATE TYPE drift_action AS ENUM (
  'create',  -- Resource exists in state but not in cloud
  'update',  -- Resource configuration differs
  'delete',  -- Resource exists in cloud but not in state
  'replace' -- Resource needs to be recreated
);

-- ================================================================
-- MAIN TABLE
-- ================================================================

CREATE TABLE infrastructure_drift (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Detection info
  detection_id VARCHAR(100) NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detection_source VARCHAR(50) NOT NULL DEFAULT 'terraform_plan',

  -- Resource identification
  resource_type drift_resource_type NOT NULL,
  resource_name VARCHAR(255) NOT NULL,
  resource_address VARCHAR(500) NOT NULL,

  -- Drift details
  drift_action drift_action NOT NULL,
  severity drift_severity NOT NULL,
  status drift_status NOT NULL DEFAULT 'detected',

  -- Change details
  attribute_changed VARCHAR(255),
  expected_value TEXT,
  actual_value TEXT,
  full_diff JSONB,

  -- Context
  environment VARCHAR(50) NOT NULL DEFAULT 'production',
  terraform_state_version INTEGER,

  -- Resolution tracking
  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMPTZ,
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMPTZ,
  resolution_method VARCHAR(100),
  resolution_notes TEXT,

  -- Acceptance/Ignore tracking
  accepted_by VARCHAR(255),
  accepted_at TIMESTAMPTZ,
  acceptance_reason TEXT,
  acceptance_expires_at TIMESTAMPTZ,

  -- Risk assessment
  security_impact BOOLEAN DEFAULT false,
  availability_impact BOOLEAN DEFAULT false,
  cost_impact BOOLEAN DEFAULT false,
  estimated_impact_score INTEGER CHECK (estimated_impact_score BETWEEN 0 AND 100),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- INDEXES
-- ================================================================

-- Index for active drift lookup (unresolved items)
CREATE INDEX idx_infrastructure_drift_active
  ON infrastructure_drift(status, severity DESC)
  WHERE status IN ('detected', 'acknowledged', 'in_progress');

-- Index for resource-based queries
CREATE INDEX idx_infrastructure_drift_resource
  ON infrastructure_drift(resource_type, resource_name);

-- Index for environment filtering
CREATE INDEX idx_infrastructure_drift_environment
  ON infrastructure_drift(environment, detected_at DESC);

-- Index for time-based queries
CREATE INDEX idx_infrastructure_drift_detected_at
  ON infrastructure_drift(detected_at DESC);

-- Index for security-impacting drift
CREATE INDEX idx_infrastructure_drift_security
  ON infrastructure_drift(detected_at DESC)
  WHERE security_impact = true AND status IN ('detected', 'acknowledged');

-- Index for detection_id uniqueness check
CREATE UNIQUE INDEX idx_infrastructure_drift_detection_id
  ON infrastructure_drift(detection_id, resource_address)
  WHERE status NOT IN ('resolved', 'ignored');

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_infrastructure_drift_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_infrastructure_drift_updated_at
  BEFORE UPDATE ON infrastructure_drift
  FOR EACH ROW
  EXECUTE FUNCTION update_infrastructure_drift_updated_at();

-- Validate severity based on security impact
CREATE OR REPLACE FUNCTION validate_drift_severity()
RETURNS TRIGGER AS $$
BEGIN
  -- Security-impacting drift should be at least high severity
  IF NEW.security_impact = true AND NEW.severity IN ('low', 'info') THEN
    RAISE NOTICE 'Upgrading severity to high due to security impact';
    NEW.severity = 'high';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_drift_severity
  BEFORE INSERT OR UPDATE ON infrastructure_drift
  FOR EACH ROW
  EXECUTE FUNCTION validate_drift_severity();

-- ================================================================
-- VIEWS
-- ================================================================

-- Active drift summary view
CREATE VIEW v_active_drift AS
SELECT
  id,
  resource_type,
  resource_name,
  resource_address,
  drift_action,
  severity,
  status,
  attribute_changed,
  environment,
  security_impact,
  detected_at,
  EXTRACT(EPOCH FROM (NOW() - detected_at)) / 3600 AS hours_since_detection
FROM infrastructure_drift
WHERE status IN ('detected', 'acknowledged', 'in_progress')
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    WHEN 'info' THEN 5
  END,
  detected_at ASC;

-- Drift by environment summary
CREATE VIEW v_drift_by_environment AS
SELECT
  environment,
  COUNT(*) FILTER (WHERE status IN ('detected', 'acknowledged', 'in_progress')) AS active_count,
  COUNT(*) FILTER (WHERE severity = 'critical' AND status NOT IN ('resolved', 'ignored')) AS critical_count,
  COUNT(*) FILTER (WHERE severity = 'high' AND status NOT IN ('resolved', 'ignored')) AS high_count,
  COUNT(*) FILTER (WHERE security_impact = true AND status NOT IN ('resolved', 'ignored')) AS security_impacting_count,
  MAX(detected_at) AS last_detection,
  AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - detected_at)) / 3600)
    FILTER (WHERE resolved_at IS NOT NULL) AS avg_resolution_hours
FROM infrastructure_drift
GROUP BY environment;

-- Recent drift activity
CREATE VIEW v_recent_drift_activity AS
SELECT
  id,
  resource_type,
  resource_name,
  drift_action,
  severity,
  status,
  detected_at,
  resolved_at,
  resolved_by,
  CASE
    WHEN resolved_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (resolved_at - detected_at)) / 3600
    ELSE NULL
  END AS resolution_hours
FROM infrastructure_drift
ORDER BY COALESCE(resolved_at, detected_at) DESC
LIMIT 50;

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Record new drift detection
CREATE OR REPLACE FUNCTION record_drift(
  p_detection_id VARCHAR(100),
  p_resource_type drift_resource_type,
  p_resource_name VARCHAR(255),
  p_resource_address VARCHAR(500),
  p_drift_action drift_action,
  p_severity drift_severity,
  p_attribute_changed VARCHAR(255) DEFAULT NULL,
  p_expected_value TEXT DEFAULT NULL,
  p_actual_value TEXT DEFAULT NULL,
  p_full_diff JSONB DEFAULT NULL,
  p_environment VARCHAR(50) DEFAULT 'production',
  p_security_impact BOOLEAN DEFAULT false,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS infrastructure_drift AS $$
DECLARE
  v_result infrastructure_drift;
BEGIN
  -- Check if drift already exists and is active
  SELECT * INTO v_result
  FROM infrastructure_drift
  WHERE detection_id = p_detection_id
    AND resource_address = p_resource_address
    AND status NOT IN ('resolved', 'ignored')
  FOR UPDATE;

  IF v_result.id IS NOT NULL THEN
    -- Update existing drift record
    UPDATE infrastructure_drift
    SET
      severity = CASE
        WHEN p_severity::TEXT < severity::TEXT THEN p_severity
        ELSE severity
      END,
      expected_value = p_expected_value,
      actual_value = p_actual_value,
      full_diff = p_full_diff,
      security_impact = p_security_impact OR security_impact,
      metadata = infrastructure_drift.metadata || p_metadata
    WHERE id = v_result.id
    RETURNING * INTO v_result;
  ELSE
    -- Insert new drift record
    INSERT INTO infrastructure_drift (
      detection_id,
      resource_type,
      resource_name,
      resource_address,
      drift_action,
      severity,
      attribute_changed,
      expected_value,
      actual_value,
      full_diff,
      environment,
      security_impact,
      metadata
    ) VALUES (
      p_detection_id,
      p_resource_type,
      p_resource_name,
      p_resource_address,
      p_drift_action,
      p_severity,
      p_attribute_changed,
      p_expected_value,
      p_actual_value,
      p_full_diff,
      p_environment,
      p_security_impact,
      p_metadata
    ) RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Acknowledge drift
CREATE OR REPLACE FUNCTION acknowledge_drift(
  p_drift_id UUID,
  p_acknowledged_by VARCHAR(255)
)
RETURNS infrastructure_drift AS $$
DECLARE
  v_result infrastructure_drift;
BEGIN
  UPDATE infrastructure_drift
  SET
    status = 'acknowledged',
    acknowledged_by = p_acknowledged_by,
    acknowledged_at = NOW()
  WHERE id = p_drift_id
    AND status = 'detected'
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Drift not found or not in detected status';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Resolve drift
CREATE OR REPLACE FUNCTION resolve_drift(
  p_drift_id UUID,
  p_resolved_by VARCHAR(255),
  p_resolution_method VARCHAR(100),
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS infrastructure_drift AS $$
DECLARE
  v_result infrastructure_drift;
BEGIN
  UPDATE infrastructure_drift
  SET
    status = 'resolved',
    resolved_by = p_resolved_by,
    resolved_at = NOW(),
    resolution_method = p_resolution_method,
    resolution_notes = p_resolution_notes
  WHERE id = p_drift_id
    AND status IN ('detected', 'acknowledged', 'in_progress')
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Drift not found or already resolved';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Accept drift as intentional
CREATE OR REPLACE FUNCTION accept_drift(
  p_drift_id UUID,
  p_accepted_by VARCHAR(255),
  p_reason TEXT,
  p_expires_days INTEGER DEFAULT 30
)
RETURNS infrastructure_drift AS $$
DECLARE
  v_result infrastructure_drift;
BEGIN
  UPDATE infrastructure_drift
  SET
    status = 'accepted',
    accepted_by = p_accepted_by,
    accepted_at = NOW(),
    acceptance_reason = p_reason,
    acceptance_expires_at = NOW() + (p_expires_days || ' days')::INTERVAL
  WHERE id = p_drift_id
    AND status IN ('detected', 'acknowledged')
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Drift not found or in invalid status';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Get drift statistics
CREATE OR REPLACE FUNCTION get_drift_statistics(
  p_environment VARCHAR DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_detected BIGINT,
  active_count BIGINT,
  resolved_count BIGINT,
  accepted_count BIGINT,
  avg_resolution_hours NUMERIC,
  critical_count BIGINT,
  security_impacting BIGINT,
  by_resource_type JSONB,
  by_severity JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      d.status,
      d.severity,
      d.resource_type,
      d.security_impact,
      EXTRACT(EPOCH FROM (COALESCE(d.resolved_at, NOW()) - d.detected_at)) / 3600 AS resolution_hours
    FROM infrastructure_drift d
    WHERE d.detected_at >= NOW() - (p_days || ' days')::INTERVAL
      AND (p_environment IS NULL OR d.environment = p_environment)
  )
  SELECT
    COUNT(*)::BIGINT AS total_detected,
    COUNT(*) FILTER (WHERE status IN ('detected', 'acknowledged', 'in_progress'))::BIGINT AS active_count,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT AS resolved_count,
    COUNT(*) FILTER (WHERE status = 'accepted')::BIGINT AS accepted_count,
    ROUND(AVG(resolution_hours) FILTER (WHERE status = 'resolved'), 2) AS avg_resolution_hours,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT AS critical_count,
    COUNT(*) FILTER (WHERE security_impact = true)::BIGINT AS security_impacting,
    jsonb_object_agg(
      resource_type::TEXT,
      (SELECT COUNT(*) FROM stats s2 WHERE s2.resource_type = stats.resource_type)
    ) AS by_resource_type,
    jsonb_object_agg(
      severity::TEXT,
      (SELECT COUNT(*) FROM stats s2 WHERE s2.severity = stats.severity)
    ) AS by_severity
  FROM stats;
END;
$$ LANGUAGE plpgsql;

-- Reactivate expired acceptances
CREATE OR REPLACE FUNCTION expire_drift_acceptances()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE infrastructure_drift
    SET
      status = 'detected',
      metadata = metadata || jsonb_build_object('acceptance_expired', true, 'expired_at', NOW())
    WHERE status = 'accepted'
      AND acceptance_expires_at IS NOT NULL
      AND acceptance_expires_at <= NOW()
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM expired;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE infrastructure_drift ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE POLICY infrastructure_drift_read_policy
  ON infrastructure_drift
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admins to insert/update
CREATE POLICY infrastructure_drift_admin_policy
  ON infrastructure_drift
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'devops', 'security_admin')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'devops', 'security_admin')
  );

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE infrastructure_drift IS
  'Tracks infrastructure drift between Terraform state and actual cloud resources';

COMMENT ON COLUMN infrastructure_drift.detection_id IS
  'Unique identifier for the detection run (e.g., terraform plan run ID)';

COMMENT ON COLUMN infrastructure_drift.resource_address IS
  'Terraform resource address (e.g., vercel_project.main)';

COMMENT ON COLUMN infrastructure_drift.security_impact IS
  'Whether this drift affects security posture';

COMMENT ON COLUMN infrastructure_drift.acceptance_expires_at IS
  'When accepted drift should be re-evaluated';

COMMENT ON FUNCTION record_drift IS
  'Records new drift or updates existing active drift for the same resource';

COMMENT ON FUNCTION get_drift_statistics IS
  'Returns drift statistics for dashboard and reporting';
