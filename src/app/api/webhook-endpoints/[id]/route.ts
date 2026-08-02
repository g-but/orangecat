/**
 * DELETE /api/webhook-endpoints/[id] — revoke (soft-delete; audit kept).
 *
 * Auth: Supabase session only. Returns 404 when the endpoint doesn't
 * belong to the caller or is already revoked, to avoid leaking endpoint
 * existence to other users via probing.
 *
 * Mirrors src/app/api/integration-keys/[id]/route.ts.
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { revokeWebhookEndpoint } from '@/services/webhooks/webhookEndpointsService';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params;
    const ok = await revokeWebhookEndpoint(id, user.id);
    if (!ok) {
      return apiNotFound('Webhook endpoint');
    }
    return apiSuccess({ revoked: true });
  } catch (error) {
    return handleApiError(error);
  }
}
