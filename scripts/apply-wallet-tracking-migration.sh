#!/bin/bash

# Apply Wallet Tracking Migration
# This script creates the necessary tables for wallet balance tracking

echo "🔧 Applying Wallet Tracking Migration..."

# Read the SQL file
SQL_FILE="supabase/migrations/20251117234118_create_wallet_tracking_tables.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Migration file not found: $SQL_FILE"
  exit 1
fi

echo "📊 Creating wallet tracking tables..."
echo "  - wallet_balances"
echo "  - wallet_nfts"
echo "  - wallet_history"
echo "  - tracked_wallets"
echo ""

# Apply via Supabase SQL Editor
echo "⚠️  MANUAL STEP:"
echo "1. Go to: https://supabase.com/dashboard/project/fjxbuyxephlfoivcpckd/sql/new"
echo "2. Copy the contents of: $SQL_FILE"
echo "3. Paste and run in the SQL Editor"
echo ""
echo "Or if you have psql installed:"
echo "PGPASSWORD='Cryptolotto2025!' psql -h aws-0-us-west-1.pooler.supabase.com -p 6543 -U postgres.fjxbuyxephlfoivcpckd -d postgres -f $SQL_FILE"
echo ""

# Alternative: Use curl to execute via Supabase REST API
echo "🚀 Attempting to apply via Supabase REST API..."
echo ""

# Get the SQL content
SQL_CONTENT=$(cat "$SQL_FILE")

# Execute via Supabase SQL endpoint
curl -X POST "https://fjxbuyxephlfoivcpckd.supabase.co/rest/v1/rpc/exec_sql" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeGJ1eXhlcGhsZm9pdmNwY2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4OTk4NSwiZXhwIjoyMDc2NDY1OTg1fQ.UlwSxQS5o_9-mPFtwi6ItJQ4j6EZBDUEu6qSrvFwYpU" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqeGJ1eXhlcGhsZm9pdmNwY2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDg4OTk4NSwiZXhwIjoyMDc2NDY1OTg1fQ.UlwSxQS5o_9-mPFtwi6ItJQ4j6EZBDUEu6qSrvFwYpU" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}"

echo ""
echo "✅ Migration file ready at: $SQL_FILE"
