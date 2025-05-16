import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies as getNextCookies } from 'next/headers'
import { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for server client')
}

// Create a server-side Supabase client
export const createServerClient = () => {
  const cookieStore = getNextCookies()

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map(cookie => ({
          name: cookie.name,
          value: cookie.value
        }))
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // The `set` method here will throw an error if called from a Server Component
            // It's primarily for use in Route Handlers and Server Actions
            // For Server Components, reading cookies is fine, but setting them needs a different approach (e.g., in middleware or actions)
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Gracefully handle errors if `set` is called in an unsupported context (e.g. Server Components during render)
          // console.error('Error setting cookies in Supabase server client:', error);
        }
      },
      // Optional: If you need individual get/set/remove for specific scenarios, though getAll/setAll is preferred
      // get(name: string) {
      //   return cookieStore.get(name)?.value
      // },
      // set(name: string, value: string, options: CookieOptions) {
      //   try {
      //     cookieStore.set(name, value, options)
      //   } catch (error) { /* Handle error */ }
      // },
      // remove(name: string, options: CookieOptions) {
      //   try {
      //     cookieStore.set(name, '', options) // Removing by setting an empty value with options
      //   } catch (error) { /* Handle error */ }
      // },
    },
  })
} 