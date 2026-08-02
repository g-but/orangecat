/**
 * POST /api/integration-keys/[id]/rotate — mint a fresh secret + revoke
 * the old key in one user-facing action.
 *
 * Auth: Supabase session only (the same escalation argument as mint:
 * an integration key cannot rotate itself or any other key).
 *
 * Returns the new key record + plaintext secret ONCE — identical
 * envelope to POST /api/integration-keys. The caller is expected to
 * atomically swap the env var in their integration; there is no grace
 * period (see the service docstring).
 *
 * Created: 2026-06-04
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiForbidden,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync, retryAfterSeconds } from '@/lib/rate-limit';
import { rotateIntegrationKey, ActorNotPermittedError } from '@/services/auth/integrationKeys';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    try {
      const minted = await rotateIntegrationKey(id, user.id);
      return apiSuccess({ key: minted.key, plaintext: minted.plaintext }, { status: 201 });
    } catch (error) {
      if (error instanceof ActorNotPermittedError) {
        return apiForbidden("You are no longer permitted to act as this key's actor.");
      }
      if (error instanceof Error && error.message === 'Key not found') {
        // 404 not 409 to avoid leaking key existence to probers.
        return apiNotFound('Integration key');
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
