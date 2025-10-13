const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesSchema() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Try to get one profile to see the actual columns
    // REMOVED: console.log statement
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ Error selecting from profiles:', error.message);
      console.error('   Code:', error.code);
      console.error('   Details:', error.details);
      
      // Try to create a test profile to see what columns are expected
      // REMOVED: console.log statement
      const testUserId = '00000000-0000-0000-0000-000000000000';
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: testUserId,
          username: 'test',
          display_name: 'Test User',
          bio: 'Test bio',
          avatar_url: 'https://example.com/avatar.jpg',
          bitcoin_address: 'bc1qtest'
        });
      
      if (insertError) {
        if (process.env.NODE_ENV === 'development') console.log('✅ Insert error reveals expected schema:');
        // REMOVED: console.log statement
        // REMOVED: console.log statement
        // REMOVED: console.log statement
        
        // Parse the error to understand missing columns
        if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          const match = insertError.message.match(/column "([^"]+)" of relation "profiles" does not exist/);
          if (match) {
            // REMOVED: console.log statement
          }
        }
      } else {
        if (process.env.NODE_ENV === 'development') console.log('✅ Test insert succeeded - cleaning up...');
        await supabase.from('profiles').delete().eq('id', testUserId);
      }
      
    } else {
      // REMOVED: console.log statement
      if (data && data.length > 0) {
        if (process.env.NODE_ENV === 'development') console.log('✅ Current profiles table columns:', Object.keys(data[0]));
        // REMOVED: console.log statement
      } else {
        // REMOVED: console.log statement
        
        // Try to describe the table structure
        // REMOVED: console.log statement
        const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'profiles' AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });
        
        if (columnsError) {
          // REMOVED: console.log statement
        } else {
          if (process.env.NODE_ENV === 'development') console.log('✅ Table structure:');
          columns.forEach(col => {
            // REMOVED: console.log statement
          });
        }
      }
    }
    
    // Check if we can create a profile for the current user
    // REMOVED: console.log statement for security
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      // REMOVED: console.log statement for security
    } else {
      // REMOVED: console.log statement for security
      
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        // REMOVED: console.log statement
      } else if (existingProfile) {
        if (process.env.NODE_ENV === 'development') console.log('✅ Profile exists:', existingProfile);
      } else {
        // REMOVED: console.log statement for security
        
        // Try to create a minimal profile
        // REMOVED: console.log statement
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email.split('@')[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (createError) {
          // REMOVED: console.log statement
          // REMOVED: console.log statement
        } else {
          if (process.env.NODE_ENV === 'development') console.log('✅ Profile created successfully:', newProfile);
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

checkProfilesSchema(); 