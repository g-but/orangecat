#!/usr/bin/env node

/**
 * Environment validation script
 * Ensures required Supabase/public env vars are present and not using placeholders.
 * Fails with a non-zero exit code if validation fails.
 */

const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Load .env.local if present (do not overwrite existing process env)
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false })
}

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  // Require either PUBLISHABLE or ANON; we check both below
]

const OPTIONAL_REQUIRED_ONE_OF = [
  ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
]

const PLACEHOLDER_PATTERNS = [
  'https://placeholder.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
]

function fail(message) {
  console.error(`❌ ${message}`)
  process.exitCode = 1
}

function validateRequired() {
  const missing = REQUIRED_VARS.filter(key => !process.env[key])
  if (missing.length) {
    fail(`Missing required env vars: ${missing.join(', ')}`)
  }
}

function validateAtLeastOne() {
  OPTIONAL_REQUIRED_ONE_OF.forEach(group => {
    const hasAny = group.some(key => !!process.env[key])
    if (!hasAny) {
      fail(`Provide at least one of: ${group.join(' or ')}`)
    }
  })
}

function validateFormats() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url && (!url.startsWith('https://') || !url.includes('.supabase.co'))) {
    fail('NEXT_PUBLIC_SUPABASE_URL must look like https://<project>.supabase.co')
  }

  const valuesToCheck = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ].filter(Boolean)

  const hasPlaceholder = valuesToCheck.some(value =>
    PLACEHOLDER_PATTERNS.some(pattern => value.includes(pattern))
  )

  if (hasPlaceholder) {
    fail('Supabase env vars contain placeholder/demo values. Replace with real project values.')
  }
}

function main() {
  validateRequired()
  validateAtLeastOne()
  validateFormats()

  if (process.exitCode) {
    process.exit(process.exitCode)
  } else {
    console.log('✅ Environment looks good.')
  }
}

main()
































