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

async function createUserAccount() {
  const email = 'test@orangecat.ch';
  const password = 'TestPassword123!'; // Use the same password we tested with
  
  try {
    // First, check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === email);
    
    if (existingUser) {
      console.log('✅ User already exists');
      console.log('User ID:', existingUser.id);
      
      // Check if profile exists with proper schema
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single();
        
      if (profileError) {
        console.log('🔧 Creating missing profile...');
        
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: existingUser.id,
            username: 'testuser',
            display_name: 'Test User',
            bio: 'Test user for authentication testing',
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
        } else {
          console.log('✅ Profile created successfully');
        }
      } else {
        console.log('✅ Profile already exists');
        console.log('Profile:', profile);
      }
      
      return;
    }
    
    // Create new user
    console.log('🔧 Creating new user account...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    
    console.log('✅ User account created successfully');
    console.log('User ID:', newUser.user.id);
    console.log('Email confirmed:', newUser.user.email_confirmed_at ? 'Yes' : 'No');
    
    // Create profile for new user
    console.log('🔧 Creating user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        username: 'testuser',
        display_name: 'Test User',
        bio: 'Test user for authentication testing',
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (profileError) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('✅ Profile created successfully');
    }
    
    console.log('🎉 Complete! You can now login with:');
    console.log('Email:', email);
    console.log('Password: TestPassword123!');
    
  } catch (err) {
    console.error('Script failed:', err);
  }
}

createUserAccount(); 