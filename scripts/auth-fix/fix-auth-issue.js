const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const adminClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

async function diagnoseAuthIssue() {
  // REMOVED: console.log statement for security
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  try {
    // Test basic connection
    // REMOVED: console.log statement
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    if (process.env.NODE_ENV === 'development') console.log('✅ Database connection successful');
    
    // Check if we can list users (requires admin)
    if (adminClient) {
      // REMOVED: console.log statement for security
      try {
        const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();
        if (usersError) {
          console.error('❌ Failed to list users:', usersError.message);
        } else {
          // REMOVED: console.log statement
          users.users.forEach((user, index) => {
            // REMOVED: console.log statement for security
          });
        }
      } catch (err) {
        console.error('❌ Error listing users:', err.message);
      }
    }
    
    // Test the specific email that's failing
    const testEmail = 'butaeff@gmail.com';
    // REMOVED: console.log statement for security
    
    // Try with a common test password
    const testPasswords = ['password', '123456', 'test123', 'orangecat'];
    
    for (const password of testPasswords) {
      // REMOVED: console.log statement for security
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: password
      });
      
      if (!authError) {
        if (process.env.NODE_ENV === 'development') console.log(`✅ SUCCESS! Password is: ${password}`);
        // REMOVED: console.log statement for security
        return;
      }
    }
    
    // REMOVED: console.log statement for security
    
    // Check if user exists in profiles table
    // REMOVED: console.log statement
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', '%butaeff%')
      .or('username.ilike.%mao%');
      
    if (profileError) {
      console.error('❌ Error checking profiles:', profileError.message);
    } else if (profiles.length > 0) {
      if (process.env.NODE_ENV === 'development') console.log('✅ Found matching profiles:');
      profiles.forEach(profile => {
        // REMOVED: console.log statement for security
      });
    } else {
      // REMOVED: console.log statement
    }
    
    // Provide solutions
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement
    
    if (adminClient) {
      // REMOVED: console.log statement for security
      // REMOVED: console.log statement
      // REMOVED: console.log statement for security
    }
    
  } catch (err) {
    console.error('❌ Diagnosis failed:', err.message);
  }
}

async function createTestUser() {
  if (!adminClient) {
    console.error('❌ Cannot create user without admin privileges');
    console.error('Please set SUPABASE_SERVICE_ROLE_KEY in .env.local');
    return;
  }
  
  // REMOVED: console.log statement
  // REMOVED: console.log statement
  
  const testEmail = 'butaeff@gmail.com';
  const testPassword = 'orangecat123';
  
  try {
    const { data, error } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Skip email confirmation
    });
    
    if (error) {
      console.error('❌ Failed to create user:', error.message);
      return;
    }
    
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement for security
    // REMOVED: console.log statement for security
    
    // Test the new credentials
    // REMOVED: console.log statement for security
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.error('❌ Login test failed:', authError.message);
    } else {
      // REMOVED: console.log statement for security
      // REMOVED: console.log statement
    }
    
  } catch (err) {
    console.error('❌ User creation failed:', err.message);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--create-user')) {
  createTestUser();
} else {
  diagnoseAuthIssue();
} 