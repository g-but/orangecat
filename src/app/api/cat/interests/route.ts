/**
 * Cat Interests API — the user's PUBLIC discoverability surface.
 *
 * GET    /api/cat/interests              - What you are publicly findable for
 * POST   /api/cat/interests              - Publish a topic  { topic }
 * DELETE /api/cat/interests?topic=<t>    - Stop being findable for it
 *
 * Interests are the one thing the Cat writes that other people can see, so
 * they must be inspectable and revocable outside the chat — a control you can
 * only reach by asking an AI nicely is not a control.
 */

import { listInterests, publishInterest, unpublishInterest } from '@/services/cat/interests';
import { apiSuccess, apiError, apiRateLimited, handleApiError } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    return apiSuccess({ interests: await listInterests(supabase, user.id) });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;

  const rl = await rateLimitWriteAsync(user.id);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }

  try {
    const body = (await request.json()) as { topic?: unknown };
    const topic = typeof body.topic === 'string' ? body.topic : '';
    if (!topic.trim()) {
      return apiError('Provide a topic', 'BAD_REQUEST', 400);
    }
    const result = await publishInterest(supabase, user.id, topic);
    return result.ok
      ? apiSuccess({ topic: result.topic, alreadyPublished: result.alreadyPublished })
      : apiError(result.error, 'BAD_REQUEST', 400);
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

  const topic = new URL(request.url).searchParams.get('topic');
  if (!topic) {
    return apiError('Provide ?topic=<topic>', 'BAD_REQUEST', 400);
  }

  try {
    const result = await unpublishInterest(supabase, user.id, topic);
    return result.ok
      ? apiSuccess({ removed: result.removed })
      : apiError('That interest is not published', 'NOT_FOUND', 404);
  } catch (error) {
    return handleApiError(error);
  }
});
