-- ============================================================================
-- Cron Job Definitions Table Migration
-- Phase 4, Week 8 Extended
--
-- This table stores metadata about scheduled cron jobs including their
-- schedules, configuration, and operational status.
-- ============================================================================

-- Create cron_job_definitions table
CREATE TABLE IF NOT EXISTS cron_job_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job identification
  job_name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Schedule configuration (cron expression)
  schedule VARCHAR(50) NOT NULL,  -- e.g., "0 * * * *" for hourly
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Job configuration
  handler_path VARCHAR(255) NOT NULL,  -- e.g., "/api/cron/collect-prices"
  timeout_seconds INTEGER DEFAULT 300,
  retry_count INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,

  -- Categorization
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  priority INTEGER DEFAULT 5,  -- 1 (highest) to 10 (lowest)

  -- Status and control
  is_enabled BOOLEAN DEFAULT true,
  is_system_job BOOLEAN DEFAULT false,  -- System jobs can't be disabled by users
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  -- Alerting configuration
  alert_on_failure BOOLEAN DEFAULT true,
  alert_on_timeout BOOLEAN DEFAULT true,
  alert_channels JSONB DEFAULT '["email", "slack"]'::jsonb,
  max_consecutive_failures INTEGER DEFAULT 3,  -- Alert after N failures

  -- Performance tracking
  avg_execution_time_ms INTEGER,
  success_rate DECIMAL(5,2),  -- 0.00 to 100.00
  total_runs INTEGER DEFAULT 0,
  total_failures INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_cron_jobs_name ON cron_job_definitions(job_name);
CREATE INDEX idx_cron_jobs_category ON cron_job_definitions(category);
CREATE INDEX idx_cron_jobs_enabled ON cron_job_definitions(is_enabled);
CREATE INDEX idx_cron_jobs_next_run ON cron_job_definitions(next_run_at) WHERE is_enabled = true;
CREATE INDEX idx_cron_jobs_priority ON cron_job_definitions(priority);

-- Add RLS policies
ALTER TABLE cron_job_definitions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON cron_job_definitions
  FOR ALL USING (auth.role() = 'service_role');

