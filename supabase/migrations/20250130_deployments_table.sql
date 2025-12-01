-- =====================================================
-- DEPLOYMENTS TRACKING SCHEMA
-- Migration: 20250130_deployments_table.sql
-- Purpose: Track all deployments for audit and rollback
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SECTION 1: ENUMS
-- =====================================================

-- Deployment status
CREATE TYPE deployment_status AS ENUM (
  'pending',           -- Waiting to deploy
  'deploying',         -- In progress
  'deployed',          -- Successfully deployed
  'canary',            -- In canary phase
  'promoted',          -- Promoted from canary to full
  'rolling_back',      -- Rollback in progress
  'rolled_back',       -- Successfully rolled back
  'failed',            -- Deployment failed
  'cancelled'          -- Deployment cancelled
);

-- Deployment type
CREATE TYPE deployment_type AS ENUM (
  'production',
  'canary',
  'preview',
  'staging',
  'development'
);

-- Trigger reason
CREATE TYPE deployment_trigger AS ENUM (
  'manual',            -- Manual deployment
  'push',              -- Git push
  'merge',             -- PR merge
  'schedule',          -- Scheduled deployment
  'hotfix',            -- Emergency hotfix
  'rollback',          -- Rollback from previous
  'automation'         -- Automated pipeline
);

-- =====================================================
-- SECTION 2: DEPLOYMENTS TABLE
-- =====================================================

CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Deployment identification
  deployment_id VARCHAR(100) UNIQUE NOT NULL,
  deployment_url VARCHAR(500),

  -- Environment
  environment deployment_type NOT NULL,
  status deployment_status NOT NULL DEFAULT 'pending',

  -- Git information
  git_commit_sha VARCHAR(40) NOT NULL,
  git_branch VARCHAR(255),
  git_commit_message TEXT,
  git_author VARCHAR(255),
  git_commit_url VARCHAR(500),

  -- Version info
  version VARCHAR(50),
  previous_version VARCHAR(50),
  previous_deployment_id UUID REFERENCES deployments(id),

  -- Trigger info
  triggered_by deployment_trigger NOT NULL DEFAULT 'push',
  triggered_by_user_id UUID REFERENCES auth.users(id),
  triggered_by_email VARCHAR(255),

  -- Canary info
  is_canary BOOLEAN DEFAULT false,
  canary_percentage INTEGER CHECK (canary_percentage >= 0 AND canary_percentage <= 100),
  promoted_at TIMESTAMPTZ,
  promoted_by UUID REFERENCES auth.users(id),

  -- Timing
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Build info
  build_id VARCHAR(100),
  build_logs_url VARCHAR(500),

  -- Rollback info
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by UUID REFERENCES auth.users(id),
  rollback_reason TEXT,
  rolled_back_to_id UUID REFERENCES deployments(id),

  -- Health metrics at deployment
  initial_error_rate NUMERIC(5,4),
  initial_latency_p99_ms INTEGER,
  initial_health_check BOOLEAN,

  -- Post-deployment metrics (after 15 min)
  final_error_rate NUMERIC(5,4),
  final_latency_p99_ms INTEGER,
  final_health_check BOOLEAN,

  -- Change summary
  files_changed INTEGER,
  lines_added INTEGER,
  lines_removed INTEGER,
  breaking_changes BOOLEAN DEFAULT false,
  breaking_change_notes TEXT,

  -- Tags for filtering
  tags TEXT[],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_deployment_id ON deployments(deployment_id);
CREATE INDEX idx_deployment_env ON deployments(environment);
CREATE INDEX idx_deployment_status ON deployments(status);
CREATE INDEX idx_deployment_commit ON deployments(git_commit_sha);
CREATE INDEX idx_deployment_created ON deployments(created_at DESC);
CREATE INDEX idx_deployment_canary ON deployments(is_canary) WHERE is_canary = true;
CREATE INDEX idx_deployment_version ON deployments(version);

-- =====================================================
-- SECTION 3: DEPLOYMENT METRICS TABLE
-- =====================================================

