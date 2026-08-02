/**
 * POST /api/webhook-endpoints/[id]/deliveries/[deliveryId]/replay
 *
 * Operator-only manual replay of a single delivery. The /api/cron/
 * webhook-worker handles automatic retries with exp-backoff; this
 * route is for when an operator looks at a failed delivery in the
 * /settings/integrations drawer and wants to nudge it through after
 * fixing the receiver.
 *
 * Auth: Supabase session only (an integration key shouldn't be able
 * to influence its own delivery queue — same escalation argument as
 * elsewhere). Returns 404 on endpoint OR delivery mismatch to avoid
 * leaking either ID space to probers.
 *
 * Effect: resets attempt_count to 0, status to 'pending',
 * next_attempt_at to now. The worker picks it up on the next minute.
 *
 * Created: 2026-06-04
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { userOwnsEndpoint } from '@/services/webhooks/webhookEndpointsService';
import {
  deliveryBelongsToEndpoint,
  enqueueDeliveryReplay,
} from '@/services/webhooks/deliveryService';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; deliveryId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return apiUnauthorized();
    }

    const rl = await rateLimitWriteAsync(user.id);
    if (!rl.success) {
      return apiRateLimited('Too many requests. Please slow down.', retryAfterSeconds(rl));
    }

    const { id: endpointId, deliveryId } = await params;

    const owns = await userOwnsEndpoint(endpointId, user.id);
    if (!owns) {
      return apiNotFound('Webhook endpoint');
    }

    const belongs = await deliveryBelongsToEndpoint(deliveryId, endpointId);
    if (!belongs) {
      // Same 404 envelope so probers can't tell endpoint-mismatch from
      // delivery-mismatch from never-existed.
      return apiNotFound('Webhook delivery');
    }

    const replayed = await enqueueDeliveryReplay(deliveryId);
    if (!replayed) {
      return apiError('Replay failed', 'INTERNAL_ERROR', 500);
    }

    return apiSuccess({ replayed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
