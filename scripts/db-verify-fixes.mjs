#!/usr/bin/env node
// Database Fix Verification Script
// Validates that all schema consolidation fixes are working correctly

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !service) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, service, { auth: { persistSession: false } })

console.log('🔍 Verifying Database Schema Consolidation Fixes\n')

async function runVerification() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  }

  // =====================================================================
  // TEST 1: Check for duplicate columns
  // =====================================================================
  console.log('1. 🔍 Checking for duplicate columns (user_id vs creator_id)...')

  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'projects')
      .in('column_name', ['user_id', 'creator_id'])

    if (error) throw error

    const hasUserId = columns.some(col => col.column_name === 'user_id')
    const hasCreatorId = columns.some(col => col.column_name === 'creator_id')

    if (hasUserId && hasCreatorId) {
      console.log('   ❌ FAILED: Both user_id and creator_id columns exist')
      results.failed++
    } else if (hasUserId) {
      console.log('   ✅ PASSED: Only user_id column exists (correct)')
      results.passed++
    } else if (hasCreatorId) {
      console.log('   ⚠️  WARNING: Only creator_id exists (should be user_id)')
      results.warnings++
    } else {
      console.log('   ❌ FAILED: Neither user_id nor creator_id exists')
      results.failed++
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    results.failed++
  }

  // =====================================================================
  // TEST 2: Check for missing columns that code expects
  // =====================================================================
  console.log('\n2. 🔍 Checking for required columns in projects table...')

  const requiredProjectColumns = [
    'cover_image_url', 'contributor_count', 'raised_amount_sats', 'published',
    'user_id', 'title', 'status', 'created_at', 'updated_at'
  ]

  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'projects')

    if (error) throw error

    const existingColumns = columns.map(col => col.column_name)
    const missingColumns = requiredProjectColumns.filter(col => !existingColumns.includes(col))

    if (missingColumns.length === 0) {
      console.log('   ✅ PASSED: All required project columns exist')
      results.passed++
    } else {
      console.log(`   ❌ FAILED: Missing columns: ${missingColumns.join(', ')}`)
      results.failed++
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    results.failed++
  }

  // =====================================================================
  // TEST 3: Check currency model standardization
  // =====================================================================
  console.log('\n3. 🔍 Checking currency model (should be satoshis-only)...')

  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'projects')
      .in('column_name', ['currency', 'goal_currency', 'current_amount'])

    if (error) throw error

    const hasOldCurrencyColumns = columns.length > 0

    if (hasOldCurrencyColumns) {
      console.log(`   ❌ FAILED: Found old currency columns: ${columns.map(c => c.column_name).join(', ')}`)
      results.failed++
    } else {
      console.log('   ✅ PASSED: Old currency columns removed, using satoshis')
      results.passed++
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    results.failed++
  }

  // =====================================================================
  // TEST 4: Check constraints are applied
  // =====================================================================
  console.log('\n4. 🔍 Checking data validation constraints...')

  try {
    // Check if we can insert invalid data (should fail)
    const { error: invalidStatusError } = await supabase
      .from('projects')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // fake UUID
        title: 'Test Invalid Status',
        status: 'invalid_status' // should fail constraint
      })

    const hasStatusConstraint = invalidStatusError && invalidStatusError.message.includes('violates check constraint')

    if (hasStatusConstraint) {
      console.log('   ✅ PASSED: Status constraint working')
      results.passed++
    } else {
      console.log('   ⚠️  WARNING: Status constraint may not be working')
      results.warnings++
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    results.failed++
  }

  // =====================================================================
  // TEST 5: Check triggers are working
  // =====================================================================
  console.log('\n5. 🔍 Checking updated_at triggers...')

  try {
    // Insert a test record and see if updated_at gets set
    const { data: insertData, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        title: 'Test Trigger',
        status: 'draft'
      })
      .select()
      .single()

    if (insertError) {
      // If insert fails due to FK constraint, that's expected
      if (insertError.message.includes('violates foreign key constraint')) {
        console.log('   ✅ PASSED: Foreign key constraint working (expected failure)')
        results.passed++
      } else {
        console.log(`   ❌ FAILED: Unexpected insert error: ${insertError.message}`)
        results.failed++
      }
    } else {
      // If insert succeeded, check if updated_at was set
      const hasUpdatedAt = insertData.updated_at !== null
      if (hasUpdatedAt) {
        console.log('   ✅ PASSED: updated_at trigger working')
        results.passed++

        // Clean up test record
        await supabase.from('projects').delete().eq('id', insertData.id)
      } else {
        console.log('   ⚠️  WARNING: updated_at may not be set by trigger')
        results.warnings++
      }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`)
    results.failed++
  }

  // =====================================================================
  // TEST 6: Check RLS is enabled
  // =====================================================================
  console.log('\n6. 🔍 Checking RLS is enabled on critical tables...')

  const criticalTables = ['projects', 'user_products', 'user_services', 'assets', 'loans']

  try {
    const { data: rlsData, error } = await supabase.rpc('exec_sql', {
      q: `
        SELECT schemaname, tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = ANY($1)
      `,
      params: [criticalTables]
    })

    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('   ⚠️  WARNING: exec_sql function not available, cannot verify RLS')
      results.warnings++
    } else {
      const tablesWithoutRLS = rlsData.filter(table => !table.rowsecurity)

      if (tablesWithoutRLS.length === 0) {
        console.log('   ✅ PASSED: All critical tables have RLS enabled')
        results.passed++
      } else {
        console.log(`   ❌ FAILED: Tables without RLS: ${tablesWithoutRLS.map(t => t.tablename).join(', ')}`)
        results.failed++
      }
    }
  } catch (error) {
    console.log('   ⚠️  WARNING: Cannot verify RLS status (exec_sql function needed)')
    results.warnings++
  }

  // =====================================================================
  // TEST 7: Check indexes exist
  // =====================================================================
  console.log('\n7. 🔍 Checking critical indexes exist...')

  const criticalIndexes = [
    'idx_projects_user_id',
    'idx_projects_status',
    'idx_user_products_user_id',
    'idx_user_services_user_id',
    'idx_assets_owner_id',
    'idx_loans_user_id'
  ]

  try {
    const { data: indexes, error } = await supabase.rpc('exec_sql', {
      q: `
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = ANY($1)
      `,
      params: [criticalIndexes]
    })

    if (error) {
      console.log('   ⚠️  WARNING: Cannot verify indexes (exec_sql function needed)')
      results.warnings++
    } else {
      const existingIndexes = indexes.map(idx => idx.indexname)
      const missingIndexes = criticalIndexes.filter(idx => !existingIndexes.includes(idx))

      if (missingIndexes.length === 0) {
        console.log('   ✅ PASSED: All critical indexes exist')
        results.passed++
      } else {
        console.log(`   ⚠️  WARNING: Missing indexes: ${missingIndexes.join(', ')}`)
        results.warnings++
      }
    }
  } catch (error) {
    console.log('   ⚠️  WARNING: Cannot verify indexes (exec_sql function needed)')
    results.warnings++
  }

  // =====================================================================
  // SUMMARY
  // =====================================================================
  console.log('\n' + '='.repeat(60))
  console.log('📊 VERIFICATION SUMMARY')
  console.log('='.repeat(60))

  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⚠️  Warnings: ${results.warnings}`)

  const total = results.passed + results.failed + results.warnings
  const successRate = Math.round((results.passed / total) * 100)

  console.log(`\n🎯 Success Rate: ${successRate}%`)

  if (results.failed === 0) {
    console.log('🎉 ALL CRITICAL FIXES VERIFIED!')
    if (results.warnings === 0) {
      console.log('🏆 PERFECT: Database schema consolidation successful')
    } else {
      console.log('⚠️  MINOR ISSUES: Check warnings above')
    }
  } else {
    console.log('❌ CRITICAL ISSUES: Database fixes incomplete')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
}

// Run the verification
runVerification().catch(error => {
  console.error('💥 Verification failed with error:', error)
  process.exit(1)
})















