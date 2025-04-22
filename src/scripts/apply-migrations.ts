import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigrations() {
  try {
    console.log('Applying migrations...')

    // Enable UUID extension
    await supabase.rpc('enable_uuid_extension')

    // Create profiles table
    await supabase.rpc('create_profiles_table')

    // Create funding_pages table
    await supabase.rpc('create_funding_pages_table')

    // Create transactions table
    await supabase.rpc('create_transactions_table')

    // Enable RLS
    await supabase.rpc('enable_rls', { table_name: 'profiles' })
    await supabase.rpc('enable_rls', { table_name: 'funding_pages' })
    await supabase.rpc('enable_rls', { table_name: 'transactions' })

    // Create policies
    await supabase.rpc('create_profile_policies')
    await supabase.rpc('create_funding_pages_policies')
    await supabase.rpc('create_transactions_policies')

    // Create trigger function and trigger
    await supabase.rpc('create_user_trigger_function')
    await supabase.rpc('create_user_trigger')

    console.log('✅ Migrations applied successfully')
  } catch (error) {
    console.error('Error applying migrations:', error)
    process.exit(1)
  }
}

applyMigrations() 