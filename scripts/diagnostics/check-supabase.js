#!/usr/bin/env node

// Supabase connectivity diagnostics (local/dev)
// - Uses .env.local if present
// - Verifies env, connectivity, and head-only selects on key tables

const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

// Load env from .env.local if available
try {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath })
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

function log(section, message, extra) {
  const ts = new Date().toISOString()
  const tail = extra ? `\n${JSON.stringify(extra, null, 2)}` : ''
  console.log(`[${ts}] [${section}] ${message}${tail}`)
}

if (!url || !anon) {
  log('ERROR', 'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  process.exit(1)
}

const key = service || anon
const mode = service ? 'service-role' : 'anon'
log('INFO', `Using ${mode} key to connect to ${url}`)

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function checkTable(table) {
  try {
    const { error, count } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .limit(1)
    if (error) return { table, ok: false, error: error.message }
    return { table, ok: true, count }
  } catch (e) {
    return { table, ok: false, error: e.message || String(e) }
  }
}

async function main() {
  const checks = {}
  // Connectivity check via a benign select
  const coreTables = ['profiles', 'organizations', 'funding_pages']

  for (const t of coreTables) {
    checks[t] = await checkTable(t)
  }

  const failures = Object.values(checks).filter(r => !r.ok)
  const summary = {
    mode,
    url: url.replace(/(https?:\/\/)([^.]+)\.(.*)/, '$1***.$3'),
    tables: checks,
  }

  if (failures.length) {
    log('RESULT', 'Supabase diagnostics completed with failures', summary)
    process.exit(2)
  } else {
    log('RESULT', 'Supabase diagnostics successful', summary)
  }
}

main().catch(err => {
  log('ERROR', 'Diagnostics crashed', { error: err?.message || String(err) })
  process.exit(1)
})

