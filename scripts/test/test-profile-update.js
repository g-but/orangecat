#!/usr/bin/env node
/**
 * Profile update test script
 * 
 * Run with:
 * node scripts/test-profile-update.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('🧪 Test Profile Update Flow');
  console.log('===========================\n');

  try {
    // 1. Get current profile
    console.log('1. Getting current profile...');
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (fetchError || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found:', fetchError?.message);
      return;
    }

    const currentProfile = profiles[0];
    console.log('   Current profile:', {
      id: currentProfile.id,
      username: currentProfile.username,
      full_name: currentProfile.full_name,
      avatar_url: currentProfile.avatar_url
    });

    // 2. Test profile update with display_name -> full_name mapping
    console.log('\n2. Testing profile update...');
    
    const testUpdate = {
      full_name: 'Updated Display Name',
      avatar_url: null, // Clear any broken URLs
      updated_at: new Date().toISOString()
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(testUpdate)
      .eq('id', currentProfile.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('   ❌ Update failed:', updateError.message);
    } else {
      console.log('   ✅ Update successful!');
      console.log('   Updated profile:', {
        id: updateResult.id,
        username: updateResult.username,
        full_name: updateResult.full_name,
        avatar_url: updateResult.avatar_url
      });
    }

    // 3. Test the actual ProfileService flow by importing it
    console.log('\n3. Testing ProfileService.updateProfile...');
    
    // We can't easily import the service here, but we can test the raw update
    // Let's try updating with the format the service would use
    const serviceStyleUpdate = {
      full_name: 'Service Style Update',
      website: JSON.stringify({
        bio: 'Test bio from service',
        location: 'Test location',
        banner_url: null
      }),
      updated_at: new Date().toISOString()
    };

    const { data: serviceResult, error: serviceError } = await supabase
      .from('profiles')
      .update(serviceStyleUpdate)
      .eq('id', currentProfile.id)
      .select('*')
      .single();

    if (serviceError) {
      console.error('   ❌ Service-style update failed:', serviceError.message);
    } else {
      console.log('   ✅ Service-style update successful!');
      console.log('   Result:', {
        id: serviceResult.id,
        full_name: serviceResult.full_name,
        website: serviceResult.website
      });
    }

    console.log('\n✅ Profile update test complete!');

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

main(); 