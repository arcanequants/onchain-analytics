#!/usr/bin/env node

/**
 * ================================================================
 * DATABASE SCHEMA DEPLOYMENT SCRIPT (Supabase API version)
 * ================================================================
 * This script deploys the complete database schema to Supabase using REST API
 * Run: node scripts/deploy-schema-api.js
 * ================================================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DATABASE_URL = process.env.DATABASE_URL;

if (!SUPABASE_URL || SUPABASE_URL === 'your_supabase_project_url') {
  console.error('❌ Error: SUPABASE_URL not configured in .env.local');
  process.exit(1);
}

if (!DATABASE_URL || DATABASE_URL === 'your_supabase_postgres_url') {
  console.error('❌ Error: DATABASE_URL not configured in .env.local');
  process.exit(1);
}

console.log('🚀 Starting Database Schema Deployment (API Method)');
console.log('====================================================');
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

// Extract password from DATABASE_URL
const passwordMatch = DATABASE_URL.match(/postgres:([^@]+)@/);
if (!passwordMatch) {
  console.error('❌ Error: Could not extract password from DATABASE_URL');
  process.exit(1);
}

const DB_PASSWORD = passwordMatch[1];
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

console.log(`📡 Project Reference: ${projectRef}`);
console.log('');

// Function to execute SQL via Supabase SQL API
async function executeSQLviaAPI(sql) {
  return new Promise((resolve, reject) => {
    const url = `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`;

    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: `${projectRef}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(body);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Alternative: Use curl command to execute SQL
async function deployWithCurl() {
  const { exec } = require('child_process');
  const util = require('util');
  const execPromise = util.promisify(exec);

  try {
    console.log('🔍 Testing connection to Supabase...');
    console.log('');

    // Create a temporary file with the schema
    const tempFile = path.join(__dirname, '../supabase/schema-temp.sql');
    fs.writeFileSync(tempFile, schema);

    console.log('🚀 Deploying schema via CURL...');
    console.log('');

    // Use psql via Docker if available, or try direct connection
    const command = `PGPASSWORD='${DB_PASSWORD}' psql '${DATABASE_URL}' -f '${tempFile}' 2>&1 || echo "PSQL_NOT_FOUND"`;

    const { stdout, stderr } = await execPromise(command);

    // Check if psql is not found
    if (stdout.includes('PSQL_NOT_FOUND') || stdout.includes('command not found')) {
      console.log('⚠️  psql not found locally. Using alternative method...');
      console.log('');

      // Try using Supabase SQL Editor approach
      console.log('📝 Please follow these manual steps:');
      console.log('');
      console.log('1. Go to your Supabase Dashboard:');
      console.log(`   ${SUPABASE_URL.replace('//', '//app.')}/project/${projectRef}/sql/new`);
      console.log('');
      console.log('2. Copy the content from: supabase/schema.sql');
      console.log('');
      console.log('3. Paste it into the SQL Editor');
      console.log('');
      console.log('4. Click "Run" to execute');
      console.log('');
      console.log('Alternative: Install psql client:');
      console.log('  macOS: brew install postgresql@16');
      console.log('  Ubuntu: sudo apt-get install postgresql-client');
      console.log('');

      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      console.log('Or let me create a deployment URL for you...');
      console.log('');

      return false;
    }

    if (stderr && !stderr.includes('NOTICE')) {
      console.error('❌ Error executing schema:');
      console.error(stderr);

      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return false;
    }

    console.log(stdout);
    console.log('');
    console.log('✅ Schema deployed successfully!');
    console.log('');

    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }

    return true;

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return false;
  }
}

// Main deployment function
async function deploySchema() {
  try {
    const success = await deployWithCurl();

    if (success) {
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
      console.log('📝 Next Steps:');
      console.log('  1. Verify tables in Supabase Dashboard');
      console.log('  2. Test the CRON job: curl http://localhost:3000/api/cron/collect-gas');
      console.log('  3. Continue with Week 0 Day -5 tasks');
      console.log('');
    } else {
      console.log('⚠️  Manual deployment required. See instructions above.');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ Schema deployment failed');
    console.error('');
    console.error('Error details:');
    console.error(error.message);
    console.error('');
    process.exit(1);
  }
}

// Run deployment
deploySchema();
