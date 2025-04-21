import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export const createClient = () => {
  if (typeof window === 'undefined') {
    return null // Return null during SSR
  }

  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return client
} 