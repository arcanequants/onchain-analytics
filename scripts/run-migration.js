/**
 * Run SQL Migration via Supabase
 * Phase 1, Week 1, Day 1
 *
 * RED TEAM AUDIT FIX: CRITICAL-002
 * Secrets now loaded from environment variables
 *
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Configure these in .env.local');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Starting AI Perception Core Migration...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Read the migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251127_ai_perception_core.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split into individual statements (rough split, may need adjustment)
  // For complex migrations, we'll run sections separately

  console.log('📦 Applying migration in sections...\n');

  // Section 1: Extensions
  console.log('1️⃣  Enabling extensions...');
  const { error: extError } = await supabase.rpc('exec_sql', {
    sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
  });
  if (extError) {
    console.log('   Extensions may already exist, continuing...');
  }

  // For a full migration, we need to use the SQL Editor in Supabase Dashboard
  // because the REST API doesn't support DDL statements directly

  console.log('\n⚠️  IMPORTANT: Complex DDL migrations must be run via Supabase Dashboard SQL Editor');
  console.log('\n📋 Steps to apply migration:');
  console.log('   1. Open the Supabase SQL Editor');
  console.log('   2. Copy contents of: supabase/migrations/20251127_ai_perception_core.sql');
  console.log('   3. Paste into SQL Editor and click "Run"\n');

  // Let's verify what tables currently exist
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');

  if (!tablesError && tables) {
    console.log('📊 Current public tables:', tables.map(t => t.table_name).join(', ') || '(none)');
  }
}

runMigration().catch(console.error);
