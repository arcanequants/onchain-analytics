#!/bin/bash

# Script: Apply TVL Migration to Supabase
# Usage: ./scripts/apply-tvl-migration.sh

set -e

echo "=================================================="
echo "Applying TVL Migration to Supabase"
echo "=================================================="
echo ""

# Database connection details
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.fjxbuyxephlfoivcpckd"
DB_NAME="postgres"
MIGRATION_FILE="supabase/migrations/20250119_create_tvl_table.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "🗄️  Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Applying migration..."
echo ""

# Apply migration using psql
PGPASSWORD='Cryptolotto2025!' psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "$MIGRATION_FILE"

echo ""
echo "=================================================="
echo "✅ Migration Applied Successfully"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Verify table exists:"
echo "   SELECT COUNT(*) FROM protocol_tvl;"
echo ""
echo "2. Run CRON job manually:"
echo "   curl -X GET \"https://crypto-lotto-six.vercel.app/api/cron/collect-tvl\" \\"
echo "     -H \"Authorization: Bearer L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI=\""
echo ""
echo "3. Check data collection:"
echo "   SELECT protocol_name, tvl, category, chains_supported FROM protocol_tvl LIMIT 5;"
echo ""
