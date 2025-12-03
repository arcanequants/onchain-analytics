#!/bin/bash
# ================================================================
# Apply Wallet Tracking Migration
# Project: onchain-analytics (xkrkqntnpzkwzqkbfyex)
# ================================================================

set -e

# Load database configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/db-config.sh"

echo "=================================================="
echo "Applying Wallet Tracking Migration"
echo "=================================================="
echo ""

MIGRATION_FILE="supabase/migrations/20251117234118_create_wallet_tracking_tables.sql"

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
echo "✅ Wallet Tracking Migration Applied"
echo "=================================================="
echo ""
echo "Tables created:"
echo "  - wallet_balances"
echo "  - wallet_nfts"
echo "  - wallet_history"
echo "  - tracked_wallets"
echo ""
