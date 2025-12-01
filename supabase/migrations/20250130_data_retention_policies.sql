-- ================================================================
-- Data Retention Policies Schema
-- CISO Week 4 - Automated Data Retention Enforcement
-- ================================================================

-- ================================================================
-- ENUMS
-- ================================================================

CREATE TYPE data_category AS ENUM (
  'personal_data',
  'financial_data',
  'audit_logs',
  'analytics',
  'system_logs',
  'user_generated',
  'temporary',
  'sensitive_pii',
  'health_data',
  'biometric_data'
);

CREATE TYPE retention_action AS ENUM (
  'delete',
  'anonymize',
  'archive',
  'notify_then_delete',
  'pseudonymize',
  'encrypt_archive'
);

CREATE TYPE retention_legal_basis AS ENUM (
  'gdpr_article_17',      -- Right to erasure
  'gdpr_article_5',       -- Storage limitation
  'ccpa_deletion',
  'legal_hold',
  'regulatory_requirement',
  'contractual_obligation',
  'consent_based',
  'legitimate_interest'
);

-- ================================================================
-- RETENTION POLICIES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Policy identification
  policy_name VARCHAR(255) NOT NULL,
  policy_description TEXT,

  -- Target specification
  table_name VARCHAR(255) NOT NULL,
  schema_name VARCHAR(255) DEFAULT 'public',
  date_column VARCHAR(255) NOT NULL,
  owner_column VARCHAR(255),

  -- Retention configuration
  data_category data_category NOT NULL,
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  action retention_action NOT NULL DEFAULT 'delete',

  -- Legal basis
  legal_basis retention_legal_basis NOT NULL,
  legal_reference TEXT,

  -- Notification settings
  notify_before_days INTEGER DEFAULT 7,
  notification_template_id UUID,

  -- Archive settings (for archive action)
  archive_table_name VARCHAR(255),
  archive_schema_name VARCHAR(255) DEFAULT 'archive',

  -- Anonymization settings (for anonymize action)
  anonymization_config JSONB DEFAULT '{}'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  last_executed_at TIMESTAMPTZ,
  last_execution_records INTEGER DEFAULT 0,

  -- Unique constraint on table
  UNIQUE(schema_name, table_name)
);

-- ================================================================
-- RETENTION AUDIT LOG
-- ================================================================

CREATE TABLE IF NOT EXISTS retention_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action details
  action_type VARCHAR(50) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  schema_name VARCHAR(255) DEFAULT 'public',

  -- Execution details
  records_affected INTEGER NOT NULL DEFAULT 0,
  records_notified INTEGER DEFAULT 0,
  cutoff_date TIMESTAMPTZ NOT NULL,

  -- Policy reference
  policy_id UUID REFERENCES data_retention_policies(id),

  -- Execution metadata
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  executed_by VARCHAR(255) NOT NULL,
  execution_duration_ms INTEGER,

  -- Error tracking
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,

  -- Compliance reference
  compliance_ticket_id VARCHAR(255),

  -- Full execution log
  execution_log JSONB DEFAULT '{}'::jsonb
);

-- ================================================================
-- DATA SUBJECT DELETION REQUESTS
-- ================================================================

CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request identification
  request_number VARCHAR(50) UNIQUE NOT NULL,

  -- Data subject
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255),
  identity_verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(50),
  verified_at TIMESTAMPTZ,

  -- Request details
  request_type VARCHAR(50) NOT NULL DEFAULT 'full_deletion',
  request_scope JSONB DEFAULT '{"all_data": true}'::jsonb,
  request_reason TEXT,

  -- Legal basis
  legal_basis retention_legal_basis NOT NULL,

  -- Processing status
  status VARCHAR(50) DEFAULT 'pending',
  priority INTEGER DEFAULT 100,

  -- Timeline (GDPR: 30 days max)
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,

  -- Processing details
  tables_processed JSONB DEFAULT '[]'::jsonb,
  records_deleted INTEGER DEFAULT 0,
  records_anonymized INTEGER DEFAULT 0,
  exceptions JSONB DEFAULT '[]'::jsonb,

  -- Communication
  confirmation_sent_at TIMESTAMPTZ,
  confirmation_method VARCHAR(50),

  -- Audit
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- LEGAL HOLD TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS legal_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Hold identification
  hold_name VARCHAR(255) NOT NULL,
  hold_reference VARCHAR(100) UNIQUE NOT NULL,

  -- Scope
  scope_type VARCHAR(50) NOT NULL, -- 'user', 'table', 'date_range', 'query'
  scope_definition JSONB NOT NULL,

  -- Hold details
  reason TEXT NOT NULL,
  legal_matter VARCHAR(255),
  requesting_authority VARCHAR(255),

  -- Timeline
  hold_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hold_end_date TIMESTAMPTZ,
  review_date TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  released_by UUID REFERENCES auth.users(id),
  released_at TIMESTAMPTZ
);

