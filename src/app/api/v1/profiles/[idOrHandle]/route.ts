/**
 * GET /api/v1/profiles/{idOrHandle} — resolve one public identity.
 *
 * Accepts whatever a client is actually holding: an `actor_id` (what every
 * cross-product reference carries), a profile or group id, or a handle. Users
 * and groups come back in one shape, so a caller rendering a stakeholder edge
 * never has to know which kind it pointed at.
 *
 * Public for the same reason as the batch route — see ../route.ts.
 */
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError, apiNotFound, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimit, retryAfterSeconds } from '@/lib/rate-limit';
import { resolvePublicProfile } from '@/services/platform/publicProfiles';
import { logger } from '@/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ idOrHandle: string }> }
) {
  const rl = await rateLimit(request);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }

  const { idOrHandle } = await params;
  const value = decodeURIComponent(idOrHandle ?? '').trim();
  if (!value) {
    return apiError('An actor id, profile id, group id, or handle is required', 'BAD_REQUEST', 400);
  }

  try {
    const profile = await resolvePublicProfile(createAdminClient(), value);
    if (!profile) {
      return apiNotFound('Profile not found');
    }
    return apiSuccess({ profile });
  } catch (err) {
    logger.error('GET /api/v1/profiles/[idOrHandle] failed', { err }, 'PublicProfilesV1');
    return apiError('Profile lookup failed', 'INTERNAL_ERROR', 500);
  }
}
