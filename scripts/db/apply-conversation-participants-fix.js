#!/usr/bin/env node

/**
 * Apply conversation_participants RLS policies migration
 * Reads SUPABASE_ACCESS_TOKEN from .env.local and applies the migration
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Read token from .env.local
let envToken = null;
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/SUPABASE_ACCESS_TOKEN=(.+)/);
  if (match) {
    envToken = match[1].trim();
  }
} catch (e) {
  console.error('⚠️  Could not read .env.local');
}

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || envToken;

if (!ACCESS_TOKEN) {
  console.error('❌ No SUPABASE_ACCESS_TOKEN found in environment or .env.local');
  console.error('   Please add SUPABASE_ACCESS_TOKEN to .env.local');
  process.exit(1);
}

// Get project ref from URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRefMatch = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
const PROJECT_REF = projectRefMatch ? projectRefMatch[1] : 'ohkueislstxomdjavyhs';

console.log(`📍 Project: ${PROJECT_REF}`);
console.log(`🔑 Token: ${ACCESS_TOKEN.substring(0, 10)}...`);

// Read migration SQL
const migrationPath = path.join(__dirname, 'supabase/migrations/20250102000000_add_conversation_participants_policies.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Reading migration file...');
console.log(`📏 Migration size: ${migrationSQL.length} characters\n`);

// Apply via Supabase Management API
const postData = JSON.stringify({
  query: migrationSQL
});

const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length,
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'apikey': ACCESS_TOKEN
  }
};

console.log('⚡ Applying migration...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Migration applied successfully!');
      try {
        const result = JSON.parse(data);
        if (result.error) {
          console.error('❌ Error:', result.error);
          process.exit(1);
        }
        console.log('📊 Result:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('📊 Response:', data);
      }
    } else {
      console.error(`❌ Migration failed with status ${res.statusCode}`);
      console.error('Response:', data);
      try {
        const error = JSON.parse(data);
        console.error('Error details:', error);
      } catch (e) {
        console.error('Raw response:', data);
      }
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
  process.exit(1);
});

req.write(postData);
req.end();


