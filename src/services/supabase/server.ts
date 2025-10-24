/**
 * ⚠️ DEPRECATED: This file is deprecated and will be removed in a future version.
 *
 * Please use the unified Supabase server client instead:
import { logger } from '@/utils/logger'
 * - For server/API routes: import from '@/lib/supabase/server'
 *
 * Migration completed: 2025-10-23
 * Scheduled for removal: After all consumers are migrated
 */

import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { cookies as getNextCookies } from 'next/headers';
import { Database } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js';

// Environment variables with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Log deprecation warning in development
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '⚠️ DEPRECATED: @/services/supabase/server is deprecated. Use @/lib/supabase/server instead.'
  );
}

// Warn if using fallback values in production
if (
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  process.env.NODE_ENV === 'production'
) {
}

// Create a server-side Supabase client
export const createServerClient = async () => {
  const cookieStore = await getNextCookies();

  return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((cookie: any) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // The `set` method here will throw an error if called from a Server Component
            // It's primarily for use in Route Handlers and Server Actions
            // For Server Components, reading cookies is fine, but setting them needs a different approach (e.g., in middleware or actions)
            cookieStore.set(name, value, options);
          });
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
  });
};
