-- ============================================================================
-- Data Dictionary Table Migration
-- Phase 4, Week 8 Extended
--
-- This table provides documentation for database entities, columns, and
-- business definitions to aid developers and analysts.
-- ============================================================================

-- Create data_dictionary table
CREATE TABLE IF NOT EXISTS data_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Term identification
  term VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,

  -- Definition
  definition TEXT NOT NULL,
  extended_definition TEXT,

  -- Categorization
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),

  -- Technical details (for DB columns/tables)
  table_name VARCHAR(100),
  column_name VARCHAR(100),
  data_type VARCHAR(50),
  is_required BOOLEAN,
  default_value TEXT,

  -- Business context
  business_owner VARCHAR(200),
  data_steward VARCHAR(200),
  sensitivity_level VARCHAR(50) DEFAULT 'internal',  -- public, internal, confidential, restricted

  -- Examples and usage
  example_values TEXT[],
  formula TEXT,
  calculation_notes TEXT,

  -- Related terms
  related_terms TEXT[],
  synonyms TEXT[],
  see_also TEXT[],

  -- Metadata
  source VARCHAR(200),
  last_reviewed_at TIMESTAMPTZ,
  last_reviewed_by VARCHAR(200),
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'active',  -- active, deprecated, draft

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_data_dict_term ON data_dictionary(term);
CREATE INDEX idx_data_dict_slug ON data_dictionary(slug);
CREATE INDEX idx_data_dict_category ON data_dictionary(category);
CREATE INDEX idx_data_dict_table ON data_dictionary(table_name) WHERE table_name IS NOT NULL;
CREATE INDEX idx_data_dict_tags ON data_dictionary USING GIN(tags);
CREATE INDEX idx_data_dict_search ON data_dictionary USING GIN(to_tsvector('english', term || ' ' || definition));

-- Add RLS policies
ALTER TABLE data_dictionary ENABLE ROW LEVEL SECURITY;

-- Everyone can read the data dictionary
CREATE POLICY "Anyone can read data dictionary" ON data_dictionary
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify data dictionary" ON data_dictionary
  FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER trigger_data_dictionary_updated_at
  BEFORE UPDATE ON data_dictionary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Insert Data Dictionary Definitions (50+ entries)
-- ============================================================================

INSERT INTO data_dictionary (term, slug, definition, extended_definition, category, subcategory, table_name, column_name, data_type, example_values, related_terms, tags) VALUES

