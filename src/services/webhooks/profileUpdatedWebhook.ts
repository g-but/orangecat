/**
 * profile.updated webhook fan-out.
 *
 * The invalidation signal that makes it safe for a client to CACHE an identity
 * it resolved from /api/v1/profiles. Without it a client has exactly two bad
 * options: re-resolve every actor on every render, or cache with no way to
 * learn the copy went stale — and stale is now the expected state, because a
 * handle can be retired without breaking what points at it, so handles change.
 *
 * The payload is the same public-profile shape /api/v1/profiles returns, so a
 * subscriber can overwrite its cached row directly instead of making a second
 * round trip just to learn what changed.
 *
 * Fire-and-forget: never throws, never blocks the save. The user's PERSONAL
 * actor is the fan-out target, matching paymentSettledWebhook.
 */
import { getAdminClient } from '@/lib/supabase/admin';
import { enqueueWebhookEvent } from '@/services/webhooks/deliveryService';
import { resolvePublicProfile } from '@/services/platform/publicProfiles';
import { logger } from '@/utils/logger';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/** Must match the identity event advertised in PUBLIC_API_WEBHOOK_EVENTS. */
export const PROFILE_UPDATED_EVENT = 'profile.updated' as const;

export async function enqueueProfileUpdatedWebhook(userId: string): Promise<number> {
  try {
    const admin = getAdminClient() as unknown as AnySupabaseClient;
    // Resolve through the same path the public endpoint uses, so a subscriber
    // can never receive a field the endpoint would not have served — including
    // the owner's hidden-field choices, which apply here too.
    const profile = await resolvePublicProfile(admin, userId);
    if (!profile) {
      return 0;
    }
    return await enqueueWebhookEvent({
      actorId: profile.actor_id,
      eventType: PROFILE_UPDATED_EVENT,
      payload: { type: PROFILE_UPDATED_EVENT, profile },
    });
  } catch (err) {
    logger.error('[profile-updated-webhook] enqueue failed (non-fatal)', {
      userId,
      error: (err as Error).message,
    });
    return 0;
  }
}
