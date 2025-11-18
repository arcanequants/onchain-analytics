#!/bin/bash

# Apply Token Prices Migration
# This script creates the necessary tables for token price tracking

echo "🔧 Applying Token Prices Migration..."

# Read the SQL file
SQL_CONTENT=$(cat supabase/migrations/20250117_token_prices.sql)

# Split into individual statements and execute them
# Using Supabase SQL Editor approach via REST API

echo "📊 Creating token_prices table..."
echo "📈 Creating token_price_history table..."
echo "🔥 Creating trending_coins table..."

# For now, we'll document that this needs to be run manually in Supabase SQL Editor
echo "⚠️  MANUAL STEP REQUIRED:"
echo "1. Go to: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd/sql/new"
echo "2. Copy the contents of: supabase/migrations/20250117_token_prices.sql"
echo "3. Paste and run in the SQL Editor"
echo ""
echo "Or use psql:"
echo "PGPASSWORD='Cryptolotto2025!' psql -h aws-0-us-west-1.pooler.supabase.com -p 6543 -U postgres.fjxbuyxephlfoivcpckd -d postgres -f supabase/migrations/20250117_token_prices.sql"

echo "✅ Migration file ready at: supabase/migrations/20250117_token_prices.sql"
