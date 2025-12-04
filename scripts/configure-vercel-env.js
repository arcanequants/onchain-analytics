#!/usr/bin/env node

/**
 * Configure Vercel Environment Variables
 *
 * RED TEAM AUDIT FIX: CRITICAL-002
 * Secrets now loaded from environment variables, not hardcoded
 *
 * Usage:
 *   VERCEL_TOKEN=xxx PROJECT_ID=xxx node scripts/configure-vercel-env.js
 *
 * Or source your .env.local first:
 *   source .env.local && node scripts/configure-vercel-env.js
 */

const https = require('https');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_TOKEN || !PROJECT_ID) {
  console.error('ERROR: Missing required environment variables');
  console.error('');
  console.error('Required:');
  console.error('  - VERCEL_TOKEN: Your Vercel API token');
  console.error('  - VERCEL_PROJECT_ID: The project ID from Vercel');
  console.error('');
  console.error('Set these in .env.local or pass them as environment variables');
  process.exit(1);
}

console.log('🔧 Configuring environment variables in Vercel...');
console.log(`   Project ID: ${PROJECT_ID}`);
console.log('');

// Build env vars from current environment
const envVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: process.env.NEXT_PUBLIC_SUPABASE_URL,
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    type: 'secret',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'DATABASE_URL',
    value: process.env.DATABASE_URL,
    type: 'secret',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'CRON_SECRET',
    value: process.env.CRON_SECRET,
    type: 'secret',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'SENTRY_DSN',
    value: process.env.SENTRY_DSN,
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SENTRY_DSN',
    value: process.env.NEXT_PUBLIC_SENTRY_DSN,
    type: 'plain',
    target: ['production', 'preview', 'development']
  }
].filter(env => env.value); // Only include vars that have values

let completed = 0;

envVars.forEach((envVar, index) => {
  setTimeout(() => {
    const data = JSON.stringify(envVar);

    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: `/v10/projects/${PROJECT_ID}/env`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ ${envVar.key} configured`);
        } else {
          console.log(`⚠️  ${envVar.key}: ${responseData}`);
        }

        completed++;
        if (completed === envVars.length) {
          console.log('');
          console.log('✅ All environment variables configured!');
          console.log('');
          console.log('🚀 Triggering production deployment...');
          console.log('   Vercel will automatically deploy from GitHub main branch');
          console.log('');
          console.log('📊 Monitor deployment at:');
          console.log('   https://vercel.com/arcanequants/onchain-analytics');
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Error configuring ${envVar.key}:`, error.message);
      completed++;
    });

    req.write(data);
    req.end();
  }, index * 500); // Stagger requests
});
