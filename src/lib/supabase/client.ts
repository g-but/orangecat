/**
 * Supabase Browser Client
 *
 * Browser-side Supabase client for client components.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Created browser client for Supabase
 */

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function createBrowserClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseClient = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}

// Export a singleton instance for convenience
export const supabase = createBrowserClient();