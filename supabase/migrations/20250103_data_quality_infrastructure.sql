-- ============================================================================
-- Data Quality Infrastructure Migration
-- Phase 4, Week 8 Extended - Semantic Audit Checklist
--
-- This migration creates tables and functions for comprehensive data quality
-- monitoring, including rules definition, results tracking, and orphan detection.
-- ============================================================================

-- ============================================================================
-- 1. DATA QUALITY RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_quality_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule identification
  rule_name VARCHAR(100) NOT NULL UNIQUE,
  rule_code VARCHAR(50) NOT NULL UNIQUE,  -- Short code like DQ001, DQ002
  description TEXT NOT NULL,

  -- Rule configuration
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
    'completeness',      -- Non-null checks
    'validity',          -- Range/format checks
    'consistency',       -- Cross-field checks
    'uniqueness',        -- Duplicate checks
    'timeliness',        -- Freshness checks
    'integrity',         -- FK/relationship checks
    'accuracy',          -- Value correctness
    'conformity'         -- Format/pattern checks
  )),

  -- Target specification
  target_table VARCHAR(100) NOT NULL,
  target_column VARCHAR(100),  -- NULL for table-level rules

  -- Rule definition
  check_query TEXT NOT NULL,  -- SQL query that returns violating rows
  expected_result VARCHAR(20) DEFAULT 'zero_rows',  -- 'zero_rows', 'non_empty', 'threshold'
  threshold_value DECIMAL(10,2),  -- For percentage-based rules

  -- Severity and handling
  severity VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (severity IN (
    'critical',   -- Must be 0 violations, blocks deployment
    'error',      -- Should be 0, generates alert
    'warning',    -- Should minimize, logged
    'info'        -- Informational only
  )),

  -- Alerting
  alert_on_failure BOOLEAN DEFAULT true,
  alert_channels JSONB DEFAULT '["email"]'::jsonb,

  -- Scheduling
  check_frequency VARCHAR(20) DEFAULT 'hourly' CHECK (check_frequency IN (
    'realtime',    -- On every insert/update
    'minutely',    -- Every minute
    'hourly',      -- Every hour
    'daily',       -- Once per day
    'weekly'       -- Once per week
  )),

  -- Status
  is_enabled BOOLEAN DEFAULT true,
  last_check_at TIMESTAMPTZ,
  last_status VARCHAR(20),
  consecutive_failures INTEGER DEFAULT 0,

  -- Metadata
  category VARCHAR(50),  -- Logical grouping
  owner VARCHAR(100),    -- Responsible team/person
  documentation_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dq_rules_table ON data_quality_rules(target_table);
CREATE INDEX idx_dq_rules_type ON data_quality_rules(rule_type);
CREATE INDEX idx_dq_rules_severity ON data_quality_rules(severity);
CREATE INDEX idx_dq_rules_enabled ON data_quality_rules(is_enabled);
CREATE INDEX idx_dq_rules_frequency ON data_quality_rules(check_frequency);

-- ============================================================================
-- 2. DATA QUALITY RESULTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_quality_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule reference
  rule_id UUID NOT NULL REFERENCES data_quality_rules(id) ON DELETE CASCADE,
  rule_code VARCHAR(50) NOT NULL,

  -- Execution details
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  execution_duration_ms INTEGER,

  -- Results
  status VARCHAR(20) NOT NULL CHECK (status IN (
    'pass',      -- Rule passed
    'fail',      -- Rule failed
    'error',     -- Error during execution
    'skipped'    -- Rule was skipped
  )),

  -- Metrics
  rows_checked INTEGER,
  rows_violated INTEGER DEFAULT 0,
  violation_percentage DECIMAL(5,2),

  -- Details
  sample_violations JSONB,  -- Sample of violating rows (max 10)
  error_message TEXT,

  -- Context
  check_context JSONB DEFAULT '{}'::jsonb,  -- Additional context

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_dq_results_rule ON data_quality_results(rule_id);
CREATE INDEX idx_dq_results_executed ON data_quality_results(executed_at);
CREATE INDEX idx_dq_results_status ON data_quality_results(status);
CREATE INDEX idx_dq_results_rule_code ON data_quality_results(rule_code);

