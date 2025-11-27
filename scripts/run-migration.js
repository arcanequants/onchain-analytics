/**
 * Run SQL Migration via Supabase
 * Phase 1, Week 1, Day 1
 *
 * Usage: node scripts/run-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xkrkqntnpzkwzqkbfyex.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcmtxbnRucHprd3pxa2JmeWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0ODM3MywiZXhwIjoyMDc4OTI0MzczfQ.MP3KudtKW2fiIOM0TxR-bhxtihi3k4z0vnyf7_NS_4c';

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
  console.log('   1. Open: https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex/sql');
  console.log('   2. Copy contents of: supabase/migrations/20251127_ai_perception_core.sql');
  console.log('   3. Paste into SQL Editor and click "Run"\n');

  console.log('🔗 Direct link to SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex/sql/new\n');

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
