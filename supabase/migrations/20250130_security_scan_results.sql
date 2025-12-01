-- Security Scan Results Table Migration
-- Phase 1, Week 3, Day 5 - DevSecOps Tasks
--
-- Stores results from SAST, DAST, and SCA security scans
-- Enables vulnerability tracking, SLA monitoring, and remediation workflow

-- ================================================================
-- ENUMS
-- ================================================================

-- Scan types
CREATE TYPE security_scan_type AS ENUM (
  'sast',           -- Static Application Security Testing
  'dast',           -- Dynamic Application Security Testing
  'sca',            -- Software Composition Analysis
  'secret_scan',    -- Secret/credential detection
  'container_scan', -- Container image scanning
  'iac_scan',       -- Infrastructure as Code scanning
  'license_scan'    -- License compliance scanning
);

-- Finding severity (aligned with CVSS)
CREATE TYPE finding_severity AS ENUM (
  'critical',  -- CVSS 9.0-10.0
  'high',      -- CVSS 7.0-8.9
  'medium',    -- CVSS 4.0-6.9
  'low',       -- CVSS 0.1-3.9
  'info'       -- Informational
);

-- Finding status
CREATE TYPE finding_status AS ENUM (
  'open',            -- New finding, not yet addressed
  'in_progress',     -- Being remediated
  'resolved',        -- Fixed
  'false_positive',  -- Marked as false positive
  'accepted_risk',   -- Risk accepted with justification
  'wont_fix',        -- Will not be fixed (with justification)
  'duplicate'        -- Duplicate of another finding
);

-- Scan status
CREATE TYPE scan_status AS ENUM (
  'running',
  'completed',
  'failed',
  'cancelled'
);

-- ================================================================
-- SCAN RUNS TABLE
-- ================================================================

CREATE TABLE security_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scan identification
  scan_id VARCHAR(100) NOT NULL UNIQUE,
  scan_type security_scan_type NOT NULL,
  scanner_name VARCHAR(100) NOT NULL,
  scanner_version VARCHAR(50),

  -- Target information
  target_type VARCHAR(50) NOT NULL,
  target_identifier VARCHAR(500) NOT NULL,
  target_branch VARCHAR(255),
  target_commit VARCHAR(40),

  -- Scan execution
  status scan_status NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Results summary
  findings_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  info_count INTEGER DEFAULT 0,

  -- Execution context
  triggered_by VARCHAR(100) NOT NULL DEFAULT 'scheduled',
  ci_run_id VARCHAR(100),
  ci_run_url TEXT,

  -- Configuration used
  scan_config JSONB DEFAULT '{}',

  -- Raw output (optional, can be large)
  raw_output_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- FINDINGS TABLE
-- ================================================================

CREATE TABLE security_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to scan
  scan_id UUID NOT NULL REFERENCES security_scans(id) ON DELETE CASCADE,

  -- Finding identification
  finding_id VARCHAR(255) NOT NULL,
  fingerprint VARCHAR(64),

  -- Classification
  severity finding_severity NOT NULL,
  status finding_status NOT NULL DEFAULT 'open',

  -- Finding details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  cwe_id VARCHAR(20),
  owasp_category VARCHAR(50),

  -- Location information
  file_path VARCHAR(1000),
  line_number INTEGER,
  column_number INTEGER,
  code_snippet TEXT,
  endpoint VARCHAR(500),
  parameter VARCHAR(255),

  -- Remediation
  remediation_guidance TEXT,
  remediation_effort VARCHAR(20),

  -- CVSS scoring (if available)
  cvss_score DECIMAL(3, 1) CHECK (cvss_score BETWEEN 0 AND 10),
  cvss_vector VARCHAR(100),

  -- CVE/CWE references
  cve_ids TEXT[],
  references TEXT[],

  -- Resolution tracking
  resolved_by VARCHAR(255),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  false_positive_reason TEXT,
  accepted_risk_reason TEXT,
  accepted_risk_by VARCHAR(255),
  accepted_risk_until TIMESTAMPTZ,

  -- SLA tracking
  sla_due_date TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT false,

  -- Deduplication
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint for deduplication
  UNIQUE (fingerprint, file_path, line_number)
);

-- ================================================================
-- INDEXES
-- ================================================================

-- Scan indexes
CREATE INDEX idx_security_scans_type
  ON security_scans(scan_type, started_at DESC);

CREATE INDEX idx_security_scans_status
  ON security_scans(status);

CREATE INDEX idx_security_scans_target
  ON security_scans(target_type, target_identifier);

-- Finding indexes
CREATE INDEX idx_security_findings_scan
  ON security_findings(scan_id);

CREATE INDEX idx_security_findings_severity
  ON security_findings(severity, status);

