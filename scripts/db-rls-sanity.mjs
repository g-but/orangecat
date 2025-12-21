#!/usr/bin/env node
// RLS Sanity Check: Verifies that common tables enforce owner-scoped policies.
// Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
// Provide TEST_USER_ACCESS_TOKEN for an authenticated session (JWT from your app).

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const token = process.env.TEST_USER_ACCESS_TOKEN
if (!url || !anon || !token) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, TEST_USER_ACCESS_TOKEN')
  process.exit(1)
}

const supabase = createClient(url, anon, {
  global: { headers: { Authorization: `Bearer ${token}` } },
  auth: { persistSession: false },
})

async function getUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) throw new Error('Invalid TEST_USER_ACCESS_TOKEN')
  return data.user.id
}

async function testTable(table, ownerColumn, sample) {
  const userId = await getUserId()
  const insertPayload = { ...sample, [ownerColumn]: userId }
  console.log(`\n[${table}] RLS test`)
  // INSERT
  let id
  {
    const { data, error } = await supabase.from(table).insert(insertPayload).select('id').single()
    if (error) { console.error('  ✖ INSERT denied', error.message); return }
    id = data.id
    console.log('  ✓ INSERT allowed (owner)')
  }
  // SELECT
  {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single()
    if (error) { console.error('  ✖ SELECT denied', error.message); return }
    if (data[ownerColumn] !== userId) { console.error('  ✖ SELECT returned non-owner row'); return }
    console.log('  ✓ SELECT allowed (owner)')
  }
  // UPDATE
  {
    const { error } = await supabase.from(table).update({ _rls_sanity_touch: new Date().toISOString() }).eq('id', id)
    if (error) { console.error('  ✖ UPDATE denied', error.message); return }
    console.log('  ✓ UPDATE allowed (owner)')
  }
  // DELETE
  {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { console.error('  ✖ DELETE denied', error.message); return }
    console.log('  ✓ DELETE allowed (owner)')
  }
}

async function main() {
  try {
    const userId = await getUserId()
    console.log('Authenticated as:', userId)

    // Minimal samples (adjust to your schema default requirements)
    await testTable('user_products', 'user_id', { title: 'RLS Test Product', price_sats: 1, currency: 'SATS', status: 'draft' })
    await testTable('user_services', 'user_id', { title: 'RLS Test Service', category: 'Testing', status: 'draft' })
    await testTable('assets', 'owner_id', { title: 'RLS Test Asset', type: 'other', status: 'draft', currency: 'USD' })
    await testTable('projects', 'user_id', { title: 'RLS Test Project', status: 'draft', currency: 'SATS' })
    await testTable('loans', 'user_id', { title: 'RLS Test Loan', description: 'Test', original_amount: 1, remaining_balance: 1 })
  } catch (e) {
    console.error('RLS sanity failed:', e.message)
    process.exit(1)
  }
}

main()

