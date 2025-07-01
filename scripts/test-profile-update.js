#!/usr/bin/env node
/**
 * Profile update test script
 * 
 * Run with:
 * node scripts/test-profile-update.js
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
  console.error('Usage: node scripts/test-profile-update.js USER_ID');
  process.exit(1);
}

// Create a Supabase client 
const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpdate() {
  // REMOVED: console.log statement
  
  const testValue = 'Test update from Node.js ' + new Date().toISOString();
  
  try {
    // REMOVED: console.log statement
    const startTime = Date.now();
    
    const { data, error, status } = await supabase
      .from('profiles')
      .update({ 
        bio: testValue,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select('*')
      .single();
    
    const endTime = Date.now();
    
    if (error) {
      console.error(`❌ Update failed with error:`, error);
      if (error.code === '42501') {
        console.error('This appears to be a permission error. Check RLS policies.');
      }
      process.exit(1);
    }
    
    if (process.env.NODE_ENV === 'development') console.log(`✅ Update successful! Request took ${endTime - startTime}ms`);
    // REMOVED: console.log statement
    // REMOVED: console.log statement
      username: data.username,
      display_name: data.display_name,
      bitcoin_address: data.bitcoin_address
    });
    
  } catch (error) {
    console.error(`❌ Exception during update:`, error);
    process.exit(1);
  }
}

// Run the test
testProfileUpdate()
  .then(() => {
    // REMOVED: console.log statement
    process.exit(0);
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  }); 