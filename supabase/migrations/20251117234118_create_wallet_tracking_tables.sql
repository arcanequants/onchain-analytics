-- =====================================================
-- WALLET TRACKING TABLES
-- Created: 2025-01-17
-- Purpose: Track wallet balances across multiple chains
-- =====================================================

-- Table: wallet_balances
-- Stores current wallet balances for native tokens and ERC-20
CREATE TABLE IF NOT EXISTS wallet_balances (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL, -- ethereum, base, arbitrum, optimism, polygon
  token_address TEXT, -- NULL for native token (ETH, MATIC, etc)
  token_symbol TEXT NOT NULL,
  token_name TEXT,
  token_decimals INTEGER DEFAULT 18,
  balance NUMERIC NOT NULL, -- Raw balance
  balance_formatted NUMERIC, -- Human-readable balance
  balance_usd NUMERIC, -- USD value
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_wallet_chain_token UNIQUE (wallet_address, chain, token_address)
);

-- Table: wallet_nfts
-- Stores NFT holdings
CREATE TABLE IF NOT EXISTS wallet_nfts (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  token_standard TEXT, -- ERC721, ERC1155
  name TEXT,
  description TEXT,
  image_url TEXT,
  metadata JSONB,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_wallet_nft UNIQUE (wallet_address, chain, contract_address, token_id)
);

-- Table: wallet_history
-- Historical snapshots of wallet values
CREATE TABLE IF NOT EXISTS wallet_history (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  total_value_usd NUMERIC NOT NULL,
  token_count INTEGER DEFAULT 0,
  nft_count INTEGER DEFAULT 0,
  snapshot_data JSONB, -- Full snapshot of balances
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tracked_wallets
-- List of wallets being tracked (for CRON updates)
CREATE TABLE IF NOT EXISTS tracked_wallets (
  id BIGSERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  label TEXT, -- User-friendly name
  chains TEXT[] DEFAULT ARRAY['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'],
  auto_refresh BOOLEAN DEFAULT true,
  refresh_interval_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_balances_address ON wallet_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_chain ON wallet_balances(chain);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_updated ON wallet_balances(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_nfts_address ON wallet_nfts(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_nfts_chain ON wallet_nfts(chain);

CREATE INDEX IF NOT EXISTS idx_wallet_history_address ON wallet_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_history_created ON wallet_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tracked_wallets_address ON tracked_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_tracked_wallets_synced ON tracked_wallets(last_synced);

-- Enable Row Level Security (optional, for future user auth)
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_wallets ENABLE ROW LEVEL SECURITY;

-- Create public read policy (anyone can read)
CREATE POLICY "Public read access" ON wallet_balances FOR SELECT USING (true);
CREATE POLICY "Public read access" ON wallet_nfts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON wallet_history FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tracked_wallets FOR SELECT USING (true);

-- Function to clean old history (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_wallet_history()
RETURNS void AS $$
BEGIN
  DELETE FROM wallet_history
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to get wallet summary
CREATE OR REPLACE FUNCTION get_wallet_summary(p_wallet_address TEXT, p_chain TEXT DEFAULT NULL)
RETURNS TABLE (
  total_value_usd NUMERIC,
  token_count BIGINT,
  nft_count BIGINT,
  chains TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(balance_usd), 0) as total_value_usd,
    COUNT(DISTINCT CASE WHEN token_address IS NOT NULL THEN token_address END) as token_count,
    (SELECT COUNT(*) FROM wallet_nfts WHERE wallet_address = p_wallet_address AND (p_chain IS NULL OR chain = p_chain)) as nft_count,
    ARRAY_AGG(DISTINCT chain) as chains
  FROM wallet_balances
  WHERE wallet_address = p_wallet_address
    AND (p_chain IS NULL OR chain = p_chain);
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE wallet_balances IS 'Current token balances for tracked wallets';
COMMENT ON TABLE wallet_nfts IS 'NFT holdings for tracked wallets';
COMMENT ON TABLE wallet_history IS 'Historical snapshots of wallet values';
COMMENT ON TABLE tracked_wallets IS 'List of wallets being actively tracked';
