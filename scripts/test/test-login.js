/**
 * Login Test Script for butaeff@gmail.com
 * Run this in browser console to test login functionality
 */

const testLogin = async () => {
  console.log('🧪 Testing login for butaeff@gmail.com...');

  try {
    // Import Supabase client
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');

    // Get Supabase configuration from the page
    const supabaseUrl = 'https://ohkueislstxomdjavyhs.supabase.co'; // From production env
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oa3VlaXNsc3R4b21kamF2eWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDc5NTAsImV4cCI6MjA2MDEyMzk1MH0.Qc6ahUbs_5BCa4csEYsBtyxNUDYb4h3Y4K_16N1DNaY'; // From production env

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔑 Attempting login...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'butaeff@gmail.com',
      password: 'Asdfgh11!'
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      return { success: false, error: error.message };
    }

    if (data.user) {
      console.log('✅ Login successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
      return { success: true, user: data.user };
    }

    console.log('⚠️ Login returned no user data');
    return { success: false, error: 'No user data returned' };

  } catch (err) {
    console.error('💥 Test failed:', err.message);
    return { success: false, error: err.message };
  }
};

// Run the test
testLogin().then(result => {
  console.log('📊 Test result:', result);
});


