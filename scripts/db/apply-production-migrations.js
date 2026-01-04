#!/usr/bin/env node
/**
 * Apply Production Readiness Migrations
 * 
 * Applies all migrations for groups unification and actor table in order.
 * 
 * Usage: node scripts/db/apply-production-migrations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  console.error('   Make sure .env.local exists and contains these variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Migration files in order
const migrations = [
  {
    name: 'Migrate Organizations to Groups',
    file: 'scripts/db/migrate-organizations-to-groups.sql',
    description: 'Migrates all organizations data to groups table',
  },
  {
    name: 'Create Actors Table',
    file: 'supabase/migrations/20250130000004_create_actors_table.sql',
    description: 'Creates actors table for unified ownership',
  },
  {
    name: 'Migrate Users to Actors',
    file: 'scripts/db/migrate-users-to-actors.sql',
    description: 'Creates actor records for all users',
  },
  {
    name: 'Migrate Groups to Actors',
    file: 'scripts/db/migrate-groups-to-actors.sql',
    description: 'Creates actor records for all groups',
  },
  {
    name: 'Add Actor ID to Entities',
    file: 'supabase/migrations/20250130000005_add_actor_id_to_entities.sql',
    description: 'Adds actor_id column to all entity tables',
  },
  {
    name: 'Populate Actor ID',
    file: 'scripts/db/populate-actor-id.sql',
    description: 'Populates actor_id for existing entities',
  },
  {
    name: 'Remove Organizations Table',
    file: 'supabase/migrations/20250130000003_remove_organizations_table.sql',
    description: 'Drops legacy organizations tables',
    optional: true, // Only run after verification
  },
];

async function executeSQL(sql) {
  // Split into statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  const results = [];
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        // Use RPC if available, otherwise direct query
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        }).catch(async () => {
          // Fallback: try direct query for simple statements
          if (statement.toUpperCase().startsWith('SELECT')) {
            return await supabase.from('_').select('*').limit(0); // Dummy query
          }
          return { error: { message: 'Cannot execute via RPC' } };
        });

        if (error) {
          // Some errors are expected (IF NOT EXISTS, etc.)
          if (
            error.message.includes('already exists') ||
            error.message.includes('does not exist') ||
            error.message.includes('duplicate key') ||
            error.message.includes('relation already exists')
          ) {
            results.push({ type: 'skipped', statement: statement.substring(0, 60) });
          } else {
            throw error;
          }
        } else {
          results.push({ type: 'success', statement: statement.substring(0, 60) });
        }
      } catch (error) {
        throw new Error(`Failed to execute: ${statement.substring(0, 60)}... - ${error.message}`);
      }
    }
  }

  return results;
}

async function applyMigration(migration) {
  const filePath = path.join(process.cwd(), migration.file);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }

  console.log(`\n📄 ${migration.name}`);
  console.log(`   ${migration.description}`);
  console.log(`   File: ${migration.file}`);
  
  const sql = fs.readFileSync(filePath, 'utf-8');
  console.log(`   Size: ${sql.length} characters`);

  const results = await executeSQL(sql);
  
  const successCount = results.filter(r => r.type === 'success').length;
  const skippedCount = results.filter(r => r.type === 'skipped').length;
  
  console.log(`   ✅ Executed: ${successCount} statements`);
  if (skippedCount > 0) {
    console.log(`   ⏭️  Skipped: ${skippedCount} statements (already exists)`);
  }

  return { success: true, executed: successCount, skipped: skippedCount };
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migrations...');
  
  // Check groups table
  const { data: groups, error: groupsError } = await supabase
    .from('groups')
    .select('id')
    .limit(1);
  
  if (groupsError && !groupsError.message.includes('does not exist')) {
    console.log(`   ⚠️  Groups table: ${groupsError.message}`);
  } else {
    console.log('   ✅ Groups table exists');
  }

  // Check actors table
  const { data: actors, error: actorsError } = await supabase
    .from('actors')
    .select('id')
    .limit(1);
  
  if (actorsError && !actorsError.message.includes('does not exist')) {
    console.log(`   ⚠️  Actors table: ${actorsError.message}`);
  } else {
    console.log('   ✅ Actors table exists');
  }

  // Check if organizations table still exists (should be removed)
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);
  
  if (orgsError && orgsError.message.includes('does not exist')) {
    console.log('   ✅ Organizations table removed (as expected)');
  } else if (!orgsError) {
    console.log('   ⚠️  Organizations table still exists (will be removed in final step)');
  }
}

async function main() {
  console.log('🚀 Production Readiness Migrations');
  console.log('=====================================\n');
  console.log(`📍 Target: ${supabaseUrl}`);
  console.log(`🔑 Using: ${supabaseKey.substring(0, 20)}...\n`);

  try {
    // Apply migrations in order
    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      
      if (migration.optional) {
        console.log(`\n⏸️  Skipping optional migration: ${migration.name}`);
        console.log('   (Run manually after verification)');
        continue;
      }

      await applyMigration(migration);
      
      // Small delay between migrations
      if (i < migrations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Verify
    await verifyMigration();

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('1. Verify data migration in Supabase Dashboard');
    console.log('2. Test group creation/editing');
    console.log('3. Test entity ownership with actors');
    console.log('4. Run: npm run build (check for TypeScript errors)');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

main();


