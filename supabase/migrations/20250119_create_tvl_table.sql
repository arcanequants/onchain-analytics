-- Migration: Create TVL (Total Value Locked) table
-- Date: 2025-01-19
-- Description: Track TVL across DeFi protocols and chains

-- =====================================================
-- TABLE: protocol_tvl
-- =====================================================
CREATE TABLE IF NOT EXISTS protocol_tvl (
  id BIGSERIAL PRIMARY KEY,

  -- Protocol identification
  protocol_slug TEXT NOT NULL,          -- e.g., 'uniswap', 'aave', 'curve'
  protocol_name TEXT NOT NULL,          -- e.g., 'Uniswap', 'Aave', 'Curve'
  protocol_symbol TEXT,                 -- e.g., 'UNI', 'AAVE', 'CRV'

  -- Chain information
  chain TEXT,                           -- e.g., 'ethereum', 'base', NULL for all chains

  -- TVL metrics (in USD)
  tvl NUMERIC NOT NULL,                 -- Current total value locked
  tvl_prev_day NUMERIC,                 -- TVL 24h ago
  tvl_prev_week NUMERIC,                -- TVL 7d ago
  tvl_prev_month NUMERIC,               -- TVL 30d ago

  -- Change metrics
  change_1h NUMERIC,                    -- 1h TVL change %
  change_1d NUMERIC,                    -- 24h TVL change %
  change_7d NUMERIC,                    -- 7d TVL change %
  change_1m NUMERIC,                    -- 30d TVL change %

  -- Market metrics
  mcap NUMERIC,                         -- Market capitalization
  mcap_tvl_ratio NUMERIC,               -- Market cap to TVL ratio

  -- Additional metadata
  category TEXT,                        -- 'Dexes', 'Lending', 'Yield', 'Bridge', etc.
  chains_supported TEXT[],              -- Array of supported chains
  logo_url TEXT,                        -- Protocol logo URL
  url TEXT,                             -- Protocol website URL

  -- Raw data for advanced analytics
  raw_data JSONB,                       -- Full API response

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data_timestamp TIMESTAMPTZ NOT NULL,  -- When this data snapshot was taken

  -- Unique constraint: one record per protocol/chain/timestamp combination
  CONSTRAINT unique_tvl_snapshot
    UNIQUE (protocol_slug, chain, data_timestamp)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for protocol lookups
CREATE INDEX IF NOT EXISTS idx_protocol_tvl_protocol
  ON protocol_tvl(protocol_slug);

-- Index for chain lookups
CREATE INDEX IF NOT EXISTS idx_protocol_tvl_chain
  ON protocol_tvl(chain);

-- Index for timestamp-based queries (most recent data)
CREATE INDEX IF NOT EXISTS idx_protocol_tvl_timestamp
  ON protocol_tvl(data_timestamp DESC);

-- Composite index for protocol + chain queries
CREATE INDEX IF NOT EXISTS idx_protocol_tvl_protocol_chain
  ON protocol_tvl(protocol_slug, chain);

-- Index for TVL sorting (find top protocols by TVL)
CREATE INDEX IF NOT EXISTS idx_protocol_tvl_tvl
  ON protocol_tvl(tvl DESC NULLS LAST);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_protocol_tvl_category
  ON protocol_tvl(category);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE protocol_tvl ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (anyone can view TVL data)
CREATE POLICY "Public read access"
  ON protocol_tvl
  FOR SELECT
  USING (true);

-- Policy: Service role can insert/update/delete
CREATE POLICY "Service role full access"
  ON protocol_tvl
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- HELPER FUNCTION: Get latest protocol TVL
-- =====================================================

CREATE OR REPLACE FUNCTION get_latest_protocol_tvl(
  p_protocol_slug TEXT DEFAULT NULL,
  p_chain TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  protocol_slug TEXT,
  protocol_name TEXT,
  chain TEXT,
  tvl NUMERIC,
  change_1d NUMERIC,
  change_7d NUMERIC,
  category TEXT,
  chains_supported TEXT[],
  data_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH latest_data AS (
    SELECT DISTINCT ON (pt.protocol_slug, pt.chain)
      pt.protocol_slug,
      pt.protocol_name,
      pt.chain,
      pt.tvl,
      pt.change_1d,
      pt.change_7d,
      pt.category,
      pt.chains_supported,
      pt.data_timestamp,
      ROW_NUMBER() OVER (PARTITION BY pt.protocol_slug, pt.chain ORDER BY pt.data_timestamp DESC) as rn
    FROM protocol_tvl pt
    WHERE
      (p_protocol_slug IS NULL OR pt.protocol_slug = p_protocol_slug)
      AND (p_chain IS NULL OR pt.chain = p_chain)
      AND (p_category IS NULL OR pt.category = p_category)
    ORDER BY pt.protocol_slug, pt.chain, pt.data_timestamp DESC
  )
  SELECT
    ld.protocol_slug,
    ld.protocol_name,
    ld.chain,
    ld.tvl,
    ld.change_1d,
    ld.change_7d,
    ld.category,
    ld.chains_supported,
    ld.data_timestamp
  FROM latest_data ld
  WHERE rn = 1
  ORDER BY ld.tvl DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Get top protocols by TVL
-- =====================================================

CREATE OR REPLACE FUNCTION get_top_protocols_by_tvl(
  p_chain TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  protocol_slug TEXT,
  protocol_name TEXT,
  chain TEXT,
  tvl NUMERIC,
  change_1d NUMERIC,
  change_7d NUMERIC,
  category TEXT,
  mcap_tvl_ratio NUMERIC,
  data_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH latest_data AS (
    SELECT DISTINCT ON (pt.protocol_slug, pt.chain)
      pt.protocol_slug,
      pt.protocol_name,
      pt.chain,
      pt.tvl,
      pt.change_1d,
      pt.change_7d,
      pt.category,
      pt.mcap_tvl_ratio,
      pt.data_timestamp
    FROM protocol_tvl pt
    WHERE
      (p_chain IS NULL OR pt.chain = p_chain)
      AND (p_category IS NULL OR pt.category = p_category)
    ORDER BY pt.protocol_slug, pt.chain, pt.data_timestamp DESC
  )
  SELECT
    ld.protocol_slug,
    ld.protocol_name,
    ld.chain,
    ld.tvl,
    ld.change_1d,
    ld.change_7d,
    ld.category,
    ld.mcap_tvl_ratio,
    ld.data_timestamp
  FROM latest_data ld
  ORDER BY ld.tvl DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Get TVL history for a protocol
-- =====================================================

CREATE OR REPLACE FUNCTION get_protocol_tvl_history(
  p_protocol_slug TEXT,
  p_chain TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  tvl NUMERIC,
  change_1d NUMERIC,
  data_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.tvl,
    pt.change_1d,
    pt.data_timestamp
  FROM protocol_tvl pt
  WHERE
    pt.protocol_slug = p_protocol_slug
    AND (p_chain IS NULL OR pt.chain = p_chain)
    AND pt.data_timestamp >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY pt.data_timestamp ASC;
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Get TVL by category
-- =====================================================

CREATE OR REPLACE FUNCTION get_tvl_by_category(
  p_chain TEXT DEFAULT NULL
)
RETURNS TABLE (
  category TEXT,
  total_tvl NUMERIC,
  protocol_count BIGINT,
  avg_change_1d NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH latest_data AS (
    SELECT DISTINCT ON (pt.protocol_slug, pt.chain)
      pt.category,
      pt.tvl,
      pt.change_1d
    FROM protocol_tvl pt
    WHERE
      (p_chain IS NULL OR pt.chain = p_chain)
    ORDER BY pt.protocol_slug, pt.chain, pt.data_timestamp DESC
  )
  SELECT
    ld.category,
    SUM(ld.tvl) as total_tvl,
    COUNT(*) as protocol_count,
    AVG(ld.change_1d) as avg_change_1d
  FROM latest_data ld
  WHERE ld.category IS NOT NULL
  GROUP BY ld.category
  ORDER BY total_tvl DESC;
END;
$$;

-- =====================================================
-- CLEANUP FUNCTION: Remove old TVL data
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_tvl()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep only last 90 days of data
  DELETE FROM protocol_tvl
  WHERE data_timestamp < NOW() - INTERVAL '90 days';

  -- Log cleanup
  RAISE NOTICE 'Cleaned up TVL data older than 90 days';
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE protocol_tvl IS 'Historical Total Value Locked data from DeFiLlama API';
COMMENT ON COLUMN protocol_tvl.protocol_slug IS 'Unique identifier for the protocol (lowercase, hyphenated)';
COMMENT ON COLUMN protocol_tvl.tvl IS 'Current total value locked in USD';
COMMENT ON COLUMN protocol_tvl.mcap_tvl_ratio IS 'Market cap to TVL ratio (higher = potentially overvalued)';
COMMENT ON COLUMN protocol_tvl.category IS 'Protocol category (Dexes, Lending, Yield, etc.)';
COMMENT ON COLUMN protocol_tvl.data_timestamp IS 'Timestamp when this data snapshot was recorded';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT SELECT ON protocol_tvl TO anon, authenticated;
GRANT ALL ON protocol_tvl TO service_role;
GRANT USAGE ON SEQUENCE protocol_tvl_id_seq TO service_role;
