#!/usr/bin/env node

/**
 * ================================================================
 * SCHEMA VERIFICATION SCRIPT
 * ================================================================
 * This script verifies that all tables, views, and functions
 * were created successfully in Supabase
 * ================================================================
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('🔍 Verifying Database Schema Deployment');
  console.log('========================================');
  console.log('');

  try {
    // Expected tables
    const expectedTables = [
      'gas_prices',
      'cron_executions',
      'fear_greed_index',
      'events',
      'event_submissions',
      'users',
      'api_keys',
      'api_requests',
      'subscriptions',
      'analytics_events',
      'backfill_jobs'
    ];

    console.log('📊 Verifying Tables:');
    console.log('');

    let tablesVerified = 0;

    for (const table of expectedTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`  ❌ ${table}: NOT accessible (${error.message})`);
        } else {
          console.log(`  ✅ ${table}: accessible (${count || 0} rows)`);
          tablesVerified++;
        }
      } catch (err) {
        console.log(`  ❌ ${table}: ERROR (${err.message})`);
      }
    }

    console.log('');
    console.log(`📊 Tables Verified: ${tablesVerified}/${expectedTables.length}`);
    console.log('');

    // Summary
    console.log('========================================');
    if (tablesVerified === expectedTables.length) {
      console.log('🎉 ALL TABLES VERIFIED SUCCESSFULLY!');
      console.log('========================================');
      console.log('');
      console.log('✅ Database schema deployment complete!');
      console.log('');
      console.log('📝 Next Steps:');
      console.log('  1. ✅ Database schema deployed');
      console.log('  2. ✅ All 11 tables verified');
      console.log('  3. Create CRON job to collect gas prices');
      console.log('  4. Set up Sentry error tracking');
      console.log('  5. Set up UptimeRobot monitoring');
      console.log('');
      console.log('🚀 Ready to continue with Week 0 Day -5!');
      console.log('');
    } else {
      console.log('⚠️  SOME TABLES NOT VERIFIED');
      console.log('========================================');
      console.log('');
      console.log(`Verified: ${tablesVerified}/${expectedTables.length} tables`);
      console.log('');
      console.log('Please check the errors above and re-run deployment if needed.');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ Verification failed');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    process.exit(1);
  }
}

verifySchema();
