const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  try {
    // Test if we can create a session and get user
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('Auth error:', error.message);
      return;
    }

    if (!data.session) {
      console.log('No active session');
      return;
    }

    console.log('User authenticated:', data.session.user.email);

    // Test profile API endpoint
    const response = await fetch('http://localhost:3000/api/profile/me', {
      headers: {
        'Authorization': 'Bearer ' + data.session.access_token,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('Profile API response:', response.status, JSON.stringify(result, null, 2));

  } catch (err) {
    console.log('Error:', err.message);
  }
})();



