#!/usr/bin/env node

/**
 * Database Diagnostic Script
 * Checks the current state of timeline-related database objects
 */

const https = require('https');
const fs = require('fs');

const PROJECT_REF = 'ohkueislstxomdjavyhs';

// Read token from .env.local
let envToken = null;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/SUPABASE_ACCESS_TOKEN=(.+)/);
  if (match) {
    envToken = match[1].trim();
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
}

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || envToken;

if (!ACCESS_TOKEN) {
  console.error('❌ No access token found!');
  process.exit(1);
}

console.log('🔍 Diagnosing database state...\n');

// Queries to run
const diagnosticQueries = [
  {
    name: 'Check timeline_events table',
    query: `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'timeline_events'
    ) as exists;`,
  },
  {
    name: 'Check timeline_likes table',
    query: `SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'timeline_likes'
    ) as exists;`,
  },
  {
    name: 'Check get_enriched_timeline_feed function',
    query: `SELECT EXISTS (
      SELECT FROM pg_proc WHERE proname = 'get_enriched_timeline_feed'
    ) as exists;`,
  },
  {
    name: 'Check get_user_timeline_feed function',
    query: `SELECT EXISTS (
      SELECT FROM pg_proc WHERE proname = 'get_user_timeline_feed'
    ) as exists;`,
  },
  {
    name: 'Check get_community_timeline function',
    query: `SELECT EXISTS (
      SELECT FROM pg_proc WHERE proname = 'get_community_timeline'
    ) as exists;`,
  },
  {
    name: 'Check profiles table columns',
    query: `SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
      ORDER BY ordinal_position LIMIT 20;`,
  },
  {
    name: 'Check for handle_new_user function',
    query: `SELECT EXISTS (
      SELECT FROM pg_proc WHERE proname = 'handle_new_user'
    ) as exists;`,
  },
  {
    name: 'Check for trigger on auth.users',
    query: `SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;`,
  },
];

let currentIndex = 0;

function runNextQuery() {
  if (currentIndex >= diagnosticQueries.length) {
    console.log('\n✅ Diagnostic complete!');
    return;
  }

  const { name, query } = diagnosticQueries[currentIndex];
  console.log(`\n📊 ${name}:`);

  const data = JSON.stringify({ query });
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

  const req = https.request(options, res => {
    let responseData = '';

    res.on('data', chunk => {
      responseData += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(responseData);
          console.log('   ', JSON.stringify(result, null, 2));
        } catch (e) {
          console.log('   ', responseData);
        }
      } else {
        console.log('   ❌ Error:', responseData);
      }

      currentIndex++;
      setTimeout(runNextQuery, 500); // Small delay between queries
    });
  });

  req.on('error', error => {
    console.error('   ❌ Network error:', error.message);
    currentIndex++;
    setTimeout(runNextQuery, 500);
  });

  req.write(data);
  req.end();
}

// Start running queries
runNextQuery();
