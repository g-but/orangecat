import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiSuccess } from '@/lib/api/standardResponse';
import { getUsableModels } from '@/services/cat/model-access';

/**
 * GET /api/user/available-models
 *
 * The picker's SSOT: the models this authenticated user can actually use right
 * now (derived from free pool + verified BYOK keys + Cat Credits balance), plus
 * the locked ones surfaced as honest "connect to unlock" CTAs. No fake list.
 */
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const access = await getUsableModels(request.supabase, request.user.id);
  return apiSuccess(access);
});