-- Partition by month for efficient cleanup
-- (In production, consider partitioning this table)

-- ============================================================================
-- 3. ORPHAN DETECTION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS orphan_detection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scan details
  scan_id UUID NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  scan_type VARCHAR(50) DEFAULT 'scheduled' CHECK (scan_type IN (
    'scheduled',   -- Regular weekly scan
    'manual',      -- Manual trigger
    'pre_deploy',  -- Before deployment
    'post_deploy'  -- After deployment
  )),

  -- Target
  source_table VARCHAR(100) NOT NULL,
  source_column VARCHAR(100) NOT NULL,
  target_table VARCHAR(100) NOT NULL,
  target_column VARCHAR(100) NOT NULL,

  -- Results
  orphan_count INTEGER NOT NULL DEFAULT 0,
  sample_orphan_ids JSONB,  -- Sample of orphan IDs (max 100)

  -- Resolution
  resolution_action VARCHAR(50) CHECK (resolution_action IN (
    'none',        -- No action taken
    'notified',    -- Team notified
    'quarantined', -- Moved to quarantine table
    'deleted',     -- Soft deleted
    'fixed'        -- FK restored
  )),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,

  -- Metadata
  scan_duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orphan_scan ON orphan_detection_log(scan_id);
CREATE INDEX idx_orphan_scanned_at ON orphan_detection_log(scanned_at);
CREATE INDEX idx_orphan_source ON orphan_detection_log(source_table, source_column);
CREATE INDEX idx_orphan_count ON orphan_detection_log(orphan_count) WHERE orphan_count > 0;

-- ============================================================================
-- 4. SCHEMA MIGRATIONS AUDIT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Migration identification
  migration_name VARCHAR(255) NOT NULL,
  migration_version VARCHAR(50),
  checksum VARCHAR(64),

  -- Execution details
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  executed_by VARCHAR(100),
  execution_duration_ms INTEGER,

  -- Status
  status VARCHAR(20) NOT NULL CHECK (status IN (
    'pending',     -- Queued for execution
    'running',     -- Currently executing
    'completed',   -- Successfully completed
    'failed',      -- Execution failed
    'rolled_back'  -- Was rolled back
  )),

  -- Content tracking
  migration_sql_hash VARCHAR(64),
  rollback_sql_hash VARCHAR(64),
  has_rollback BOOLEAN DEFAULT false,

  -- Backward compatibility
  is_backward_compatible BOOLEAN,
  breaking_changes JSONB,  -- List of breaking changes if any

  -- Environment
  environment VARCHAR(50) DEFAULT 'production',
  database_version VARCHAR(50),

  -- Error handling
  error_message TEXT,
  error_details JSONB,

  -- Review
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Metadata
  affected_tables JSONB,
  estimated_rows_affected INTEGER,
  actual_rows_affected INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_migrations_name ON schema_migrations_audit(migration_name);
CREATE INDEX idx_migrations_version ON schema_migrations_audit(migration_version);
CREATE INDEX idx_migrations_executed ON schema_migrations_audit(executed_at);
CREATE INDEX idx_migrations_status ON schema_migrations_audit(status);
CREATE INDEX idx_migrations_env ON schema_migrations_audit(environment);

-- ============================================================================
-- 5. INSERT DEFAULT DATA QUALITY RULES (20+ rules)
-- ============================================================================

INSERT INTO data_quality_rules (
  rule_code, rule_name, description, rule_type, target_table, target_column,
  check_query, severity, check_frequency, category
) VALUES

-- ============================================================================
-- COMPLETENESS RULES
-- ============================================================================

('DQ001', 'user_profiles_email_required',
 'All user profiles must have an email address',
 'completeness', 'user_profiles', 'email',
 'SELECT id FROM user_profiles WHERE email IS NULL OR email = ''''',
 'critical', 'hourly', 'users'),

('DQ002', 'analyses_url_required',
 'All analyses must have a URL',
 'completeness', 'analyses', 'url',
 'SELECT id FROM analyses WHERE url IS NULL OR url = ''''',
 'critical', 'hourly', 'analyses'),

