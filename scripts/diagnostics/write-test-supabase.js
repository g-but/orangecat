#!/usr/bin/env node

// Supabase write test (local/dev/prod)
// Safely creates a temporary auth user, ensures profile exists, creates a funding page, then cleans up.

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
const service = process.env.SUPABASE_SERVICE_ROLE_KEY

function log(section, message, extra) {
  const ts = new Date().toISOString()
  const tail = extra ? `\n${JSON.stringify(extra, null, 2)}` : ''
  console.log(`[${ts}] [${section}] ${message}${tail}`)
}

if (!url || !service) {
  log('ERROR', 'Missing env: require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })

async function columnExists(table, column) {
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', table)
    .eq('column_name', column)
    .limit(1)
  if (error) return false
  return Array.isArray(data) && data.length > 0
}

async function ensureProfile(userId) {
  // Check if profile exists (trigger should create it on auth.users insert)
  const { data, error } = await supabase.from('profiles').select('id').eq('id', userId).limit(1)
  if (!error && data && data.length > 0) return true

  // Attempt to create minimal profile if trigger is not present
  const { error: insErr } = await supabase.from('profiles').insert({ id: userId, username: `diag_${userId.substring(0,8)}`, display_name: 'Diag User' })
  return !insErr
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const runId = Math.random().toString(36).slice(2, 8)
  const email = `oc_diag_${Date.now()}_${runId}@example.com`

  log('INFO', 'Creating test auth user', { email })
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({ email, email_confirm: true })
  if (createErr || !created?.user?.id) {
    log('ERROR', 'Failed to create auth user', { error: createErr?.message })
    process.exit(2)
  }

  const userId = created.user.id
  log('INFO', 'Created auth user', { userId })

  // Give trigger a moment (if present)
  await sleep(250)

  const profileOk = await ensureProfile(userId)
  if (!profileOk) {
    log('ERROR', 'Profile not present and failed to create')
    // cleanup user before exit
    await supabase.auth.admin.deleteUser(userId)
    process.exit(3)
  }

  // Determine funding_pages column for owner
  const hasCreator = await columnExists('funding_pages', 'creator_id')
  const hasUser = !hasCreator && await columnExists('funding_pages', 'user_id')
  const ownerColumn = hasCreator ? 'creator_id' : hasUser ? 'user_id' : null

  // Insert a test funding page if table and owner column exist
  let fundingId = null
  let fundingOk = false
  if (ownerColumn) {
    const slug = `diag-${runId}-${Date.now()}`
    const payload = {
      [ownerColumn]: userId,
      slug,
      title: 'Diagnostics Test Campaign',
      description: 'Temporary record created by write-test-supabase.js',
      is_public: true,
      is_active: true,
      total_raised: 0,
      supporter_count: 0,
    }
    const { data, error } = await supabase.from('funding_pages').insert(payload).select('id').limit(1)
    if (!error && data && data.length > 0) {
      fundingId = data[0].id
      fundingOk = true
      log('INFO', 'Inserted funding page', { fundingId, slug })
    } else {
      log('WARN', 'Failed to insert funding page (continuing)', { error: error?.message })
    }
  } else {
    log('WARN', 'No suitable owner column found on funding_pages (skipping funding page write)')
  }

  // Cleanup: delete funding page if created
  if (fundingId) {
    await supabase.from('funding_pages').delete().eq('id', fundingId)
    log('INFO', 'Deleted test funding page', { fundingId })
  }

  // Cleanup: delete auth user (cascade removes profile)
  await supabase.auth.admin.deleteUser(userId)
  log('INFO', 'Deleted test auth user', { userId })

  const summary = { userCreated: true, profileOk, fundingOk }
  if (profileOk && (fundingOk || ownerColumn === null)) {
    log('RESULT', 'Write test successful', summary)
  } else {
    log('RESULT', 'Write test completed with issues', summary)
    process.exit(4)
  }
}

main().catch(async (err) => {
  log('ERROR', 'Write test crashed', { error: err?.message || String(err) })
  process.exit(1)
})

