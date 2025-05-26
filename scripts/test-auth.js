const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey.substring(0, 20) + '...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    console.log('Connection test:', { data, error });
    
    // Test auth with the email you're trying to use
    console.log('\nTesting sign in with butaeff@gmail.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'butaeff@gmail.com',
      password: 'yourpassword' // Replace with actual password
    });
    
    console.log('Auth result:', { authData, authError });
    
    if (authError) {
      console.log('\nChecking if user exists...');
      // Check if this is a user not found vs wrong password
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById('butaeff@gmail.com');
      console.log('User lookup:', { userData, userError });
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testAuth(); 