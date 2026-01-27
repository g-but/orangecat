/**
 * Supabase Admin Client - SINGLE SOURCE OF TRUTH
 *
 * Creates an admin client with service role key for server-side operations.
 * Includes build-time safety with dummy client fallback.
 *
 * SSOT: This is the canonical location for admin client creation.
 * @/services/supabase/admin re-exports from here.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
// Support multiple key names for compatibility
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_KEY) as string;

/**
 * Create a dummy client for build-time safety.
 * During static builds the service-role key may be intentionally absent.
 * This keeps the build green while throwing at runtime if actually used.
 */
function createDummyClient(): SupabaseClient<Database> {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          'Supabase Admin client requested, but required environment variables are missing. ' +
            'Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your deployment environment.'
        );
      },
    }
  ) as unknown as SupabaseClient<Database>;
}

/**
 * Create an admin Supabase client with service role key.
 * Falls back to dummy client if env vars are missing (for build safety).
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !serviceRoleKey) {
    logger.warn('Supabase admin credentials missing, using dummy client', {}, 'supabase');
    return createDummyClient();
  }
  try {
    return createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (error) {
    logger.error(
      'Error creating admin client',
      { error: error instanceof Error ? error.message : error },
      'supabase'
    );
    throw new Error(
      `Failed to create Supabase admin client: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Singleton instance for convenience
let _adminClient: SupabaseClient<Database> | null = null;

/**
 * Get the singleton admin client instance.
 * Lazily creates the client on first call.
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (!_adminClient) {
    _adminClient = createAdminClient();
  }
  return _adminClient;
}
