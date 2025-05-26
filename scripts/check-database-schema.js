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

async function checkDatabaseSchema() {
  console.log('🔍 Checking current database schema...\n');
  
  try {
    // Check if profiles table exists and get its structure
    console.log('🔍 Checking profiles table...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (profileError) {
      console.error('❌ Cannot access profiles table:', profileError);
    } else {
      console.log('✅ Profiles table is accessible');
      if (profileData && profileData.length > 0) {
        console.log('✅ Current profiles table columns:', Object.keys(profileData[0]));
      } else {
        console.log('⚠️ Profiles table is empty, checking for existence...');
        // Try to insert a test record to see what columns are expected
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: '00000000-0000-0000-0000-000000000000' });
        
        if (insertError) {
          console.log('Insert error (reveals expected columns):', insertError.message);
        }
      }
    }
    
    // Check your specific user profile
    console.log('\n👤 Checking your profile data...');
    const userId = 'c7f91de5-214b-4210-a0c7-ab4ad1ac70c9';
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error('❌ Error fetching your profile:', userError);
    } else if (userProfile) {
      console.log('✅ Your current profile:');
      console.log(JSON.stringify(userProfile, null, 2));
    } else {
      console.log('❌ Your profile not found');
    }
    
    // Check other tables if they exist
    const tablesToCheck = ['funding_pages', 'transactions'];
    for (const tableName of tablesToCheck) {
      console.log(`\n📊 Checking ${tableName} table...`);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ ${tableName} table not accessible: ${error.message}`);
      } else {
        console.log(`✅ ${tableName} table exists and is accessible`);
        if (data && data.length > 0) {
          console.log(`Sample structure:`, Object.keys(data[0]));
        } else {
          console.log(`${tableName} table is empty`);
        }
      }
    }
    
    // Test the specific update that's failing
    console.log('\n🧪 Testing the failing update...');
    const testData = {
      username: 'test',
      display_name: 'test',
      bio: 'test bio',
      bitcoin_address: 'bc1qtest'
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(testData)
      .eq('id', userId)
      .select('*');
      
    if (updateError) {
      console.error('❌ Update test failed:', updateError);
      console.log('This confirms the column issue!');
    } else {
      console.log('✅ Update test succeeded:', updateResult);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseSchema(); 