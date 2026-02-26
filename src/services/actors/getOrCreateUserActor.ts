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

  // Actor doesn't exist - create one
  // First get user profile for display name
  interface ProfileData {
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileResult: any = await supabase
    .from(DATABASE_TABLES.PROFILES)
    .select('username, name, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  const profile = profileResult.data as ProfileData | null;
  const profileError = profileResult.error;

  if (profileError) {
    logger.error('Failed to get profile for actor creation', {
      error: profileError?.message,
      userId,
    });
    throw profileError;
  }

  const displayName = profile?.name || profile?.username || 'User';
  const slug = profile?.username || null;

  // Create actor using admin client (bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newActor, error: createError } = await (
    adminClient.from(DATABASE_TABLES.ACTORS) as any
  )
    .insert({
      actor_type: 'user',
      user_id: userId,
      display_name: displayName,
      avatar_url: profile?.avatar_url || null,
      slug: slug,
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
