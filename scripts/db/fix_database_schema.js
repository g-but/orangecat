// Complete Database Schema Fix
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://ohkueislstxomdjavyhs.supabase.co';
const supabaseKey = 'REPLACE_WITH_ENV_VAR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyCompleteSchema() {
  console.log('🔧 Applying complete OrangeCat database schema...\n');
  
  try {
    // 1. Check current database state
    console.log('📊 Checking current database state...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.log('❌ Cannot query information_schema, trying alternative method...');
    } else {
      console.log('Current tables:', tables?.map(t => t.table_name).join(', ') || 'none');
    }
    
    // 2. Apply essential base tables first
    console.log('\n📝 Applying base schema...');
    
    // Read and apply the consolidated schema
    const schemaFiles = [
      'supabase/migrations/20250924000000_consolidated_schema.sql',
      'supabase/migrations/20251202_create_personal_economy_tables.sql'
    ];
    
    for (const file of schemaFiles) {
      try {
        console.log(`📄 Applying ${file}...`);
        const sql = readFileSync(join(process.cwd(), file), 'utf-8');
        
        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await supabase.rpc('exec_sql', { sql: statement + ';' });
            } catch (e) {
              console.log(`⚠️  Statement failed (might already exist): ${statement.substring(0, 50)}...`);
            }
          }
        }
        
        console.log(`✅ Applied ${file}`);
      } catch (e) {
        console.log(`❌ Failed to apply ${file}:`, e.message);
      }
    }
    
    // 3. Verify tables were created
    console.log('\n🔍 Verifying schema...');
    const essentialTables = [
      'profiles', 'campaigns', 'user_products', 'user_services', 
      'user_causes', 'loans', 'messages', 'timeline_events'
    ];
    
    for (const table of essentialTables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          console.log(`✅ ${table} - OK`);
        } else {
          console.log(`❌ ${table} - MISSING`);
        }
      } catch (e) {
        console.log(`❌ ${table} - ERROR`);
      }
    }
    
    console.log('\n🎉 Schema application complete!');
    console.log('🔄 Restart your Next.js app to pick up the new schema');
    
  } catch (error) {
    console.error('❌ Schema application failed:', error);
  }
}

applyCompleteSchema();
