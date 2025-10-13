const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixProfilesSchema() {
  // REMOVED: console.log statement
  
  try {
    // REMOVED: console.log statement
    const { data: currentProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Cannot access profiles table:', error);
      return;
    }
    
    if (currentProfile && currentProfile.length > 0) {
      // REMOVED: console.log statement
    }
    
    // REMOVED: console.log statement
    
    // Add missing columns one by one
    const columnsToAdd = [
      { name: 'bio', type: 'text', description: 'User biography' },
      { name: 'display_name', type: 'text', description: 'User display name' },
      { name: 'bitcoin_address', type: 'text', description: 'Bitcoin address for donations' },
      { name: 'lightning_address', type: 'text', description: 'Lightning address for donations' },
      { name: 'banner_url', type: 'text', description: 'Profile banner image URL' }
    ];
    
    for (const column of columnsToAdd) {
      // REMOVED: console.log statement
      
      try {
        // Try to add the column - if it already exists, this will fail gracefully
        const { error: addError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
        });
        
        if (addError) {
          // REMOVED: console.log statement
          
          // Try to test if column exists by attempting to select it
          const { error: testError } = await supabase
            .from('profiles')
            .select(column.name)
            .limit(1);
            
          if (testError && testError.message.includes('column')) {
            // REMOVED: console.log statement
          } else {
            if (process.env.NODE_ENV === 'development') console.log(`✅ Column ${column.name} already exists`);
          }
        } else {
          // REMOVED: console.log statement
        }
      } catch (err) {
        // REMOVED: console.log statement
      }
    }
    
    // REMOVED: console.log statement
    
    // Test if we can now update with the expected columns
    const userId = 'c7f91de5-214b-4210-a0c7-ab4ad1ac70c9';
    const testData = {
      username: 'butaeff',
      display_name: 'Butaeff',
      bio: 'OrangeCat creator',
      bitcoin_address: 'bc1qgsup75ajy4rln08j0te9wpdgrf46ctx6w94xzq'
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(testData)
      .eq('id', userId)
      .select('*');
      
    if (updateError) {
      console.error('❌ Update test still failing:', updateError);
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      columnsToAdd.forEach(col => {
        // REMOVED: console.log statement
      });
      // REMOVED: console.log statement
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Update test succeeded!');
      // REMOVED: console.log statement
    }
    
    // Check final schema
    // REMOVED: console.log statement
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (finalProfile) {
      if (process.env.NODE_ENV === 'development') console.log('✅ All columns:', Object.keys(finalProfile));
      // REMOVED: console.log statement
      // REMOVED: console.log statement
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixProfilesSchema(); 