CREATE INDEX idx_security_findings_status
  ON security_findings(status)
  WHERE status = 'open';

CREATE INDEX idx_security_findings_sla
  ON security_findings(sla_due_date)
  WHERE status = 'open' AND sla_due_date IS NOT NULL;

CREATE INDEX idx_security_findings_sla_breached
  ON security_findings(severity, created_at)
  WHERE sla_breached = true AND status = 'open';

CREATE INDEX idx_security_findings_fingerprint
  ON security_findings(fingerprint);

CREATE INDEX idx_security_findings_cwe
  ON security_findings(cwe_id)
  WHERE cwe_id IS NOT NULL;

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Auto-update updated_at for scans
CREATE OR REPLACE FUNCTION update_security_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_security_scans_updated_at
  BEFORE UPDATE ON security_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_security_scans_updated_at();

-- Auto-update updated_at for findings
CREATE OR REPLACE FUNCTION update_security_findings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_security_findings_updated_at
  BEFORE UPDATE ON security_findings
  FOR EACH ROW
  EXECUTE FUNCTION update_security_findings_updated_at();

-- Calculate SLA due date based on severity
CREATE OR REPLACE FUNCTION calculate_finding_sla()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_due_date IS NULL THEN
    NEW.sla_due_date := CASE NEW.severity
      WHEN 'critical' THEN NEW.created_at + INTERVAL '24 hours'
      WHEN 'high' THEN NEW.created_at + INTERVAL '7 days'
      WHEN 'medium' THEN NEW.created_at + INTERVAL '30 days'
      WHEN 'low' THEN NEW.created_at + INTERVAL '90 days'
      ELSE NULL
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_finding_sla
  BEFORE INSERT ON security_findings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_finding_sla();

-- Update scan summary counts
CREATE OR REPLACE FUNCTION update_scan_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE security_scans
    SET
      findings_count = (SELECT COUNT(*) FROM security_findings WHERE scan_id = NEW.scan_id),
      critical_count = (SELECT COUNT(*) FROM security_findings WHERE scan_id = NEW.scan_id AND severity = 'critical'),
      high_count = (SELECT COUNT(*) FROM security_findings WHERE scan_id = NEW.scan_id AND severity = 'high'),
      medium_count = (SELECT COUNT(*) FROM security_findings WHERE scan_id = NEW.scan_id AND severity = 'medium'),
      low_count = (SELECT COUNT(*) FROM security_findings WHERE scan_id = NEW.scan_id AND severity = 'low'),
      info_count = (SELECT COUNT(*) FROM security_findings WHERE scan_id = NEW.scan_id AND severity = 'info')
    WHERE id = NEW.scan_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_scan_counts
  AFTER INSERT OR UPDATE ON security_findings
  FOR EACH ROW
  EXECUTE FUNCTION update_scan_counts();

-- ================================================================
-- VIEWS
-- ================================================================

-- Open findings summary
CREATE VIEW v_open_findings_summary AS
SELECT
  severity,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE sla_breached = true) as sla_breached_count,
  MIN(created_at) as oldest_finding,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)::INTEGER as avg_age_days
FROM security_findings
WHERE status = 'open'
GROUP BY severity
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    WHEN 'info' THEN 5
  END;

-- Recent scans
CREATE VIEW v_recent_scans AS
SELECT
  id,
  scan_id,
  scan_type,
  scanner_name,
  target_identifier,
  status,
  started_at,
  completed_at,
  duration_seconds,
  findings_count,
  critical_count,
  high_count,
  triggered_by
FROM security_scans
ORDER BY started_at DESC
LIMIT 50;

-- Findings by CWE
CREATE VIEW v_findings_by_cwe AS
SELECT
  cwe_id,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'open') as open_count,
  MAX(severity) as max_severity,
  MIN(first_seen_at) as first_seen,
  MAX(last_seen_at) as last_seen
FROM security_findings
WHERE cwe_id IS NOT NULL
GROUP BY cwe_id
ORDER BY open_count DESC, total_count DESC;

-- SLA status
CREATE VIEW v_sla_status AS
SELECT
  id,
  finding_id,
  title,
  severity,
  status,
  created_at,
  sla_due_date,
  sla_breached,
  CASE
    WHEN sla_due_date IS NULL THEN NULL
    WHEN NOW() > sla_due_date THEN 0
    ELSE EXTRACT(EPOCH FROM (sla_due_date - NOW())) / 3600
  END AS hours_remaining,
  file_path
