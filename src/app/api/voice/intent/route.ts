/**
 * POST /api/voice/intent — body: { transcript }
 *
 * Turns what someone just said into where they should land. Returns the entity
 * type and a cleaned description; the client routes to that entity's create
 * path with the description attached, and the existing AI prefill fills the
 * form from there. No new prefill path — this only answers "which form".
 *
 * 200 with `{ intent: null }` is a real answer, not an error: we heard them and
 * could not tell what they wanted to make. The client shows the transcript and
 * asks, which is the honest response to not knowing.
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { apiBadRequest, apiRateLimited, apiSuccess } from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { routeVoiceIntent } from '@/services/voice/intent-router';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  const { user } = request;

  // Every call is an LLM completion — same per-user write budget as the other
  // model-backed endpoints.
  const limit = await rateLimitWriteAsync(user.id);
  if (!limit.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(limit));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiBadRequest('Invalid JSON body');
  }

  const transcript = (body as { transcript?: unknown })?.transcript;
  if (typeof transcript !== 'string' || !transcript.trim()) {
    return apiBadRequest('A transcript is required.');
  }

  try {
    const intent = await routeVoiceIntent(transcript);
    return apiSuccess({ intent }, { cache: 'NONE' });
  } catch (error) {
    // routeVoiceIntent already answers null on its own failures; anything
    // reaching here is unexpected, and "we couldn't tell" is still the right
    // thing to say to the person waiting.
    logger.error('voice/intent failed', { error }, 'VoiceIntent');
    return apiSuccess({ intent: null }, { cache: 'NONE' });
  }
});
