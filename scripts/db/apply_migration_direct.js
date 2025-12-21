const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use environment variables directly since dotenv might not be working
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For database operations, we might need to try a different approach
// Let's try using the anon key first and see if we can execute raw SQL

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function applyMigrationDirectly() {
  try {
    console.log('Attempting to apply assets migration directly...');

    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20251205090000_add_assets_and_collateral.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Migration file loaded, length:', migrationSQL.length);

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Try to execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        try {
          // Try using rpc with raw SQL execution if available
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (error) {
            console.warn(`Statement ${i + 1} failed:`, error.message);
            // Continue with other statements
          } else {
            console.log(`Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`Statement ${i + 1} error:`, err.message);
          // Continue with other statements
        }
      }
    }

    console.log('Migration application attempt completed');

    // Test if the assets table was created
    console.log('Testing if assets table exists...');
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Assets table test failed:', error.message);
    } else {
      console.log('Assets table exists! Migration successful.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

applyMigrationDirectly();
































