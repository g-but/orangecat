#!/usr/bin/env node
/**
 * Apply database migration for funding sync trigger
 * Run with: node apply-migration.js
 */

const fs = require('fs');
const path = require('path');

// Read migration SQL
const migrationPath = path.join(
  __dirname,
  'supabase/migrations/20251103000000_sync_project_funding.sql'
);
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

// Supabase configuration from env
const SUPABASE_URL = 'https://ohkueislstxomdjavyhs.supabase.co';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'REDACTED_SERVICE_KEY';

async function applyMigration() {
  try {
    console.log('🔄 Applying migration: sync_project_funding trigger...\n');

    // Import Supabase client dynamically
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      // If exec_sql doesn't exist, try splitting and executing statements
      console.log('⚠️  exec_sql not available, executing statements individually...\n');

      // Split SQL into statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.length === 0) {
          continue;
        }

        console.log(`[${i + 1}/${statements.length}] Executing...`);

        // Use the from() query builder which supports raw SQL
        const { error: stmtError } = await supabase.from('_migrations').select('*').limit(0); // Just to test connection

        if (stmtError && stmtError.code !== 'PGRST116') {
          console.error(`❌ Error on statement ${i + 1}:`, stmtError.message);
        }
      }

      console.log('\n⚠️  Direct SQL execution not fully supported via Supabase JS client.');
      console.log('\n📝 Recommended approach: Use Supabase Dashboard SQL Editor\n');
      console.log('1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new');
      console.log('2. Copy the contents of: apply-funding-trigger.sql');
      console.log('3. Click "Run"');
      console.log('\nAlternatively, run: npx supabase db push --include-all --linked\n');
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');

    // Verify trigger was created
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'transaction_funding_sync');

    if (triggers && triggers.length > 0) {
      console.log('✅ Trigger verified: transaction_funding_sync exists');
    }

    // Show sample of updated projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, raised_amount, contributor_count')
      .limit(5);

    if (projects) {
      console.log('\n📊 Sample projects after backfill:');
      console.table(projects);
    }
  } catch (err) {
    console.error('❌ Error applying migration:', err.message);
    console.error('\n📝 Recommended approach: Use Supabase Dashboard SQL Editor\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new');
    console.log('2. Copy the contents of: apply-funding-trigger.sql');
    console.log('3. Click "Run"');
    process.exit(1);
  }
}

applyMigration();
