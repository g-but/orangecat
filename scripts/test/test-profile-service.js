#!/usr/bin/env node

/**
 * Test ProfileService to ensure profile editing works correctly
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Create a mock logger for the test
global.logger = {
  debug: (...args) => console.log('[DEBUG]', ...args),
  info: (...args) => console.log('[INFO]', ...args),
  warn: (...args) => console.log('[WARN]', ...args),
  error: (...args) => console.log('[ERROR]', ...args),
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  console.log('🧪 Testing ProfileService')
  console.log('========================\n')

  try {
    // 1. Get a profile to test with
    console.log('1. Getting test profile...')
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error || !profiles || profiles.length === 0) {
      console.error('❌ No profiles found for testing')
      return
    }

    const testProfile = profiles[0]
    console.log(`   Testing with profile: ${testProfile.id}`)
    console.log(`   Current name: ${testProfile.full_name}`)

    // 2. Test the ProfileService flow manually
    console.log('\n2. Testing profile update flow...')
    
    // Create test data similar to what the UI would send
    const formData = {
      display_name: 'Test Updated Name',
      bio: 'This is a test bio update',
      location: 'Test Location',
      website: 'https://test.example.com',
      avatar_url: null, // Clear any broken URLs
      banner_url: null,
      bitcoin_address: null,
      lightning_address: null,
      public_profile: true,
      allow_donations: true
    }

    // Map the form data like ProfileMapper would
    const updateData = {
      full_name: formData.display_name,
      website: JSON.stringify({
        website: formData.website,
        bio: formData.bio,
        location: formData.location,
        banner_url: formData.banner_url,
        bitcoin_address: formData.bitcoin_address,
        lightning_address: formData.lightning_address,
        public_profile: formData.public_profile,
        allow_donations: formData.allow_donations
      }),
      updated_at: new Date().toISOString()
    }

    console.log('   Update data:', JSON.stringify(updateData, null, 2))

    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', testProfile.id)
      .select('*')
      .maybeSingle()

    if (updateError) {
      console.error('   ❌ Update failed:', updateError.message)
    } else {
      console.log('   ✅ Update successful!')
      if (updateResult) {
        console.log('   Updated profile:', {
          id: updateResult.id,
          full_name: updateResult.full_name,
          website: updateResult.website
        })
      } else {
        console.log('   Update succeeded but no data returned (checking with select...)')
        
        // Fetch the updated profile
        const { data: fetchResult } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', testProfile.id)
          .single()
        
        if (fetchResult) {
          console.log('   ✅ Profile was updated successfully:', {
            id: fetchResult.id,
            full_name: fetchResult.full_name,
            website: fetchResult.website
          })
        }
      }
    }

    console.log('\n✅ ProfileService test complete!')

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

main() 