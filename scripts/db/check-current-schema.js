const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentSchema() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Method 1: Try to get a sample profile to see columns
    // REMOVED: console.log statement
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('   ❌ Could not query profiles:', profilesError.message);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      const columns = Object.keys(profiles[0]);
      // REMOVED: console.log statement
      // REMOVED: console.log statement
    } else {
      // REMOVED: console.log statement
    }
    
    // Method 2: Try to query information schema
    // REMOVED: console.log statement
    
    try {
      const { data: schemaInfo, error: schemaError } = await supabase
        .rpc('exec', {
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });
      
      if (schemaError) {
        // REMOVED: console.log statement
      } else if (schemaInfo && schemaInfo.length > 0) {
        // REMOVED: console.log statement
        schemaInfo.forEach(col => {
          // REMOVED: console.log statement
        });
      }
    } catch (err) {
      // REMOVED: console.log statement
    }
    
    // Method 3: Test specific column existence
    // REMOVED: console.log statement
    
    const testColumns = [
      'id', 'username', 'full_name', 'display_name', 'bio', 
      'avatar_url', 'banner_url', 'website', 'bitcoin_address',
      'lightning_address', 'email', 'phone', 'location',
      'social_links', 'preferences', 'verification_status',
      'profile_color', 'follower_count', 'created_at', 'updated_at'
    ];
    
    const existingColumns = [];
    const missingColumns = [];
    
    for (const column of testColumns) {
      try {
        const { error } = await supabase
          .from('profiles')
          .select(column)
          .limit(1);
        
        if (error && error.message.includes('does not exist')) {
          missingColumns.push(column);
        } else {
          existingColumns.push(column);
        }
      } catch (err) {
        missingColumns.push(column);
      }
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    // Method 4: Check if we can add a column
    // REMOVED: console.log statement
    
    try {
      // Try to add a test column
      const { error: addError } = await supabase
        .rpc('exec', {
          sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS test_column TEXT;'
        });
      
      if (addError) {
        // REMOVED: console.log statement
        // REMOVED: console.log statement
      } else {
        // REMOVED: console.log statement
        
        // Remove the test column
        await supabase.rpc('exec', {
          sql: 'ALTER TABLE public.profiles DROP COLUMN IF EXISTS test_column;'
        });
        // REMOVED: console.log statement
      }
    } catch (err) {
      // REMOVED: console.log statement
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log(`✅ Existing columns: ${existingColumns.length}`);
    // REMOVED: console.log statement
    
    if (missingColumns.length > 0) {
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
    } else {
      // REMOVED: console.log statement
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkCurrentSchema(); 