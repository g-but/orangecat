#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'ohkueislstxomdjavyhs';
const ACCESS_TOKEN =
  process.env.SUPABASE_ACCESS_TOKEN || 'sbp_8a9797e27e1e7b1819c04ce9e2ccee0cfb9ed85b';

// Read the migration file
const migrationSQL = fs.readFileSync(
  './supabase/migrations/20251113140000_enable_open_timeline_posting.sql',
  'utf8'
);

const data = JSON.stringify({
  query: migrationSQL,
});

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

console.log('Applying timeline migration to production...');
console.log('Project:', PROJECT_REF);

const req = https.request(options, res => {
  let responseData = '';

  res.on('data', chunk => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseData);

    if (res.statusCode === 200) {
      console.log('✅ Migration applied successfully!');
    } else {
      console.error('❌ Migration failed');
      process.exit(1);
    }
  });
});

req.on('error', error => {
  console.error('Error:', error);
  process.exit(1);
});

req.write(data);
req.end();