CREATE TABLE deployment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,

  -- Timing
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  minutes_since_deploy INTEGER,

  -- Traffic metrics
  request_count INTEGER,
  error_count INTEGER,
  error_rate NUMERIC(5,4),

  -- Latency metrics
  latency_p50_ms INTEGER,
  latency_p90_ms INTEGER,
  latency_p99_ms INTEGER,
  latency_avg_ms INTEGER,

  -- Resource metrics
  cpu_usage_percent NUMERIC(5,2),
  memory_usage_mb NUMERIC(10,2),
  memory_limit_mb NUMERIC(10,2),

  -- Business metrics
  active_users INTEGER,
  api_calls INTEGER,

  -- Health
  health_check_passed BOOLEAN,
  health_check_details JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_deployment ON deployment_metrics(deployment_id);
CREATE INDEX idx_metrics_recorded ON deployment_metrics(recorded_at DESC);

-- =====================================================
-- SECTION 4: DEPLOYMENT EVENTS TABLE
-- =====================================================

CREATE TABLE deployment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_description TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Severity
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),

  -- Actor
  actor_id UUID REFERENCES auth.users(id),
  actor_email VARCHAR(255),
  is_automated BOOLEAN DEFAULT false,

  -- Data
  event_data JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_deployment ON deployment_events(deployment_id);
CREATE INDEX idx_events_timestamp ON deployment_events(event_timestamp DESC);
CREATE INDEX idx_events_type ON deployment_events(event_type);
CREATE INDEX idx_events_severity ON deployment_events(severity);

