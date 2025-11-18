#!/usr/bin/env node

/**
 * Apply Timeline Social Features Migration
 *
 * This applies the migration that enables:
 * - Likes system
 * - Dislikes system (for scam detection & wisdom of crowds)
 * - Comments system
 * - Shares system
 *
 * Run with: node apply-social-features-migration.js
 */

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

console.log('🚀 Applying Timeline Social Features Migration...');
console.log('📊 Features: Likes, Dislikes (scam detection), Comments, Shares');
console.log('🔗 Project:', PROJECT_REF);
console.log('');

// Read the migration SQL file
const migrationPath = './supabase/migrations/20251113000001_timeline_social_features.sql';
console.log(`📁 Reading migration: ${migrationPath}`);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
console.log(`✓ Loaded ${migrationSQL.length} characters`);
console.log('');

// Prepare API request
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
    'Content-Length': Buffer.byteLength(data),
  },
};

console.log('📡 Sending migration to Supabase...');

const req = https.request(options, res => {
  let responseData = '';

  res.on('data', chunk => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('');
    console.log('📥 Response Status:', res.statusCode);

    if (res.statusCode === 200) {
      console.log('');
      console.log('✅ SUCCESS! Timeline social features deployed!');
      console.log('');
      console.log("🎉 What's now available:");
      console.log('   ✓ Likes system');
      console.log('   ✓ Dislikes system (wisdom of crowds / scam detection)');
      console.log('   ✓ Comments system');
      console.log('   ✓ Shares system');
      console.log('   ✓ RLS policies enabled');
      console.log('   ✓ Performance indexes');
      console.log('');
      console.log('🛡️  Community moderation enabled: Users can now dislike scams!');
      console.log('');
    } else {
      console.log('');
      console.log('❌ Migration failed!');
      console.log('Response:', responseData);
      console.log('');
      console.log('💡 Common issues:');
      console.log('   • Tables may already exist (check Supabase Dashboard)');
      console.log('   • API token may be invalid');
      console.log('   • SQL syntax error in migration');
      console.log('');
      process.exit(1);
    }
  });
});

req.on('error', error => {
  console.error('');
  console.error('❌ Network error:', error.message);
  console.error('');
  process.exit(1);
});

// Write request and send
req.write(data);
req.end();
