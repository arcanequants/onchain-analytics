-- Token Prices Table
-- Stores cryptocurrency price data from CoinGecko API

CREATE TABLE IF NOT EXISTS token_prices (
  id BIGSERIAL PRIMARY KEY,

  -- Token Info
  coingecko_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Price Data (USD)
  current_price DECIMAL(20, 8) NOT NULL,
  market_cap BIGINT,
  market_cap_rank INTEGER,
  total_volume BIGINT,

  -- Price Changes
  price_change_24h DECIMAL(20, 8),
  price_change_percentage_24h DECIMAL(10, 4),
  price_change_percentage_7d DECIMAL(10, 4),
  price_change_percentage_30d DECIMAL(10, 4),

  -- Supply Info
  circulating_supply DECIMAL(30, 2),
  total_supply DECIMAL(30, 2),
  max_supply DECIMAL(30, 2),

  -- All-Time High/Low
  ath DECIMAL(20, 8),
  ath_date TIMESTAMPTZ,
  ath_change_percentage DECIMAL(10, 4),
  atl DECIMAL(20, 8),
  atl_date TIMESTAMPTZ,
  atl_change_percentage DECIMAL(10, 4),

  -- Metadata
  image TEXT,
  last_updated TIMESTAMPTZ NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_token_prices_symbol ON token_prices(symbol);
CREATE INDEX idx_token_prices_coingecko_id ON token_prices(coingecko_id);
CREATE INDEX idx_token_prices_market_cap_rank ON token_prices(market_cap_rank);
CREATE INDEX idx_token_prices_last_updated ON token_prices(last_updated);

-- Unique constraint to prevent duplicates (one entry per token)
CREATE UNIQUE INDEX idx_token_prices_unique_token ON token_prices(coingecko_id, last_updated);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_token_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER token_prices_updated_at
  BEFORE UPDATE ON token_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_token_prices_updated_at();

-- Historical Price Data Table
CREATE TABLE IF NOT EXISTS token_price_history (
  id BIGSERIAL PRIMARY KEY,

  coingecko_id TEXT NOT NULL,
  symbol TEXT NOT NULL,

  -- Price at specific timestamp
  price DECIMAL(20, 8) NOT NULL,
  market_cap BIGINT,
  total_volume BIGINT,

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for historical data
CREATE INDEX idx_token_price_history_coingecko_id ON token_price_history(coingecko_id);
CREATE INDEX idx_token_price_history_symbol ON token_price_history(symbol);
CREATE INDEX idx_token_price_history_timestamp ON token_price_history(timestamp);

-- Unique constraint for historical data (one entry per token per timestamp)
CREATE UNIQUE INDEX idx_token_price_history_unique ON token_price_history(coingecko_id, timestamp);

-- Trending Coins Table
CREATE TABLE IF NOT EXISTS trending_coins (
  id BIGSERIAL PRIMARY KEY,

  coingecko_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,

  -- Trending Metrics
  market_cap_rank INTEGER,
  price_btc DECIMAL(20, 12),
  score INTEGER, -- CoinGecko trending score

  -- Metadata
  thumb TEXT, -- Small image
  large TEXT, -- Large image

  -- Timestamps
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for trending
CREATE INDEX idx_trending_coins_timestamp ON trending_coins(timestamp);
CREATE INDEX idx_trending_coins_score ON trending_coins(score DESC);

-- Comments for documentation
COMMENT ON TABLE token_prices IS 'Current cryptocurrency prices and market data from CoinGecko';
COMMENT ON TABLE token_price_history IS 'Historical cryptocurrency price data for charts';
COMMENT ON TABLE trending_coins IS 'Trending cryptocurrencies from CoinGecko';

COMMENT ON COLUMN token_prices.coingecko_id IS 'CoinGecko unique identifier (e.g., "bitcoin", "ethereum")';
COMMENT ON COLUMN token_prices.market_cap_rank IS 'Rank by market capitalization (1 = largest)';
COMMENT ON COLUMN token_price_history.timestamp IS 'Time when this price was recorded';
COMMENT ON COLUMN trending_coins.score IS 'CoinGecko trending score (higher = more trending)';
