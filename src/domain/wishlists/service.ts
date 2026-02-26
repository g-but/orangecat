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
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';

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
