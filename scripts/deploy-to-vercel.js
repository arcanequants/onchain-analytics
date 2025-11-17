#!/usr/bin/env node

const https = require('https');

const VERCEL_TOKEN = 'E4SHDXmoBXQo1v3GgJZ7azqQ';

console.log('🚀 Setting up Vercel deployment...');
console.log('');

// Step 1: Create project
const projectData = JSON.stringify({
  name: 'onchain-analytics',
  framework: 'nextjs',
  gitRepository: {
    type: 'github',
    repo: 'arcanequants/onchain-analytics'
  }
});

const options = {
  hostname: 'api.vercel.com',
  port: 443,
  path: '/v10/projects',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(projectData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const response = JSON.parse(data);

    if (response.error) {
      console.log('⚠️  Project might already exist or error:', response.error.message);
      // Continue anyway
    } else {
      console.log('✅ Vercel project created!');
      console.log('   Project ID:', response.id);
      console.log('');
    }

    console.log('📝 Next: Configure environment variables in Vercel Dashboard');
    console.log('   Go to: https://vercel.com/arcanequants/onchain-analytics/settings/environment-variables');
    console.log('');
    console.log('   Add these variables:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   - DATABASE_URL');
    console.log('   - CRON_SECRET');
    console.log('   - SENTRY_DSN');
    console.log('   - NEXT_PUBLIC_SENTRY_DSN');
    console.log('');
    console.log('   Or I can set them up automatically - just say "configure env vars"');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

req.write(projectData);
req.end();
