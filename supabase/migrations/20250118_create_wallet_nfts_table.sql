-- Create wallet_nfts table for storing NFT holdings
-- This table stores NFTs owned by tracked wallet addresses
CREATE TABLE IF NOT EXISTS wallet_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  token_type TEXT NOT NULL, -- ERC721 or ERC1155
  title TEXT,
  description TEXT,
  token_uri TEXT,

  -- Media
  image_url TEXT,
  thumbnail_url TEXT,
  media_type TEXT, -- image, video, audio, etc.

  -- Metadata
  raw_metadata JSONB,
  collection_name TEXT,
  collection_slug TEXT,

  -- Balance (for ERC1155)
  balance TEXT DEFAULT '1',

  -- Floor price (only available for Ethereum mainnet)
  floor_price_eth NUMERIC,
  floor_price_usd NUMERIC,
  floor_price_updated_at TIMESTAMPTZ,

  -- Spam detection
  is_spam BOOLEAN DEFAULT false,
  spam_classification TEXT,

  -- Timestamps
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one record per wallet+chain+contract+tokenId
  UNIQUE(wallet_address, chain, contract_address, token_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wallet_nfts_wallet_chain
  ON wallet_nfts(wallet_address, chain);

CREATE INDEX IF NOT EXISTS idx_wallet_nfts_contract
  ON wallet_nfts(contract_address);

CREATE INDEX IF NOT EXISTS idx_wallet_nfts_updated
  ON wallet_nfts(last_updated);

CREATE INDEX IF NOT EXISTS idx_wallet_nfts_spam
  ON wallet_nfts(is_spam);

-- Add comment
COMMENT ON TABLE wallet_nfts IS 'Stores NFT holdings (ERC-721 and ERC-1155) for tracked wallet addresses across multiple chains';
