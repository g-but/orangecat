#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase service role configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  db: {
    schema: 'public'
  }
});

async function runSQLScript() {
  try {
    console.log('🔧 Executing emergency RLS bypass test...');

    // Read the SQL file
    const sqlContent = fs.readFileSync('emergency_rls_bypass_test.sql', 'utf8');

    // Split into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 60) + '...');

        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

          if (error) {
            console.log('Error executing statement:', error);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (e) {
          console.log('Failed to execute statement:', e.message);
        }
      }
    }

    console.log('🎉 SQL script execution complete!');

  } catch (error) {
    console.error('Script failed:', error);
  }
}

runSQLScript();