-- ============================================================================
-- Token/Price Metrics (15 entries)
-- ============================================================================
(
  'Current Price',
  'current-price',
  'The most recent trading price of a token in USD',
  'This value is updated every 5 minutes from CoinGecko API and represents the latest spot price across major exchanges.',
  'Tokens',
  'Price Metrics',
  'token_prices',
  'current_price',
  'DECIMAL',
  ARRAY['97500.00', '3650.50', '235.25'],
  ARRAY['Market Cap', 'Trading Volume'],
  ARRAY['price', 'token', 'market']
),
(
  'Market Cap',
  'market-cap',
  'Total market value of a token calculated as current price multiplied by circulating supply',
  'Market capitalization is a key metric for comparing the relative size of different cryptocurrencies. It represents the total value of all tokens currently in circulation.',
  'Tokens',
  'Price Metrics',
  'token_prices',
  'market_cap',
  'DECIMAL',
  ARRAY['1900000000000', '440000000000'],
  ARRAY['Current Price', 'Circulating Supply', 'FDV'],
  ARRAY['market', 'valuation', 'token']
),
(
  'Market Cap Rank',
  'market-cap-rank',
  'Ranking of a token by market capitalization relative to all other tracked tokens',
  'A lower number indicates a larger market cap. Bitcoin is typically rank 1, Ethereum rank 2, etc.',
  'Tokens',
  'Rankings',
  'token_prices',
  'market_cap_rank',
  'INTEGER',
  ARRAY['1', '2', '3', '50', '100'],
  ARRAY['Market Cap'],
  ARRAY['ranking', 'token']
),
(
  'Trading Volume (24h)',
  'trading-volume-24h',
  'Total trading volume across all exchanges in the last 24 hours',
  'High volume indicates strong market interest and liquidity. Volume spikes often precede or accompany significant price movements.',
  'Tokens',
  'Price Metrics',
  'token_prices',
  'total_volume',
  'DECIMAL',
  ARRAY['50000000000', '15000000000'],
  ARRAY['Liquidity', 'Market Cap'],
  ARRAY['volume', 'trading', 'liquidity']
),
(
  'Price Change (24h)',
  'price-change-24h',
  'Absolute price change in USD over the last 24 hours',
  'Can be positive (price increased) or negative (price decreased).',
  'Tokens',
  'Price Metrics',
  'token_prices',
  'price_change_24h',
  'DECIMAL',
  ARRAY['1500.00', '-250.50', '0.05'],
  ARRAY['Price Change %'],
  ARRAY['price', 'change', 'daily']
),
(
  'Price Change Percentage (24h)',
  'price-change-percentage-24h',
  'Percentage price change over the last 24 hours',
  'Expressed as a percentage. A value of 5.5 means the price increased by 5.5% in the last 24 hours.',
  'Tokens',
  'Price Metrics',
  'token_prices',
  'price_change_percentage_24h',
  'DECIMAL',
  ARRAY['5.50', '-2.30', '0.15'],
  ARRAY['Price Change 24h'],
  ARRAY['price', 'change', 'percentage']
),
(
  'Circulating Supply',
  'circulating-supply',
  'Number of tokens currently available and circulating in the market',
  'Excludes locked, reserved, or burned tokens. This is the supply used to calculate market cap.',
  'Tokens',
  'Supply Metrics',
  'token_prices',
  'circulating_supply',
  'DECIMAL',
  ARRAY['19500000', '120000000'],
  ARRAY['Total Supply', 'Max Supply', 'Market Cap'],
  ARRAY['supply', 'token']
),
(
  'Total Supply',
  'total-supply',
  'Total number of tokens that currently exist, including locked or reserved tokens',
  'Total supply minus burned tokens. May be higher than circulating supply.',
  'Tokens',
  'Supply Metrics',
  'token_prices',
  'total_supply',
  'DECIMAL',
  ARRAY['21000000', '150000000'],
  ARRAY['Circulating Supply', 'Max Supply'],
  ARRAY['supply', 'token']
),
(
  'All-Time High (ATH)',
  'all-time-high',
  'The highest price ever recorded for a token',
  'Historical maximum price. Useful for understanding how far current price is from peak.',
  'Tokens',
  'Price Metrics',
  'token_prices',
  'ath',
  'DECIMAL',
  ARRAY['69000.00', '4800.00'],
  ARRAY['ATL', 'Current Price'],
  ARRAY['price', 'historical', 'peak']
),
(
  'All-Time Low (ATL)',
  'all-time-low',
  'The lowest price ever recorded for a token',
  'Historical minimum price. Useful for understanding price range and volatility.',
  'Tokens',
  'Price Metrics',
  'token_prices',
  'atl',
  'DECIMAL',
  ARRAY['0.01', '0.43'],
  ARRAY['ATH', 'Current Price'],
  ARRAY['price', 'historical', 'floor']
),
(
  'CoinGecko ID',
  'coingecko-id',
  'Unique identifier used by CoinGecko API to reference a token',
  'Used as the primary key for token price data. Format is lowercase with hyphens.',
  'Tokens',
  'Identifiers',
  'token_prices',
  'coingecko_id',
  'VARCHAR',
  ARRAY['bitcoin', 'ethereum', 'solana'],
  ARRAY['Symbol'],
  ARRAY['identifier', 'api']
),
(
  'Token Symbol',
  'token-symbol',
  'Short ticker symbol representing a token',
  'Usually 3-5 uppercase letters. Used for display and quick reference.',
  'Tokens',
  'Identifiers',
  'token_prices',
  'symbol',
  'VARCHAR',
  ARRAY['BTC', 'ETH', 'SOL', 'USDC'],
  ARRAY['CoinGecko ID', 'Token Name'],
  ARRAY['identifier', 'symbol']
),
(
  'Fully Diluted Valuation (FDV)',
  'fully-diluted-valuation',
  'Theoretical market cap if all possible tokens were in circulation',
  'Calculated as current price × max supply. Useful for comparing valuations accounting for future token issuance.',
  'Tokens',
  'Valuation Metrics',
  NULL,
  NULL,
  'DECIMAL',
  ARRAY['2000000000000'],
  ARRAY['Market Cap', 'Max Supply'],
  ARRAY['valuation', 'fdv']
),
(
  'Volume/Market Cap Ratio',
  'volume-mcap-ratio',
  'Ratio of 24h trading volume to market cap',
  'Higher ratio indicates more active trading relative to size. Typical healthy range is 0.02-0.1.',
  'Tokens',
  'Derived Metrics',
  NULL,
  NULL,
  'DECIMAL',
  ARRAY['0.05', '0.12', '0.03'],
  ARRAY['Trading Volume', 'Market Cap'],
  ARRAY['ratio', 'liquidity']
),
(
  'Price Volatility',
  'price-volatility',
  'Measure of price variation over a time period',
  'Typically measured as standard deviation of returns. Higher volatility means more price uncertainty.',
  'Tokens',
  'Risk Metrics',
  NULL,
  NULL,
  'DECIMAL',
  ARRAY['0.45', '0.65', '0.85'],
  ARRAY['Price Change %'],
  ARRAY['volatility', 'risk']
),

