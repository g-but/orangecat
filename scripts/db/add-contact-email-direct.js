#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function addContactEmailColumn() {
  console.log('🔧 Adding contact_email column to profiles table...\n');

  // Use the Management API to execute SQL
  // The Management API endpoint for executing SQL is: /rest/v1/rpc/exec_sql
  // But we need to use the service role key

  const sql = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'contact_email'
      ) THEN
        ALTER TABLE public.profiles ADD COLUMN contact_email TEXT;
        COMMENT ON COLUMN public.profiles.contact_email IS 
          'Public contact email (different from registration email). Visible on profile for supporters to contact the user.';
        CREATE INDEX IF NOT EXISTS idx_profiles_contact_email 
          ON public.profiles(contact_email) 
          WHERE contact_email IS NOT NULL;
        RAISE NOTICE 'contact_email column added successfully';
      ELSE
        RAISE NOTICE 'contact_email column already exists';
      END IF;
    END $$;
  `;

  try {
    // Try using Supabase's REST API with the Management API endpoint
    // Note: This might not work if the exec_sql function doesn't exist
    // In that case, we'll need to use the Supabase Dashboard or CLI

    console.log('📝 Attempting to execute SQL via Management API...\n');

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
      console.log('✅ SQL executed successfully!\n');
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to execute SQL via REST API');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${errorText}\n`);

      // Fallback: Use Supabase client to check if column exists
      console.log('🔍 Checking if column exists via Supabase client...\n');

      try {
        const { data, error } = await supabase.from('profiles').select('contact_email').limit(1);

        if (error) {
          if (error.message.includes('contact_email') || error.message.includes('column')) {
            console.log('❌ Column does not exist. Please apply the migration manually:\n');
            console.log(
              '   1. Go to: https://app.supabase.com/project/ohkueislstxomdjavyhs/sql/new'
            );
            console.log('   2. Copy and paste this SQL:\n');
            console.log(sql);
            console.log('\n   3. Click "Run"\n');
            process.exit(1);
          } else {
            throw error;
          }
        } else {
          console.log('✅ Column exists! The migration may have already been applied.\n');
        }
      } catch (checkError) {
        console.error('❌ Error checking column:', checkError.message);
        console.log('\n💡 Please apply the migration manually via Supabase Dashboard:\n');
        console.log('   1. Go to: https://app.supabase.com/project/ohkueislstxomdjavyhs/sql/new');
        console.log('   2. Copy and paste this SQL:\n');
        console.log(sql);
        console.log('\n   3. Click "Run"\n');
        process.exit(1);
      }
    }

    // Verify the column exists
    console.log('🔍 Verifying column exists...\n');
    const { data: verifyData, error: verifyError } = await supabase
      .from('profiles')
      .select('contact_email')
      .limit(1);

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      process.exit(1);
    }

    console.log('✅ Verification successful - contact_email column is accessible\n');
    console.log('✨ Migration complete!\n');
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    console.error(err.stack);
    console.log('\n💡 Please apply the migration manually via Supabase Dashboard:\n');
    console.log('   1. Go to: https://app.supabase.com/project/ohkueislstxomdjavyhs/sql/new');
    console.log('   2. Copy and paste this SQL:\n');
    console.log(sql);
    console.log('\n   3. Click "Run"\n');
    process.exit(1);
  }
}

addContactEmailColumn().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});



