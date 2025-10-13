// Script to help create butaeff@gmail.com account
// Run this in browser console at https://www.orangecat.ch/auth?mode=register

(async () => {
  console.log('🔧 Creating butaeff@gmail.com account...');

  try {
    // Get the Supabase client from the page
    const supabase = window.supabase;

    if (!supabase) {
      console.log('❌ Supabase client not found. Make sure you\'re on the registration page.');
      return;
    }

    console.log('📝 Attempting to register butaeff@gmail.com...');

    const { data, error } = await supabase.auth.signUp({
      email: 'butaeff@gmail.com',
      password: 'Asdfgh11!',
      options: {
        data: {
          display_name: 'Butaeff'
        }
      }
    });

    if (error) {
      console.error('❌ Registration failed:', error.message);
      return { success: false, error: error.message };
    }

    if (data.user) {
      console.log('✅ Registration successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');

      if (!data.user.email_confirmed_at) {
        console.log('📧 Check your email for confirmation link!');
        console.log('After confirming, you can login with:');
        console.log('Email: butaeff@gmail.com');
        console.log('Password: Asdfgh11!');
      }

      return { success: true, user: data.user };
    }

    console.log('⚠️ Registration returned no user data');
    return { success: false, error: 'No user data returned' };

  } catch (err) {
    console.error('💥 Registration failed:', err.message);
    return { success: false, error: err.message };
  }
})();


