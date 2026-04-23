import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { logger } from '@/utils/logger';
import { apiSuccess, apiInternalError, apiRateLimited } from '@/lib/api/standardResponse';
import {  applyRateLimitHeaders, rateLimitSocialAsync , retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { DATABASE_TABLES } from '@/config/database-tables';

async function handleUnfollow(request: AuthenticatedRequest) {
  try {
    const { supabase, user } = request;

    // Rate limiting check - 10 unfollows per minute
    const rateLimitResult = await rateLimitSocialAsync(user.id);
    if (!rateLimitResult.success) { return apiRateLimited('Too many unfollow requests. Please slow down.', retryAfterSeconds(rateLimitResult)); }

    const { following_id } = await request.json();

    // Validate input using centralized validator
    const validationError = getValidationError(validateUUID(following_id, 'following_id'));
    if (validationError) {
      return validationError;
    }

    // Delete follow relationship
    const { error } = await supabase
      .from(DATABASE_TABLES.FOLLOWS)
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', following_id);

    if (error) {
      logger.error('Error deleting follow', {
        userId: user.id,
        followingId: following_id,
        error: error.message,
      });
      return apiInternalError('Failed to unfollow user');
    }

    // Audit log unfollow action
    await auditSuccess(AUDIT_ACTIONS.USER_UNFOLLOWED, user.id, 'profile', following_id);

    logger.info('User unfollowed successfully', {
      userId: user.id,
      followingId: following_id,
    });

    return applyRateLimitHeaders(apiSuccess({ following_id }), rateLimitResult);
  } catch (error) {
    logger.error('Unexpected error in POST /api/social/unfollow', { error });
    return apiInternalError('Internal server error');
  }
}

export const POST = withAuth(handleUnfollow);
