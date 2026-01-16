import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';

// Types for following data
interface FollowRecord {
  following_id: string;
  created_at: string;
}

interface FollowingProfile {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  bitcoin_address: string | null;
  lightning_address: string | null;
}

interface FollowingWithProfile {
  following_id: string;
  created_at: string;
  profiles: FollowingProfile | null;
}

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

    // Get following with profile data
    // First get the follow relationships
    const {
      data: follows,
      error: followsError,
      count,
    } = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from(DATABASE_TABLES.FOLLOWS) as any)
      .select('following_id, created_at', { count: 'exact' })
      .eq('follower_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1) as { data: FollowRecord[] | null; error: { message: string } | null; count: number | null };

    if (followsError) {
      logger.error('Failed to fetch follows', { userId: id, error: followsError.message });
      return apiInternalError('Failed to fetch following');
    }

    // Then fetch profiles for each following_id
    const followingIds = (follows || []).map((f) => f.following_id);
    let following: FollowingWithProfile[] = [];

    if (followingIds.length > 0) {
      const { data: profiles, error: profilesError } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from(DATABASE_TABLES.PROFILES) as any)
        .select('id, username, name, avatar_url, bio, bitcoin_address, lightning_address')
        .in('id', followingIds) as { data: FollowingProfile[] | null; error: { message: string } | null };

      if (profilesError) {
        logger.error('Failed to fetch following profiles', {
          userId: id,
          followingCount: followingIds.length,
          error: profilesError.message,
        });
        return apiInternalError('Failed to fetch following profiles');
      }

      // Combine follows with profiles
      following = (follows || []).map((follow) => {
        const profile = profiles?.find((p) => p.id === follow.following_id);
        return {
          following_id: follow.following_id,
          created_at: follow.created_at,
          profiles: profile || null,
        };
      });
    }

    logger.info('Fetched following successfully', {
      userId: id,
      count: following.length,
      total: count || 0,
    });

    return apiSuccess(
      {
        data: following || [],
        pagination: {
          limit,
          offset,
          total: count || 0,
        },
      },
      { cache: 'SHORT' }
    );
  } catch (error) {
    logger.error('Unexpected error fetching following', { error });
    return apiInternalError('Internal server error');
  }
}
