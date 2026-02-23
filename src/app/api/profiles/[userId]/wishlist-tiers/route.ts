/**
 * Wishlist Donation Tiers API Route
 *
 * Fetches top wishlist items for a user to be used as donation tiers.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Created API to fetch wishlist items as donation tiers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params;
    const supabase = await createServerClient();

    // Fetch active wishlists for this user
    // We filter items that are not fully funded and not fulfilled
    const { data: items, error } = await supabase
      .from(DATABASE_TABLES.WISHLIST_ITEMS)
      .select(
        `
        id,
        title,
        target_amount_sats,
        funded_amount_sats,
        wishlists!inner(actor_id)
      `
      )
      .eq('wishlists.actor_id', userId)
      .eq('is_fulfilled', false)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      logger.error('Failed to fetch wishlist tiers', { error: error.message, userId });
      return NextResponse.json({ error: 'Failed to fetch wishlist tiers' }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    logger.error('Error in wishlist-tiers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
