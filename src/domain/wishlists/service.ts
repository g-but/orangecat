/**
 * WISHLIST DOMAIN SERVICE
 *
 * Business logic for wishlists.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-15
 * Last Modified Summary: Added auto-creation of actor if missing
 */

import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

export async function listWishlistsPage(limit: number, offset: number, userId?: string) {
  const supabase = await createServerClient();

  let query = supabase.from(DATABASE_TABLES.WISHLIST_WITH_STATS).select('*', { count: 'exact' });

  if (userId) {
    query = query.eq('actor_id', userId);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to list wishlists', { error: error.message, userId });
    throw error;
  }

  // Type for wishlist data from view
  type WishlistWithStats = {
    id: string;
    actor_id: string;
    title: string;
    description?: string | null;
    item_count?: number;
    [key: string]: unknown;
  };

  // Transform data to include items_count from item_count view field
  const items = ((data || []) as WishlistWithStats[]).map(w => ({
    ...w,
    items_count: w.item_count || 0,
  }));

  return { items, total: count || 0 };
}

/**
 * Get or create actor for user
 * Actors are required for wishlists but may not exist for all users
 */
async function getOrCreateUserActor(userId: string): Promise<{ id: string }> {
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
    throw new Error('Failed to set up user account configuration');
  }

  logger.info('Created actor for user', { actorId: newActor.id, userId });
  return newActor as { id: string };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createWishlist(userId: string, data: any) {
  const supabase = await createServerClient();

  // Get or create actor for this user
  const actor = await getOrCreateUserActor(userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wishlist, error } = await (supabase.from(DATABASE_TABLES.WISHLISTS) as any)
    .insert({
      actor_id: actor.id,
      title: data.title,
      description: data.description,
      type: data.type,
      visibility: data.visibility,
      is_active: data.is_active ?? true,
      cover_image_url: data.cover_image_url,
      event_date: data.event_date,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create wishlist', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      userId,
      actorId: actor.id,
      data,
    });
    throw error;
  }

  return wishlist;
}
