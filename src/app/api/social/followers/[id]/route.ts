import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate user ID
    const idValidation = getValidationError(validateUUID(id, 'user ID'));
    if (idValidation) {
      return idValidation;
    }

    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get followers with profile data
    // First get the follow relationships
    const {
      data: follows,
      error: followsError,
      count,
    } = await supabase
      .from('follows')
      .select('follower_id, created_at', { count: 'exact' })
      .eq('following_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (followsError) {
      logger.error('Failed to fetch follows', { userId: id, error: followsError.message });
      return apiInternalError('Failed to fetch followers');
    }

    // Then fetch profiles for each follower_id
    const followerIds = (follows || []).map(f => f.follower_id);
    let followers: any[] = [];

    if (followerIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, name, avatar_url, bio, bitcoin_address, lightning_address')
        .in('id', followerIds);

      if (profilesError) {
        logger.error('Failed to fetch follower profiles', {
          userId: id,
          followerCount: followerIds.length,
          error: profilesError.message,
        });
        return apiInternalError('Failed to fetch follower profiles');
      }

      // Combine follows with profiles
      followers = (follows || []).map(follow => {
        const profile = profiles?.find(p => p.id === follow.follower_id);
        return {
          follower_id: follow.follower_id,
          created_at: follow.created_at,
          profiles: profile || null,
        };
      });
    }

    logger.info('Fetched followers successfully', {
      userId: id,
      count: followers.length,
      total: count || 0,
    });

    return apiSuccess(
      {
        data: followers || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
        },
      },
      { cache: 'SHORT' }
    );
  } catch (error) {
    logger.error('Unexpected error fetching followers', { error });
    return apiInternalError('Internal server error');
  }
}
