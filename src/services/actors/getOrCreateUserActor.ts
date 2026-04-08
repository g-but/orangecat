/**
 * Get or Create User Actor (Server-Side)
 *
 * Shared utility for ensuring a user has an associated actor record.
 * Uses server-side Supabase clients (createServerClient + createAdminClient).
 *
 * Created: 2026-02-26
 * Last Modified: 2026-02-26
 * Last Modified Summary: Extracted from duplicated code in wishlists and documents services
 */

import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

/**
 * Get or create actor for user.
 * Actors are required for domain entities but may not exist for all users.
 * If no actor exists, one is created using the admin client (bypasses RLS).
 */
export async function getOrCreateUserActor(userId: string): Promise<{ id: string }> {
  const supabase = await createServerClient();
  const adminClient = createAdminClient();

  // First try to find existing actor
  const { data: existingActor, error: findError } = await supabase
    .from(DATABASE_TABLES.ACTORS)
    .select('id')
    .eq('user_id', userId)
    .eq('actor_type', 'user')
    .maybeSingle();

  if (existingActor) {
    return existingActor as { id: string };
  }

  if (findError && findError.code !== 'PGRST116') {
    logger.error('Error checking for existing actor', { error: findError.message, userId });
    throw findError;
  }

  // Actor doesn't exist - create one using admin client (bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newActor, error: createError } = await (
    adminClient.from(DATABASE_TABLES.ACTORS) as any
  )
    .insert({
      actor_type: 'user',
      user_id: userId,
    })
    .select('id')
    .single();

  if (createError) {
    logger.error('Failed to create actor for user', { error: createError.message, userId });
    throw createError;
  }

  logger.info('Created actor for user', { actorId: newActor.id, userId });
  return newActor as { id: string };
}
