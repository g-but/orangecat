#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  console.log('🔧 Comprehensive Profile Fix')
  console.log('============================\n')

  try {
    // 1. Check for duplicate profiles
    console.log('1. Checking for duplicate profiles...')
    const { data: allProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, full_name, created_at')
      .order('created_at')

    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError.message)
      return
    }

    console.log(`   Found ${allProfiles.length} total profiles`)
    
    // Group by username to find duplicates
    const usernameGroups = {}
    allProfiles.forEach(profile => {
      if (!usernameGroups[profile.username]) {
        usernameGroups[profile.username] = []
      }
      usernameGroups[profile.username].push(profile)
    })

    const duplicates = Object.keys(usernameGroups).filter(username => 
      usernameGroups[username].length > 1
    )

    if (duplicates.length > 0) {
      console.log(`   ⚠️  Found ${duplicates.length} usernames with duplicate profiles`)
      for (const username of duplicates) {
        const profiles = usernameGroups[username]
        console.log(`   - ${username}: ${profiles.length} profiles`)
        
        // Keep the oldest profile, remove the rest
        const toKeep = profiles[0]
        const toRemove = profiles.slice(1)
        
        for (const profile of toRemove) {
          console.log(`     Removing duplicate: ${profile.id}`)
          await supabase.from('profiles').delete().eq('id', profile.id)
        }
      }
    } else {
      console.log('   ✅ No duplicate profiles found')
    }

    // 2. Fix missing display names
    console.log('\n2. Fixing missing display names...')
    const { data: profilesWithoutNames, error: nameError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .is('full_name', null)

    if (!nameError && profilesWithoutNames.length > 0) {
      console.log(`   Found ${profilesWithoutNames.length} profiles without display names`)
      
      for (const profile of profilesWithoutNames) {
        const displayName = profile.username.split('@')[0] // Use email username part
        await supabase
          .from('profiles')
          .update({ full_name: displayName })
          .eq('id', profile.id)
        console.log(`   Fixed: ${profile.username} -> ${displayName}`)
      }
    } else {
      console.log('   ✅ All profiles have display names')
    }

    // 3. Test profile update with exact user
    console.log('\n3. Testing profile update...')
    
    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single()

    if (testError) {
      console.error('   ❌ Could not get test profile:', testError.message)
    } else {
      console.log(`   Testing with profile: ${testProfile.id}`)
      
      const updateData = {
        full_name: 'Fixed Display Name',
        updated_at: new Date().toISOString()
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', testProfile.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('   ❌ Update failed:', updateError.message)
      } else {
        console.log('   ✅ Update successful!')
        console.log('   Result:', {
          id: updateResult.id,
          full_name: updateResult.full_name
        })
      }
    }

    // 4. Check RLS policies
    console.log('\n4. Current profiles table structure:')
    const { data: currentProfiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(3)

    if (currentProfiles && currentProfiles.length > 0) {
      console.log('   Sample profile structure:')
      const sample = currentProfiles[0]
      Object.keys(sample).forEach(key => {
        console.log(`   - ${key}: ${typeof sample[key]} (${sample[key] === null ? 'null' : 'has value'})`)
      })
    }

    // 1. Fix broken avatar URLs
    console.log('1. Fixing broken avatar URLs...')
    const { data: brokenProfiles, error: brokenError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .like('avatar_url', '%example.com%')
    
    if (brokenError) {
      console.error('   ❌ Error finding broken profiles:', brokenError.message)
    } else if (brokenProfiles.length > 0) {
      console.log(`   Found ${brokenProfiles.length} profiles with broken avatar URLs`)
      brokenProfiles.forEach(p => console.log(`   - ${p.full_name || p.username}: ${p.avatar_url}`))
      
      // Fix them
      const { data: fixedProfiles, error: fixError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .in('id', brokenProfiles.map(p => p.id))
        .select('id, username, full_name')
      
      if (fixError) {
        console.error('   ❌ Error fixing profiles:', fixError.message)
      } else {
        console.log(`   ✅ Fixed ${fixedProfiles.length} broken avatar URLs`)
      }
    } else {
      console.log('   ✅ No broken avatar URLs found')
    }

    console.log('\n✅ Profile fix complete!')

  } catch (error) {
    console.error('❌ Script error:', error.message)
    console.error(error.stack)
  }
}

main() 