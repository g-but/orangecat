import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies as getNextCookies } from 'next/headers';
import { Database } from '@/types/database';
import { logger } from '@/utils/logger';

// Environment variables (fail-fast in production, safe fallbacks in dev only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (process.env.NODE_ENV === 'production') {
  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error('Missing Supabase configuration in production environment', {}, 'Supabase');
    throw new Error('Supabase environment variables are not set in production');
  }
} else {
  // Development: log a clear warning if missing (server can still start, but features may be limited)
  if (!supabaseUrl || !supabaseAnonKey) {
    logger.warn('Supabase env missing in development. Some features may not work.', {}, 'Supabase');
  }
}

// Create a server-side Supabase client
export const createServerClient = async () => {
  const cookieStore = await getNextCookies();

  return createSupabaseServerClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
      ) {
        try {
          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }) => {
              cookieStore.set(name, value, options);
            }
          );
        } catch (error) {
          // Gracefully handle errors if `set` is called in an unsupported context
          logger.warn('Failed to set cookies in server client', { error }, 'Supabase');
        }
      },
    },
  });
};
