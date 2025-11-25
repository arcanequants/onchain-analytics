#!/bin/bash

# Script to check if database triggers and functions are properly set up
# This verifies the email verification migration was applied correctly

echo "================================================"
echo "Checking Database Triggers and Functions"
echo "================================================"

# Production database credentials
DB_HOST="aws-0-us-west-1.pooler.supabase.com"
DB_NAME="postgres"
DB_PORT="5432"
DB_USER="postgres.xkrkqntnpzkwzqkbfyex"

echo ""
echo "1. Checking if user_profiles table exists..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
    );
  " | grep -q 't' && echo "✅ Table user_profiles exists" || echo "❌ Table user_profiles NOT FOUND"

echo ""
echo "2. Checking user_profiles table columns..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -c "
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ORDER BY ordinal_position;
  "

echo ""
echo "3. Checking if handle_new_user() function exists..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -t -c "
    SELECT EXISTS (
      SELECT FROM pg_proc
      WHERE proname = 'handle_new_user'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    );
  " | grep -q 't' && echo "✅ Function handle_new_user() exists" || echo "❌ Function handle_new_user() NOT FOUND"

echo ""
echo "4. Checking if on_auth_user_created trigger exists..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -t -c "
    SELECT EXISTS (
      SELECT FROM pg_trigger
      WHERE tgname = 'on_auth_user_created'
      AND tgrelid = (SELECT oid FROM pg_class WHERE relname = 'users' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth'))
    );
  " | grep -q 't' && echo "✅ Trigger on_auth_user_created exists" || echo "❌ Trigger on_auth_user_created NOT FOUND"

echo ""
echo "5. Checking trigger details..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -c "
    SELECT
      tgname AS trigger_name,
      pg_get_triggerdef(oid) AS trigger_definition
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created';
  "

echo ""
echo "6. Checking if email verification columns exist..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -t -c "
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'email_verified'
    );
  " | grep -q 't' && echo "✅ Column email_verified exists" || echo "❌ Column email_verified NOT FOUND"

echo ""
echo "7. Checking RLS policies on user_profiles..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -c "
    SELECT polname AS policy_name, polcmd AS command
    FROM pg_policy
    WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = 'user_profiles' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'));
  "

echo ""
echo "8. Checking recent auth.users entries (last 5)..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -c "
    SELECT id, email, created_at
    FROM auth.users
    ORDER BY created_at DESC
    LIMIT 5;
  "

echo ""
echo "9. Checking recent user_profiles entries (last 5)..."
PGPASSWORD='muxmos-toxqoq-8dyCfi' psql \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -p "$DB_PORT" \
  -c "
    SELECT id, email, created_at, email_verified
    FROM public.user_profiles
    ORDER BY created_at DESC
    LIMIT 5;
  "

echo ""
echo "================================================"
echo "Database Check Complete"
echo "================================================"