FROM security_findings
WHERE status = 'open'
ORDER BY
  sla_breached DESC,
  sla_due_date ASC NULLS LAST;

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Record a new scan
CREATE OR REPLACE FUNCTION start_security_scan(
  p_scan_type security_scan_type,
  p_scanner_name VARCHAR(100),
  p_target_type VARCHAR(50),
  p_target_identifier VARCHAR(500),
  p_triggered_by VARCHAR(100) DEFAULT 'scheduled',
  p_ci_run_id VARCHAR(100) DEFAULT NULL,
  p_scan_config JSONB DEFAULT '{}'
)
RETURNS security_scans AS $$
DECLARE
  v_scan_id VARCHAR(100);
  v_result security_scans;
BEGIN
  -- Generate scan ID
  v_scan_id := UPPER(p_scan_type::TEXT) || '-' ||
               TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' ||
               UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

  INSERT INTO security_scans (
    scan_id,
    scan_type,
    scanner_name,
    target_type,
    target_identifier,
    triggered_by,
    ci_run_id,
    scan_config
  ) VALUES (
    v_scan_id,
    p_scan_type,
    p_scanner_name,
    p_target_type,
    p_target_identifier,
    p_triggered_by,
    p_ci_run_id,
    p_scan_config
  ) RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Complete a scan
CREATE OR REPLACE FUNCTION complete_security_scan(
  p_scan_id UUID,
  p_status scan_status DEFAULT 'completed',
  p_raw_output_url TEXT DEFAULT NULL
)
RETURNS security_scans AS $$
DECLARE
  v_result security_scans;
BEGIN
  UPDATE security_scans
  SET
    status = p_status,
    completed_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    raw_output_url = p_raw_output_url
  WHERE id = p_scan_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Add or update a finding
