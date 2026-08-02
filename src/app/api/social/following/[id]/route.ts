/**
 * GET /api/social/following/[id] — people the given user follows.
 * Implementation shared with /api/social/followers via createFollowListRoute.
 */
import { createFollowListRoute } from '@/lib/api/followListRoute';

export const GET = createFollowListRoute('following');
