#!/usr/bin/env node

const https = require('https');

const VERCEL_TOKEN = 'E4SHDXmoBXQo1v3GgJZ7azqQ';
const PROJECT_ID = 'prj_TjGvYSYOj2pCoE7Q8amrBf7wZ8CP';

console.log('🔧 Configuring environment variables in Vercel...');
console.log('');

const envVars = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://xkrkqntnpzkwzqkbfyex.supabase.co',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcmtxbnRucHprd3pxa2JmeWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNDgzNzMsImV4cCI6MjA3ODkyNDM3M30.szioW9K48P4KKw_BmhmH-Kj7mNGZekEB2WFv1bM317M',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'DATABASE_URL',
    value: 'postgresql://postgres:muxmos-toxqoq-8dyCfi@db.xkrkqntnpzkwzqkbfyex.supabase.co:5432/postgres',
    type: 'secret',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'CRON_SECRET',
    value: 'L+e90h3WQtfGF0I/P/dTuKAVA0S9q5IZ7Nb3hiu9rsI=',
    type: 'secret',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'SENTRY_DSN',
    value: 'https://bc6e1a96e8cef9873aa7ab8f4196a26e@o4510379533860864.ingest.us.sentry.io/4510379538710528',
    type: 'plain',
    target: ['production', 'preview', 'development']
  },
  {
    key: 'NEXT_PUBLIC_SENTRY_DSN',
    value: 'https://bc6e1a96e8cef9873aa7ab8f4196a26e@o4510379533860864.ingest.us.sentry.io/4510379538710528',
    type: 'plain',
    target: ['production', 'preview', 'development']
  }
];

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
