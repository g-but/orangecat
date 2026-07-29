/**
 * Cat Memory API
 *
 * GET    /api/cat/memories          - List what Cat remembers about you
 * DELETE /api/cat/memories?id=<id>  - Forget one memory
 * DELETE /api/cat/memories?all=true - Forget everything
 *
 * Memory is private and RLS-scoped; these endpoints let users see and control
 * exactly what Cat has learned (privacy-first, ChatGPT-style memory controls).
 */

import { listMemoriesResult, deleteMemory, deleteAllMemories } from '@/services/cat/memory';
import { apiSuccess, apiError, apiRateLimited, handleApiError } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const result = await listMemoriesResult(supabase, user.id);
    if (!result.ok) {
      return apiError(
        'Could not load memories right now. Please try again.',
        'INTERNAL_ERROR',
        500
      );
    }
    return apiSuccess({ memories: result.memories });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;

  const rl = await rateLimitWriteAsync(user.id);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all') === 'true';

  try {
    if (all) {
      const ok = await deleteAllMemories(supabase, user.id);
      return ok
        ? apiSuccess({ success: true })
        : apiError('Failed to clear memories', 'INTERNAL_ERROR', 500);
    }
    if (id) {
      const ok = await deleteMemory(supabase, user.id, id);
      return ok
        ? apiSuccess({ success: true })
        : apiError('Failed to delete memory', 'INTERNAL_ERROR', 500);
    }
    return apiError('Provide ?id=<id> or ?all=true', 'BAD_REQUEST', 400);
  } catch (error) {
    return handleApiError(error);
  }
});
