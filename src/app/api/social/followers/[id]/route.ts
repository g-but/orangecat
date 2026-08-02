/**
 * GET /api/social/followers/[id] — people following the given user.
 * Implementation shared with /api/social/following via createFollowListRoute.
 */
import { createFollowListRoute } from '@/lib/api/followListRoute';

export const GET = createFollowListRoute('followers');
