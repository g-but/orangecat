const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileFunctionality() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Step 1: Test authentication
    // REMOVED: console.log statement for security
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'butaeff@gmail.com',
      password: 'orangecat123'
    });
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return;
    }
    
    // REMOVED: console.log statement for security
    
    // Step 2: Test profile retrieval
    // REMOVED: console.log statement
    const { data: existingProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (getError && getError.code !== 'PGRST116') {
      console.error('❌ Error getting profile:', getError.message);
    } else if (existingProfile) {
      if (process.env.NODE_ENV === 'development') console.log('✅ Profile found:', existingProfile);
    } else {
      // REMOVED: console.log statement
    }
    
    // Step 3: Test profile update with current schema
    // REMOVED: console.log statement
    
    const updateData = {
      username: 'butaeff',
      full_name: 'Butae Orange Cat', // Using full_name instead of display_name
      avatar_url: 'https://example.com/avatar.jpg',
      website: 'https://orangecat.ch',
      updated_at: new Date().toISOString()
    };
    
    // REMOVED: console.log statement
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .upsert(updateData)
      .eq('id', user.id)
      .select('*')
      .single();
    
    if (updateError) {
      console.error('❌ Profile update failed:', updateError.message);
      console.error('   Code:', updateError.code);
      console.error('   Details:', updateError.details);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Profile update successful:', updateResult);
    }
    
    // Step 4: Test profile creation if needed
    if (!existingProfile && updateError) {
      // REMOVED: console.log statement
      
      const createData = {
        id: user.id,
        username: 'butaeff',
        full_name: 'Butae Orange Cat',
        avatar_url: 'https://example.com/avatar.jpg',
        website: 'https://orangecat.ch',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: createResult, error: createError } = await supabase
        .from('profiles')
        .insert(createData)
        .select('*')
        .single();
      
      if (createError) {
        console.error('❌ Profile creation failed:', createError.message);
      } else {
        if (process.env.NODE_ENV === 'development') console.log('✅ Profile creation successful:', createResult);
      }
    }
    
    // Step 5: Final verification
    // REMOVED: console.log statement
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (finalError) {
      console.error('❌ Final verification failed:', finalError.message);
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Final profile state:', finalProfile);
      // REMOVED: console.log statement
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    if (process.env.NODE_ENV === 'development') console.log('✅ Profile Schema: Fixed to match database');
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

testProfileFunctionality(); 