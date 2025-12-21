#!/usr/bin/env node

/**
 * Apply Personal Economy Migration
 *
 * This script applies the personal economy tables migration to add:
 * - user_products (My Store)
 * - user_services (My Services)
 * - user_causes (My Causes)
 * - user_ai_assistants (My Cat)
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
    console.log('🚀 Applying Personal Economy migration...\n');

    // Read the migration file
    const migrationPath = join(
      __dirname,
      '../../supabase/migrations/20251202_create_personal_economy_tables.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded successfully');
    console.log(`📏 File size: ${migrationSQL.length} characters\n`);

    // Apply RLS policy fixes
    console.log('🔧 Applying RLS policy fixes...\n');

    const rlsFixes = `
-- Admin policies for service role operations
CREATE POLICY "Admin can manage all products"
  ON user_products FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin can manage all services"
  ON user_services FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admin can manage all causes"
  ON user_causes FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
`;

    try {
      // Try to execute the RLS fixes using RPC if available
      console.log('Attempting to apply RLS policy fixes...');
      // Note: This would require creating an RPC function in Supabase
      console.log('⚠️  RLS fixes need to be applied manually via Supabase Dashboard SQL Editor.');
      console.log('📋 Copy and run this SQL:\n');
      console.log(rlsFixes);
      console.log('\n');

      console.log('⚠️  Original migration still needs manual application.');
      console.log('📋 To apply the full migration:\n');

      console.log('   Option 1 - Via Supabase Dashboard:');
      console.log('   1. Go to: https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to SQL Editor');
      console.log('   4. Copy and paste the entire migration file:');
      console.log(`      ${migrationPath}`);
      console.log('   5. Click "Run"\n');

      console.log('   Option 2 - Via Supabase CLI (if installed):');
      console.log('   supabase db push\n');

    // Test if we can connect to Supabase
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1).single();

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      console.log('\n💡 Make sure your Supabase project is running and credentials are correct.');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('🎯 Ready to apply migration via dashboard.');
    }

    console.log('\n📝 Migration includes:');
    console.log('   ✅ user_products table - Product catalog');
    console.log('   ✅ user_services table - Service offerings');
    console.log('   ✅ user_causes table - Charity campaigns');
    console.log('   ✅ user_ai_assistants table - AI assistants');
    console.log('   ✅ RLS policies for security');
    console.log('   ✅ Performance indexes');
    console.log('   ✅ Automatic timestamps');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

applyMigration();


































