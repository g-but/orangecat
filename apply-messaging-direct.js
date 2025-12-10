#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
  console.log(`📝 Executing: ${description}`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // Try direct SQL execution as fallback
      console.log('   Trying direct SQL execution...');
      const { data: directData, error: directError } = await supabase.from('_supabase_migration_temp').select('*').limit(1);
      if (directError && directError.message.includes('relation') && directError.message.includes('does not exist')) {
        // Create temp function for SQL execution
        const createFuncSQL = `
          CREATE OR REPLACE FUNCTION exec_sql(query text)
          RETURNS json AS $$
          BEGIN
            EXECUTE query;
            RETURN json_build_object('success', true);
          END;
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `;
        try {
          await supabase.rpc('exec_sql', { query: createFuncSQL });
          const { data: funcData, error: funcError } = await supabase.rpc('exec_sql', { query: sql });
          if (funcError) {
            console.log(`❌ ${description} - FAILED: ${funcError.message}`);
            return false;
          } else {
            console.log(`✅ ${description} - SUCCESS`);
            return true;
          }
        } catch (e) {
          console.log(`❌ ${description} - FAILED: ${e.message}`);
          return false;
        }
      }
      console.log(`❌ ${description} - FAILED: ${directError.message}`);
      return false;
    } else {
      console.log(`✅ ${description} - SUCCESS`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${description} - ERROR: ${error.message}`);
    return false;
  }
}

async function applyMessagingMigration() {
  console.log('🚀 Applying messaging migration...\n');

  try {
    const sql = fs.readFileSync('supabase/migrations/20251207_create_private_messaging.sql', 'utf8');

    // Split SQL into individual statements (basic splitting on semicolons)
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;

      const success = await executeSQL(statement + ';', `Statement ${i + 1}`);
      if (!success) {
        console.log(`\n❌ Migration failed at statement ${i + 1}`);
        process.exit(1);
      }
    }

    console.log('\n🎉 Messaging migration applied successfully!');
    console.log('\n🔄 You may need to refresh your browser to see the changes.');
  } catch (error) {
    console.error('❌ Failed to read migration file:', error.message);
    process.exit(1);
  }
}

applyMessagingMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});







