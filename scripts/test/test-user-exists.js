/**
 * Test if user butaeff@gmail.com exists and can login
 * This script can be run in browser console on the production site
 */

const testUserLogin = async () => {
  console.log('🔍 Checking if butaeff@gmail.com account exists and can login...');

  try {
    // Get Supabase configuration from the page
    // In production, these would be available from window.__SUPABASE_CONFIG__ or similar
    const supabaseUrl = 'https://ohkueislstxomdjavyhs.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDc5NTAsImV4cCI6MjA2MDEyMzk1MH0.Qc6ahUbs_5BCa4csEYsBtyxNUDYb4h3Y4K_16N1DNaY';

    // Import Supabase client dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.skypack.dev/@supabase/supabase-js@2';
    script.onload = async () => {
      const { createClient } = window.supabase;
      const supabase = createClient(supabaseUrl, supabaseKey);

      console.log('🔑 Testing login with butaeff@gmail.com / Asdfgh11!...');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'butaeff@gmail.com',
        password: 'Asdfgh11!'
      });

      if (error) {
        console.error('❌ Login failed:', error.message);

        if (error.message.includes('Invalid login credentials')) {
          console.log('💡 This means either:');
          console.log('   1. The user account doesn\'t exist');
          console.log('   2. The password is incorrect');
          console.log('   3. The email is not confirmed');
        }

        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('✅ Login successful!');
        console.log('User details:');
        console.log('- ID:', data.user.id);
        console.log('- Email:', data.user.email);
        console.log('- Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
        console.log('- Created:', data.user.created_at);
        console.log('- Last sign in:', data.user.last_sign_in_at);

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.log('⚠️ Profile not found:', profileError.message);
        } else {
          console.log('✅ Profile found:', profile);
        }

        return { success: true, user: data.user, profile };
      }

      console.log('⚠️ Login returned no user data');
      return { success: false, error: 'No user data returned' };
    };

    document.head.appendChild(script);

  } catch (err) {
    console.error('💥 Test failed:', err.message);
    return { success: false, error: err.message };
  }
};

// Instructions for use
console.log('📋 To test butaeff@gmail.com login:');
console.log('1. Go to https://www.orangecat.ch/auth?mode=login');
console.log('2. Open browser console (F12)');
console.log('3. Copy and paste this entire script');
console.log('4. Press Enter to run');
console.log('5. Check the results in console');

// Auto-run the test
testUserLogin();


