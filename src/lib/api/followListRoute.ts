/**
 * Follow-List Route Factory
 *
 * Shared GET handler for /api/social/followers/[id] and
 * /api/social/following/[id] — the two routes are identical except for
 * which side of the follows edge is selected and filtered.
 *
 * Created: 2026-08-02
 * Last Modified: 2026-08-02
 * Last Modified Summary: Extracted from duplicated followers/following routes (jscpd dedup)
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';
import { DATABASE_TABLES } from '@/config/database-tables';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/constants/pagination';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const PROFILE_COLUMNS = 'id, username, name, avatar_url, bio, bitcoin_address, lightning_address';

/** Per-direction differences between the two follow-list routes. */
const FOLLOW_LIST_CONFIG = {
  followers: {
    // People following [id]: select the follower side, filter by following_id.
    select: `follower_id, created_at, profile:profiles!follows_follower_id_fkey(${PROFILE_COLUMNS})`,
    filterColumn: 'following_id',
    label: 'followers',
  },
  following: {
    // People [id] follows: select the following side, filter by follower_id.
    select: `following_id, created_at, profile:profiles!follows_following_id_fkey(${PROFILE_COLUMNS})`,
    filterColumn: 'follower_id',
    label: 'following',
  },
} as const;

export type FollowListDirection = keyof typeof FOLLOW_LIST_CONFIG;

/**
 * Build the GET handler for a follow-list route.
 * Response shape and error messages are identical to the pre-factory routes.
 */
export function createFollowListRoute(direction: FollowListDirection) {
  const config = FOLLOW_LIST_CONFIG[direction];

  return withOptionalAuth(async (request, context: RouteContext) => {
    try {
      const { id } = await context.params;

      const idValidation = getValidationError(validateUUID(id, 'user ID'));
      if (idValidation) {
        return idValidation;
      }

      const { supabase } = request;
      const { searchParams } = new URL((request as NextRequest).url);
      const limit = Math.min(
        parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_SIZE)),
        MAX_PAGE_SIZE
      );
      const offset = parseInt(searchParams.get('offset') || '0');

      const { data, error, count } = await supabase
        .from(DATABASE_TABLES.FOLLOWS)
        .select(config.select, { count: 'exact' })
        .eq(config.filterColumn, id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error(`Failed to fetch ${config.label}`, { userId: id, error: error.message });
        return apiInternalError(`Failed to fetch ${config.label}`);
      }

      return apiSuccess(
        { data: data || [], pagination: { limit, offset, total: count || 0 } },
        { cache: 'SHORT' }
      );
    } catch (error) {
      logger.error(`Unexpected error fetching ${config.label}`, { error });
      return apiInternalError('Internal server error');
    }
  });
}
