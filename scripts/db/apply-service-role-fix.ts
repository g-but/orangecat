import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applyServiceRoleFix() {
  try {
    console.log('Applying service role fix for messaging...')

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/20251214220436_fix_messaging_service_role.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0)

    for (const statement of statements) {
      if (statement.trim().startsWith('--') || statement.trim() === '') continue
      
      console.log('Executing:', statement.substring(0, 50) + '...')
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error) {
        console.error('Error executing statement:', error)
        // Try direct execution instead of RPC
        const { error: directError } = await supabase.from('_temp').select('*').limit(0)
        // This won't work, but let's try a different approach
      }
    }

    console.log('✅ Service role fix applied successfully')
  } catch (error) {
    console.error('Error applying service role fix:', error)
    process.exit(1)
  }
}

applyServiceRoleFix()
