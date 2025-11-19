#!/bin/bash

# Apply NFT table migration to Supabase database
# Run this script after installing PostgreSQL client: brew install postgresql

echo "Applying NFT table migration..."

PGPASSWORD='Cryptolotto2025!' psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.fjxbuyxephlfoivcpckd \
  -d postgres \
  -f /Users/albertosorno/onchain-analytics/app/supabase/migrations/20250118_create_wallet_nfts_table.sql

if [ $? -eq 0 ]; then
  echo "✅ NFT table migration applied successfully!"
else
  echo "❌ Migration failed. Install PostgreSQL client first: brew install postgresql"
  echo "Or apply the SQL manually in Supabase dashboard: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd/sql"
fi