CREATE OR REPLACE FUNCTION upsert_finding(
  p_scan_id UUID,
  p_finding_id VARCHAR(255),
  p_fingerprint VARCHAR(64),
  p_severity finding_severity,
  p_title VARCHAR(500),
  p_description TEXT DEFAULT NULL,
  p_category VARCHAR(100) DEFAULT NULL,
  p_cwe_id VARCHAR(20) DEFAULT NULL,
  p_file_path VARCHAR(1000) DEFAULT NULL,
  p_line_number INTEGER DEFAULT NULL,
  p_remediation_guidance TEXT DEFAULT NULL,
  p_cvss_score DECIMAL DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS security_findings AS $$
DECLARE
  v_result security_findings;
BEGIN
  -- Try to find existing finding by fingerprint
  SELECT * INTO v_result
  FROM security_findings
  WHERE fingerprint = p_fingerprint
    AND (file_path = p_file_path OR (file_path IS NULL AND p_file_path IS NULL))
    AND (line_number = p_line_number OR (line_number IS NULL AND p_line_number IS NULL))
  FOR UPDATE;

  IF v_result.id IS NOT NULL THEN
    -- Update existing finding
    UPDATE security_findings
    SET
      scan_id = p_scan_id,
      last_seen_at = NOW(),
      occurrence_count = occurrence_count + 1,
      severity = p_severity,
      metadata = security_findings.metadata || p_metadata
    WHERE id = v_result.id
    RETURNING * INTO v_result;
  ELSE
    -- Insert new finding
    INSERT INTO security_findings (
      scan_id,
      finding_id,
      fingerprint,
      severity,
      title,
      description,
      category,
      cwe_id,
      file_path,
      line_number,
      remediation_guidance,
      cvss_score,
      metadata
    ) VALUES (
      p_scan_id,
      p_finding_id,
      p_fingerprint,
      p_severity,
      p_title,
      p_description,
      p_category,
      p_cwe_id,
      p_file_path,
      p_line_number,
      p_remediation_guidance,
      p_cvss_score,
      p_metadata
    ) RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Resolve a finding
CREATE OR REPLACE FUNCTION resolve_finding(
  p_finding_id UUID,
  p_resolved_by VARCHAR(255),
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS security_findings AS $$
DECLARE
  v_result security_findings;
BEGIN
  UPDATE security_findings
  SET
    status = 'resolved',
    resolved_by = p_resolved_by,
    resolved_at = NOW(),
    resolution_notes = p_resolution_notes
  WHERE id = p_finding_id
    AND status = 'open'
  RETURNING * INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Finding not found or not open';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Mark as false positive
CREATE OR REPLACE FUNCTION mark_false_positive(
  p_finding_id UUID,
  p_marked_by VARCHAR(255),
  p_reason TEXT
)
RETURNS security_findings AS $$
DECLARE
  v_result security_findings;
BEGIN
  UPDATE security_findings
  SET
    status = 'false_positive',
    resolved_by = p_marked_by,
    resolved_at = NOW(),
    false_positive_reason = p_reason
  WHERE id = p_finding_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Accept risk
CREATE OR REPLACE FUNCTION accept_finding_risk(
  p_finding_id UUID,
  p_accepted_by VARCHAR(255),
  p_reason TEXT,
  p_valid_days INTEGER DEFAULT 90
)
RETURNS security_findings AS $$
DECLARE
  v_result security_findings;
BEGIN
  UPDATE security_findings
  SET
    status = 'accepted_risk',
    accepted_risk_by = p_accepted_by,
    accepted_risk_reason = p_reason,
    accepted_risk_until = NOW() + (p_valid_days || ' days')::INTERVAL
  WHERE id = p_finding_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Check for SLA breaches
CREATE OR REPLACE FUNCTION check_sla_breaches()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH breached AS (
    UPDATE security_findings
    SET sla_breached = true
    WHERE status = 'open'
      AND sla_due_date IS NOT NULL
      AND sla_due_date < NOW()
      AND sla_breached = false
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_count FROM breached;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Get security scan statistics
CREATE OR REPLACE FUNCTION get_security_statistics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_scans BIGINT,
  total_findings BIGINT,
  open_findings BIGINT,
  sla_breached BIGINT,
  mttr_hours NUMERIC,
  by_severity JSONB,
  by_scan_type JSONB,
  trend JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH scan_stats AS (
    SELECT
      COUNT(DISTINCT s.id)::BIGINT as total_scans,
      COUNT(f.id)::BIGINT as total_findings,
      COUNT(f.id) FILTER (WHERE f.status = 'open')::BIGINT as open_findings,
      COUNT(f.id) FILTER (WHERE f.sla_breached = true AND f.status = 'open')::BIGINT as sla_breached,
      ROUND(AVG(EXTRACT(EPOCH FROM (f.resolved_at - f.created_at)) / 3600)
        FILTER (WHERE f.status = 'resolved'), 2) as mttr_hours
    FROM security_scans s
    LEFT JOIN security_findings f ON f.scan_id = s.id
    WHERE s.started_at >= NOW() - (p_days || ' days')::INTERVAL
  ),
  severity_stats AS (
    SELECT jsonb_object_agg(severity::TEXT, cnt) as by_severity
    FROM (
      SELECT severity, COUNT(*) as cnt
      FROM security_findings
      WHERE status = 'open'
      GROUP BY severity
    ) s
  ),
  type_stats AS (
    SELECT jsonb_object_agg(scan_type::TEXT, cnt) as by_scan_type
    FROM (
      SELECT scan_type, COUNT(*) as cnt
      FROM security_scans
      WHERE started_at >= NOW() - (p_days || ' days')::INTERVAL
      GROUP BY scan_type
    ) t
  ),
  trend_stats AS (
    SELECT jsonb_agg(jsonb_build_object(
      'date', date,
      'new_findings', new_findings,
      'resolved_findings', resolved_findings
    ) ORDER BY date) as trend
    FROM (
      SELECT
        DATE(created_at) as date,
        COUNT(*) as new_findings,
        0 as resolved_findings
      FROM security_findings
      WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
      GROUP BY DATE(created_at)
    ) d
  )
  SELECT
    ss.total_scans,
    ss.total_findings,
    ss.open_findings,
    ss.sla_breached,
    ss.mttr_hours,
    COALESCE(sev.by_severity, '{}'::JSONB),
    COALESCE(typ.by_scan_type, '{}'::JSONB),
    COALESCE(tr.trend, '[]'::JSONB)
  FROM scan_stats ss
  CROSS JOIN severity_stats sev
  CROSS JOIN type_stats typ
  CROSS JOIN trend_stats tr;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE security_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_findings ENABLE ROW LEVEL SECURITY;

-- Scans: read for all authenticated, write for security admins
CREATE POLICY security_scans_read_policy
  ON security_scans
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY security_scans_write_policy
  ON security_scans
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin', 'devops')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin', 'devops')
  );

-- Findings: read for all authenticated, write for security admins
CREATE POLICY security_findings_read_policy
  ON security_findings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY security_findings_write_policy
  ON security_findings
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin', 'devops')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'security_admin', 'devops')
  );

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE security_scans IS
  'Stores security scan execution records (SAST, DAST, SCA, etc.)';

COMMENT ON TABLE security_findings IS
  'Stores individual security findings from scans';

COMMENT ON COLUMN security_findings.fingerprint IS
  'Unique hash for deduplication across scans';

COMMENT ON COLUMN security_findings.sla_due_date IS
  'SLA deadline based on severity: Critical=24h, High=7d, Medium=30d, Low=90d';

COMMENT ON FUNCTION upsert_finding IS
  'Inserts new finding or updates existing one based on fingerprint';
