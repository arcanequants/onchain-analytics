-- Fix numeric field overflow for price change percentages
-- Some tokens can have very large percentage changes (>1,000,000%)

ALTER TABLE token_prices
  ALTER COLUMN price_change_percentage_24h TYPE DECIMAL(15, 4),
  ALTER COLUMN price_change_percentage_7d TYPE DECIMAL(15, 4),
  ALTER COLUMN price_change_percentage_30d TYPE DECIMAL(15, 4),
  ALTER COLUMN ath_change_percentage TYPE DECIMAL(15, 4),
  ALTER COLUMN atl_change_percentage TYPE DECIMAL(15, 4);

COMMENT ON COLUMN token_prices.price_change_percentage_24h IS 'Price change percentage in 24h (can be very large for volatile tokens)';
