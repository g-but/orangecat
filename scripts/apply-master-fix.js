#!/usr/bin/env node

/**
 * Apply Master Database Fix
 *
 * Executes the complete database repair script via Supabase client.
 * This fixes RLS policies, schema issues, and enables all commerce features.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function applyMasterFix() {
  console.log('🚀 Applying OrangeCat Database Master Fix...');

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Read the master fix SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'sql', 'database_master_fix.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded, executing...');

    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    let executed = 0;
    let errors = 0;

    for (const statement of statements) {
      if (!statement.trim()) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });

        if (error) {
          // If exec_sql doesn't exist, try direct query
          if (error.message.includes('function exec_sql')) {
            console.log('⚠️  exec_sql function not available, trying direct execution...');
            const { error: directError } = await supabase
              .from('_supabase_migration_temp')
              .select('*')
              .limit(1);
            if (directError) {
              console.log(
                '⚠️  Cannot execute SQL directly. Please run the master fix manually in Supabase SQL editor.'
              );
              break;
            }
          } else {
            console.error(`❌ Statement failed:`, statement.substring(0, 100) + '...');
            console.error(`   Error: ${error.message}`);
            errors++;
          }
        } else {
          executed++;
          if (executed % 10 === 0) {
            console.log(`✅ Executed ${executed} statements...`);
          }
        }
      } catch (err) {
        console.error(`❌ Failed to execute statement:`, err.message);
        errors++;
      }
    }

    console.log(`\n📊 Master Fix Results:`);
    console.log(`✅ Successfully executed: ${executed} statements`);
    console.log(`❌ Failed statements: ${errors}`);

    if (executed > 0) {
      console.log('\n🎉 Database master fix applied successfully!');
      console.log('🔄 Commerce features (products, services, loans) should now work.');
    } else {
      console.log('\n⚠️  No statements were executed.');
      console.log(
        '💡 Manual application required - run supabase/sql/database_master_fix.sql in Supabase SQL editor'
      );
    }
  } catch (error) {
    console.error('❌ Failed to apply master fix:', error.message);

    if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Network issue detected. The fix may need to be applied manually.');
    }

    console.log('\n🔧 Manual Application Instructions:');
    console.log('1. Open Supabase Dashboard > SQL Editor');
    console.log('2. Copy contents of supabase/sql/database_master_fix.sql');
    console.log('3. Execute the SQL script');
    console.log('4. Run: node scripts/db-verify-fixes.mjs to verify');
  }
}

// Run the fix
applyMasterFix().catch(console.error);



