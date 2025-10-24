/**
 * ⚠️ DEPRECATED: This file is deprecated and will be removed in a future version.
 *
 * Please use the unified Supabase clients instead:
 * - For browser/client components: import from '@/lib/supabase/browser'
 * - For server/API routes: import from '@/lib/supabase/server'
 *
 * Migration completed: 2025-10-23
 * Scheduled for removal: After all consumers are migrated
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '⚠️ DEPRECATED: @/lib/db is deprecated. Use @/lib/supabase/browser or @/lib/supabase/server instead.'
  )
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side client for API routes
export async function createServerClient() {
  const { createServerClient: createSupabaseServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  
  const cookieStore = await cookies()
  
  return createSupabaseServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
