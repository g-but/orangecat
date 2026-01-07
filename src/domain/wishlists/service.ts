/**
 * WISHLIST DOMAIN SERVICE
 *
 * Business logic for wishlists.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Initial wishlist domain service
 */

import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

export async function listWishlistsPage(limit: number, offset: number, userId?: string) {
  const supabase = await createServerClient();
  
  let query = supabase
    .from('wishlist_with_stats')
    .select('*', { count: 'exact' });

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

  // Transform data to include items_count from item_count view field
  const items = data?.map(w => ({
    ...w,
    items_count: w.item_count || 0
  })) || [];

  return { items, total: count || 0 };
}

export async function createWishlist(userId: string, data: any) {
  const supabase = await createServerClient();
  
  // Fetch the actor ID for this user
  const { data: actor, error: actorError } = await supabase
    .from('actors')
    .select('id')
    .eq('user_id', userId)
    .eq('actor_type', 'user')
    .single();

  if (actorError || !actor) {
    logger.error('Failed to find actor for user', { error: actorError?.message, userId });
    throw new Error('User account configuration incomplete (missing actor)');
  }

  const { data: wishlist, error } = await supabase
    .from('wishlists')
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
      data 
    });
    throw error;
  }

  return wishlist;
}
