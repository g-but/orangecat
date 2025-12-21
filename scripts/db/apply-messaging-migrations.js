#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function executeSQL(sql, description) {
  console.log(`📝 Executing: ${description}`);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ query: sql }),
    });

    if (response.ok) {
      console.log(`✅ ${description} - SUCCESS`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ ${description} - FAILED`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${description} - ERROR:`, error.message);
    return false;
  }
}

async function applyMigrations() {
  console.log('🚀 Applying messaging migrations...\n');

  const migrations = [
    {
      file: 'supabase/migrations/20251207_create_private_messaging.sql',
      description: 'Create private messaging system'
    },
    {
      file: 'supabase/migrations/20251208_fix_messaging_views.sql',
      description: 'Fix messaging views and functions'
    },
    {
      file: 'supabase/migrations/20251208_grant_messaging_permissions.sql',
      description: 'Grant messaging permissions'
    }
  ];

  for (const migration of migrations) {
    try {
      const sql = fs.readFileSync(migration.file, 'utf8');
      const success = await executeSQL(sql, migration.description);
      if (!success) {
        console.log(`\n❌ Migration failed: ${migration.file}`);
        process.exit(1);
      }
      console.log('');
    } catch (error) {
      console.error(`❌ Failed to read migration file ${migration.file}:`, error.message);
      process.exit(1);
    }
  }

  console.log('🎉 All messaging migrations applied successfully!');
  console.log('\n🔄 You may need to refresh your browser to see the changes.');
}

applyMigrations().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


























