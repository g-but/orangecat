#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  console.log('🔍 Schema Details Check')
  console.log('======================\n')

  try {
    // 1. Check available columns by selecting everything
    console.log('1. Current profiles table columns:')
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error fetching profiles:', error.message)
      return
    }

    if (profiles && profiles.length > 0) {
      const columns = Object.keys(profiles[0])
      console.log('   Available columns:', columns.join(', '))
      console.log('')
      
      columns.forEach(col => {
        const value = profiles[0][col]
        console.log(`   ${col}: ${value === null ? 'null' : value}`)
      })
    }

    // 2. Test direct update
    console.log('\n2. Testing direct table update...')
    
    // Get the first profile ID
    const { data: firstProfile } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single()

    if (firstProfile) {
      const testUpdate = {}
      
      // Test which column name works for display name
      if (profiles[0].hasOwnProperty('display_name')) {
        testUpdate.display_name = 'Test Display Name'
        console.log('   Using display_name column')
      } else if (profiles[0].hasOwnProperty('full_name')) {
        testUpdate.full_name = 'Test Full Name'
        console.log('   Using full_name column')
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update(testUpdate)
        .eq('id', firstProfile.id)
        .select('*')
        .single()

      if (!updateError) {
        console.log('   ✅ Direct update successful')
        console.log('   Updated data:', JSON.stringify(updateResult, null, 2))
      } else {
        console.log('   ❌ Update failed:', updateError.message)
      }
    }

    // 3. Check if RPC functions exist
    console.log('\n3. Available RPC functions:')
    const { data: functions, error: funcError } = await supabase
      .rpc('version')  // This should always exist

    if (!funcError) {
      console.log('   ✅ RPC calls are working')
    } else {
      console.log('   ❌ RPC error:', funcError.message)
    }

    console.log('\n✅ Schema check complete!')

  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

main() 