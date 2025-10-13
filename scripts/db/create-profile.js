#!/usr/bin/env node
/**
 * Create a new profile record
 * 
 * Run with:
 * node scripts/create-profile.js USER_ID
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Get the Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const userId = process.argv[2]; // Get user ID from command line argument

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined in .env.local');
  process.exit(1);
}

if (!userId) {
  console.error('❌ Missing user ID');
  console.error('Usage: node scripts/create-profile.js USER_ID');
  process.exit(1);
}

// Create a Supabase client 
const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfile() {
  // REMOVED: console.log statement for security
  
  const newProfile = {
    id: userId,
    username: 'user_' + Math.floor(Math.random() * 10000),
    display_name: 'New User',
    bio: 'This is a new profile created via script',
    bitcoin_address: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    // REMOVED: console.log statement
    
    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (existingProfile) {
      if (process.env.NODE_ENV === 'development') console.log('✅ Profile already exists. No need to create a new one.');
      return;
    }
    
    // Insert new profile
    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();
    
    if (error) {
      console.error(`❌ Creation failed with error:`, error);
      
      // Check for common errors
      if (error.code === '23505') {
        console.error('This is a unique constraint violation. The profile might already exist or the username is taken.');
      } else if (error.code === '42501') {
        console.error('This is a permission error. Check RLS policies.');
        console.error('You might need to add the following policy to your profiles table:');
        console.error(`
CREATE POLICY "Enable insert for authenticated users only" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);`);
      }
      
      process.exit(1);
    }
    
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    
  } catch (error) {
    console.error(`❌ Exception during profile creation:`, error);
    process.exit(1);
  }
}

// Run the function
createProfile()
  .then(() => {
    // REMOVED: console.log statement
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 