('DQ003', 'ai_responses_content_required',
 'All AI responses must have content',
 'completeness', 'ai_responses', 'content',
 'SELECT id FROM ai_responses WHERE content IS NULL',
 'error', 'hourly', 'ai'),

('DQ004', 'recommendations_text_required',
 'All recommendations must have text',
 'completeness', 'recommendations', 'recommendation_text',
 'SELECT id FROM recommendations WHERE recommendation_text IS NULL OR recommendation_text = ''''',
 'error', 'hourly', 'recommendations'),

-- ============================================================================
-- VALIDITY RULES (Range/Format checks)
-- ============================================================================

('DQ005', 'perception_score_range',
 'Perception scores must be between 0 and 100',
 'validity', 'analyses', 'perception_score',
 'SELECT id FROM analyses WHERE perception_score < 0 OR perception_score > 100',
 'critical', 'hourly', 'scores'),

('DQ006', 'confidence_score_range',
 'Confidence scores must be between 0.0 and 1.0',
 'validity', 'ai_responses', 'confidence',
 'SELECT id FROM ai_responses WHERE confidence < 0 OR confidence > 1',
 'error', 'hourly', 'scores'),

('DQ007', 'cost_non_negative',
 'Cost values must be non-negative',
 'validity', 'ai_responses', 'cost_usd',
 'SELECT id FROM ai_responses WHERE cost_usd < 0',
 'error', 'hourly', 'costs'),

('DQ008', 'token_count_non_negative',
 'Token counts must be non-negative',
 'validity', 'ai_responses', 'tokens_used',
 'SELECT id FROM ai_responses WHERE tokens_used < 0',
 'warning', 'daily', 'usage'),

('DQ009', 'email_format_valid',
 'Email addresses must have valid format',
 'validity', 'user_profiles', 'email',
 'SELECT id FROM user_profiles WHERE email IS NOT NULL AND email !~ ''^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$''',
 'warning', 'daily', 'users'),

('DQ010', 'url_format_valid',
 'URLs must have valid format',
 'validity', 'analyses', 'url',
 'SELECT id FROM analyses WHERE url IS NOT NULL AND url !~ ''^https?://''',
 'warning', 'daily', 'analyses'),

-- ============================================================================
-- CONSISTENCY RULES (Cross-field checks)
-- ============================================================================

('DQ011', 'completed_at_after_created_at',
 'Completion time must be after creation time',
 'consistency', 'analyses', NULL,
 'SELECT id FROM analyses WHERE completed_at IS NOT NULL AND completed_at < created_at',
 'error', 'hourly', 'temporal'),

('DQ012', 'updated_at_after_created_at',
 'Update time must be after or equal to creation time',
 'consistency', 'user_profiles', NULL,
 'SELECT id FROM user_profiles WHERE updated_at < created_at',
 'warning', 'daily', 'temporal'),

('DQ013', 'response_time_positive',
 'Response duration must be positive when completed',
 'consistency', 'ai_responses', NULL,
 'SELECT id FROM ai_responses WHERE response_time_ms IS NOT NULL AND response_time_ms <= 0',
 'warning', 'daily', 'performance'),

-- ============================================================================
-- UNIQUENESS RULES
-- ============================================================================

('DQ014', 'user_email_unique',
 'User emails must be unique',
 'uniqueness', 'user_profiles', 'email',
 'SELECT email, COUNT(*) as cnt FROM user_profiles WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1',
 'critical', 'hourly', 'users'),

('DQ015', 'api_key_unique',
 'API keys must be unique',
 'uniqueness', 'api_keys', 'key_hash',
 'SELECT key_hash, COUNT(*) as cnt FROM api_keys WHERE key_hash IS NOT NULL GROUP BY key_hash HAVING COUNT(*) > 1',
 'critical', 'hourly', 'security'),

