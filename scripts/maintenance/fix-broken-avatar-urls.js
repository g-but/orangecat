#!/usr/bin/env node

/**
 * Fix Broken Avatar URLs Script
 * 
 * This script cleans up profiles with broken avatar URLs (example.com domains)
 * and replaces them with null to use DefaultAvatar instead.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixBrokenAvatarUrls() {
  console.log('🔍 Looking for profiles with broken avatar URLs...')
  
  try {
    // Find profiles with example.com avatar URLs
    const { data: brokenProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .like('avatar_url', '%example.com%')
    
    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError.message)
      return
    }
    
    console.log(`📋 Found ${brokenProfiles.length} profiles with broken avatar URLs`)
    
    if (brokenProfiles.length === 0) {
      console.log('✅ No broken avatar URLs found!')
      return
    }
    
    // Log the broken profiles
    brokenProfiles.forEach(profile => {
      console.log(`  - ${profile.full_name || profile.username} (${profile.id}): ${profile.avatar_url}`)
    })
    
    // Update broken avatars to null
    const profileIds = brokenProfiles.map(p => p.id)
    const { data: updatedProfiles, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .in('id', profileIds)
      .select('id, username, full_name')
    
    if (updateError) {
      console.error('❌ Error updating profiles:', updateError.message)
      return
    }
    
    console.log(`✅ Successfully fixed ${updatedProfiles.length} profiles`)
    updatedProfiles.forEach(profile => {
      console.log(`  ✓ Fixed ${profile.full_name || profile.username}`)
    })
    
    // Also check for other common broken URL patterns
    console.log('\n🔍 Checking for other broken URL patterns...')
    
    const brokenPatterns = [
      'https://via.placeholder.com',
      'http://example.com',
      'https://test.com',
      'http://localhost'
    ]
    
    for (const pattern of brokenPatterns) {
      const { data: otherBroken, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .like('avatar_url', `%${pattern}%`)
      
      if (!error && otherBroken.length > 0) {
        console.log(`📋 Found ${otherBroken.length} profiles with ${pattern} URLs`)
        
        const ids = otherBroken.map(p => p.id)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: null })
          .in('id', ids)
        
        if (!updateError) {
          console.log(`  ✅ Fixed ${otherBroken.length} ${pattern} URLs`)
        }
      }
    }
    
    console.log('\n🎉 Avatar URL cleanup complete!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Check database connection first
async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1)
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Fix Broken Avatar URLs Script')
  console.log('================================\n')
  
  const connected = await testConnection()
  if (!connected) {
    process.exit(1)
  }
  
  await fixBrokenAvatarUrls()
}

main().catch(console.error)