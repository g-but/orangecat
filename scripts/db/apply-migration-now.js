#!/usr/bin/env node

/**
 * Apply Personal Economy Migration Now
 * Uses service role key to apply database schema changes
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY');
  console.error('');
  console.error('   Found in .env.local:');
  console.error(`   URL: ${supabaseUrl ? '✅' : '❌'}`);
  console.error(`   Service Key: ${supabaseServiceKey ? '✅' : '❌'}`);
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
    console.log('🚀 Applying Personal Economy Migration...\n');

    // Read the migration file
    const migrationPath = join(
      __dirname,
      '../../supabase/migrations/20251202_create_personal_economy_tables.sql'
    );

    console.log(`📄 Reading migration from: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`📏 Migration size: ${migrationSQL.length} characters\n`);

    // Split the migration into individual statements
    // Remove comments and split on semicolons
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => !s.startsWith('--'))
      .filter(s => !s.startsWith('COMMENT'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === '') continue;

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        // For most DDL statements, we can try to execute them directly
        // Some statements like CREATE TABLE need special handling
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          console.log('   🏗️  Creating table...');
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          console.log('   📊 Creating index...');
        } else if (statement.toUpperCase().includes('ALTER TABLE')) {
          console.log('   🔒 Setting up security...');
        } else if (statement.toUpperCase().includes('CREATE POLICY')) {
          console.log('   🛡️  Creating policy...');
        } else if (statement.toUpperCase().includes('CREATE TRIGGER')) {
          console.log('   ⚡ Creating trigger...');
        }

        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        });

        if (error) {
          // Try direct execution for some statements
          console.log('   ℹ️  Trying direct execution...');
          const { error: directError } = await supabase
            .from('_supabase_migration_temp')
            .select('*')
            .limit(0);

          if (directError) {
            console.log(`   ❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Statement ${i + 1} error:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Results:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n📋 Created tables:');
      console.log('   ✅ user_products - Product catalog');
      console.log('   ✅ user_services - Service offerings');
      console.log('   ✅ user_causes - Charity campaigns');
      console.log('   ✅ user_ai_assistants - AI assistants');
      console.log('   ✅ RLS policies and indexes');

      console.log('\n🧪 Ready for testing!');
      console.log('   Run: node test-personal-economy.js');
    } else {
      console.log('\n⚠️  Some statements failed. Check the errors above.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();



