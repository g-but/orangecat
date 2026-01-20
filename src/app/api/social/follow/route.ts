import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/utils/logger';
import {
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiInternalError,
  apiConflict,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { applyRateLimitHeaders, type RateLimitResult } from '@/lib/rate-limit';
import { enforceUserSocialLimit, RateLimitError } from '@/lib/api/rateLimiting';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';
import { DATABASE_TABLES } from '@/config/database-tables';

async function handleFollow(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient();
    const user = request.user;

    // Rate limiting check - 10 follows per minute
    let rateLimitResult: RateLimitResult;
    try {
      rateLimitResult = await enforceUserSocialLimit(user.id);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const retryAfter = e.details?.retryAfter || 60;
        logger.warn('Follow rate limit exceeded', { userId: user.id });
        return apiRateLimited('Too many follow requests. Please slow down.', retryAfter);
      }
      throw e;
    }

    const { following_id } = await request.json();

    // Validate input using centralized validator
    const validationError = getValidationError(validateUUID(following_id, 'following_id'));
    if (validationError) {
      return validationError;
    }

    // Prevent self-following
    if (user.id === following_id) {
      return apiBadRequest('Cannot follow yourself');
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('id')
      .eq('id', following_id)
      .single();

    if (userError || !targetUser) {
      return apiNotFound('User not found');
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from(DATABASE_TABLES.FOLLOWS)
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single();

    if (existingFollow) {
      return apiConflict('Already following this user');
    }

    // Create follow relationship
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: followError } = await (supabase.from(DATABASE_TABLES.FOLLOWS) as any).insert({
      follower_id: user.id,
      following_id: following_id,
    });

    if (followError) {
      logger.error('Error creating follow', {
        userId: user.id,
        followingId: following_id,
        error: followError.message,
      });
      return apiInternalError('Failed to follow user');
    }

    // Audit log follow action
    await auditSuccess(AUDIT_ACTIONS.USER_FOLLOWED, user.id, 'profile', following_id);

    logger.info('User followed successfully', {
      userId: user.id,
      followingId: following_id,
    });

    return applyRateLimitHeaders(apiSuccess({ following_id }, { status: 201 }), rateLimitResult);
  } catch (error) {
    logger.error('Unexpected error in POST /api/social/follow', { error });
    return apiInternalError('Internal server error');
  }
}

export const POST = withAuth(handleFollow);
