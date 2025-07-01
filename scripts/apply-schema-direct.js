const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchemaFix() {
  console.log('🔧 Applying schema fixes directly...');
  
  try {
    // Method 1: Try using SQL through a prepared query
    console.log('📝 Step 1: Testing current schema...');
    
    // Check if display_name column exists by trying to select it
    const { data: testSelect, error: testError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1);
    
    if (testError) {
      console.error('❌ Basic profiles query failed:', testError.message);
      return;
    }
    
    console.log('✅ Basic profiles table accessible');
    
    // Test if display_name exists
    const { data: displayNameTest, error: displayNameError } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .limit(1);
    
    if (displayNameError && displayNameError.message.includes('display_name')) {
      console.log('❌ display_name column missing - need to add it manually');
      console.log('');
      console.log('🚨 MANUAL FIX REQUIRED:');
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log('');
      console.log('-- Add missing columns to profiles table');
      console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;');
      console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;');
      console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;');
      console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bitcoin_address text;');
      console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lightning_address text;');
      console.log('');
      console.log('-- Update the handle_new_user function');
      console.log(`CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
  VALUES (
    new.id,
    split_part(new.email, '@', 1),
    split_part(new.email, '@', 1),
    NOW(),
    NOW()
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
      console.log('');
      console.log('📱 Go to: https://app.supabase.com/project/ohkueislstxomdjavyhs/sql');
      console.log('');
      return;
    } else {
      console.log('✅ display_name column exists!');
    }
    
    // If we get here, the schema is correct
    console.log('🎉 Schema appears to be correct!');
    
    // Test creating a user to see if everything works
    console.log('🧪 Testing user creation workflow...');
    
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }
    
    console.log(`📊 Found ${users.users.length} existing users`);
    
    // Check if our test user exists
    const testEmail = 'test@orangecat.ch';
    const existingUser = users.users.find(user => user.email === testEmail);
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.id);
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single();
      
      if (profileError) {
        console.log('❌ Profile missing, creating...');
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: existingUser.id,
            username: 'testuser',
            display_name: 'Test User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) {
          console.error('❌ Error creating profile:', createError.message);
        } else {
          console.log('✅ Profile created successfully');
        }
      } else {
        console.log('✅ Profile exists:', profile);
      }
    } else {
      console.log('❌ Test user does not exist, creating...');
      
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: 'TestPassword123!',
        email_confirm: true
      });
      
      if (createUserError) {
        console.error('❌ Error creating user:', createUserError.message);
      } else {
        console.log('✅ User created successfully:', newUser.user.id);
      }
    }
    
  } catch (err) {
    console.error('💥 Script failed:', err);
  }
}

applySchemaFix(); 