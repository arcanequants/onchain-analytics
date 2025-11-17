-- Create gas_prices table for historical data storage
CREATE TABLE IF NOT EXISTS gas_prices (
  id BIGSERIAL PRIMARY KEY,
  chain TEXT NOT NULL,
  gas_price DECIMAL NOT NULL,
  block_number BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying by chain and time
CREATE INDEX IF NOT EXISTS idx_gas_prices_chain_created ON gas_prices(chain, created_at DESC);

-- Create index for block number lookups
CREATE INDEX IF NOT EXISTS idx_gas_prices_block ON gas_prices(block_number);

-- Add comment for documentation
COMMENT ON TABLE gas_prices IS 'Historical gas price data across multiple chains';
COMMENT ON COLUMN gas_prices.chain IS 'Chain name (ethereum, base, arbitrum, optimism, polygon)';
COMMENT ON COLUMN gas_prices.gas_price IS 'Gas price in Gwei';
COMMENT ON COLUMN gas_prices.block_number IS 'Block number when price was recorded';
COMMENT ON COLUMN gas_prices.status IS 'Gas price status indicator (low, medium, high)';
