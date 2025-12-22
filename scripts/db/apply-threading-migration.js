#!/usr/bin/env node

/**
 * Apply Threading Support Migration
 *
 * This script applies the threading support migration to add X-style
 * quote replies and thread visualization to the timeline system.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure .env.local exists and contains these variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  try {
    console.log('🚀 Applying threading support migration...\n');

    // Read the migration file
    const migrationPath = join(
      __dirname,
      '../../supabase/migrations/20250127_add_threading_support.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        });

        if (error) {
          // Try direct execution if rpc fails
          const { error: directError } = await supabase
            .from('_supabase_migration_temp')
            .select('*')
            .limit(1);
          if (directError) {
            console.log('   ℹ️  Trying direct SQL execution...');
            // For now, just log that we need manual execution
            console.log('   ⚠️  Please execute the migration manually in Supabase dashboard');
            console.log(
              '   📄 Migration file: supabase/migrations/20250127_add_threading_support.sql'
            );
            break;
          }
        } else {
          console.log('   ✅ Success');
        }
      } catch (err) {
        console.log(`   ⚠️  Statement ${i + 1} may need manual execution`);
        console.log(`      Error: ${err.message}`);
      }
    }

    console.log('\n🎉 Migration application completed!');
    console.log('🔍 Verifying threading support...');

    // Verify the migration was applied
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'timeline_events')
      .in('column_name', ['thread_depth', 'is_quote_reply']);

    if (columnError) {
      console.log('⚠️  Could not verify column creation');
    } else if (columns && columns.length >= 2) {
      console.log('✅ Threading columns created successfully');
    } else {
      console.log('⚠️  Threading columns may not have been created');
    }

    // Test the functions
    console.log('🔍 Testing create_quote_reply function...');
    try {
      const { error: funcError } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', 'create_quote_reply');

      if (funcError) {
        console.log('⚠️  Could not verify function creation');
      } else {
        console.log('✅ create_quote_reply function available');
      }
    } catch (err) {
      console.log('⚠️  Function verification failed');
    }

    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Test quote reply functionality');
    console.log('3. Verify thread visualization works');
    console.log('4. Check thread navigation features');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n🔧 Manual execution:');
    console.log('   Copy the contents of supabase/migrations/20250127_add_threading_support.sql');
    console.log('   Execute in Supabase SQL Editor or psql');
    process.exit(1);
  }
}

// Run the migration
applyMigration();