-- ============================================================================
-- TIMELINESS RULES (Freshness checks)
-- ============================================================================

('DQ016', 'stale_pending_analyses',
 'Pending analyses older than 1 hour may be stuck',
 'timeliness', 'analyses', NULL,
 'SELECT id FROM analyses WHERE status = ''pending'' AND created_at < NOW() - INTERVAL ''1 hour''',
 'warning', 'hourly', 'operations'),

('DQ017', 'stale_processing_analyses',
 'Processing analyses older than 10 minutes may be stuck',
 'timeliness', 'analyses', NULL,
 'SELECT id FROM analyses WHERE status = ''processing'' AND updated_at < NOW() - INTERVAL ''10 minutes''',
 'error', 'minutely', 'operations'),

('DQ018', 'old_unverified_users',
 'Users unverified after 7 days should be reviewed',
 'timeliness', 'user_profiles', NULL,
 'SELECT id FROM user_profiles WHERE email_verified = false AND created_at < NOW() - INTERVAL ''7 days''',
 'info', 'daily', 'users'),

-- ============================================================================
-- INTEGRITY RULES (Relationship checks)
-- ============================================================================

('DQ019', 'orphan_ai_responses',
 'AI responses must belong to existing analyses',
 'integrity', 'ai_responses', 'analysis_id',
 'SELECT ar.id FROM ai_responses ar LEFT JOIN analyses a ON ar.analysis_id = a.id WHERE a.id IS NULL',
 'error', 'hourly', 'integrity'),

('DQ020', 'orphan_recommendations',
 'Recommendations must belong to existing analyses',
 'integrity', 'recommendations', 'analysis_id',
 'SELECT r.id FROM recommendations r LEFT JOIN analyses a ON r.analysis_id = a.id WHERE a.id IS NULL',
 'error', 'hourly', 'integrity'),

('DQ021', 'orphan_user_feedback',
 'User feedback must belong to existing users',
 'integrity', 'user_feedback', 'user_id',
 'SELECT uf.id FROM user_feedback uf LEFT JOIN user_profiles up ON uf.user_id = up.user_id WHERE up.user_id IS NULL AND uf.user_id IS NOT NULL',
 'warning', 'daily', 'integrity'),

-- ============================================================================
-- ACCURACY RULES
-- ============================================================================

('DQ022', 'provider_name_valid',
 'AI provider must be a known provider',
 'accuracy', 'ai_responses', 'provider',
 'SELECT id FROM ai_responses WHERE provider NOT IN (''openai'', ''anthropic'', ''google'', ''perplexity'', ''mock'')',
 'error', 'hourly', 'ai'),

('DQ023', 'status_value_valid',
 'Analysis status must be a valid value',
 'accuracy', 'analyses', 'status',
 'SELECT id FROM analyses WHERE status NOT IN (''pending'', ''processing'', ''completed'', ''failed'', ''cancelled'')',
 'critical', 'hourly', 'analyses'),

('DQ024', 'plan_type_valid',
 'User plan must be a valid value',
 'accuracy', 'user_profiles', 'plan_type',
 'SELECT id FROM user_profiles WHERE plan_type NOT IN (''free'', ''starter'', ''pro'', ''enterprise'')',
 'warning', 'daily', 'billing'),

-- ============================================================================
-- CONFORMITY RULES (Format/Pattern checks)
-- ============================================================================

('DQ025', 'uuid_format_valid',
 'User IDs must be valid UUIDs',
 'conformity', 'user_profiles', 'user_id',
 'SELECT id FROM user_profiles WHERE user_id::text !~ ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''',
 'critical', 'daily', 'data_format'),

('DQ026', 'json_metadata_valid',
 'Metadata fields must be valid JSON',
 'conformity', 'analyses', 'metadata',
 'SELECT id FROM analyses WHERE metadata IS NOT NULL AND NOT (metadata::text ~ ''^\\{.*\\}$'' OR metadata::text ~ ''^\\[.*\\]$'')',
 'warning', 'daily', 'data_format');

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to run a single data quality rule
CREATE OR REPLACE FUNCTION run_data_quality_rule(p_rule_id UUID)
RETURNS UUID AS $$
DECLARE
  v_rule RECORD;
  v_result_id UUID;
  v_start_time TIMESTAMPTZ;
  v_rows_violated INTEGER;
  v_sample JSONB;
  v_status VARCHAR(20);
