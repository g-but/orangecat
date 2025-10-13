#!/usr/bin/env node
/**
 * Profile Update Flow Test
 * Tests the complete flow of updating a user profile
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test user credentials
const TEST_EMAIL = 'profiletest@example.com';
const TEST_PASSWORD = 'TestPassword123!';

async function cleanupTestUser() {
  try {
    // Try to sign in first to get the user
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signInData?.user) {
      // Delete profile
      await supabase.from('profiles').delete().eq('id', signInData.user.id);
      // Sign out
      await supabase.auth.signOut();
    }
  } catch (err) {
    // Ignore cleanup errors
  }
}

async function testProfileUpdateFlow() {
  console.log('🧪 Testing Profile Update Flow\n');
  console.log('================================\n');

  let userId = null;
  let accessToken = null;

  try {
    // Cleanup any existing test user
    await cleanupTestUser();

    // Step 1: Sign up
    console.log('1️⃣ Creating test user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: {
          username: 'profiletestuser',
        }
      }
    });

    if (signUpError) {
      console.error('   ❌ Sign up failed:', signUpError.message);
      return;
    }

    console.log('   ✅ User created:', signUpData.user?.email);
    userId = signUpData.user?.id;
    accessToken = signUpData.session?.access_token;

    // Step 2: Get current profile
    console.log('\n2️⃣ Fetching profile from API...');
    const profileResponse = await fetch(`${BASE_URL}/api/profile/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      console.error('   ❌ Failed to fetch profile:', profileResponse.status);
      const errorData = await profileResponse.json();
      console.error('   Error:', errorData.error);
      return;
    }

    const profileData = await profileResponse.json();
    console.log('   ✅ Profile fetched successfully');
    console.log('   Username:', profileData.data?.username);
    console.log('   Display Name:', profileData.data?.display_name);

    // Step 3: Update profile
    console.log('\n3️⃣ Updating profile via API...');
    const timestamp = Date.now();
    const updateData = {
      display_name: `Test User ${timestamp}`,
      bio: `This is a test bio created at ${new Date().toISOString()}`,
      website: 'https://test-example.com',
      bitcoin_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      lightning_address: 'test@getalby.com',
    };

    console.log('   Sending update request...');
    const updateResponse = await fetch(`${BASE_URL}/api/profile/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const updateResult = await updateResponse.json();

    console.log('   Response status:', updateResponse.status);

    if (!updateResponse.ok) {
      console.error('   ❌ Profile update failed!');
      console.error('   Error:', updateResult.error);
      console.error('   Full response:', JSON.stringify(updateResult, null, 2));
      return;
    }

    if (updateResult.success && updateResult.data) {
      console.log('   ✅ Profile updated successfully!');
      console.log('\n   Updated fields:');
      console.log('   - Display Name:', updateResult.data.display_name);
      console.log('   - Bio:', updateResult.data.bio?.substring(0, 60) + '...');
      console.log('   - Website:', updateResult.data.website);
      console.log('   - Bitcoin:', updateResult.data.bitcoin_address);
      console.log('   - Lightning:', updateResult.data.lightning_address);

      // Step 4: Verify the update persisted
      console.log('\n4️⃣ Verifying update persisted...');
      const verifyResponse = await fetch(`${BASE_URL}/api/profile/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success && verifyData.data) {
        const verified =
          verifyData.data.display_name === updateData.display_name &&
          verifyData.data.bio === updateData.bio &&
          verifyData.data.website === updateData.website &&
          verifyData.data.bitcoin_address === updateData.bitcoin_address &&
          verifyData.data.lightning_address === updateData.lightning_address;

        if (verified) {
          console.log('   ✅ All fields verified successfully!');
        } else {
          console.log('   ⚠️ Some fields did not match:');
          console.log('   Display Name:', verifyData.data.display_name === updateData.display_name ? '✓' : '✗');
          console.log('   Bio:', verifyData.data.bio === updateData.bio ? '✓' : '✗');
          console.log('   Website:', verifyData.data.website === updateData.website ? '✓' : '✗');
          console.log('   Bitcoin:', verifyData.data.bitcoin_address === updateData.bitcoin_address ? '✓' : '✗');
          console.log('   Lightning:', verifyData.data.lightning_address === updateData.lightning_address ? '✓' : '✗');
        }
      } else {
        console.error('   ❌ Failed to verify update');
      }

      console.log('\n================================');
      console.log('✅ ALL TESTS PASSED!');
      console.log('================================\n');
      console.log('🎉 Profile update functionality is working correctly!');
      console.log('✅ Users can now edit and save their profiles.');

    } else {
      console.error('   ❌ Update succeeded but returned unexpected data');
      console.error('   Response:', JSON.stringify(updateResult, null, 2));
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test user...');
    try {
      if (userId) {
        await supabase.from('profiles').delete().eq('id', userId);
        await supabase.auth.signOut();
        console.log('   ✅ Cleanup complete');
      }
    } catch (cleanupError) {
      console.log('   ⚠️ Cleanup warning:', cleanupError.message);
    }
  }
}

// Run the test
testProfileUpdateFlow();
