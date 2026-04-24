/**
 * WISHLIST DOMAIN SERVICE
 *
 * Business logic for wishlists.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-03-31
 * Last Modified Summary: Refactored to use generic base entity service for create
 */

import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { createEntity } from '@/domain/base/entityService';
import { getOrCreateUserActor } from '@/services/actors/getOrCreateUserActor';
import type { WishlistFormData } from '@/lib/validation';

export async function listWishlistsPage(limit: number, offset: number, userId?: string) {
  const supabase = await createServerClient();

  let query = supabase.from(DATABASE_TABLES.WISHLIST_WITH_STATS).select('*', { count: 'exact' });

  if (userId) {
    const actor = await getOrCreateUserActor(userId);
    query = query.eq('actor_id', actor.id);
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
  return createEntity('wishlist', userId, {
    title: data.title,
    description: data.description,
    type: data.type,
    visibility: data.visibility,
    is_active: data.is_active ?? true,
    cover_image_url: data.cover_image_url,
    event_date: data.event_date,
  });
}
