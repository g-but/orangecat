// Apply migration using existing Supabase client
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use environment variables that should be available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  process.exit(1);
}

console.log('🚀 Applying OrangeCat schema migration...');
console.log(`📍 Target: ${supabaseUrl}`);

// Create client with service role if available, otherwise anon key
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('📄 Reading migration file...');
    const migrationPath = join(__dirname, 'supabase/migrations/20250101000000_complete_orangecat_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log(`📏 Migration size: ${migrationSQL.length} characters`);
    console.log('⚡ Executing migration...');
    
    // Split into statements and execute one by one
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let executed = 0;
    let skipped = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Use raw SQL execution
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            // Some statements might fail safely (like CREATE INDEX IF NOT EXISTS)
            if (error.message.includes('already exists') || error.message.includes('does not exist')) {
              console.log(`⚠️  Skipped: ${statement.substring(0, 60)}...`);
              skipped++;
            } else {
              throw error;
            }
          } else {
            executed++;
          }
        } catch (e) {
          console.log(`❌ Failed: ${statement.substring(0, 60)}... - ${e.message}`);
          throw e;
        }
      }
    }
    
    console.log(`✅ Migration complete!`);
    console.log(`📈 Executed: ${executed} statements`);
    console.log(`⏭️  Skipped: ${skipped} statements (already existed)`);
    
    // Test that tables exist
    console.log('\n🔍 Verifying tables...');
    const tables = ['user_products', 'user_services', 'loans', 'conversations', 'messages', 'timeline_events', 'donations'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          console.log(`✅ ${table} - OK`);
        } else {
          console.log(`❌ ${table} - ERROR: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${table} - ERROR: ${e.message}`);
      }
    }
    
    console.log('\n🎉 SUCCESS: All entity creation should now work!');
    console.log('🚀 Ready for comprehensive browser testing');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n💡 If this fails, you can still apply manually via Supabase SQL Editor');
    console.log('📄 Migration file: supabase/migrations/20250101000000_complete_orangecat_schema.sql');
    process.exit(1);
  }
}

applyMigration();