BEGIN
  v_start_time := clock_timestamp();

  -- Get rule definition
  SELECT * INTO v_rule FROM data_quality_rules WHERE id = p_rule_id;

  IF v_rule IS NULL THEN
    RAISE EXCEPTION 'Rule not found: %', p_rule_id;
  END IF;

  -- Execute the check query and count violations
  EXECUTE format('SELECT COUNT(*) FROM (%s) AS violations', v_rule.check_query)
  INTO v_rows_violated;

  -- Get sample violations (max 10)
  EXECUTE format('SELECT jsonb_agg(v) FROM (SELECT * FROM (%s) AS v LIMIT 10) AS sample', v_rule.check_query)
  INTO v_sample;

  -- Determine status
  v_status := CASE
    WHEN v_rows_violated = 0 THEN 'pass'
    ELSE 'fail'
  END;

  -- Insert result
  INSERT INTO data_quality_results (
    rule_id, rule_code, status, rows_violated,
    sample_violations, execution_duration_ms
  ) VALUES (
    v_rule.id, v_rule.rule_code, v_status, v_rows_violated,
    v_sample, EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER
  ) RETURNING id INTO v_result_id;

  -- Update rule metadata
  UPDATE data_quality_rules SET
    last_check_at = NOW(),
    last_status = v_status,
    consecutive_failures = CASE WHEN v_status = 'fail' THEN consecutive_failures + 1 ELSE 0 END,
    updated_at = NOW()
  WHERE id = p_rule_id;

  RETURN v_result_id;

EXCEPTION WHEN OTHERS THEN
  -- Log error result
  INSERT INTO data_quality_results (
    rule_id, rule_code, status, error_message
  ) VALUES (
    v_rule.id, v_rule.rule_code, 'error', SQLERRM
  ) RETURNING id INTO v_result_id;

  RETURN v_result_id;
END;
$$ LANGUAGE plpgsql;

-- Function to run all enabled rules by frequency
CREATE OR REPLACE FUNCTION run_data_quality_checks(p_frequency VARCHAR DEFAULT 'hourly')
RETURNS TABLE (
  rule_code VARCHAR,
  status VARCHAR,
  rows_violated INTEGER
) AS $$
DECLARE
  v_rule RECORD;
BEGIN
  FOR v_rule IN
    SELECT id, dqr.rule_code
    FROM data_quality_rules dqr
    WHERE is_enabled = true
    AND check_frequency = p_frequency
    ORDER BY severity DESC, rule_code
  LOOP
    PERFORM run_data_quality_rule(v_rule.id);

    RETURN QUERY
    SELECT dqr.rule_code::VARCHAR, dqr.last_status::VARCHAR,
           COALESCE((SELECT dr.rows_violated FROM data_quality_results dr
                     WHERE dr.rule_id = v_rule.id ORDER BY executed_at DESC LIMIT 1), 0)
    FROM data_quality_rules dqr WHERE dqr.id = v_rule.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get data quality summary
