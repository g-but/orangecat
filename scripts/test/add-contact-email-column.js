#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

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

  try {
    // First check if the column exists
    console.log('🔍 Checking if column exists...');
    const { data: checkData, error: checkError } = await supabase
      .from('profiles')
      .select('contact_email')
      .limit(1);

    if (checkError && checkError.message.includes('contact_email')) {
      console.log('❌ Column does not exist, adding it...\n');

      // Use Supabase's RPC to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public'
              AND table_name = 'profiles'
              AND column_name = 'contact_email'
            ) THEN
              ALTER TABLE public.profiles ADD COLUMN contact_email TEXT;
              CREATE INDEX IF NOT EXISTS idx_profiles_contact_email
                ON public.profiles(contact_email)
                WHERE contact_email IS NOT NULL;
              RAISE NOTICE 'contact_email column added successfully';
            ELSE
              RAISE NOTICE 'contact_email column already exists';
            END IF;
          END $$;
        `,
      });

      if (error) {
        console.error('❌ Failed to add column:', error.message);
        process.exit(1);
      }

      console.log('✅ Column added successfully!\n');
    } else {
      console.log('✅ Column already exists!\n');
    }

    // Verify
    console.log('🔍 Verifying column exists...');
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
    process.exit(1);
  }
}

addContactEmailColumn().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});














































