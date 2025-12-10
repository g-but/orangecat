#!/usr/bin/env node
// Creates or ensures a confirmed test user exists using Supabase Admin API
// Reads config from environment variables or .env.local

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  // Load .env.local if present to populate process.env
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
  }
}

async function ensureTestUser() {
  loadEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase configuration: ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
  }

  // Allow caller to pass custom creds, else default
  const email = process.env.E2E_TEST_USER_EMAIL || `e2e_user_${Date.now()}@example.com`
  const password = process.env.E2E_TEST_USER_PASSWORD || 'testPassword!123'

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

  try {
    // Try to create a fresh confirmed user
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { preferred_username: 'e2e_user', name: 'E2E User' },
    })

    if (error) {
      // If user already exists, try to find it and update password
      if (String(error.message || '').toLowerCase().includes('already') || (error.status && error.status !== 0)) {
        // Search via admin.listUsers (paginate a few pages)
        let found = null
        for (let page = 1; page <= 5; page++) {
          const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 100 })
          if (listErr) break
          found = list.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase())
          if (found) break
          if (!list.users.length) break
        }
        if (found) {
          await admin.auth.admin.updateUserById(found.id, { password })
          console.log(`Updated password for existing user: ${email}`)
        } else {
          console.warn('User appears to exist but could not be found via listUsers. Proceeding with provided credentials.')
        }
      } else {
        throw error
      }
    } else {
      console.log(`Created confirmed test user: ${email}`)
    }

    // Emit env exports for convenience when running Playwright
    console.log(`E2E_TEST_USER_EMAIL=${email}`)
    console.log(`E2E_TEST_USER_PASSWORD=${password}`)
  } catch (e) {
    console.error('Failed to ensure test user:', e.message || e)
    process.exit(1)
  }
}

ensureTestUser()

