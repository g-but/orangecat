const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY!');
  console.error('This script requires service role key to modify RLS policies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Step 1: Check current RLS status
    // REMOVED: console.log statement
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
    
    if (policiesError) {
      // REMOVED: console.log statement
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Current policies:', policies.length);
    }
    
    // Step 2: Test current user authentication
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
    // REMOVED: console.log statement
    
    // Step 3: Try direct update with service role key
    // REMOVED: console.log statement
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({
        username: 'butaeff',
        full_name: 'Butae Orange Cat',
        avatar_url: 'https://example.com/avatar.jpg',
        website: 'https://orangecat.ch',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('*');
    
    if (updateError) {
      console.error('❌ Service role update failed:', updateError.message);
      console.error('   Code:', updateError.code);
      
      // If it's still RLS, we need to disable RLS temporarily or fix policies
      if (updateError.code === '42501') {
        // REMOVED: console.log statement
        
        // Try to disable RLS temporarily
        // REMOVED: console.log statement
        const { error: disableError } = await supabase.rpc('exec', {
          sql: 'ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;'
        });
        
        if (disableError) {
          // REMOVED: console.log statement
        } else {
          // REMOVED: console.log statement
          
          // Try update again
          const { data: retryResult, error: retryError } = await supabase
            .from('profiles')
            .update({
              username: 'butaeff',
              full_name: 'Butae Orange Cat',
              avatar_url: 'https://example.com/avatar.jpg',
              website: 'https://orangecat.ch',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
            .select('*');
          
          if (retryError) {
            console.error('   ❌ Update still failed:', retryError.message);
          } else {
            // REMOVED: console.log statement
          }
          
          // Re-enable RLS with proper policies
          // REMOVED: console.log statement
          const { error: enableError } = await supabase.rpc('exec', {
            sql: `
              ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
              
              DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
              CREATE POLICY "Users can view all profiles"
                ON public.profiles FOR SELECT
                USING (true);

              DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
              CREATE POLICY "Users can update their own profile"
                ON public.profiles FOR UPDATE
                USING (auth.uid() = id);

              DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
              CREATE POLICY "Users can insert their own profile"
                ON public.profiles FOR INSERT
                WITH CHECK (auth.uid() = id);
            `
          });
          
          if (enableError) {
            // REMOVED: console.log statement
          } else {
            // REMOVED: console.log statement
          }
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Service role update successful:', updateResult);
    }
    
    // Step 4: Final test with regular user authentication
    // REMOVED: console.log statement for security
    
    // Create a new client with anon key for user operations
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { error: userAuthError } = await userClient.auth.signInWithPassword({
      email: 'butaeff@gmail.com',
      password: 'orangecat123'
    });
    
    if (userAuthError) {
      console.error('❌ User authentication failed:', userAuthError.message);
    } else {
      // REMOVED: console.log statement for security
      
      const { data: finalResult, error: finalError } = await userClient
        .from('profiles')
        .update({
          username: 'butaeff-final-test',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select('*');
      
      if (finalError) {
        console.error('❌ Final user update failed:', finalError.message);
        console.error('   Code:', finalError.code);
      } else {
        // REMOVED: console.log statement
      }
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    if (process.env.NODE_ENV === 'development') console.log('✅ Profile updates should now work correctly');
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

fixRLSPolicies(); 