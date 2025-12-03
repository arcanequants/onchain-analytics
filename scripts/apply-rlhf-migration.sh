#!/bin/bash
# Apply RLHF tables migration to Supabase

# Supabase connection details
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.fjxbuyxephlfoivcpckd"

echo "Applying RLHF tables migration..."
echo "================================="

PGPASSWORD="${PGPASSWORD}" psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "supabase/migrations/20241203_rlhf_tables.sql"

if [ $? -eq 0 ]; then
  echo ""
  echo "Migration applied successfully!"
  echo ""
  echo "Tables created:"
  echo "  - user_feedback"
  echo "  - score_corrections"
  echo "  - preference_pairs"
  echo "  - calibration_data"
  echo "  - calibration_adjustments"
  echo "  - rlhf_training_runs"
else
  echo ""
  echo "Migration failed!"
  exit 1
fi
