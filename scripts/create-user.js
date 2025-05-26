const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
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
  const email = 'butaeff@gmail.com';
  const password = 'password123'; // Use a secure password
  
  console.log('Creating user account for:', email);
  
  try {
    // First, check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === email);
    
    if (existingUser) {
      console.log('User already exists!');
      console.log('User ID:', existingUser.id);
      console.log('Email confirmed:', existingUser.email_confirmed_at ? 'Yes' : 'No');
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single();
        
      if (profileError) {
        console.log('Profile does not exist, creating one...');
        
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: existingUser.id,
            username: 'butaeff',
            display_name: 'Butaeff',
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
        } else {
          console.log('Profile created successfully:', newProfile);
        }
      } else {
        console.log('Profile already exists:', profile);
      }
      
      return;
    }
    
    // Create new user
    console.log('Creating new user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email
    });
    
    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }
    
    console.log('User created successfully!');
    console.log('User ID:', newUser.user.id);
    console.log('Email:', newUser.user.email);
    
    // Create profile for new user
    console.log('Creating profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        username: 'butaeff',
        display_name: 'Butaeff',
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (profileError) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('Profile created successfully:', profile);
    }
    
    console.log('\n✅ Setup complete! You can now log in with:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (err) {
    console.error('Script failed:', err);
  }
}

createUserAccount(); 