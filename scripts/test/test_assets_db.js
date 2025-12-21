const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAssetsTable() {
  try {
    console.log('Testing assets table existence...')

    // Try to select from assets table
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Assets table error:', error.message)
      return false
    }

    console.log('Assets table exists and is accessible')
    console.log('Sample data:', data)
    return true
  } catch (err) {
    console.error('Error testing assets table:', err.message)
    return false
  }
}

testAssetsTable()

