-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX idx_retention_policies_table
  ON data_retention_policies(schema_name, table_name);

CREATE INDEX idx_retention_policies_active
  ON data_retention_policies(is_active) WHERE is_active = true;

CREATE INDEX idx_retention_policies_category
  ON data_retention_policies(data_category);

CREATE INDEX idx_retention_audit_executed
  ON retention_audit_log(executed_at DESC);

CREATE INDEX idx_retention_audit_table
  ON retention_audit_log(table_name);

CREATE INDEX idx_retention_audit_policy
  ON retention_audit_log(policy_id);

CREATE INDEX idx_deletion_requests_status
  ON deletion_requests(status);

CREATE INDEX idx_deletion_requests_user
  ON deletion_requests(user_id);

CREATE INDEX idx_deletion_requests_deadline
  ON deletion_requests(deadline_at) WHERE status = 'pending';

CREATE INDEX idx_legal_holds_active
  ON legal_holds(is_active) WHERE is_active = true;

CREATE INDEX idx_legal_holds_scope
  ON legal_holds USING GIN(scope_definition);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Generate deletion request number
CREATE OR REPLACE FUNCTION generate_deletion_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'DEL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
    LPAD(NEXTVAL('deletion_request_seq')::TEXT, 5, '0');
  NEW.deadline_at := NOW() + INTERVAL '30 days'; -- GDPR deadline
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS deletion_request_seq;

CREATE TRIGGER set_deletion_request_number
  BEFORE INSERT ON deletion_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL)
  EXECUTE FUNCTION generate_deletion_request_number();

-- Check if data is under legal hold
CREATE OR REPLACE FUNCTION is_under_legal_hold(
  p_table_name VARCHAR,
  p_user_id UUID DEFAULT NULL,
  p_record_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_hold_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM legal_holds
    WHERE is_active = true
    AND (hold_end_date IS NULL OR hold_end_date > NOW())
    AND (
      -- Check table-level holds
      (scope_type = 'table' AND scope_definition->>'table_name' = p_table_name)
      -- Check user-level holds
      OR (scope_type = 'user' AND p_user_id IS NOT NULL
          AND (scope_definition->>'user_id')::UUID = p_user_id)
      -- Check record-level holds
      OR (scope_type = 'record' AND p_record_id IS NOT NULL
          AND (scope_definition->>'record_id')::UUID = p_record_id)
    )
  ) INTO v_hold_exists;

  RETURN v_hold_exists;
END;
$$ LANGUAGE plpgsql;

