#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkAndAddColumn() {
  console.log('🔍 Checking if contact_email column exists...\n');

  try {
    // Try to query the column - if it doesn't exist, this will fail
    const { data, error } = await supabase.from('profiles').select('contact_email').limit(1);

    if (error) {
      if (error.message.includes('contact_email') || error.message.includes('column')) {
        console.log('❌ contact_email column does not exist');
        console.log('📝 Adding contact_email column...\n');

        // Use the Management API to execute SQL
        const sql = `
          ALTER TABLE IF NOT EXISTS public.profiles
            ADD COLUMN IF NOT EXISTS contact_email TEXT;
          
          COMMENT ON COLUMN public.profiles.contact_email IS 
            'Public contact email (different from registration email). Visible on profile for supporters to contact the user.';
          
          CREATE INDEX IF NOT EXISTS idx_profiles_contact_email 
            ON public.profiles(contact_email) 
            WHERE contact_email IS NOT NULL;
        `;

        // Try using the REST API endpoint for SQL execution
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

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Failed to execute SQL via REST API');
          console.error(`   Error: ${errorText}`);
          console.log('\n💡 Please apply this SQL manually via Supabase Dashboard:');
          console.log('   https://app.supabase.com/project/ohkueislstxomdjavyhs/sql/new\n');
          console.log('SQL to execute:');
          console.log(sql);
          process.exit(1);
        }

        console.log('✅ contact_email column added successfully!\n');
      } else {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
      }
    } else {
      console.log('✅ contact_email column already exists!\n');
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

checkAndAddColumn().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});



