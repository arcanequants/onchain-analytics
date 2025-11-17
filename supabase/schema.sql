-- ================================================================
-- COMPLETE DATABASE SCHEMA FOR ONCHAIN ANALYTICS
-- Version: 3.0
-- Date: 2025-01-17
-- Status: DEPLOYING TO PRODUCTION
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE 1: gas_prices (for Gas Tracker)
-- ================================================================
CREATE TABLE IF NOT EXISTS gas_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chain TEXT NOT NULL CHECK (chain IN ('ethereum', 'base', 'arbitrum', 'optimism', 'polygon')),
  gas_price NUMERIC(20, 2) NOT NULL, -- in Gwei
  block_number BIGINT NOT NULL,
  base_fee NUMERIC(20, 2), -- EIP-1559 base fee (Gwei)
  priority_fee NUMERIC(20, 2), -- EIP-1559 priority fee (Gwei)
  status TEXT NOT NULL CHECK (status IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for gas_prices
CREATE INDEX IF NOT EXISTS idx_gas_prices_chain_created ON gas_prices(chain, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gas_prices_created ON gas_prices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gas_prices_status ON gas_prices(status);

-- RLS for gas_prices
ALTER TABLE gas_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON gas_prices;
CREATE POLICY "Public read access" ON gas_prices FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role write" ON gas_prices;
CREATE POLICY "Service role write" ON gas_prices FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ================================================================
-- TABLE 2: cron_executions (for CRON job monitoring)
-- ================================================================
CREATE TABLE IF NOT EXISTS cron_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failure')),
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for cron_executions
CREATE INDEX IF NOT EXISTS idx_cron_executions_job_name ON cron_executions(job_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_executions_status ON cron_executions(status);

-- RLS for cron_executions
ALTER TABLE cron_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON cron_executions;
CREATE POLICY "Service role only" ON cron_executions FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 3: fear_greed_index (for Fear & Greed Index - Month 1)
-- ================================================================
CREATE TABLE IF NOT EXISTS fear_greed_index (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 100),
  classification TEXT NOT NULL CHECK (classification IN ('extreme_fear', 'fear', 'neutral', 'greed', 'extreme_greed')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  volatility NUMERIC(10, 2),
  market_momentum NUMERIC(10, 2),
  social_media NUMERIC(10, 2),
  surveys NUMERIC(10, 2),
  bitcoin_dominance NUMERIC(10, 2),
  google_trends NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fear_greed_timestamp ON fear_greed_index(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fear_greed_classification ON fear_greed_index(classification);

-- RLS
ALTER TABLE fear_greed_index ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON fear_greed_index;
CREATE POLICY "Public read access" ON fear_greed_index FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role write" ON fear_greed_index;
CREATE POLICY "Service role write" ON fear_greed_index FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ================================================================
-- TABLE 4: events (for Event Calendar - Month 1)
-- ================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('unlock', 'airdrop', 'listing', 'mainnet', 'upgrade', 'halving', 'hardfork', 'conference')),
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  project_name TEXT NOT NULL,
  project_symbol TEXT,
  project_logo_url TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  importance TEXT NOT NULL DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type_date ON events(event_type, event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_importance ON events(importance);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON events;
CREATE POLICY "Public read access" ON events FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role write" ON events;
CREATE POLICY "Service role write" ON events FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- ================================================================
-- TABLE 5: event_submissions (for user-submitted events - Month 1)
-- ================================================================
CREATE TABLE IF NOT EXISTS event_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  project_name TEXT NOT NULL,
  project_symbol TEXT,
  source_url TEXT,
  submitted_by TEXT NOT NULL, -- email
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON event_submissions(status);
CREATE INDEX IF NOT EXISTS idx_event_submissions_created ON event_submissions(created_at DESC);

-- RLS
ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can submit" ON event_submissions;
CREATE POLICY "Public can submit" ON event_submissions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service role can manage" ON event_submissions;
CREATE POLICY "Service role can manage" ON event_submissions FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 6: users (for API & Premium features - Month 2)
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trial')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 7: api_keys (for API access - Month 2)
-- ================================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL, -- bcrypt hash of the API key
  key_prefix TEXT NOT NULL, -- first 8 chars for display
  name TEXT NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  rate_limit INTEGER NOT NULL DEFAULT 100, -- calls per day
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own keys" ON api_keys;
CREATE POLICY "Users can read own keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own keys" ON api_keys;
CREATE POLICY "Users can create own keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access" ON api_keys;
CREATE POLICY "Service role full access" ON api_keys FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 8: api_requests (for API usage tracking - Month 2)
-- ================================================================
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_api_requests_key ON api_requests(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_requests_created ON api_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON api_requests(endpoint, created_at DESC);

-- RLS
ALTER TABLE api_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON api_requests;
CREATE POLICY "Service role only" ON api_requests FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 9: subscriptions (for Stripe billing - Month 2)
-- ================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('basic', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own subscriptions" ON subscriptions;
CREATE POLICY "Users can read own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role full access" ON subscriptions;
CREATE POLICY "Service role full access" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 10: analytics_events (for custom analytics - Week 1)
-- ================================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  event_properties JSONB,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can insert events" ON analytics_events;
CREATE POLICY "Public can insert events" ON analytics_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Service role read access" ON analytics_events;
CREATE POLICY "Service role read access" ON analytics_events FOR SELECT USING (auth.role() = 'service_role');

-- ================================================================
-- TABLE 11: backfill_jobs (for historical data backfill - Month 1)
-- ================================================================
CREATE TABLE IF NOT EXISTS backfill_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL CHECK (job_type IN ('gas_prices', 'fear_greed', 'events')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_backfill_jobs_type_status ON backfill_jobs(job_type, status);
CREATE INDEX IF NOT EXISTS idx_backfill_jobs_created ON backfill_jobs(created_at DESC);

-- RLS
ALTER TABLE backfill_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON backfill_jobs;
CREATE POLICY "Service role only" ON backfill_jobs FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- MATERIALIZED VIEWS (for performance optimization)
-- ================================================================

-- View 1: Hourly average gas prices
DROP MATERIALIZED VIEW IF EXISTS gas_prices_hourly CASCADE;
CREATE MATERIALIZED VIEW gas_prices_hourly AS
SELECT
  chain,
  DATE_TRUNC('hour', created_at) as hour,
  AVG(gas_price) as avg_gas_price,
  MIN(gas_price) as min_gas_price,
  MAX(gas_price) as max_gas_price,
  COUNT(*) as samples
FROM gas_prices
GROUP BY chain, DATE_TRUNC('hour', created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gas_prices_hourly_unique ON gas_prices_hourly(chain, hour);

-- View 2: Daily API usage by key
DROP MATERIALIZED VIEW IF EXISTS api_usage_daily CASCADE;
CREATE MATERIALIZED VIEW api_usage_daily AS
SELECT
  api_key_id,
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as request_count,
  AVG(response_time_ms) as avg_response_time,
  COUNT(CASE WHEN status_code >= 500 THEN 1 END) as error_count
FROM api_requests
WHERE api_key_id IS NOT NULL
GROUP BY api_key_id, DATE_TRUNC('day', created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_usage_daily_unique ON api_usage_daily(api_key_id, day);

-- ================================================================
-- FUNCTIONS (for automated tasks)
-- ================================================================

-- Function 1: Refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY gas_prices_hourly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY api_usage_daily;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Cleanup old data (keep last 30 days for gas_prices)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- Delete gas prices older than 30 days
  DELETE FROM gas_prices WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete CRON executions older than 7 days
  DELETE FROM cron_executions WHERE created_at < NOW() - INTERVAL '7 days';

  -- Delete analytics events older than 90 days
  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';

  -- Delete API requests older than 90 days
  DELETE FROM api_requests WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- DEPLOYMENT COMPLETE! ✅
-- ================================================================

-- Verification queries (run these after deployment):
-- \dt -- List all tables (should show 11 tables)
-- \dm -- List all materialized views (should show 2 views)
-- \df -- List all functions (should show 2 functions)
-- SELECT * FROM gas_prices LIMIT 1; -- Test gas_prices table
-- SELECT * FROM cron_executions LIMIT 1; -- Test cron_executions table