-- Anonymize expired records (generic function)
CREATE OR REPLACE FUNCTION anonymize_expired_records(
  p_table_name VARCHAR,
  p_date_column VARCHAR,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_policy RECORD;
  v_anonymization_sql TEXT;
BEGIN
  -- Get anonymization config from policy
  SELECT * INTO v_policy
  FROM data_retention_policies
  WHERE table_name = p_table_name
  AND action = 'anonymize'
  AND is_active = true;

  IF v_policy IS NULL THEN
    RETURN 0;
  END IF;

  -- Build dynamic anonymization query based on config
  -- Default: anonymize common PII fields
  v_anonymization_sql := format(
    'UPDATE %I SET
      email = ''anonymized_'' || id || ''@example.com'',
      name = ''Anonymous User'',
      phone = NULL,
      address = NULL,
      ip_address = ''0.0.0.0'',
      user_agent = ''Anonymized'',
      updated_at = NOW()
    WHERE %I < $1
    AND NOT EXISTS (
      SELECT 1 FROM legal_holds
      WHERE is_active = true
      AND scope_type = ''table''
      AND scope_definition->>''table_name'' = $2
    )',
    p_table_name,
    p_date_column
  );

  EXECUTE v_anonymization_sql USING p_cutoff_date, p_table_name;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Archive expired records
CREATE OR REPLACE FUNCTION archive_expired_records(
  p_table_name VARCHAR,
  p_date_column VARCHAR,
  p_cutoff_date TIMESTAMPTZ
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_policy RECORD;
  v_archive_table VARCHAR;
BEGIN
  -- Get policy with archive config
  SELECT * INTO v_policy
  FROM data_retention_policies
  WHERE table_name = p_table_name
  AND action = 'archive'
  AND is_active = true;

  IF v_policy IS NULL THEN
    RETURN 0;
  END IF;

  v_archive_table := COALESCE(
    v_policy.archive_table_name,
    p_table_name || '_archive'
  );

  -- Create archive table if not exists (copy structure)
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I.%I (LIKE public.%I INCLUDING ALL)',
    COALESCE(v_policy.archive_schema_name, 'archive'),
    v_archive_table,
    p_table_name
  );

  -- Add archive metadata columns if not exist
  BEGIN
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NOW()',
      COALESCE(v_policy.archive_schema_name, 'archive'),
      v_archive_table
    );
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;

  -- Move records to archive (excluding legal holds)
  EXECUTE format(
    'WITH archived AS (
      DELETE FROM public.%I
      WHERE %I < $1
      AND NOT EXISTS (
        SELECT 1 FROM legal_holds
        WHERE is_active = true
        AND scope_type = ''table''
        AND scope_definition->>''table_name'' = $2
      )
      RETURNING *
    )
    INSERT INTO %I.%I
    SELECT *, NOW() as archived_at FROM archived',
    p_table_name,
    p_date_column,
    COALESCE(v_policy.archive_schema_name, 'archive'),
    v_archive_table
  ) USING p_cutoff_date, p_table_name;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Process deletion request
CREATE OR REPLACE FUNCTION process_deletion_request(
  p_request_id UUID,
  p_processor_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_request RECORD;
  v_result JSONB := '{"success": false}'::jsonb;
  v_tables_processed JSONB := '[]'::jsonb;
  v_total_deleted INTEGER := 0;
  v_total_anonymized INTEGER := 0;
  v_table_name VARCHAR;
  v_table_result JSONB;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM deletion_requests
  WHERE id = p_request_id
  AND status = 'pending';

  IF v_request IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found or already processed'
    );
  END IF;

  -- Check for legal holds on user
  IF is_under_legal_hold(NULL, v_request.user_id, NULL) THEN
    UPDATE deletion_requests
    SET status = 'on_hold',
        updated_at = NOW()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'User data is under legal hold'
    );
  END IF;

  -- Update status
  UPDATE deletion_requests
  SET status = 'processing',
      processing_started_at = NOW(),
      processed_by = p_processor_id,
      updated_at = NOW()
  WHERE id = p_request_id;

  -- Process each table with user data
  FOR v_table_name IN
    SELECT DISTINCT table_name
    FROM data_retention_policies
    WHERE owner_column IS NOT NULL
    AND is_active = true
  LOOP
    v_table_result := process_table_deletion(
      v_table_name,
      v_request.user_id,
      v_request.request_scope
    );

    v_tables_processed := v_tables_processed ||
      jsonb_build_object(v_table_name, v_table_result);

    v_total_deleted := v_total_deleted +
      COALESCE((v_table_result->>'deleted')::INTEGER, 0);
    v_total_anonymized := v_total_anonymized +
      COALESCE((v_table_result->>'anonymized')::INTEGER, 0);
  END LOOP;

  -- Update request with results
  UPDATE deletion_requests
  SET status = 'completed',
      completed_at = NOW(),
      tables_processed = v_tables_processed,
      records_deleted = v_total_deleted,
      records_anonymized = v_total_anonymized,
      updated_at = NOW()
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'records_deleted', v_total_deleted,
    'records_anonymized', v_total_anonymized,
    'tables_processed', v_tables_processed
  );
