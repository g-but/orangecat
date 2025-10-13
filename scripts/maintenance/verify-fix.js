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

async function verifyFix() {
  // REMOVED: console.log statement for security
  
  const userId = 'c7f91de5-214b-4210-a0c7-ab4ad1ac70c9';
  let allTestsPassed = true;
  
  try {
    // Test 1: Check current profile schema
    // REMOVED: console.log statement
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('❌ Profile access failed:', profileError.message);
      allTestsPassed = false;
    } else {
      const columns = Object.keys(profileData);
      const expectedColumns = ['id', 'username', 'display_name', 'bio', 'bitcoin_address', 'avatar_url'];
      const hasAllColumns = expectedColumns.every(col => columns.includes(col));
      
      if (hasAllColumns) {
        if (process.env.NODE_ENV === 'development') console.log('✅ Profile table has all required columns');
        // REMOVED: console.log statement
      } else {
        console.error('❌ Profile table missing columns');
        // REMOVED: console.log statement
        // REMOVED: console.log statement
        allTestsPassed = false;
      }
    }
    
    // Test 2: Test profile update functionality
    // REMOVED: console.log statement
    const testUpdateData = {
      username: 'butaeff',
      display_name: 'Butaeff (OrangeCat Creator)',
      bio: 'Building the future of Bitcoin crowdfunding with OrangeCat 🐱⚡',
      bitcoin_address: 'bc1qgsup75ajy4rln08j0te9wpdgrf46ctx6w94xzq',
      updated_at: new Date().toISOString()
    };
    
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(testUpdateData)
      .eq('id', userId)
      .select('*')
      .single();
      
    if (updateError) {
      console.error('❌ Profile update failed:', updateError.message);
      allTestsPassed = false;
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Profile update successful');
      // REMOVED: console.log statement for security
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
    }
    
    // Test 3: Test RPC function if it exists
    // REMOVED: console.log statement
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('update_profile', {
          profile_data: {
            bio: 'Updated via RPC function - OrangeCat is amazing! 🚀'
          }
        });
        
      if (rpcError) {
        // REMOVED: console.log statement
      } else {
        if (process.env.NODE_ENV === 'development') console.log('✅ RPC function working');
      }
    } catch (e) {
      // REMOVED: console.log statement
    }
    
    // Test 4: Verify auth.users connection
    // REMOVED: console.log statement for security
    try {
      // Test direct query (this might fail with current permissions, that's OK)
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
        .eq('id', userId)
        .single();
        
      if (authError) {
        // REMOVED: console.log statement for security
      } else {
        // REMOVED: console.log statement for security
      }
    } catch (e) {
      // REMOVED: console.log statement
    }
    
    // Test 5: Check table relationships
    // REMOVED: console.log statement
    const { data: tables, error: tablesError } = await supabase
      .from('funding_pages')
      .select('*')
      .limit(1);
      
    if (tablesError) {
      // REMOVED: console.log statement
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Funding pages table accessible');
    }
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
      
    if (transactionsError) {
      // REMOVED: console.log statement
    } else {
      if (process.env.NODE_ENV === 'development') console.log('✅ Transactions table accessible');
    }
    
    // Final summary
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
    if (allTestsPassed) {
      // REMOVED: console.log statement
      if (process.env.NODE_ENV === 'development') console.log('✅ Profile table schema is correct');
      // REMOVED: console.log statement
      // REMOVED: console.log statement for security
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement for security
      // REMOVED: console.log statement for security
      // REMOVED: console.log statement
    } else {
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
      // REMOVED: console.log statement
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
    allTestsPassed = false;
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

verifyFix(); 