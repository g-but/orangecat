#!/usr/bin/env node

/**
 * Test Profile Update Script
 * 
 * This script tests profile updates to diagnose the current issues.
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testProfileUpdate() {
  try {
    console.log('🔍 Testing Profile Update...\n')
    
    // 1. Check current database schema
    console.log('1. Checking database schema...')
    const { data: schemaData, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message)
      return
    }
    
    if (schemaData.length > 0) {
      console.log('✅ Database columns:', Object.keys(schemaData[0]))
    }
    
    // 2. Get all profiles
    console.log('\n2. Current profiles:')
    const { data: profiles, error: getError } = await supabase
      .from('profiles')
      .select('*')
    
    if (getError) {
      console.error('❌ Get profiles failed:', getError.message)
      return
    }
    
    profiles.forEach(profile => {
      console.log(`  - ${profile.full_name || profile.username || 'Unnamed'} (${profile.id})`)
      console.log(`    Username: ${profile.username}`)
      console.log(`    Avatar: ${profile.avatar_url}`)
      console.log(`    Website: ${profile.website}`)
    })
    
    // 3. Test update on first profile
    if (profiles.length > 0) {
      const testProfile = profiles[0]
      console.log(`\n3. Testing update on profile: ${testProfile.id}`)
      
      const testUpdate = {
        full_name: 'Test Update',
        website: 'https://test.com',
        updated_at: new Date().toISOString()
      }
      
      console.log('Update data:', testUpdate)
      
      // Try using .maybeSingle()
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update(testUpdate)
        .eq('id', testProfile.id)
        .select('*')
        .maybeSingle()
      
      if (updateError) {
        console.error('❌ Update failed:', updateError.message)
      } else if (updateData) {
        console.log('✅ Update successful:', updateData)
      } else {
        console.log('⚠️ Update succeeded but no data returned')
        
        // Try to fetch the updated profile
        const { data: fetchData, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', testProfile.id)
          .single()
        
        if (fetchError) {
          console.error('❌ Fetch after update failed:', fetchError.message)
        } else {
          console.log('✅ Fetched updated profile:', fetchData)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testProfileUpdate().catch(console.error) 