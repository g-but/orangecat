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

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { validateUUID } from '@/lib/api/validation';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ proofId: string }>;
}

// DELETE /api/wishlists/proofs/[proofId] - Delete a proof
export const DELETE = withAuth(async (request: AuthenticatedRequest, context: RouteContext) => {
  try {
    const { proofId } = await context.params;

    // Validate proof ID
    if (!validateUUID(proofId)) {
      return apiBadRequest('Invalid proof ID');
    }

    const { user, supabase } = request;

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many requests. Please slow down.', retryAfter);
    }

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
      return apiNotFound('Proof not found');
    }

    // Users can only delete their own proofs
    if (proof.user_id !== user.id) {
      return apiForbidden('You can only delete your own proofs');
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
      return apiInternalError('Failed to delete proof');
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

    return apiSuccess({ message: 'Proof deleted successfully' });
  } catch (error) {
    logger.error('Error in DELETE /api/wishlists/proofs/[proofId]:', error);
    return apiInternalError();
  }
});