-- ============================================================================
-- TVL Metrics (10 entries)
-- ============================================================================
(
  'Total Value Locked (TVL)',
  'total-value-locked',
  'Total USD value of assets deposited in a DeFi protocol',
  'TVL is the most common metric for measuring the size and adoption of DeFi protocols. Higher TVL generally indicates more trust and usage.',
  'DeFi',
  'TVL Metrics',
  'protocol_tvl',
  'tvl',
  'DECIMAL',
  ARRAY['25000000000', '18000000000'],
  ARRAY['TVL Change 1d', 'TVL Change 7d'],
  ARRAY['tvl', 'defi', 'protocol']
),
(
  'TVL Change (1 Day)',
  'tvl-change-1d',
  'Percentage change in TVL over the last 24 hours',
  'Positive values indicate inflows, negative values indicate outflows.',
  'DeFi',
  'TVL Metrics',
  'protocol_tvl',
  'tvl_change_1d',
  'DECIMAL',
  ARRAY['2.50', '-1.30', '0.00'],
  ARRAY['TVL', 'TVL Change 7d'],
  ARRAY['tvl', 'change']
),
(
  'TVL Change (7 Days)',
  'tvl-change-7d',
  'Percentage change in TVL over the last 7 days',
  'Weekly change provides a smoother view of TVL trends than daily.',
  'DeFi',
  'TVL Metrics',
  'protocol_tvl',
  'tvl_change_7d',
  'DECIMAL',
  ARRAY['5.00', '-3.50'],
  ARRAY['TVL', 'TVL Change 1d'],
  ARRAY['tvl', 'change', 'weekly']
),
(
  'Protocol Category',
  'protocol-category',
  'Classification of a DeFi protocol by its primary function',
  'Categories include DEX, Lending, Bridge, Liquid Staking, CDP, Derivatives, Yield, and more.',
  'DeFi',
  'Classification',
  'protocol_tvl',
  'category',
  'VARCHAR',
  ARRAY['DEX', 'Lending', 'Liquid Staking', 'Bridge'],
  ARRAY['Protocol Chain'],
  ARRAY['category', 'defi']
),
(
  'Protocol Chain',
  'protocol-chain',
  'Primary blockchain where a protocol operates',
  'Some protocols are multi-chain and operate on multiple blockchains.',
  'DeFi',
  'Classification',
  'protocol_tvl',
  'chain',
  'VARCHAR',
  ARRAY['ethereum', 'base', 'arbitrum', 'multi-chain'],
  ARRAY['Protocol Category'],
  ARRAY['chain', 'blockchain']
),
(
  'Chains Supported',
  'chains-supported',
  'List of all blockchains where a protocol is deployed',
  'Multi-chain protocols may have different TVL on each chain.',
  'DeFi',
  'Deployment',
  'protocol_tvl',
  'chains_supported',
  'ARRAY',
  ARRAY['ethereum,base,arbitrum', 'ethereum,polygon'],
  ARRAY['Protocol Chain'],
  ARRAY['chain', 'multichain']
),
(
  'DeFiLlama ID',
  'defillama-id',
  'Unique identifier used by DeFiLlama API for a protocol',
  'Used to fetch TVL data from the DeFiLlama API.',
  'DeFi',
  'Identifiers',
  'protocol_tvl',
  'protocol_id',
  'VARCHAR',
  ARRAY['lido', 'aave', 'uniswap'],
  ARRAY['Protocol Name'],
  ARRAY['identifier', 'api']
),
(
  'TVL Dominance',
  'tvl-dominance',
  'Percentage of total DeFi TVL held by a specific protocol',
  'Calculated as protocol TVL / total DeFi TVL × 100.',
  'DeFi',
  'Derived Metrics',
  NULL,
  NULL,
  'DECIMAL',
  ARRAY['25.5', '15.3', '8.2'],
  ARRAY['TVL', 'Market Share'],
  ARRAY['tvl', 'dominance', 'share']
),
(
  'TVL per Chain',
  'tvl-per-chain',
  'TVL breakdown by blockchain for multi-chain protocols',
  'Useful for understanding where protocol liquidity is concentrated.',
  'DeFi',
  'Derived Metrics',
  NULL,
  NULL,
  'JSONB',
  ARRAY['{"ethereum": 15B, "arbitrum": 2B}'],
  ARRAY['TVL', 'Chains Supported'],
  ARRAY['tvl', 'chain', 'breakdown']
),
(
  'Yield Rate',
  'yield-rate',
  'Annual percentage yield (APY) offered by a protocol',
  'Expressed as annual percentage. Actual returns may vary.',
  'DeFi',
  'Yield Metrics',
  NULL,
  NULL,
  'DECIMAL',
  ARRAY['4.5', '8.2', '15.0'],
  ARRAY['TVL', 'Protocol Category'],
  ARRAY['yield', 'apy', 'returns']
),

