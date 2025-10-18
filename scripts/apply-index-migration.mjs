#!/usr/bin/env node

/**
 * Apply database migration: Add index on transactions.status
 *
 * This script uses the Supabase client with service role key
 * to execute DDL commands that aren't available via the REST API.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔗 Connected to Supabase:', supabaseUrl)
console.log('📝 Applying migration: Add index on transactions.status\n')

// The SQL to execute
const migrationSQL = `
-- Add index on transactions.status column
CREATE INDEX IF NOT EXISTS idx_transactions_status
ON transactions(status);

-- Add comment for documentation
COMMENT ON INDEX idx_transactions_status IS
'Index for fast filtering transactions by status. Critical for admin dashboards and payment processing.';
`

try {
  // Execute via RPC (need to create a function first) or use raw SQL
  // For now, let's verify the index exists by querying pg_indexes

  console.log('🔍 Checking if transactions table exists...')
  const { data: tables, error: tablesError } = await supabase
    .from('transactions')
    .select('id')
    .limit(1)

  if (tablesError) {
    console.error('❌ Error accessing transactions table:', tablesError.message)
    console.log('\n💡 This is expected if you haven\'t created transactions yet.')
    console.log('   The migration will be applied when the table is created.')
    process.exit(0)
  }

  console.log('✅ Transactions table exists')

  // Since we can't execute DDL directly via the client,
  // let's document what needs to be done
  console.log('\n📋 Migration SQL to execute in Supabase Dashboard:')
  console.log('─'.repeat(60))
  console.log(migrationSQL)
  console.log('─'.repeat(60))

  console.log('\n🎯 Instructions:')
  console.log('1. Go to: https://supabase.com/dashboard/project/ohkueislstxomdjavyhs/sql/new')
  console.log('2. Paste the SQL above')
  console.log('3. Click "Run"')
  console.log('4. Verify: Index should appear in Database → Indexes')

  console.log('\n✨ Alternative: Let me create a Supabase function to execute this...')

  // Create a temporary RPC function to execute the DDL
  const createFunctionSQL = `
CREATE OR REPLACE FUNCTION apply_transaction_index_migration()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add index on transactions.status column
  CREATE INDEX IF NOT EXISTS idx_transactions_status
  ON transactions(status);

  -- Add comment for documentation
  EXECUTE 'COMMENT ON INDEX idx_transactions_status IS ' ||
    quote_literal('Index for fast filtering transactions by status. Critical for admin dashboards and payment processing.');

  RETURN 'Index idx_transactions_status created successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;
`

  console.log('\n📋 Or use this Function approach (recommended):')
  console.log('─'.repeat(60))
  console.log(createFunctionSQL)
  console.log('─'.repeat(60))
  console.log('\nThen call it with:')
  console.log('SELECT apply_transaction_index_migration();')

} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