CREATE OR REPLACE FUNCTION get_data_quality_summary()
RETURNS TABLE (
  total_rules INTEGER,
  passing_rules INTEGER,
  failing_rules INTEGER,
  error_rules INTEGER,
  pass_rate DECIMAL,
  critical_failures INTEGER,
  last_check TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_rules,
    COUNT(*) FILTER (WHERE last_status = 'pass')::INTEGER as passing_rules,
    COUNT(*) FILTER (WHERE last_status = 'fail')::INTEGER as failing_rules,
    COUNT(*) FILTER (WHERE last_status = 'error')::INTEGER as error_rules,
    ROUND(COUNT(*) FILTER (WHERE last_status = 'pass')::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) as pass_rate,
    COUNT(*) FILTER (WHERE last_status = 'fail' AND severity = 'critical')::INTEGER as critical_failures,
    MAX(last_check_at) as last_check
  FROM data_quality_rules
  WHERE is_enabled = true;
END;
$$ LANGUAGE plpgsql;

-- Function to detect orphan records
CREATE OR REPLACE FUNCTION detect_orphan_records(
  p_source_table VARCHAR,
  p_source_column VARCHAR,
  p_target_table VARCHAR,
  p_target_column VARCHAR,
  p_scan_type VARCHAR DEFAULT 'scheduled'
)
RETURNS UUID AS $$
DECLARE
  v_scan_id UUID;
  v_orphan_count INTEGER;
  v_sample_ids JSONB;
BEGIN
  v_scan_id := gen_random_uuid();

  -- Count orphans
  EXECUTE format(
    'SELECT COUNT(*) FROM %I s LEFT JOIN %I t ON s.%I = t.%I WHERE t.%I IS NULL AND s.%I IS NOT NULL',
    p_source_table, p_target_table, p_source_column, p_target_column, p_target_column, p_source_column
  ) INTO v_orphan_count;

  -- Get sample IDs
  EXECUTE format(
    'SELECT jsonb_agg(s.%I) FROM (SELECT s.%I FROM %I s LEFT JOIN %I t ON s.%I = t.%I WHERE t.%I IS NULL AND s.%I IS NOT NULL LIMIT 100) s',
    p_source_column, p_source_column, p_source_table, p_target_table, p_source_column, p_target_column, p_target_column, p_source_column
  ) INTO v_sample_ids;

  -- Log result
  INSERT INTO orphan_detection_log (
    scan_id, scan_type, source_table, source_column,
    target_table, target_column, orphan_count, sample_orphan_ids
  ) VALUES (
    v_scan_id, p_scan_type, p_source_table, p_source_column,
    p_target_table, p_target_column, v_orphan_count, v_sample_ids
  );

  RETURN v_scan_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

ALTER TABLE data_quality_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE orphan_detection_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE schema_migrations_audit ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to dq_rules" ON data_quality_rules
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to dq_results" ON data_quality_results
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to orphan_log" ON orphan_detection_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to migrations_audit" ON schema_migrations_audit
  FOR ALL USING (auth.role() = 'service_role');

-- Admin read access
CREATE POLICY "Admin can view dq_rules" ON data_quality_rules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admin can view dq_results" ON data_quality_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admin can view orphan_log" ON orphan_detection_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Admin can view migrations_audit" ON schema_migrations_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- ============================================================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_data_quality_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_data_quality_rules_updated_at
  BEFORE UPDATE ON data_quality_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_data_quality_rules_updated_at();

-- ============================================================================
-- 9. COMMENTS
-- ============================================================================

COMMENT ON TABLE data_quality_rules IS 'Defines data quality rules for automated validation';
COMMENT ON TABLE data_quality_results IS 'Stores results of data quality rule executions';
COMMENT ON TABLE orphan_detection_log IS 'Tracks orphan record detection scans';
COMMENT ON TABLE schema_migrations_audit IS 'Audits all database migrations with status and compatibility';

COMMENT ON COLUMN data_quality_rules.rule_type IS 'Type: completeness, validity, consistency, uniqueness, timeliness, integrity, accuracy, conformity';
COMMENT ON COLUMN data_quality_rules.severity IS 'Severity: critical (blocks), error (alerts), warning (logs), info';
COMMENT ON COLUMN data_quality_rules.check_frequency IS 'How often to run: realtime, minutely, hourly, daily, weekly';

COMMENT ON FUNCTION run_data_quality_rule IS 'Executes a single data quality rule and stores the result';
COMMENT ON FUNCTION run_data_quality_checks IS 'Runs all enabled rules for a given frequency';
COMMENT ON FUNCTION get_data_quality_summary IS 'Returns summary statistics for data quality';
COMMENT ON FUNCTION detect_orphan_records IS 'Detects orphan records between two tables';
