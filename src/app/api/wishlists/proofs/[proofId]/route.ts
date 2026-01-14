/**
 * Wishlist Proof Delete API Route
 *
 * Handles deletion of wishlist fulfillment proofs.
 *
 * DELETE /api/wishlists/proofs/[proofId] - Delete a proof
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-06
 * Last Modified Summary: Created wishlist proof delete API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { validateUUID } from '@/lib/api/validation';
import { logger } from '@/utils/logger';

interface RouteParams {
  params: Promise<{ proofId: string }>;
}

// DELETE /api/wishlists/proofs/[proofId] - Delete a proof
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { proofId } = await params;

    // Validate proof ID
    if (!validateUUID(proofId)) {
      return NextResponse.json(
        { error: 'Invalid proof ID' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the proof and verify ownership
    const { data: proof, error: proofError } = await (supabase
      .from('wishlist_fulfillment_proofs') as any)
      .select('id, user_id, wishlist_item_id')
      .eq('id', proofId)
      .single();

    if (proofError || !proof) {
      return NextResponse.json(
        { error: 'Proof not found' },
        { status: 404 }
      );
    }

    // Users can only delete their own proofs
    if (proof.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own proofs' },
        { status: 403 }
      );
    }

    // Delete the proof
    const { error: deleteError } = await (supabase
      .from('wishlist_fulfillment_proofs') as any)
      .delete()
      .eq('id', proofId);

    if (deleteError) {
      logger.error('Failed to delete wishlist proof', {
        error: deleteError.message,
        proofId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to delete proof' },
        { status: 500 }
      );
    }

    // Also delete any associated feedback
    const { error: feedbackDeleteError } = await (supabase
      .from('wishlist_feedback') as any)
      .delete()
      .eq('fulfillment_proof_id', proofId);

    if (feedbackDeleteError) {
      logger.warn('Failed to delete associated feedback', {
        error: feedbackDeleteError.message,
        proofId,
      });
      // Don't fail the request for this - log and continue
    }

    logger.info('Deleted wishlist proof successfully', {
      proofId,
      userId: user.id,
    });

    return NextResponse.json(
      { message: 'Proof deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error in DELETE /api/wishlists/proofs/[proofId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}