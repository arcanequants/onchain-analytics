#!/bin/bash

# Apply Email Verification Migration
# This script applies the email verification migration to Supabase

set -e

echo "🔄 Applying email verification migration to Supabase..."
echo ""

# Database connection details
DB_HOST="db.xkrkqntnpzkwzqkbfyex.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="muxmos-toxqoq-8dyCfi"
DB_PORT="5432"

# Migration file
MIGRATION_FILE="supabase/migrations/20250121_add_email_verification.sql"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "🗄️  Database: $DB_HOST"
echo ""

# Apply migration using psql
PGPASSWORD="$DB_PASSWORD" psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -f "$MIGRATION_FILE"

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "🎯 Next steps:"
echo "   1. Install Resend SDK: npm install resend"
echo "   2. Get Resend API key from https://resend.com"
echo "   3. Add to .env.local: RESEND_API_KEY=re_..."
echo "   4. Continue with implementation"
