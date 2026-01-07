/**
 * Wishlist Proof API Route
 *
 * Handles wishlist fulfillment proof operations.
 *
 * POST /api/wishlists/proofs - Create proof of purchase/wishlist fulfillment
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-06
 * Last Modified Summary: Created wishlist proof API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { wishlistFulfillmentProofSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';

// POST /api/wishlists/proofs - Create proof of purchase/wishlist fulfillment
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request
    const validationResult = wishlistFulfillmentProofSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Verify the wishlist item exists and user has access
    const { data: wishlistItem, error: itemError } = await supabase
      .from('wishlist_items')
      .select('id, wishlist_id, wishlists!inner(actor_id)')
      .eq('id', validationResult.data.wishlist_item_id)
      .single();

    if (itemError || !wishlistItem) {
      return NextResponse.json(
        { error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    // Users can only add proofs to their own wishlists
    const wishlist = Array.isArray(wishlistItem.wishlists) ? wishlistItem.wishlists[0] : wishlistItem.wishlists;
    if (!wishlist || wishlist.actor_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only add proofs to your own wishlists' },
        { status: 403 }
      );
    }

    // Create the proof
    const { data: proof, error: proofError } = await supabase
      .from('wishlist_fulfillment_proofs')
      .insert({
        wishlist_item_id: validationResult.data.wishlist_item_id,
        user_id: user.id,
        proof_type: validationResult.data.proof_type,
        description: validationResult.data.description,
        image_url: validationResult.data.image_url,
        transaction_id: validationResult.data.transaction_id,
      })
      .select()
      .single();

    if (proofError) {
      logger.error('Failed to create wishlist proof', {
        error: proofError.message,
        userId: user.id,
        wishlistItemId: validationResult.data.wishlist_item_id,
      });
      return NextResponse.json(
        { error: 'Failed to create proof' },
        { status: 500 }
      );
    }

    logger.info('Created wishlist proof successfully', {
      proofId: proof.id,
      userId: user.id,
      wishlistItemId: validationResult.data.wishlist_item_id,
      proofType: validationResult.data.proof_type,
    });

    return NextResponse.json(
      { proof },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error in POST /api/wishlists/proofs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}