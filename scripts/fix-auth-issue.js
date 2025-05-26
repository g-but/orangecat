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

async function fixAuthenticationIssue() {
  console.log('🔍 Investigating authentication issue...');
  
  const email = 'butaeff@gmail.com';
  const userId = 'c7f91de5-214b-4210-a0c7-ab4ad1ac70c9';
  
  try {
    // Step 1: Check auth.users table directly
    console.log('\n1. Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('email', email);
    
    if (authError) {
      console.log('Could not query auth.users directly, trying alternative method...');
      
      // Try using admin API to get user
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userData?.user) {
        console.log('✅ User found in auth system:');
        console.log('- ID:', userData.user.id);
        console.log('- Email:', userData.user.email);
        console.log('- Email confirmed:', userData.user.email_confirmed_at ? 'Yes' : 'No');
        console.log('- Created:', userData.user.created_at);
        console.log('- Last sign in:', userData.user.last_sign_in_at || 'Never');
        
        // Check if email is confirmed
        if (!userData.user.email_confirmed_at) {
          console.log('\n⚠️  Email is not confirmed! This might be the issue.');
          
          // Auto-confirm email
          console.log('🔧 Auto-confirming email...');
          const { error: confirmError } = await supabase.auth.admin.updateUserById(
            userId,
            { email_confirm: true }
          );
          
          if (confirmError) {
            console.error('❌ Failed to confirm email:', confirmError.message);
          } else {
            console.log('✅ Email confirmed successfully!');
          }
        }
        
        // Reset password to a known value
        console.log('\n🔧 Resetting password to ensure it matches expectations...');
        const newPassword = 'TempPassword123!'; // User should change this immediately
        
        const { error: passwordError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );
        
        if (passwordError) {
          console.error('❌ Failed to reset password:', passwordError.message);
        } else {
          console.log('✅ Password reset successfully!');
          console.log(`📝 NEW TEMPORARY PASSWORD: ${newPassword}`);
          console.log('⚠️  IMPORTANT: Change this password immediately after logging in!');
        }
        
      } else {
        console.log('❌ User not found in auth system:', userError?.message);
        
        // Try to create the user
        console.log('\n🔧 Attempting to create user in auth system...');
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'TempPassword123!',
          email_confirm: true,
          user_metadata: {
            full_name: null
          }
        });
        
        if (createError) {
          console.error('❌ Failed to create user:', createError.message);
        } else {
          console.log('✅ User created successfully!');
          console.log('📝 TEMPORARY PASSWORD: TempPassword123!');
          console.log('⚠️  IMPORTANT: Change this password immediately after logging in!');
        }
      }
    } else {
      console.log('✅ Auth users query successful:', authUsers);
    }
    
    // Step 2: Check profiles table
    console.log('\n2. Checking profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    
    if (profileError) {
      console.error('❌ Profile check error:', profileError.message);
    } else if (profile && profile.length > 0) {
      console.log('✅ Profile found:', profile[0]);
      
      // Fix profile if needed
      if (!profile[0].username || profile[0].username === email) {
        console.log('\n🔧 Fixing profile data...');
        
        // First, let's check what columns exist in the profiles table
        const { data: tableInfo, error: tableError } = await supabase
          .rpc('get_table_columns', { table_name: 'profiles' })
          .single();
        
        // If the RPC doesn't exist, try a simpler update without email column
        console.log('Updating profile with valid columns only...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            username: 'butaeff'
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('❌ Failed to update profile:', updateError.message);
        } else {
          console.log('✅ Profile updated successfully!');
        }
      }
    } else {
      console.log('❌ No profile found, creating one...');
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: 'butaeff',
          email: email
        });
      
      if (createProfileError) {
        console.error('❌ Failed to create profile:', createProfileError.message);
      } else {
        console.log('✅ Profile created successfully!');
      }
    }
    
    // Step 3: Clear any problematic auth sessions/tokens
    console.log('\n3. Clearing any existing sessions...');
    const { error: signOutError } = await supabase.auth.admin.signOut(userId);
    if (signOutError) {
      console.log('Note: Could not sign out user (this is normal if no active sessions)');
    } else {
      console.log('✅ All sessions cleared');
    }
    
    console.log('\n🎉 Authentication issue resolution complete!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Use email: butaeff@gmail.com');
    console.log('2. Use password: TempPassword123!');
    console.log('3. Log in to your app');
    console.log('4. Immediately go to settings and change your password');
    console.log('5. Your profile should now work correctly');
    
  } catch (err) {
    console.error('❌ Script failed:', err);
  }
}

fixAuthenticationIssue(); 