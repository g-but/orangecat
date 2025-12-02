import { NextResponse } from 'next/server';
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
import { rateLimitSocial } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { auditSuccess, AUDIT_ACTIONS } from '@/lib/api/auditLog';

async function handleFollow(request: AuthenticatedRequest) {
  try {
    const supabase = await createServerClient();
    const user = request.user;

    // Rate limiting check - 10 follows per minute
    const rateLimitResult = rateLimitSocial(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      logger.warn('Follow rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many follow requests. Please slow down.', retryAfter);
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
      .from('profiles')
      .select('id')
      .eq('id', following_id)
      .single();

    if (userError || !targetUser) {
      return apiNotFound('User not found');
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single();

    if (existingFollow) {
      return apiConflict('Already following this user');
    }

    // Create follow relationship
    const { error: followError } = await supabase.from('follows').insert({
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

    return apiSuccess({ following_id }, { status: 201 });
  } catch (error) {
    logger.error('Unexpected error in POST /api/social/follow', { error });
    return apiInternalError('Internal server error');
  }
}

export const POST = withAuth(handleFollow);
