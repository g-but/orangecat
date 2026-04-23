/**
 * Actor Domain Helpers
 *
 * Server-side domain utilities for actor lookups.
 * Functions accept an injectable Supabase client so callers can reuse
 * the already-authenticated client from withAuth middleware.
 */

import type { AnySupabaseClient } from '@/lib/supabase/types';
import { DATABASE_TABLES } from '@/config/database-tables';

/**
 * Get the primary actor ID for a user.
 * Returns null if the user has no actor record.
 */
export async function getUserActorId(
  supabase: AnySupabaseClient,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from(DATABASE_TABLES.ACTORS)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as { id: string }).id;
}
