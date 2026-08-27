/**
 * GET /api/v1/profiles?actor_ids=…&handles=… — batch identity resolver.
 *
 * The counterpart to every v1 surface that hands back an `actor_id`:
 * stakeholder edges, entity ownership, settled payments, timeline events. A
 * client renders a page of those with ONE call here, not one call per row.
 *
 * Public, like /api/v1/search and /api/v1/demand: it returns exactly what an
 * anonymous visitor already reads off the rendered profile page, so gating it
 * behind a scope would be theatre — and a scope on public data is the kind of
 * friction that gets worked around with a scraper instead.
 */
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiSuccess, apiError, apiRateLimited } from '@/lib/api/standardResponse';
import { rateLimit, retryAfterSeconds } from '@/lib/rate-limit';
import { PUBLIC_PROFILE_MAX_BATCH, parseBatchParam } from '@/config/public-profile';
import { resolvePublicProfiles, isUuid } from '@/services/platform/publicProfiles';
import { logger } from '@/utils/logger';

export async function GET(request: NextRequest) {
  const rl = await rateLimit(request);
  if (!rl.success) {
    return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
  }

  const url = new URL(request.url);
  const actorIds = parseBatchParam(url.searchParams.get('actor_ids'));
  const handles = parseBatchParam(url.searchParams.get('handles'));

  // The ceiling is on the request, not on each parameter — otherwise two
  // parameters buy twice the batch, and the documented limit is a fiction.
  if (
    actorIds === null ||
    handles === null ||
    actorIds.length + handles.length > PUBLIC_PROFILE_MAX_BATCH
  ) {
    return apiError(
      `At most ${PUBLIC_PROFILE_MAX_BATCH} references per request`,
      'VALIDATION_ERROR',
      422
    );
  }
  if (actorIds.length === 0 && handles.length === 0) {
    return apiError('Provide actor_ids and/or handles (comma-separated)', 'BAD_REQUEST', 400);
  }

  // Rejected rather than silently dropped: a typo'd id that resolves to
  // "not found" sends the caller looking for a deleted account. Counted, not
  // echoed — reflecting caller-supplied strings back is a habit worth not
  // having, and the caller already knows what it sent.
  const malformed = actorIds.filter(id => !isUuid(id)).length;
  if (malformed > 0) {
    return apiError(
      `${malformed} of ${actorIds.length} actor_ids are not UUIDs`,
      'VALIDATION_ERROR',
      422
    );
  }

  try {
    const profiles = await resolvePublicProfiles(createAdminClient(), { actorIds, handles });
    // Unresolved references are absent rather than an error: one deleted
    // account must not blank out a whole stakeholder graph. `requested` lets a
    // caller tell "not found" from "I asked for the wrong thing".
    return apiSuccess({
      profiles,
      requested: { actor_ids: actorIds.length, handles: handles.length },
    });
  } catch (err) {
    logger.error('GET /api/v1/profiles failed', { err }, 'PublicProfilesV1');
    return apiError('Profile lookup failed', 'INTERNAL_ERROR', 500);
  }
}
