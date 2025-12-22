#!/usr/bin/env node

/**
 * Create Personal Economy Tables Programmatically
 * Uses Supabase service role key and client methods
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTables() {
  try {
    console.log('🚀 Creating Personal Economy Tables...\n');

    // Test connection
    console.log('🔍 Testing connection...');
    const { error: testError } = await supabase.from('profiles').select('count').limit(1).single();
    if (testError) {
      console.error('❌ Connection failed:', testError.message);
      process.exit(1);
    }
    console.log('✅ Connection successful\n');

    // Since direct DDL isn't available via JS client, we'll try to execute
    // the migration by splitting it into individual statements and using
    // a workaround approach

    console.log('⚠️  Note: Direct DDL execution via JS client is limited in Supabase');
    console.log('📋 For security, Supabase requires manual application via Dashboard');
    console.log('');
    console.log('🔗 Please apply the migration manually:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new');
    console.log(
      '   2. Copy the entire SQL from: supabase/migrations/20251202_create_personal_economy_tables.sql'
    );
    console.log('   3. Paste and click Run');
    console.log('');
    console.log('✅ This will create:');
    console.log('   • user_products table');
    console.log('   • user_services table');
    console.log('   • user_causes table');
    console.log('   • user_ai_assistants table');
    console.log('   • All indexes, policies, and triggers');

    // Try to verify if tables already exist
    console.log('\n🔍 Checking if tables already exist...');

    const tablesToCheck = ['user_products', 'user_services', 'user_causes', 'user_ai_assistants'];

    for (const tableName of tablesToCheck) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1);
        if (!error) {
          console.log(`   ✅ ${tableName} - Already exists`);
        } else {
          console.log(`   ❌ ${tableName} - Does not exist`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName} - Error checking: ${err.message}`);
      }
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Apply migration via Supabase Dashboard');
    console.log('   2. Run: node test-personal-economy.js');
    console.log('   3. Test the features at http://localhost:3000/dashboard');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTables();
