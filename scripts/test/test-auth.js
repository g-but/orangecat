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
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    // REMOVED: console.log statement
    
    // Test auth with the email you're trying to use
    // REMOVED: console.log statement
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'mao@gmail.com',
      password: 'yourpassword' // Replace with actual password
    });
    
    // REMOVED: console.log statement for security
    
    if (authError) {
      // REMOVED: console.log statement for security
      // Check if this is a user not found vs wrong password
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById('mao@gmail.com');
      // REMOVED: console.log statement
    }
    
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testAuth(); 