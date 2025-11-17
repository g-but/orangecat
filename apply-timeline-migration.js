#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'ohkueislstxomdjavyhs';

// Read token from .env.local if available
let envToken = null;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/SUPABASE_ACCESS_TOKEN=(.+)/);
  if (match) {
    envToken = match[1].trim();
  }
} catch (e) {
  // .env.local not found, will use environment variable
}

const ACCESS_TOKEN =
  process.env.SUPABASE_ACCESS_TOKEN || envToken || 'sbp_8a9797e27e1e7b1819c04ce9e2ccee0cfb9ed85b';

// Read the social features migration file
const migrationSQL = fs.readFileSync(
  './supabase/migrations/20251113000001_timeline_social_features.sql',
  'utf8'
);

// Properly structure the data object - JSON.stringify will handle escaping
const dataObj = {
  query: migrationSQL,
};
const data = JSON.stringify(dataObj);

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

console.log('Applying timeline SOCIAL FEATURES migration to production...');
console.log('This will enable: likes, comments, shares on timeline posts');
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
