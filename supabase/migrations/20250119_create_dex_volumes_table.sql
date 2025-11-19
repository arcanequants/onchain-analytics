-- Migration: Create DEX volumes table
-- Date: 2025-01-19
-- Description: Track DEX (Decentralized Exchange) trading volumes across multiple chains

-- =====================================================
-- TABLE: dex_volumes
-- =====================================================
CREATE TABLE IF NOT EXISTS dex_volumes (
  id BIGSERIAL PRIMARY KEY,

  -- Protocol identification
  protocol_slug TEXT NOT NULL,          -- e.g., 'uniswap', 'pancakeswap'
  protocol_name TEXT NOT NULL,          -- e.g., 'Uniswap', 'PancakeSwap'
  chain TEXT,                           -- e.g., 'ethereum', 'base', NULL for all chains

  -- Volume metrics (in USD)
  volume_24h NUMERIC,                   -- 24-hour volume
  volume_7d NUMERIC,                    -- 7-day volume
  volume_30d NUMERIC,                   -- 30-day volume
  total_volume NUMERIC,                 -- All-time volume

  -- Change percentages
  change_24h NUMERIC,                   -- 24h volume change %
  change_7d NUMERIC,                    -- 7d volume change %
  change_30d NUMERIC,                   -- 30d volume change %

  -- Additional metadata
  chains_supported TEXT[],              -- Array of supported chains
  dex_type TEXT,                        -- 'spot', 'options', 'aggregator'

  -- Raw data for advanced analytics
  raw_data JSONB,                       -- Full API response

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  data_timestamp TIMESTAMPTZ NOT NULL,  -- When this data snapshot was taken

  -- Unique constraint: one record per protocol/chain/timestamp combination
  CONSTRAINT unique_dex_volume_snapshot
    UNIQUE (protocol_slug, chain, data_timestamp)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Index for protocol lookups
CREATE INDEX IF NOT EXISTS idx_dex_volumes_protocol
  ON dex_volumes(protocol_slug);

-- Index for chain lookups
CREATE INDEX IF NOT EXISTS idx_dex_volumes_chain
  ON dex_volumes(chain);

-- Index for timestamp-based queries (most recent data)
CREATE INDEX IF NOT EXISTS idx_dex_volumes_timestamp
  ON dex_volumes(data_timestamp DESC);

-- Composite index for protocol + chain queries
CREATE INDEX IF NOT EXISTS idx_dex_volumes_protocol_chain
  ON dex_volumes(protocol_slug, chain);

-- Index for volume sorting (find top DEXes)
CREATE INDEX IF NOT EXISTS idx_dex_volumes_volume24h
  ON dex_volumes(volume_24h DESC NULLS LAST);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE dex_volumes ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access (anyone can view DEX data)
CREATE POLICY "Public read access"
  ON dex_volumes
  FOR SELECT
  USING (true);

-- Policy: Service role can insert/update/delete
CREATE POLICY "Service role full access"
  ON dex_volumes
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- HELPER FUNCTION: Get latest DEX volumes
-- =====================================================

CREATE OR REPLACE FUNCTION get_latest_dex_volumes(
  p_protocol_slug TEXT DEFAULT NULL,
  p_chain TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  protocol_slug TEXT,
  protocol_name TEXT,
  chain TEXT,
  volume_24h NUMERIC,
  volume_7d NUMERIC,
  change_24h NUMERIC,
  chains_supported TEXT[],
  data_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH latest_data AS (
    SELECT DISTINCT ON (dv.protocol_slug, dv.chain)
      dv.protocol_slug,
      dv.protocol_name,
      dv.chain,
      dv.volume_24h,
      dv.volume_7d,
      dv.change_24h,
      dv.chains_supported,
      dv.data_timestamp,
      ROW_NUMBER() OVER (PARTITION BY dv.protocol_slug, dv.chain ORDER BY dv.data_timestamp DESC) as rn
    FROM dex_volumes dv
    WHERE
      (p_protocol_slug IS NULL OR dv.protocol_slug = p_protocol_slug)
      AND (p_chain IS NULL OR dv.chain = p_chain)
    ORDER BY dv.protocol_slug, dv.chain, dv.data_timestamp DESC
  )
  SELECT
    ld.protocol_slug,
    ld.protocol_name,
    ld.chain,
    ld.volume_24h,
    ld.volume_7d,
    ld.change_24h,
    ld.chains_supported,
    ld.data_timestamp
  FROM latest_data ld
  WHERE rn = 1
  ORDER BY ld.volume_24h DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- HELPER FUNCTION: Get top DEXes by volume
-- =====================================================

CREATE OR REPLACE FUNCTION get_top_dexes(
  p_chain TEXT DEFAULT NULL,
  p_timeframe TEXT DEFAULT '24h',  -- '24h', '7d', '30d'
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  protocol_slug TEXT,
  protocol_name TEXT,
  chain TEXT,
  volume NUMERIC,
  change_percent NUMERIC,
  data_timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH latest_data AS (
    SELECT DISTINCT ON (dv.protocol_slug, dv.chain)
      dv.protocol_slug,
      dv.protocol_name,
      dv.chain,
      CASE
        WHEN p_timeframe = '24h' THEN dv.volume_24h
        WHEN p_timeframe = '7d' THEN dv.volume_7d
        WHEN p_timeframe = '30d' THEN dv.volume_30d
        ELSE dv.volume_24h
      END as volume,
      CASE
        WHEN p_timeframe = '24h' THEN dv.change_24h
        WHEN p_timeframe = '7d' THEN dv.change_7d
        WHEN p_timeframe = '30d' THEN dv.change_30d
        ELSE dv.change_24h
      END as change_percent,
      dv.data_timestamp
    FROM dex_volumes dv
    WHERE
      (p_chain IS NULL OR dv.chain = p_chain)
    ORDER BY dv.protocol_slug, dv.chain, dv.data_timestamp DESC
  )
  SELECT
    ld.protocol_slug,
    ld.protocol_name,
    ld.chain,
    ld.volume,
    ld.change_percent,
    ld.data_timestamp
  FROM latest_data ld
  ORDER BY ld.volume DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- CLEANUP FUNCTION: Remove old DEX data
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_dex_volumes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep only last 90 days of data
  DELETE FROM dex_volumes
  WHERE data_timestamp < NOW() - INTERVAL '90 days';

  -- Log cleanup
  RAISE NOTICE 'Cleaned up DEX volumes older than 90 days';
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE dex_volumes IS 'Historical DEX trading volume data from DeFiLlama API';
COMMENT ON COLUMN dex_volumes.protocol_slug IS 'Unique identifier for the DEX protocol (lowercase, hyphenated)';
COMMENT ON COLUMN dex_volumes.volume_24h IS '24-hour trading volume in USD';
COMMENT ON COLUMN dex_volumes.chains_supported IS 'Array of blockchain networks where this DEX operates';
COMMENT ON COLUMN dex_volumes.data_timestamp IS 'Timestamp when this data snapshot was recorded';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT SELECT ON dex_volumes TO anon, authenticated;
GRANT ALL ON dex_volumes TO service_role;
GRANT USAGE ON SEQUENCE dex_volumes_id_seq TO service_role;
