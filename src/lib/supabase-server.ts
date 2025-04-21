import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          if (!cookie) return undefined
          return decodeURIComponent(cookie.value)
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({
            name,
            value: encodeURIComponent(value),
            ...options,
          })
        },
        remove(name: string, options: any) {
          cookieStore.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )
} 