-- =====================================================
-- SECTION 5: CREATE DEPLOYMENT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION create_deployment(
  p_deployment_id VARCHAR(100),
  p_environment deployment_type,
  p_git_commit_sha VARCHAR(40),
  p_git_branch VARCHAR(255) DEFAULT NULL,
  p_git_message TEXT DEFAULT NULL,
  p_git_author VARCHAR(255) DEFAULT NULL,
  p_version VARCHAR(50) DEFAULT NULL,
  p_triggered_by deployment_trigger DEFAULT 'push',
  p_user_id UUID DEFAULT NULL,
  p_is_canary BOOLEAN DEFAULT false,
  p_canary_percentage INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
  v_previous RECORD;
BEGIN
  -- Get previous deployment
  SELECT id, version INTO v_previous
  FROM deployments
  WHERE environment = p_environment
    AND status IN ('deployed', 'promoted')
  ORDER BY completed_at DESC
  LIMIT 1;

  -- Create deployment
  INSERT INTO deployments (
    deployment_id,
    environment,
    git_commit_sha,
    git_branch,
    git_commit_message,
    git_author,
    version,
    previous_version,
    previous_deployment_id,
    triggered_by,
    triggered_by_user_id,
    is_canary,
    canary_percentage,
    status
  ) VALUES (
    p_deployment_id,
    p_environment,
    p_git_commit_sha,
    p_git_branch,
    p_git_message,
    p_git_author,
    p_version,
    v_previous.version,
    v_previous.id,
    p_triggered_by,
    p_user_id,
    p_is_canary,
    p_canary_percentage,
    'pending'
  )
  RETURNING id INTO v_id;

  -- Log event
  INSERT INTO deployment_events (
    deployment_id,
    event_type,
    event_description,
    actor_id,
    event_data
  ) VALUES (
    v_id,
    'deployment_created',
    format('Deployment created for %s (%s)', p_environment, p_git_branch),
    p_user_id,
    jsonb_build_object(
      'commit', p_git_commit_sha,
      'is_canary', p_is_canary
    )
  );

  RETURN v_id;
END;
$$;

-- =====================================================
-- SECTION 6: START DEPLOYMENT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION start_deployment(p_deployment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE deployments
  SET
    status = 'deploying',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id = p_deployment_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO deployment_events (
    deployment_id,
    event_type,
    event_description,
    is_automated
  ) VALUES (
    p_deployment_id,
    'deployment_started',
    'Deployment started',
    true
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 7: COMPLETE DEPLOYMENT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION complete_deployment(
  p_deployment_id UUID,
  p_deployment_url VARCHAR(500) DEFAULT NULL,
  p_build_id VARCHAR(100) DEFAULT NULL,
  p_error_rate NUMERIC DEFAULT NULL,
  p_latency_p99 INTEGER DEFAULT NULL,
  p_health_check BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_canary BOOLEAN;
BEGIN
  SELECT is_canary INTO v_is_canary
  FROM deployments
  WHERE id = p_deployment_id;

  UPDATE deployments
  SET
    status = CASE WHEN v_is_canary THEN 'canary' ELSE 'deployed' END,
    deployment_url = COALESCE(p_deployment_url, deployment_url),
    build_id = COALESCE(p_build_id, build_id),
    completed_at = NOW(),
    duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
    initial_error_rate = p_error_rate,
    initial_latency_p99_ms = p_latency_p99,
    initial_health_check = p_health_check,
    updated_at = NOW()
  WHERE id = p_deployment_id
    AND status = 'deploying';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO deployment_events (
    deployment_id,
    event_type,
    event_description,
    is_automated,
    event_data
  ) VALUES (
    p_deployment_id,
    'deployment_completed',
    format('Deployment completed (%s)', CASE WHEN v_is_canary THEN 'canary' ELSE 'full' END),
    true,
    jsonb_build_object(
      'url', p_deployment_url,
      'error_rate', p_error_rate,
      'latency_p99', p_latency_p99
    )
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 8: PROMOTE CANARY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION promote_canary(
  p_deployment_id UUID,
  p_promoter_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE deployments
  SET
    status = 'promoted',
    is_canary = false,
    canary_percentage = 100,
    promoted_at = NOW(),
    promoted_by = p_promoter_id,
    updated_at = NOW()
  WHERE id = p_deployment_id
    AND status = 'canary';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO deployment_events (
    deployment_id,
    event_type,
    event_description,
    actor_id
  ) VALUES (
    p_deployment_id,
    'canary_promoted',
    'Canary deployment promoted to production',
    p_promoter_id
  );

  RETURN true;
END;
$$;

-- =====================================================
-- SECTION 9: ROLLBACK DEPLOYMENT FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION rollback_deployment(
  p_deployment_id UUID,
  p_reason TEXT,
  p_rollback_to_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rollback_target UUID;
  v_new_deployment_id UUID;
  v_target_commit VARCHAR(40);
  v_environment deployment_type;
BEGIN
  -- Get current deployment info
  SELECT environment INTO v_environment
  FROM deployments
  WHERE id = p_deployment_id;

  -- Determine rollback target
  v_rollback_target := COALESCE(
    p_rollback_to_id,
    (SELECT previous_deployment_id FROM deployments WHERE id = p_deployment_id)
  );

  IF v_rollback_target IS NULL THEN
    RAISE EXCEPTION 'No rollback target available';
  END IF;

  -- Get target commit
  SELECT git_commit_sha INTO v_target_commit
  FROM deployments
  WHERE id = v_rollback_target;

  -- Update current deployment
  UPDATE deployments
  SET
    status = 'rolling_back',
    rolled_back_at = NOW(),
    rolled_back_by = p_user_id,
    rollback_reason = p_reason,
    rolled_back_to_id = v_rollback_target,
    updated_at = NOW()
  WHERE id = p_deployment_id;

  -- Create new deployment for rollback
  INSERT INTO deployments (
    deployment_id,
    environment,
    git_commit_sha,
    triggered_by,
    triggered_by_user_id,
    previous_deployment_id,
    status
  ) VALUES (
    'rollback-' || p_deployment_id::TEXT,
    v_environment,
    v_target_commit,
    'rollback',
    p_user_id,
    p_deployment_id,
    'pending'
  )
  RETURNING id INTO v_new_deployment_id;

  -- Log events
  INSERT INTO deployment_events (
    deployment_id,
    event_type,
    event_description,
    severity,
    actor_id,
    event_data
  ) VALUES
  (
    p_deployment_id,
    'rollback_initiated',
    format('Rollback initiated: %s', p_reason),
    'warning',
    p_user_id,
    jsonb_build_object('target', v_rollback_target, 'reason', p_reason)
  ),
  (
    v_new_deployment_id,
    'deployment_created',
    'Rollback deployment created',
    'info',
    p_user_id,
    jsonb_build_object('rollback_from', p_deployment_id)
  );

  RETURN v_new_deployment_id;
END;
$$;

-- =====================================================
-- SECTION 10: RECORD DEPLOYMENT METRICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION record_deployment_metrics(
  p_deployment_id UUID,
  p_request_count INTEGER DEFAULT NULL,
  p_error_count INTEGER DEFAULT NULL,
  p_latency_p50 INTEGER DEFAULT NULL,
  p_latency_p90 INTEGER DEFAULT NULL,
  p_latency_p99 INTEGER DEFAULT NULL,
  p_cpu_percent NUMERIC DEFAULT NULL,
  p_memory_mb NUMERIC DEFAULT NULL,
  p_health_passed BOOLEAN DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_metric_id UUID;
  v_minutes_since INTEGER;
  v_error_rate NUMERIC;
BEGIN
  -- Calculate minutes since deployment
  SELECT EXTRACT(EPOCH FROM (NOW() - completed_at)) / 60
  INTO v_minutes_since
  FROM deployments
  WHERE id = p_deployment_id;

  -- Calculate error rate
  v_error_rate := CASE
    WHEN p_request_count > 0 THEN p_error_count::NUMERIC / p_request_count
    ELSE 0
  END;

  INSERT INTO deployment_metrics (
    deployment_id,
    minutes_since_deploy,
    request_count,
    error_count,
    error_rate,
    latency_p50_ms,
    latency_p90_ms,
    latency_p99_ms,
    cpu_usage_percent,
    memory_usage_mb,
    health_check_passed
  ) VALUES (
    p_deployment_id,
    v_minutes_since,
    p_request_count,
    p_error_count,
    v_error_rate,
    p_latency_p50,
    p_latency_p90,
    p_latency_p99,
    p_cpu_percent,
    p_memory_mb,
    p_health_passed
  )
  RETURNING id INTO v_metric_id;

  -- Update final metrics on deployment if 15+ minutes
  IF v_minutes_since >= 15 THEN
    UPDATE deployments
    SET
      final_error_rate = v_error_rate,
      final_latency_p99_ms = p_latency_p99,
      final_health_check = p_health_passed,
      updated_at = NOW()
    WHERE id = p_deployment_id
      AND final_error_rate IS NULL;
  END IF;

  RETURN v_metric_id;
END;
$$;

-- =====================================================
-- SECTION 11: GET DEPLOYMENT SUMMARY FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_deployment_summary(
  p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '7 days',
  p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_deployments INTEGER,
  successful INTEGER,
  failed INTEGER,
  rolled_back INTEGER,
  avg_duration_seconds INTEGER,
  deployments_by_env JSONB,
  deployments_by_trigger JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE d.status IN ('deployed', 'promoted'))::INTEGER,
    COUNT(*) FILTER (WHERE d.status = 'failed')::INTEGER,
    COUNT(*) FILTER (WHERE d.status = 'rolled_back')::INTEGER,
    AVG(d.duration_seconds)::INTEGER,
    jsonb_object_agg(d.environment::TEXT, env_count),
    jsonb_object_agg(d.triggered_by::TEXT, trigger_count)
  FROM (
    SELECT
      d.status,
      d.environment,
      d.triggered_by,
      d.duration_seconds,
      COUNT(*) OVER (PARTITION BY d.environment) as env_count,
      COUNT(*) OVER (PARTITION BY d.triggered_by) as trigger_count
    FROM deployments d
    WHERE d.created_at BETWEEN p_start_date AND p_end_date
  ) d
  GROUP BY ();
END;
$$;

-- =====================================================
-- SECTION 12: RLS POLICIES
-- =====================================================

ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view deployments (read-only)
CREATE POLICY deployments_view ON deployments
  FOR SELECT
  USING (true);

CREATE POLICY metrics_view ON deployment_metrics
  FOR SELECT
  USING (true);

CREATE POLICY events_view ON deployment_events
  FOR SELECT
  USING (true);

-- Admin policies
CREATE POLICY deployments_admin ON deployments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY metrics_admin ON deployment_metrics
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY events_admin ON deployment_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- SECTION 13: COMMENTS
-- =====================================================

COMMENT ON TABLE deployments IS 'Tracks all deployments for audit and rollback';
COMMENT ON TABLE deployment_metrics IS 'Performance metrics for each deployment';
COMMENT ON TABLE deployment_events IS 'Timeline of deployment events';
COMMENT ON FUNCTION create_deployment IS 'Creates a new deployment record';
COMMENT ON FUNCTION rollback_deployment IS 'Initiates a rollback to previous version';
COMMENT ON FUNCTION promote_canary IS 'Promotes a canary deployment to full production';