-- ============================================================================
-- Gas Metrics (8 entries)
-- ============================================================================
(
  'Base Fee (Gwei)',
  'base-fee-gwei',
  'Base gas fee in Gwei for the current block',
  'On EIP-1559 chains, this is the minimum fee required for transaction inclusion. This fee is burned.',
  'Gas',
  'Fee Metrics',
  'gas_metrics',
  'base_fee_gwei',
  'DECIMAL',
  ARRAY['15.5', '0.001', '25.0'],
  ARRAY['Priority Fee', 'Gas Price'],
  ARRAY['gas', 'fee', 'eip1559']
),
(
  'Priority Fee (Gwei)',
  'priority-fee-gwei',
  'Additional tip to validators/miners for transaction prioritization',
  'Higher priority fee results in faster transaction inclusion.',
  'Gas',
  'Fee Metrics',
  'gas_metrics',
  'priority_fee_gwei',
  'DECIMAL',
  ARRAY['1.5', '0.0001', '5.0'],
  ARRAY['Base Fee', 'Gas Price'],
  ARRAY['gas', 'fee', 'tip']
),
(
  'Gas Used',
  'gas-used',
  'Total gas consumed by all transactions in a block',
  'Represents actual computational work performed.',
  'Gas',
  'Block Metrics',
  'gas_metrics',
  'gas_used',
  'INTEGER',
  ARRAY['12500000', '15000000'],
  ARRAY['Gas Limit', 'Utilization'],
  ARRAY['gas', 'block']
),
(
  'Gas Limit',
  'gas-limit',
  'Maximum gas allowed per block',
  'Set by network consensus. Ethereum mainnet is typically around 30M.',
  'Gas',
  'Block Metrics',
  'gas_metrics',
  'gas_limit',
  'INTEGER',
  ARRAY['30000000', '15000000'],
  ARRAY['Gas Used', 'Utilization'],
  ARRAY['gas', 'block', 'limit']
),
(
  'Block Utilization',
  'block-utilization',
  'Percentage of block gas limit that was used',
  'High utilization (>80%) may indicate network congestion.',
  'Gas',
  'Derived Metrics',
  'gas_metrics',
  'utilization_percent',
  'DECIMAL',
  ARRAY['85.5', '42.0', '95.0'],
  ARRAY['Gas Used', 'Gas Limit'],
  ARRAY['gas', 'utilization', 'congestion']
),
(
  'Block Number',
  'block-number',
  'Sequential number identifying a specific block on the blockchain',
  'Blocks are numbered sequentially from the genesis block (block 0).',
  'Gas',
  'Block Metrics',
  'gas_metrics',
  'block_number',
  'INTEGER',
  ARRAY['20000000', '15000000'],
  ARRAY['Block Timestamp'],
  ARRAY['block', 'identifier']
),
(
  'Gwei',
  'gwei',
  'Unit of Ethereum gas pricing equal to 10^-9 ETH (1 billion Gwei = 1 ETH)',
  'Standard unit for expressing gas prices. Named after Wei Dai.',
  'Gas',
  'Units',
  NULL,
  NULL,
  'DECIMAL',
  ARRAY['15', '0.001', '100'],
  ARRAY['Wei', 'ETH'],
  ARRAY['unit', 'gas']
),
(
  'Transaction Cost (USD)',
  'transaction-cost-usd',
  'Total cost of a transaction in USD',
  'Calculated as: (base_fee + priority_fee) × gas_used × ETH_price',
  'Gas',
  'Derived Metrics',
  NULL,
  NULL,
  'DECIMAL',
  ARRAY['2.50', '0.01', '25.00'],
  ARRAY['Base Fee', 'Gas Used'],
  ARRAY['cost', 'transaction']
),

