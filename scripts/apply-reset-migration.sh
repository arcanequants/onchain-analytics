#!/bin/bash
# Apply password reset migration to Supabase
# Run this script to add reset_token columns

DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_NAME="postgres"
DB_PORT="5432"
DB_USER="postgres.xkrkqntnpzkwzqkbfyex"

echo "Applying password reset migration..."

PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -f "supabase/migrations/20250124_add_password_reset.sql"

echo "Migration complete!"
