#!/usr/bin/env node

/**
 * Generic Supabase migration runner using Management API.
 *
 * Usage:
 *   node apply-migration.js supabase/migrations/20251124060022_add_contact_email.sql
 *
 * Reads SUPABASE_ACCESS_TOKEN from .env.local or environment and sends the
 * SQL file to:
 *   https://api.supabase.com/v1/projects/ohkueislstxomdjavyhs/database/query
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
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
  console.warn('⚠️  Could not read .env.local, falling back to process.env');
}

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || envToken;

if (!ACCESS_TOKEN) {
  console.error('❌ No SUPABASE_ACCESS_TOKEN found in environment or .env.local');
  process.exit(1);
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Usage: node apply-migration.js <migration-file.sql>');
  process.exit(1);
}

const migrationPath = path.resolve(migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

// Read migration SQL
console.log(`📁 Reading migration: ${migrationPath}`);
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
      console.log('✅ SUCCESS! Migration applied!');
      console.log('');
    } else {
      console.log('');
      console.log('❌ Migration failed!');
      console.log('Response:', responseData);
      console.log('');
      process.exit(1);
    }
  });
});

req.on('error', error => {
  console.error('❌ Request error:', error.message);
  process.exit(1);
});

req.write(data);
req.end();