-- ============================================================================
-- Wallet Metrics (8 entries)
-- ============================================================================
(
  'Wallet Address',
  'wallet-address',
  'Unique identifier for a blockchain account (typically 42 character hex string starting with 0x)',
  'On EVM chains, addresses are derived from public keys and follow the format 0x followed by 40 hexadecimal characters.',
  'Wallets',
  'Identifiers',
  'tracked_wallets',
  'address',
  'VARCHAR',
  ARRAY['0x1234...5678', '0xdead...beef'],
  ARRAY['ENS Name'],
  ARRAY['address', 'wallet', 'account']
),
(
  'Wallet Label',
  'wallet-label',
  'Human-readable name or description for a wallet',
  'Optional field used to identify known wallets (exchanges, protocols, whales, etc.)',
  'Wallets',
  'Identification',
  'tracked_wallets',
  'label',
  'VARCHAR',
  ARRAY['Binance Hot Wallet', 'Vitalik.eth', 'DeFi Whale #1'],
  ARRAY['Wallet Address'],
  ARRAY['label', 'name', 'identity']
),
(
  'Wallet Balance (USD)',
  'wallet-balance-usd',
  'Total value of all token holdings in a wallet in USD',
  'Sum of all token balances × their current prices.',
  'Wallets',
  'Balance Metrics',
  'wallet_balances',
  'balance_usd',
  'DECIMAL',
  ARRAY['125000.00', '1500000.00'],
  ARRAY['Token Balance'],
  ARRAY['balance', 'portfolio', 'value']
),
(
  'Token Balance',
  'token-balance',
  'Quantity of a specific token held in a wallet',
  'Raw token amount, not USD value. Must multiply by price for value.',
  'Wallets',
  'Balance Metrics',
  'wallet_balances',
  'balance',
  'VARCHAR',
  ARRAY['50.125', '1500.00'],
  ARRAY['Balance USD'],
  ARRAY['balance', 'tokens']
),
(
  'First Seen',
  'first-seen',
  'Timestamp when a wallet was first detected by the system',
  'May not be the actual wallet creation date.',
  'Wallets',
  'Activity Metrics',
  'tracked_wallets',
  'first_seen',
  'TIMESTAMPTZ',
  ARRAY['2024-01-15T10:30:00Z'],
  ARRAY['Last Activity'],
  ARRAY['timestamp', 'tracking']
),
(
  'Last Activity',
  'last-activity',
  'Timestamp of the most recent transaction involving this wallet',
  'Used to determine if a wallet is still active.',
  'Wallets',
  'Activity Metrics',
  'tracked_wallets',
  'last_activity',
  'TIMESTAMPTZ',
  ARRAY['2025-01-15T10:30:00Z'],
  ARRAY['First Seen', 'Is Active'],
  ARRAY['timestamp', 'activity']
),
(
  'Wallet Tags',
  'wallet-tags',
  'Categorization labels applied to a wallet',
  'Used for filtering and grouping wallets by behavior or type.',
  'Wallets',
  'Classification',
  'tracked_wallets',
  'tags',
  'ARRAY',
  ARRAY['whale,defi,trader', 'exchange,hot-wallet'],
  ARRAY['Wallet Label'],
  ARRAY['tags', 'classification']
),
(
  'Is Active',
  'is-active',
  'Boolean indicating if a wallet has recent activity',
  'Typically true if last_activity is within the last 30 days.',
  'Wallets',
  'Activity Metrics',
  'tracked_wallets',
  'is_active',
  'BOOLEAN',
  ARRAY['true', 'false'],
  ARRAY['Last Activity'],
  ARRAY['active', 'status']
),

