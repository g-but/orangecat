#!/usr/bin/env node

/**
 * Apply Organization Members Migration Direct
 *
 * Uses Supabase service role client to apply the migration directly.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
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
    console.log('🚀 Applying Organization Members Migration...\n');

    // Read the migration file
    const migrationSQL = readFileSync('supabase/migrations/20251205100000_add_organization_members.sql', 'utf-8');

    // Split into statements and filter out comments and empty lines
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => !s.startsWith('--'))
      .filter(s => !s.startsWith('COMMENT'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === '') continue;

      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        // Try to execute the statement directly
        const { error } = await supabase.rpc('exec', { query: statement + ';' });

        if (error) {
          console.log(`   ❌ Statement ${i + 1} failed:`, error.message);
          errorCount++;
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
      console.log('\n📋 Created:');
      console.log('   ✅ organization_members table');
      console.log('   ✅ Member role-based permissions');
      console.log('   ✅ Row Level Security policies');
      console.log('   ✅ Automatic owner assignment trigger');
    } else {
      console.log('\n⚠️  Some statements failed. You may need to apply them manually.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();