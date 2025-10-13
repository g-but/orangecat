#!/usr/bin/env node
const fs = require('fs');
const https = require('https');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Read migration file
const migrationSQL = fs.readFileSync('supabase/migrations/20251013072134_fix_profiles_complete.sql', 'utf8');

console.log('🚀 Applying Profile Backend Fix to Production...');
console.log(`📍 Target: ${SUPABASE_URL}`);
console.log('');

// Parse URL
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec`);

const postData = JSON.stringify({ sql: migrationSQL });

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('✅ Migration applied successfully!');
      console.log('');
      console.log('📊 Next steps:');
      console.log('1. Start your app: npm run dev');
      console.log('2. Test registration at http://localhost:3000/auth');
      console.log('3. Verify profile was created');
      console.log('');
      console.log('🚀 Ready to launch!');
    } else {
      console.error('❌ Migration failed:');
      console.error(`Status: ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request failed:', e.message);
  process.exit(1);
});

req.write(postData);
req.end();