-- ============================================================================
-- System/Operational Metrics (9 entries)
-- ============================================================================
(
  'Cron Execution',
  'cron-execution',
  'A single run of a scheduled job',
  'Each execution is logged with start time, duration, status, and metadata.',
  'System',
  'Operations',
  'cron_executions',
  NULL,
  'RECORD',
  ARRAY['collect-prices, success, 1500ms'],
  ARRAY['Cron Job', 'Execution Time'],
  ARRAY['cron', 'job', 'execution']
),
(
  'Execution Time',
  'execution-time',
  'Duration of a cron job execution in milliseconds',
  'Used to monitor job performance and detect slowdowns.',
  'System',
  'Performance',
  'cron_executions',
  'execution_time',
  'INTEGER',
  ARRAY['1500', '5000', '30000'],
  ARRAY['Cron Execution'],
  ARRAY['performance', 'duration']
),
(
  'Job Status',
  'job-status',
  'Current state of a cron job execution',
  'Values: success, error, running, timeout',
  'System',
  'Operations',
  'cron_executions',
  'status',
  'VARCHAR',
  ARRAY['success', 'error', 'running'],
  ARRAY['Error Message'],
  ARRAY['status', 'job']
),
(
  'Error Message',
  'error-message',
  'Description of error if a job execution failed',
  'Contains technical details about the failure cause.',
  'System',
  'Operations',
  'cron_executions',
  'error_message',
  'TEXT',
  ARRAY['API rate limit exceeded', 'Connection timeout'],
  ARRAY['Job Status'],
  ARRAY['error', 'debugging']
),
(
  'API Response Time',
  'api-response-time',
  'Time taken for an external API to respond in milliseconds',
  'Used to monitor third-party service health.',
  'System',
  'Performance',
  NULL,
  NULL,
  'INTEGER',
  ARRAY['150', '500', '2000'],
  ARRAY['API Health'],
  ARRAY['api', 'latency', 'performance']
),
(
  'Records Processed',
  'records-processed',
  'Number of data records processed during a job execution',
  'Stored in execution metadata.',
  'System',
  'Operations',
  NULL,
  NULL,
  'INTEGER',
  ARRAY['100', '500', '5000'],
  ARRAY['Execution Time'],
  ARRAY['metrics', 'processing']
),
(
  'Success Rate',
  'success-rate',
  'Percentage of successful job executions over a time period',
  'Calculated as: successful_runs / total_runs × 100',
  'System',
  'Reliability',
  'cron_job_definitions',
  'success_rate',
  'DECIMAL',
  ARRAY['99.5', '95.0', '100.0'],
  ARRAY['Total Runs', 'Total Failures'],
  ARRAY['reliability', 'uptime']
),
(
  'Service Level Agreement (SLA)',
  'sla',
  'Target availability or performance commitment',
  'Typically expressed as percentage uptime (e.g., 99.9%).',
  'System',
  'Reliability',
  NULL,
  NULL,
  'DECIMAL',
  ARRAY['99.9', '99.99'],
  ARRAY['Success Rate', 'Uptime'],
  ARRAY['sla', 'availability']
),
(
  'Data Freshness',
  'data-freshness',
  'How recent the data is, measured as time since last update',
  'Critical for ensuring users see current information.',
  'System',
  'Data Quality',
  NULL,
  NULL,
  'INTERVAL',
  ARRAY['5 minutes', '1 hour', '24 hours'],
  ARRAY['Last Updated'],
  ARRAY['freshness', 'quality']
);

-- ============================================================================
-- Search Function
-- ============================================================================

CREATE OR REPLACE FUNCTION search_data_dictionary(search_query TEXT)
RETURNS TABLE (
  id UUID,
  term VARCHAR,
  slug VARCHAR,
  definition TEXT,
  category VARCHAR,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dd.id,
    dd.term,
    dd.slug,
    dd.definition,
    dd.category,
    ts_rank(
      to_tsvector('english', dd.term || ' ' || dd.definition || ' ' || COALESCE(dd.extended_definition, '')),
      plainto_tsquery('english', search_query)
    ) AS relevance
  FROM data_dictionary dd
  WHERE
    to_tsvector('english', dd.term || ' ' || dd.definition || ' ' || COALESCE(dd.extended_definition, ''))
    @@ plainto_tsquery('english', search_query)
    OR dd.term ILIKE '%' || search_query || '%'
    OR search_query = ANY(dd.tags)
  ORDER BY relevance DESC, dd.term ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE data_dictionary IS 'Centralized definitions for all data terms, metrics, and database columns';
COMMENT ON FUNCTION search_data_dictionary IS 'Full-text search across data dictionary entries';
