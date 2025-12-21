import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
// Support both SUPABASE_SERVICE_ROLE_KEY and SUPABASE_SECRET_KEY for compatibility
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY) as string

export function createAdminClient() {
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY environment variable')
  }
  try {
    return createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  } catch (error) {
    console.error('Error creating admin client:', error)
    throw new Error(`Failed to create Supabase admin client: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

