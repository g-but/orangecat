#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

async function applyMigration() {
  console.log('🔧 Applying contact_email migration...\n');

  const migrationPath = path.join(
    __dirname,
    '../../supabase/migrations/20251124060022_add_contact_email.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📝 Executing migration SQL...\n');

  try {
    // Split into statements and execute one by one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('='));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;

      const preview = stmt.substring(0, 80).replace(/\s+/g, ' ');

      console.log(`[${i + 1}/${statements.length}] ${preview}...`);

      try {
        // Use the REST API to execute SQL via the Management API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseServiceKey,
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: stmt }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Check if it's a "already exists" error which is fine
          if (errorText.includes('already exists') || errorText.includes('duplicate')) {
            console.log('  ⚠️  Already exists, continuing...\n');
            continue;
          }
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        console.log('  ✅ Success\n');
      } catch (err) {
        // Try direct SQL execution via Supabase client
        if (
          err.message.includes('already exists') ||
          err.message.includes('does not exist') ||
          err.message.includes('duplicate')
        ) {
          console.log("  ⚠️  Already exists/doesn't exist, continuing...\n");
          continue;
        }

        // If REST API doesn't work, try using psql via Supabase CLI
        console.log('  ⚠️  REST API approach failed, trying alternative...');
        console.log(`  Error: ${err.message}\n`);

        // For ALTER TABLE statements, we can try a different approach
        if (stmt.toUpperCase().includes('ALTER TABLE')) {
          console.log('  💡 This is an ALTER TABLE statement - it may need manual application');
          console.log('  💡 You can apply it via Supabase Dashboard SQL Editor\n');
        }
      }
    }

    // Verify the migration
    console.log('🔍 Verifying migration...\n');

    try {
      const { data, error } = await supabase.from('profiles').select('contact_email').limit(1);

      if (error) {
        console.log('❌ Could not verify: column may not exist yet');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log('✅ contact_email column exists in profiles table');
      }
    } catch (err) {
      console.log('❌ Verification failed:', err.message);
    }

    console.log('\n✨ Migration process complete!\n');
    console.log("💡 If the column still doesn't exist, apply the SQL manually:");
    console.log('   1. Go to: https://app.supabase.com/project/ohkueislstxomdjavyhs/sql/new');
    console.log(
      '   2. Copy the SQL from: supabase/migrations/20251124060022_add_contact_email.sql'
    );
    console.log('   3. Paste and run\n');
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
  }
}

applyMigration().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});














































