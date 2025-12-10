#!/usr/bin/env node
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

function mask(str) {
  if (!str) return 'missing'
  return str.slice(0, 6) + '...' + str.slice(-4)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase env:')
console.log('  URL:', url ? 'set' : 'missing')
console.log('  ANON:', anon ? 'set' : 'missing')
console.log('  SERVICE_ROLE:', service ? 'set' : 'missing')

if (!url || !anon) {
  console.error('ERROR: Missing URL or anon key')
  process.exit(1)
}

const tablesToCheck = ['assets', 'loan_collateral', 'loans', 'transactions', 'projects']

async function checkWithClient(name, client) {
  try {
    const { data, error, status } = await client.from(name).select('*', { count: 'exact', head: true }).limit(1)
    if (error) {
      return { ok: false, status, error: error.message }
    }
    return { ok: true, status }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

async function main() {
  const admin = service ? createClient(url, service) : null
  const anonClient = createClient(url, anon)

  const results = []
  for (const t of tablesToCheck) {
    const adminRes = admin ? await checkWithClient(t, admin) : { ok: false, error: 'no service key' }
    const anonRes = await checkWithClient(t, anonClient)
    results.push({ table: t, admin: adminRes, anon: anonRes })
  }

  console.log('\nTable availability:')
  for (const r of results) {
    console.log(`- ${r.table}: admin=${r.admin.ok ? 'OK' : `ERR(${r.admin.error||r.admin.status})`} anon=${r.anon.ok ? 'OK' : `ERR(${r.anon.error||r.anon.status})`}`)
  }

  // Attempt minimal row count estimates for key tables via admin (optional)
  if (admin) {
    console.log('\nCounts (admin, approximate):')
    for (const t of ['assets','loan_collateral','loans','projects','transactions']) {
      try {
        const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true })
        if (error) console.log(`  ${t}: error`)
        else console.log(`  ${t}: ${count ?? 0}`)
      } catch { console.log(`  ${t}: error`) }
    }
  } else {
    console.log('\nCounts skipped: no service role key set')
  }
}

main().catch(err => {
  console.error('Diagnostics failed:', err.message)
  process.exit(1)
})

