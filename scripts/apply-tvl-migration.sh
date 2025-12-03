#!/bin/bash
# ================================================================
# Apply TVL Migration
# Project: onchain-analytics (xkrkqntnpzkwzqkbfyex)
# ================================================================

set -e

# Load database configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/db-config.sh"

echo "=================================================="
echo "Applying TVL Migration"
echo "=================================================="
echo ""

MIGRATION_FILE="supabase/migrations/20250119_create_tvl_table.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "🗄️  Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo "⚠️  psql not installed. Apply migration manually:"
  echo ""
  echo "1. Go to: $SQL_EDITOR_URL"
  echo "2. Copy contents of: $MIGRATION_FILE"
  echo "3. Paste and run in SQL Editor"
  echo ""
  exit 1
fi

echo "Applying migration..."
run_migration "$MIGRATION_FILE"

echo ""
echo "=================================================="
echo "✅ TVL Migration Applied Successfully"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Verify table exists:"
echo "   SELECT COUNT(*) FROM protocol_tvl;"
echo ""
echo "2. Run CRON job manually:"
echo "   curl -X GET \"$VERCEL_URL/api/cron/collect-tvl\" \\"
echo "     -H \"Authorization: Bearer \$CRON_SECRET\""
echo ""
