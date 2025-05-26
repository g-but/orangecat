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
  console.log('🔧 Fixing profiles table schema...\n');
  
  try {
    console.log('📋 Current profiles table structure:');
    const { data: currentProfile, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Cannot access profiles table:', error);
      return;
    }
    
    if (currentProfile && currentProfile.length > 0) {
      console.log('Current columns:', Object.keys(currentProfile[0]));
    }
    
    console.log('\n🔄 Adding missing columns to profiles table...');
    
    // Add missing columns one by one
    const columnsToAdd = [
      { name: 'bio', type: 'text', description: 'User biography' },
      { name: 'display_name', type: 'text', description: 'User display name' },
      { name: 'bitcoin_address', type: 'text', description: 'Bitcoin address for donations' },
      { name: 'lightning_address', type: 'text', description: 'Lightning address for donations' },
      { name: 'banner_url', type: 'text', description: 'Profile banner image URL' }
    ];
    
    for (const column of columnsToAdd) {
      console.log(`Adding column: ${column.name} (${column.type}) - ${column.description}`);
      
      try {
        // Try to add the column - if it already exists, this will fail gracefully
        const { error: addError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
        });
        
        if (addError) {
          console.log(`⚠️ Could not add ${column.name} via RPC, trying direct approach...`);
          
          // Try to test if column exists by attempting to select it
          const { error: testError } = await supabase
            .from('profiles')
            .select(column.name)
            .limit(1);
            
          if (testError && testError.message.includes('column')) {
            console.log(`❌ Column ${column.name} does not exist and cannot be added via client`);
          } else {
            console.log(`✅ Column ${column.name} already exists`);
          }
        } else {
          console.log(`✅ Successfully added column ${column.name}`);
        }
      } catch (err) {
        console.log(`⚠️ Error with column ${column.name}:`, err.message);
      }
    }
    
    console.log('\n🧪 Testing updated schema...');
    
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
      console.log('\n📝 Manual SQL commands needed:');
      console.log('Go to your Supabase SQL Editor and run:');
      console.log('');
      columnsToAdd.forEach(col => {
        console.log(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
      });
      console.log('');
    } else {
      console.log('✅ Update test succeeded!');
      console.log('Updated profile:', JSON.stringify(updateResult[0], null, 2));
    }
    
    // Check final schema
    console.log('\n📋 Final profiles table structure:');
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (finalProfile) {
      console.log('✅ All columns:', Object.keys(finalProfile));
      console.log('✅ Your profile data:');
      console.log(JSON.stringify(finalProfile, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixProfilesSchema(); 