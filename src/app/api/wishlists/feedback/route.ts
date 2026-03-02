/**
 * Wishlist Feedback API Route
 *
 * Handles wishlist feedback operations (likes/dislikes).
 *
 * POST /api/wishlists/feedback - Submit like/dislike feedback
 *
 * Created: 2026-01-06
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use withAuth middleware
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { wishlistFeedbackSchema } from '@/lib/validation';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
  apiConflict,
  apiInternalError,
  apiCreated,
} from '@/lib/api/standardResponse';

// POST /api/wishlists/feedback - Submit like/dislike feedback
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { user, supabase } = request;

    const body = await request.json();

    // Validate request
    const validationResult = wishlistFeedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return apiBadRequest('Invalid request', validationResult.error.errors);
    }

    // Verify the wishlist item exists
    const { data: wishlistItem, error: itemError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.WISHLIST_ITEMS) as any
    )
      .select('id, wishlist_id, wishlists!inner(actor_id)')
      .eq('id', validationResult.data.wishlist_item_id)
      .single();

    if (itemError || !wishlistItem) {
      return apiNotFound('Wishlist item not found');
    }

    // Users cannot feedback on their own wishlist items
    const wishlist = Array.isArray(wishlistItem.wishlists)
      ? wishlistItem.wishlists[0]
      : wishlistItem.wishlists;
    if (wishlist && wishlist.actor_id === user.id) {
      return apiForbidden('You cannot provide feedback on your own wishlist items');
    }

    // If feedback is associated with a proof, verify it exists
    if (validationResult.data.fulfillment_proof_id) {
      const { data: proof, error: proofError } = await (
        supabase
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .from(DATABASE_TABLES.WISHLIST_FULFILLMENT_PROOFS) as any
      )
        .select('id, wishlist_item_id')
        .eq('id', validationResult.data.fulfillment_proof_id)
        .eq('wishlist_item_id', validationResult.data.wishlist_item_id)
        .single();

      if (proofError || !proof) {
        return apiNotFound('Fulfillment proof not found or does not match wishlist item');
      }
    }

    // Check if user already provided feedback for this proof/item combination
    const existingFeedbackQuery = (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.WISHLIST_FEEDBACK) as any
    )
      .select('id, feedback_type')
      .eq('user_id', user.id)
      .eq('wishlist_item_id', validationResult.data.wishlist_item_id);

    if (validationResult.data.fulfillment_proof_id) {
      existingFeedbackQuery.eq('fulfillment_proof_id', validationResult.data.fulfillment_proof_id);
    } else {
      existingFeedbackQuery.is('fulfillment_proof_id', null);
    }

    const { data: existingFeedback, error: feedbackCheckError } = await existingFeedbackQuery;

    if (feedbackCheckError) {
      logger.error('Failed to check existing feedback', {
        error: feedbackCheckError.message,
        userId: user.id,
        wishlistItemId: validationResult.data.wishlist_item_id,
      });
      return apiInternalError('Failed to check existing feedback');
    }

    if (existingFeedback && existingFeedback.length > 0) {
      const existing = existingFeedback[0];
      if (existing.feedback_type === validationResult.data.feedback_type) {
        return apiConflict('You have already provided this type of feedback');
      } else {
        // Update existing feedback (allow changing like to dislike or vice versa)
        const { data: updatedFeedback, error: updateError } = await (
          supabase
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from(DATABASE_TABLES.WISHLIST_FEEDBACK) as any
        )
          .update({
            feedback_type: validationResult.data.feedback_type,
            comment: validationResult.data.comment,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          logger.error('Failed to update wishlist feedback', {
            error: updateError.message,
            feedbackId: existing.id,
            userId: user.id,
          });
          return apiInternalError('Failed to update feedback');
        }

        logger.info('Updated wishlist feedback successfully', {
          feedbackId: updatedFeedback.id,
          userId: user.id,
          wishlistItemId: validationResult.data.wishlist_item_id,
          feedbackType: validationResult.data.feedback_type,
        });

        return apiSuccess(updatedFeedback);
      }
    }

    // Create new feedback
    const { data: feedback, error: feedbackError } = await (
      supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.WISHLIST_FEEDBACK) as any
    )
      .insert({
        wishlist_item_id: validationResult.data.wishlist_item_id,
        fulfillment_proof_id: validationResult.data.fulfillment_proof_id,
        user_id: user.id,
        feedback_type: validationResult.data.feedback_type,
        comment: validationResult.data.comment,
      })
      .select()
      .single();

    if (feedbackError) {
      logger.error('Failed to create wishlist feedback', {
        error: feedbackError.message,
        userId: user.id,
        wishlistItemId: validationResult.data.wishlist_item_id,
      });
      return apiInternalError('Failed to create feedback');
    }

    logger.info('Created wishlist feedback successfully', {
      feedbackId: feedback.id,
      userId: user.id,
      wishlistItemId: validationResult.data.wishlist_item_id,
      feedbackType: validationResult.data.feedback_type,
    });

    return apiCreated(feedback);
  } catch (error) {
    logger.error('Error in POST /api/wishlists/feedback:', error);
    return apiInternalError();
  }
});
