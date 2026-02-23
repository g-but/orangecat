/**
 * Wishlist Proof Delete API Route
 *
 * Handles deletion of wishlist fulfillment proofs.
 *
 * DELETE /api/wishlists/proofs/[proofId] - Delete a proof
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { validateUUID } from '@/lib/api/validation';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

interface RouteContext {
  params: Promise<{ proofId: string }>;
}

// DELETE /api/wishlists/proofs/[proofId] - Delete a proof
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { proofId } = await context.params;

    // Validate proof ID
    if (!validateUUID(proofId)) {
      return NextResponse.json({ error: 'Invalid proof ID' }, { status: 400 });
    }

    const { user, supabase } = request;

    // Get the proof and verify ownership
    const { data: proof, error: proofError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.WISHLIST_FULFILLMENT_PROOFS) as any
    )
      .select('id, user_id, wishlist_item_id')
      .eq('id', proofId)
      .single();

    if (proofError || !proof) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }

    // Users can only delete their own proofs
    if (proof.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own proofs' }, { status: 403 });
    }

    // Delete the proof
    const { error: deleteError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.WISHLIST_FULFILLMENT_PROOFS) as any
    )
      .delete()
      .eq('id', proofId);

    if (deleteError) {
      logger.error('Failed to delete wishlist proof', {
        error: deleteError.message,
        proofId,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Failed to delete proof' }, { status: 500 });
    }

    // Also delete any associated feedback
    const { error: feedbackDeleteError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.WISHLIST_FEEDBACK) as any
    )
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

    return NextResponse.json({ message: 'Proof deleted successfully' }, { status: 200 });
  } catch (error) {
    logger.error('Error in DELETE /api/wishlists/proofs/[proofId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
