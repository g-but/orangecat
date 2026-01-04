#!/usr/bin/env node

/**
 * Apply Organization Members Migration
 *
 * This script applies the organization_members table migration.
 * Run this after setting up your Supabase credentials.
 *
 * Usage:
 *   node scripts/db/apply-organization-members-migration.js
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
  console.error('   Please check your .env.local file');
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
    const migrationPath = join(
      __dirname,
      '../../supabase/migrations/20251205100000_add_organization_members.sql'
    );

    console.log(`📄 Reading migration from: ${migrationPath}`);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`📏 Migration size: ${migrationSQL.length} characters\n`);

    // Split the migration into individual statements
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

        // Execute the statement directly
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';',
        });

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
      console.log('   ✅ RLS policies for member management');
      console.log('   ✅ Automated role-based permissions');
      console.log('   ✅ Owner creation trigger');
      console.log('   ✅ Member invitation system');

      console.log('\n🧪 Ready to test!');
      console.log('   1. Visit /organizations/create to create your first organization');
      console.log('   2. Check the organization dashboard at /organizations/[slug]');
      console.log('   3. Try inviting team members');
    } else {
      console.log('\n⚠️  Some statements failed. Check the errors above.');
      console.log('   You may need to run individual statements manually in Supabase.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

applyMigration();



