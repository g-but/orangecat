/**
 * Wishlist Item Proofs API Route
 *
 * Handles fetching proofs for a wishlist item.
 *
 * GET /api/wishlists/items/[itemId]/proofs - Get all proofs for a wishlist item
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Created API endpoint to fetch wishlist item proofs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

// GET /api/wishlists/items/[itemId]/proofs - Get all proofs for a wishlist item
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { itemId } = await params;

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify the wishlist item exists
    const { data: wishlistItem, error: itemError } = await supabase
      .from('wishlist_items')
      .select('id, wishlist_id, wishlists!inner(actor_id)')
      .eq('id', itemId)
      .single();

    if (itemError || !wishlistItem) {
      return NextResponse.json(
        { error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    // Get all proofs for this item
    const { data: proofs, error: proofsError } = await supabase
      .from('wishlist_fulfillment_proofs')
      .select(`
        id,
        wishlist_item_id,
        user_id,
        proof_type,
        description,
        image_url,
        transaction_id,
        created_at,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('wishlist_item_id', itemId)
      .order('created_at', { ascending: false });

    if (proofsError) {
      logger.error('Failed to fetch wishlist proofs', {
        error: proofsError.message,
        itemId,
      });
      return NextResponse.json(
        { error: 'Failed to fetch proofs' },
        { status: 500 }
      );
    }

    // Get feedback for each proof
    const proofIds = proofs?.map(p => p.id) || [];
    let feedbackMap: Record<string, any[]> = {};

    if (proofIds.length > 0) {
      const { data: feedback, error: feedbackError } = await supabase
        .from('wishlist_feedback')
        .select(`
          id,
          fulfillment_proof_id,
          user_id,
          feedback_type,
          comment,
          created_at,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .in('fulfillment_proof_id', proofIds);

      if (!feedbackError && feedback) {
        // Group feedback by proof_id
        feedbackMap = feedback.reduce((acc, f) => {
          if (f.fulfillment_proof_id) {
            if (!acc[f.fulfillment_proof_id]) {
              acc[f.fulfillment_proof_id] = [];
            }
            acc[f.fulfillment_proof_id].push(f);
          }
          return acc;
        }, {} as Record<string, any[]>);
      }
    }

    // Combine proofs with their feedback
    const proofsWithFeedback = proofs?.map(proof => {
      const feedback = feedbackMap[proof.id] || [];
      const likes = feedback.filter(f => f.feedback_type === 'like').length;
      const dislikes = feedback.filter(f => f.feedback_type === 'dislike').length;
      const userFeedback = user ? feedback.find(f => f.user_id === user.id) : null;

      return {
        id: proof.id,
        wishlist_item_id: proof.wishlist_item_id,
        user_id: proof.user_id,
        proof_type: proof.proof_type,
        description: proof.description,
        image_url: proof.image_url,
        transaction_id: proof.transaction_id,
        created_at: proof.created_at,
        creator: proof.profiles,
        feedback: {
          likes,
          dislikes,
          user_feedback: userFeedback ? {
            type: userFeedback.feedback_type,
            comment: userFeedback.comment,
          } : null,
        },
      };
    }) || [];

    // Check if current user can add proofs (must be wishlist owner)
    const wishlist = Array.isArray(wishlistItem.wishlists) ? wishlistItem.wishlists[0] : wishlistItem.wishlists;
    const canAddProof = user && wishlist && wishlist.actor_id === user.id;

    return NextResponse.json({
      proofs: proofsWithFeedback,
      can_add_proof: canAddProof || false,
    });
  } catch (error) {
    logger.error('Error in GET /api/wishlists/items/[itemId]/proofs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
