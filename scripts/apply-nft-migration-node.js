#!/usr/bin/env node

/**
 * Apply NFT table migration to Supabase database using Node.js
 * Requires: npm install pg
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🚀 Applying NFT table migration...\n');

  // Database connection string from .env.local
  const connectionString = 'postgresql://postgres:muxmos-toxqoq-8dyCfi@db.xkrkqntnpzkwzqkbfyex.supabase.co:5432/postgres';

  // Read migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250118_create_wallet_nfts_table.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration file loaded:', migrationPath);
  console.log('📝 SQL length:', migrationSQL.length, 'characters\n');

  // Connect to database
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Supabase requires SSL
    }
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected to database\n');

    console.log('⚙️  Executing migration SQL...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully!\n');

    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const result = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'wallet_nfts'
      ORDER BY ordinal_position
      LIMIT 10
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table wallet_nfts created successfully!');
      console.log('📊 First 10 columns:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️  Warning: Could not verify table creation');
    }

    console.log('\n🎉 Migration complete!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
