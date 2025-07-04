#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  console.log('🔧 Quick Profile Fix Script')
  console.log('===========================\n')

  try {
    // 1. Clear broken avatar URLs
    console.log('1. Clearing broken avatar URLs...')
    const { data: brokenProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or('avatar_url.like.%example.com%,avatar_url.like.%placeholder%,avatar_url.like.%test.com%')

    if (!fetchError && brokenProfiles && brokenProfiles.length > 0) {
      console.log(`   Found ${brokenProfiles.length} profiles with broken URLs`)
      
      for (const profile of brokenProfiles) {
        console.log(`   - ${profile.display_name || profile.username}: ${profile.avatar_url}`)
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .in('id', brokenProfiles.map(p => p.id))

      if (!updateError) {
        console.log('   ✅ Cleared broken avatar URLs')
      } else {
        console.error('   ❌ Error clearing URLs:', updateError.message)
      }
    } else {
      console.log('   ✅ No broken avatar URLs found')
    }

    // 2. Check current profile schema
    console.log('\n2. Checking profile schema...')
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (!error && profiles && profiles.length > 0) {
      console.log('   Current schema columns:')
      const sample = profiles[0]
      Object.keys(sample).forEach(key => {
        const value = sample[key]
        const displayValue = value === null ? 'null' : (typeof value === 'string' && value.length > 50 ? value.substring(0, 47) + '...' : value)
        console.log(`   - ${key}: ${displayValue}`)
      })
    }

    // 3. Test profile update function
    console.log('\n3. Testing profile update function...')
    const { data: testResult, error: rpcError } = await supabase
      .rpc('update_profile', {
        profile_data: {
          display_name: 'Test Update'
        }
      })

    if (!rpcError) {
      console.log('   ✅ Profile update function is working')
    } else {
      console.log('   ⚠️  Profile update function error:', rpcError.message)
    }

    console.log('\n✅ Profile diagnostics complete!')

  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

main() 