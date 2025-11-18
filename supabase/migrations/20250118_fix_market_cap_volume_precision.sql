-- Fix market_cap and total_volume to support decimal values
-- Some cryptocurrencies have fractional market cap/volume values from CoinGecko

ALTER TABLE token_prices
  ALTER COLUMN market_cap TYPE DECIMAL(30, 2),
  ALTER COLUMN total_volume TYPE DECIMAL(30, 2);

ALTER TABLE token_price_history
  ALTER COLUMN market_cap TYPE DECIMAL(30, 2),
  ALTER COLUMN total_volume TYPE DECIMAL(30, 2);

COMMENT ON COLUMN token_prices.market_cap IS 'Market capitalization in USD (supports decimals for small-cap tokens)';
COMMENT ON COLUMN token_prices.total_volume IS 'Total trading volume in 24h (supports decimals)';
