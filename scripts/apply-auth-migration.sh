#!/bin/bash

# Script to apply auth migration
# Usage: PGPASSWORD='password' ./scripts/apply-auth-migration.sh

set -e

echo "Applying auth migration..."

psql -h db.xkrkqntnpzkwzqkbfyex.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f supabase/migrations/20250120_auth_users.sql

echo "Auth migration applied successfully!"
