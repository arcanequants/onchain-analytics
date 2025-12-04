/**
 * Apply SQL Migration via Supabase REST API
 *
 * Usage: npx ts-node scripts/apply-migration-rest.ts <migration-file>
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://xkrkqntnpzkwzqkbfyex.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcmtxbnRucHprd3pxa2JmeWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM0ODM3MywiZXhwIjoyMDc4OTI0MzczfQ.MP3KudtKW2fiIOM0TxR-bhxtihi3k4z0vnyf7_NS_4c';

async function applyMigration(migrationFile: string) {
  console.log('='.repeat(60));
  console.log('Applying Migration via Supabase REST API');
  console.log('='.repeat(60));
  console.log('');

  const filePath = path.resolve(migrationFile);

  if (!fs.existsSync(filePath)) {
    console.error(`Migration file not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Migration file: ${filePath}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('');

  const sql = fs.readFileSync(filePath, 'utf-8');
  console.log(`SQL length: ${sql.length} characters`);
  console.log('');

  // Split SQL into individual statements (simple split - may need adjustment for complex SQL)
  const statements = sql
    .split(/;(?=\s*(?:--|CREATE|DROP|ALTER|INSERT|UPDATE|DELETE|GRANT|DO|COMMENT|$))/gi)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements`);
  console.log('');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

    try {
      // Use rpc to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });

      if (error) {
        // Try direct approach if rpc doesn't exist
        console.log(`  [${i + 1}/${statements.length}] ${preview}...`);
        console.log(`     Warning: ${error.message}`);
        errorCount++;
      } else {
        console.log(`  [${i + 1}/${statements.length}] OK: ${preview}...`);
        successCount++;
      }
    } catch (err) {
      console.log(`  [${i + 1}/${statements.length}] Error: ${preview}...`);
      console.log(`     ${err}`);
      errorCount++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`Migration Complete: ${successCount} succeeded, ${errorCount} had issues`);
  console.log('='.repeat(60));
  console.log('');
  console.log('Note: Some "errors" may be expected (e.g., dropping non-existent objects)');
  console.log('');
  console.log('To verify, check the Supabase dashboard:');
  console.log('  https://supabase.com/dashboard/project/xkrkqntnpzkwzqkbfyex/editor');
}

// Get migration file from command line
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.log('Usage: npx ts-node scripts/apply-migration-rest.ts <migration-file>');
  console.log('');
  console.log('Example:');
  console.log('  npx ts-node scripts/apply-migration-rest.ts supabase/migrations/20251203_dead_letter_queue.sql');
  process.exit(1);
}

applyMigration(migrationFile).catch(console.error);
