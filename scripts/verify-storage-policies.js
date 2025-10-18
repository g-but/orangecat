#!/usr/bin/env node

/**
 * Verify Storage Policies
 */

require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const accessToken = process.env.SUPABASE_ACCESS_TOKEN

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1]

async function checkPolicies() {
  const sql = `
    SELECT
      policyname,
      cmd,
      roles,
      qual,
      with_check
    FROM pg_policies
    WHERE tablename = 'objects'
    AND schemaname = 'storage'
    AND policyname LIKE '%avatar%'
    ORDER BY policyname;
  `

  const sqlUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`

  const response = await fetch(sqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ query: sql })
  })

  if (!response.ok) {
    console.error('❌ Could not verify policies')
    return
  }

  const result = await response.json()

  console.log('\n📋 Current Storage Policies for Avatars:\n')
  console.log('='.repeat(80))

  if (result.result && result.result.length > 0) {
    result.result.forEach((policy, i) => {
      console.log(`\n${i + 1}. ${policy.policyname}`)
      console.log(`   Command: ${policy.cmd}`)
      console.log(`   Roles: ${policy.roles}`)
    })
    console.log('\n' + '='.repeat(80))
    console.log(`\n✅ Found ${result.result.length} avatar policies!`)
    console.log('\n🎉 You should now be able to upload avatars!\n')
  } else {
    console.log('\n⚠️  No avatar policies found.\n')
  }
}

checkPolicies().catch(console.error)