END;
$$ LANGUAGE plpgsql;

-- Helper function for table deletion
CREATE OR REPLACE FUNCTION process_table_deletion(
  p_table_name VARCHAR,
  p_user_id UUID,
  p_scope JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_policy RECORD;
  v_deleted INTEGER := 0;
  v_anonymized INTEGER := 0;
BEGIN
  -- Get policy for table
  SELECT * INTO v_policy
  FROM data_retention_policies
  WHERE table_name = p_table_name
  AND is_active = true;

  IF v_policy IS NULL OR v_policy.owner_column IS NULL THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'No policy or owner column');
  END IF;

  -- Determine action based on data category
  IF v_policy.data_category IN ('audit_logs', 'financial_data') THEN
    -- Anonymize instead of delete for compliance
    EXECUTE format(
      'UPDATE %I SET
        email = ''anonymized@example.com'',
        name = ''Deleted User'',
        updated_at = NOW()
      WHERE %I = $1',
      p_table_name,
      v_policy.owner_column
    ) USING p_user_id;

    GET DIAGNOSTICS v_anonymized = ROW_COUNT;
  ELSE
    -- Full deletion
    EXECUTE format(
      'DELETE FROM %I WHERE %I = $1',
      p_table_name,
      v_policy.owner_column
    ) USING p_user_id;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'deleted', v_deleted,
    'anonymized', v_anonymized
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- DEFAULT POLICIES
-- ================================================================

INSERT INTO data_retention_policies (
  policy_name, policy_description, table_name, date_column,
  data_category, retention_days, action, legal_basis
) VALUES
  ('Session Cleanup', 'Remove expired sessions', 'sessions', 'expires_at',
   'temporary', 1, 'delete', 'gdpr_article_5'),

  ('Cache Cleanup', 'Clean analysis cache', 'analysis_cache', 'created_at',
   'temporary', 7, 'delete', 'gdpr_article_5'),

  ('Analytics Retention', 'Anonymize old analytics', 'analytics_events', 'created_at',
   'analytics', 365, 'anonymize', 'legitimate_interest'),

  ('Audit Log Archive', 'Archive old audit logs', 'audit_log', 'created_at',
   'audit_logs', 2555, 'archive', 'regulatory_requirement'),

  ('User Exports Cleanup', 'Clean old user exports', 'user_exports', 'created_at',
   'user_generated', 30, 'notify_then_delete', 'gdpr_article_5')
ON CONFLICT (schema_name, table_name) DO NOTHING;

-- ================================================================
-- RLS POLICIES
-- ================================================================

ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_holds ENABLE ROW LEVEL SECURITY;

-- Policies table - admin only
CREATE POLICY admin_retention_policies ON data_retention_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'dpo', 'ciso')
    )
  );

-- Audit log - read by admin, write by system
CREATE POLICY admin_read_retention_audit ON retention_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'dpo', 'ciso', 'auditor')
    )
  );

-- Deletion requests - users can see their own
CREATE POLICY user_own_deletion_requests ON deletion_requests
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY admin_all_deletion_requests ON deletion_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'dpo')
    )
  );

-- Legal holds - admin/legal only
CREATE POLICY legal_holds_admin ON legal_holds
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'legal', 'ciso')
    )
  );

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE data_retention_policies IS
  'Configurable data retention policies for automated enforcement';

COMMENT ON TABLE retention_audit_log IS
  'Immutable log of all data retention actions for compliance';

COMMENT ON TABLE deletion_requests IS
  'GDPR Article 17 right to erasure requests tracking';

COMMENT ON TABLE legal_holds IS
  'Legal hold management to prevent deletion during litigation';

COMMENT ON FUNCTION is_under_legal_hold IS
  'Check if specific data is protected by an active legal hold';

COMMENT ON FUNCTION process_deletion_request IS
  'Process a user deletion request across all relevant tables';
