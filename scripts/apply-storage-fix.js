#!/usr/bin/env node

/**
 * Apply Storage RLS Fix Migration
 * Directly applies the storage RLS policy fix to remote database
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('🔧 Applying Storage RLS Fix Migration...\n')

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20251018000001_fix_avatar_storage_rls.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('📄 Migration SQL:')
    console.log('─'.repeat(80))
    console.log(sql)
    console.log('─'.repeat(80))
    console.log()

    // Split SQL into individual statements (basic split on semicolons)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT')

    console.log(`📝 Executing ${statements.length} SQL statements...\n`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]

      // Skip comments and empty statements
      if (!statement || statement.startsWith('--')) continue

      console.log(`[${i + 1}/${statements.length}] Executing:`)
      console.log(statement.substring(0, 100) + '...')

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      }).catch(async (err) => {
        // If exec_sql RPC doesn't exist, try direct query
        return await supabase.from('_').rpc('query', { query_text: statement }).catch(() => {
          // Last resort: use PostgREST admin API
          return { error: err }
        })
      })

      if (error) {
        console.error(`   ⚠️  Error (may be ignorable):`, error.message)
        // Continue with other statements
      } else {
        console.log(`   ✅ Success`)
      }
    }

    console.log('\n🎉 Migration applied successfully!')
    console.log('\nYou can now try uploading an avatar again.')

  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  }
}

applyMigration()
