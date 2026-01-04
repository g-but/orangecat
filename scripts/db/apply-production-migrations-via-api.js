#!/usr/bin/env node
/**
 * Apply Production Readiness Migrations via Supabase Management API
 * 
 * Uses Supabase Management API to apply migrations.
 * Requires SUPABASE_ACCESS_TOKEN in .env.local
 * 
 * Usage: node scripts/db/apply-production-migrations-via-api.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read token from .env.local
let envToken = null;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/SUPABASE_ACCESS_TOKEN=(.+)/);
  if (match) {
    envToken = match[1].trim();
  }
} catch (e) {
  console.warn('⚠️  Could not read .env.local');
}

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || envToken;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'ohkueislstxomdjavyhs';

if (!ACCESS_TOKEN) {
  console.error('❌ No SUPABASE_ACCESS_TOKEN found in environment or .env.local');
  console.error('   Get it from: https://supabase.com/dashboard/account/tokens');
  process.exit(1);
}

// Migration files in order
const migrations = [
  {
    name: 'Migrate Organizations to Groups',
    file: 'scripts/db/migrate-organizations-to-groups.sql',
  },
  {
    name: 'Create Actors Table',
    file: 'supabase/migrations/20250130000004_create_actors_table.sql',
  },
  {
    name: 'Migrate Users to Actors',
    file: 'scripts/db/migrate-users-to-actors.sql',
  },
  {
    name: 'Migrate Groups to Actors',
    file: 'scripts/db/migrate-groups-to-actors.sql',
  },
  {
    name: 'Add Actor ID to Entities',
    file: 'supabase/migrations/20250130000005_add_actor_id_to_entities.sql',
  },
  {
    name: 'Populate Actor ID',
    file: 'scripts/db/populate-actor-id.sql',
  },
];

function applyMigration(migration) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(process.cwd(), migration.file);
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`Migration file not found: ${filePath}`));
      return;
    }

    console.log(`\n📄 ${migration.name}`);
    console.log(`   File: ${migration.file}`);
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`   Size: ${sql.length} characters`);

    const data = JSON.stringify({ query: sql });

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
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   ✅ Success!');
          resolve({ success: true, response: responseData });
        } else {
          console.log(`   ❌ Failed (${res.statusCode})`);
          console.log(`   Response: ${responseData.substring(0, 200)}`);
          reject(new Error(`Migration failed: ${responseData}`));
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🚀 Production Readiness Migrations');
  console.log('=====================================\n');
  console.log(`📍 Project: ${PROJECT_REF}`);
  console.log(`🔑 Token: ${ACCESS_TOKEN.substring(0, 20)}...\n`);

  try {
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      await applyMigration(migration);
      
      // Small delay between migrations
      if (i < migrations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('1. Verify data migration in Supabase Dashboard');
    console.log('2. Test group creation/editing');
    console.log('3. Test entity ownership with actors');
    console.log('4. Run: npm run build (check for TypeScript errors)');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  }
}

main();


