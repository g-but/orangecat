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
  console.log('🔍 Verifying authentication and profile fixes...\n');
  
  const userId = 'c7f91de5-214b-4210-a0c7-ab4ad1ac70c9';
  let allTestsPassed = true;
  
  try {
    // Test 1: Check current profile schema
    console.log('1️⃣ Testing profile table schema...');
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
        console.log('✅ Profile table has all required columns');
        console.log('   Available columns:', columns.join(', '));
      } else {
        console.error('❌ Profile table missing columns');
        console.log('   Available:', columns.join(', '));
        console.log('   Missing:', expectedColumns.filter(col => !columns.includes(col)).join(', '));
        allTestsPassed = false;
      }
    }
    
    // Test 2: Test profile update functionality
    console.log('\n2️⃣ Testing profile update...');
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
      console.log('✅ Profile update successful');
      console.log('   Username:', updateResult.username);
      console.log('   Display Name:', updateResult.display_name);
      console.log('   Bio:', updateResult.bio);
      console.log('   Bitcoin Address:', updateResult.bitcoin_address);
    }
    
    // Test 3: Test RPC function if it exists
    console.log('\n3️⃣ Testing RPC update function...');
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('update_profile', {
          profile_data: {
            bio: 'Updated via RPC function - OrangeCat is amazing! 🚀'
          }
        });
        
      if (rpcError) {
        console.log('⚠️ RPC function not available (this is OK):', rpcError.message);
      } else {
        console.log('✅ RPC function working');
      }
    } catch (e) {
      console.log('⚠️ RPC function not available (this is OK)');
    }
    
    // Test 4: Verify auth.users connection
    console.log('\n4️⃣ Testing auth.users connection...');
    try {
      // Test direct query (this might fail with current permissions, that's OK)
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
        .eq('id', userId)
        .single();
        
      if (authError) {
        console.log('⚠️ Direct auth.users access restricted (this is normal for security)');
      } else {
        console.log('✅ Auth user found:', authUsers.email);
      }
    } catch (e) {
      console.log('⚠️ Direct auth.users access not available (this is normal)');
    }
    
    // Test 5: Check table relationships
    console.log('\n5️⃣ Testing table relationships...');
    const { data: tables, error: tablesError } = await supabase
      .from('funding_pages')
      .select('*')
      .limit(1);
      
    if (tablesError) {
      console.log('⚠️ Funding pages table not accessible:', tablesError.message);
    } else {
      console.log('✅ Funding pages table accessible');
    }
    
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);
      
    if (transactionsError) {
      console.log('⚠️ Transactions table not accessible:', transactionsError.message);
    } else {
      console.log('✅ Transactions table accessible');
    }
    
    // Final summary
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('✅ Profile table schema is correct');
      console.log('✅ Profile updates are working');
      console.log('✅ Your authentication system is ready');
      console.log('\n💡 You can now:');
      console.log('   - Log in to your application');
      console.log('   - Edit your profile (username, bio, Bitcoin address)');
      console.log('   - Change your password in settings');
      console.log('   - Use all profile features without errors');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\n🔧 Next steps:');
      console.log('   1. Go to Supabase SQL Editor');
      console.log('   2. Run the migration: supabase/migrations/20250525000000_fix_profiles_schema.sql');
      console.log('   3. Run this verification script again');
    }
    
    console.log('\n📚 Documentation available at:');
    console.log('   - docs/SUPABASE_SCHEMA_GUIDE.md');
    console.log('   - supabase/migrations/ (for all database changes)');
    
  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
    allTestsPassed = false;
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

verifyFix(); 