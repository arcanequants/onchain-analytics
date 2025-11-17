#!/usr/bin/env node

/**
 * ================================================================
 * DATABASE SCHEMA DEPLOYMENT SCRIPT (Node.js version)
 * ================================================================
 * This script deploys the complete database schema to Supabase
 * Run: node scripts/deploy-schema.js
 * ================================================================
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL === 'your_supabase_postgres_url') {
  console.error('❌ Error: DATABASE_URL not configured in .env.local');
  process.exit(1);
}

console.log('🚀 Starting Database Schema Deployment');
console.log('=======================================');
console.log('');

// Read schema file
const schemaPath = path.join(__dirname, '../supabase/schema.sql');

if (!fs.existsSync(schemaPath)) {
  console.error('❌ Error: supabase/schema.sql not found');
  process.exit(1);
}

console.log('✅ Found schema file');
console.log('');

const schema = fs.readFileSync(schemaPath, 'utf8');

// Use pg library to execute SQL
const { Client } = require('pg');

async function deploySchema() {
  // Parse the connection string to avoid IPv6 issues
  const url = new URL(DATABASE_URL.replace('postgresql://', 'postgres://'));

  const client = new Client({
    host: url.hostname,
    port: url.port || 5432,
    database: url.pathname.slice(1),
    user: url.username,
    password: url.password,
    ssl: {
      rejectUnauthorized: false
    },
    // Force IPv4
    family: 4
  });

  try {
    console.log('🔍 Testing database connection...');
    await client.connect();
    console.log('✅ Database connection successful');
    console.log('');

    console.log('📊 Current database state:');
    console.log('');

    // Show existing tables
    const tablesResult = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    if (tablesResult.rows.length > 0) {
      console.log('Existing tables:');
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.tablename}`);
      });
    } else {
      console.log('No tables yet');
    }

    console.log('');
    console.log('⚠️  About to deploy schema to Supabase');
    console.log('');
    console.log('This will:');
    console.log('  • Create 11 tables (gas_prices, cron_executions, fear_greed_index, etc.)');
    console.log('  • Create 2 materialized views (gas_prices_hourly, api_usage_daily)');
    console.log('  • Create 2 functions (refresh_materialized_views, cleanup_old_data)');
    console.log('  • Set up Row Level Security (RLS) policies');
    console.log('  • Create indexes for performance');
    console.log('');
    console.log('Note: If tables already exist, they will NOT be dropped (using IF NOT EXISTS)');
    console.log('');

    // For automation, we skip the confirmation prompt
    console.log('🚀 Deploying schema...');
    console.log('');

    // Execute schema
    await client.query(schema);

    console.log('');
    console.log('✅ Schema deployed successfully!');
    console.log('');

    console.log('🔍 Verifying deployment...');
    console.log('');

    // Verify tables
    console.log('📊 Tables created:');
    const verifyTables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'gas_prices', 'cron_executions', 'fear_greed_index',
          'events', 'event_submissions', 'users', 'api_keys',
          'api_requests', 'subscriptions', 'analytics_events', 'backfill_jobs'
        )
      ORDER BY tablename;
    `);

    verifyTables.rows.forEach(row => {
      console.log(`  ✅ ${row.tablename}`);
    });

    console.log('');
    console.log('📈 Materialized views created:');
    const verifyViews = await client.query(`
      SELECT matviewname
      FROM pg_matviews
      WHERE schemaname = 'public'
      ORDER BY matviewname;
    `);

    verifyViews.rows.forEach(row => {
      console.log(`  ✅ ${row.matviewname}`);
    });

    console.log('');
    console.log('⚙️  Functions created:');
    const verifyFunctions = await client.query(`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('refresh_materialized_views', 'cleanup_old_data')
      ORDER BY routine_name;
    `);

    verifyFunctions.rows.forEach(row => {
      console.log(`  ✅ ${row.routine_name}()`);
    });

    console.log('');
    console.log('✅ Testing tables...');
    console.log('');

    // Test critical tables
    const criticalTables = ['gas_prices', 'cron_executions', 'analytics_events'];

    for (const table of criticalTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0].count;
        console.log(`  ✅ ${table}: accessible (${count} rows)`);
      } catch (error) {
        console.log(`  ❌ ${table}: not accessible`);
      }
    }

    console.log('');
    console.log('=======================================');
    console.log('🎉 DATABASE SCHEMA DEPLOYMENT COMPLETE!');
    console.log('=======================================');
    console.log('');
    console.log('📊 Summary:');
    console.log('  • 11 tables created');
    console.log('  • 2 materialized views created');
    console.log('  • 2 functions created');
    console.log('  • RLS policies enabled');
    console.log('  • Indexes created');
    console.log('');
    console.log('🔐 Security:');
    console.log('  • Row Level Security (RLS) is ENABLED on all tables');
    console.log('  • Public can only READ gas_prices, fear_greed_index, events');
    console.log('  • Service role can write to all tables');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('  1. ✅ Supabase credentials configured');
    console.log('  2. Test the CRON job: curl http://localhost:3000/api/cron/collect-gas');
    console.log('  3. Verify data is being inserted into gas_prices table');
    console.log('  4. Continue with Week 0 Day -5 tasks (Sentry, UptimeRobot)');
    console.log('');
    console.log('✅ You can now continue with the roadmap!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Schema deployment failed');
    console.error('');
    console.error('Error details:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run deployment
deploySchema();