-- Admin users can view all jobs
CREATE POLICY "Admin users can view jobs" ON cron_job_definitions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Admin users can update non-system jobs
CREATE POLICY "Admin users can update non-system jobs" ON cron_job_definitions
  FOR UPDATE USING (
    NOT is_system_job AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_cron_job_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cron_job_definitions_updated_at
  BEFORE UPDATE ON cron_job_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_cron_job_definitions_updated_at();

-- ============================================================================
-- Insert Default Cron Job Definitions
-- ============================================================================

INSERT INTO cron_job_definitions (
  job_name,
  display_name,
  description,
  schedule,
  handler_path,
  category,
  priority,
  is_system_job,
  timeout_seconds,
  metadata
) VALUES
-- Price collection jobs
(
  'collect-prices',
  'Collect Token Prices',
  'Fetches current prices for tracked tokens from CoinGecko API',
  '*/5 * * * *',  -- Every 5 minutes
  '/api/cron/collect-prices',
  'data-collection',
  1,
  true,
  120,
  '{"source": "coingecko", "tokens_per_batch": 100}'::jsonb
),
(
  'collect-prices-extended',
  'Collect Extended Price Data',
  'Fetches additional price metrics including market cap, volume, and supply data',
  '0 * * * *',  -- Every hour
  '/api/cron/collect-prices-extended',
  'data-collection',
  2,
  true,
  300,
  '{"include_market_data": true, "include_community_data": true}'::jsonb
),
-- TVL collection jobs
(
  'collect-tvl',
  'Collect Protocol TVL',
  'Fetches Total Value Locked data from DeFiLlama API',
  '*/15 * * * *',  -- Every 15 minutes
  '/api/cron/collect-tvl',
  'data-collection',
  1,
  true,
  180,
  '{"source": "defillama", "chains": ["ethereum", "base", "arbitrum", "optimism"]}'::jsonb
),
(
  'collect-tvl-history',
  'Collect Historical TVL',
  'Fetches and stores historical TVL data for trend analysis',
  '0 0 * * *',  -- Daily at midnight
  '/api/cron/collect-tvl-history',
  'data-collection',
  3,
  true,
  600,
  '{"days_to_fetch": 7}'::jsonb
),
-- Gas metrics jobs
(
  'collect-gas',
  'Collect Gas Metrics',
  'Fetches current gas prices and utilization across chains',
  '*/2 * * * *',  -- Every 2 minutes
  '/api/cron/collect-gas',
  'data-collection',
  1,
  true,
  60,
  '{"chains": ["ethereum", "base", "arbitrum", "optimism", "polygon"]}'::jsonb
),
-- Wallet tracking jobs
(
  'sync-wallets',
  'Sync Tracked Wallets',
  'Updates balances and activity for tracked wallets',
  '*/30 * * * *',  -- Every 30 minutes
  '/api/cron/sync-wallets',
  'data-collection',
  2,
  true,
  300,
  '{"batch_size": 50, "include_nfts": false}'::jsonb
),
(
  'detect-whale-activity',
  'Detect Whale Activity',
  'Monitors large transactions and significant wallet movements',
  '*/10 * * * *',  -- Every 10 minutes
  '/api/cron/detect-whales',
  'analytics',
  2,
  true,
  180,
  '{"threshold_usd": 100000, "chains": ["ethereum", "base"]}'::jsonb
),
-- Cleanup and maintenance jobs
(
  'cleanup-old-data',
  'Cleanup Old Data',
  'Removes old metrics data to maintain database performance',
  '0 3 * * *',  -- Daily at 3 AM
  '/api/cron/cleanup-old-data',
  'maintenance',
  5,
  true,
  600,
  '{"retention_days": {"gas_metrics": 30, "price_history": 365, "cron_executions": 90}}'::jsonb
),
(
  'vacuum-analyze',
  'Database Maintenance',
  'Runs VACUUM ANALYZE on key tables for query optimization',
  '0 4 * * 0',  -- Weekly on Sunday at 4 AM
  '/api/cron/vacuum-analyze',
  'maintenance',
  8,
  true,
  1800,
  '{"tables": ["token_prices", "protocol_tvl", "gas_metrics", "wallet_balances"]}'::jsonb
),
-- Report generation jobs
(
  'generate-daily-report',
  'Generate Daily Report',
  'Creates daily summary report with key metrics',
  '0 6 * * *',  -- Daily at 6 AM
  '/api/cron/generate-daily-report',
  'reports',
  4,
  true,
  300,
  '{"recipients": "admin", "format": "html"}'::jsonb
),
(
  'generate-weekly-digest',
  'Generate Weekly Digest',
  'Creates weekly analytics digest for stakeholders',
  '0 7 * * 1',  -- Weekly on Monday at 7 AM
  '/api/cron/generate-weekly-digest',
  'reports',
  4,
  true,
  600,
  '{"include_charts": true, "sections": ["prices", "tvl", "gas", "whales"]}'::jsonb
),
-- Health check jobs
(
  'health-check-apis',
  'API Health Check',
  'Verifies external API connectivity and response times',
  '*/5 * * * *',  -- Every 5 minutes
  '/api/cron/health-check-apis',
  'monitoring',
  1,
  true,
  60,
  '{"apis": ["coingecko", "defillama", "alchemy", "supabase"]}'::jsonb
),
(
  'health-check-internal',
  'Internal Health Check',
  'Checks internal system components and database connectivity',
  '*/1 * * * *',  -- Every minute
  '/api/cron/health-check-internal',
  'monitoring',
  1,
  true,
  30,
  '{"components": ["database", "cache", "queue"]}'::jsonb
),
-- RLHF and AI jobs
(
  'process-feedback',
  'Process User Feedback',
  'Aggregates and processes user feedback for RLHF training',
  '0 */4 * * *',  -- Every 4 hours
  '/api/cron/process-feedback',
  'ai',
  3,
  true,
  300,
  '{"min_samples": 10, "confidence_threshold": 0.7}'::jsonb
),
(
  'calibrate-models',
  'Calibrate AI Models',
  'Runs calibration analysis on prediction models',
  '0 0 * * 0',  -- Weekly on Sunday at midnight
  '/api/cron/calibrate-models',
  'ai',
  5,
  true,
  1800,
  '{"industries": "all", "min_samples_per_industry": 100}'::jsonb
);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to calculate next run time from cron expression
CREATE OR REPLACE FUNCTION calculate_next_run(
  p_schedule VARCHAR,
  p_timezone VARCHAR DEFAULT 'UTC'
) RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_next_run TIMESTAMPTZ;
BEGIN
  -- Simple implementation - in production, use pg_cron or similar
  -- This is a placeholder that returns current time + 1 hour
  v_next_run := NOW() + INTERVAL '1 hour';
  RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- Function to update job statistics after execution
CREATE OR REPLACE FUNCTION update_job_stats(
  p_job_name VARCHAR,
  p_success BOOLEAN,
  p_execution_time_ms INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE cron_job_definitions
  SET
    last_run_at = NOW(),
    next_run_at = calculate_next_run(schedule, timezone),
    total_runs = total_runs + 1,
    total_failures = CASE WHEN p_success THEN total_failures ELSE total_failures + 1 END,
    avg_execution_time_ms = CASE
      WHEN avg_execution_time_ms IS NULL THEN p_execution_time_ms
      ELSE (avg_execution_time_ms + p_execution_time_ms) / 2
    END,
    success_rate = CASE
      WHEN total_runs = 0 THEN 0
      ELSE ((total_runs - total_failures)::DECIMAL / (total_runs + 1)) * 100
    END,
    updated_at = NOW()
  WHERE job_name = p_job_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get jobs due for execution
CREATE OR REPLACE FUNCTION get_due_jobs()
RETURNS TABLE (
  job_name VARCHAR,
  handler_path VARCHAR,
  timeout_seconds INTEGER,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cj.job_name,
    cj.handler_path,
    cj.timeout_seconds,
    cj.metadata
  FROM cron_job_definitions cj
  WHERE cj.is_enabled = true
    AND (cj.next_run_at IS NULL OR cj.next_run_at <= NOW())
  ORDER BY cj.priority ASC, cj.next_run_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE cron_job_definitions IS 'Stores configuration for scheduled cron jobs';
COMMENT ON COLUMN cron_job_definitions.schedule IS 'Cron expression (e.g., "0 * * * *" for hourly)';
COMMENT ON COLUMN cron_job_definitions.priority IS 'Job priority: 1 (highest) to 10 (lowest)';
COMMENT ON COLUMN cron_job_definitions.is_system_job IS 'System jobs cannot be disabled by regular admins';
COMMENT ON COLUMN cron_job_definitions.max_consecutive_failures IS 'Send alert after N consecutive failures';
