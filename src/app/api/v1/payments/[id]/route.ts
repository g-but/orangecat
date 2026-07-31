/**
 * GET /api/v1/payments/{id} — Payment status (machine-payable contract)
 *
 * The verify half of the agent loop: poll until `status` is `paid` (auto
 * settlement detection via NWC lookup / LNURL verify) or `expired`/`failed`.
 * Only the buyer or seller of the intent can read it.
 *
 * Accepts integration keys (`payments.read` scope) and session auth.
 */

import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  apiSuccess,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiInternalError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { resolveRequestAuth, hasScope } from '@/lib/api/resolveRequestAuth';
import { checkPaymentStatus } from '@/domain/payments';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimitIntegrationKeyRead, retryAfterSeconds } from '@/lib/rate-limit';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { logger } from '@/utils/logger';

const PAYMENTS_READ_SCOPE = 'payments.read';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const idValidation = getValidationError(validateUUID(id, 'payment ID'));
  if (idValidation) {
    return idValidation;
  }

  try {
    const auth = await resolveRequestAuth(request);
    if (!auth) {
      return apiUnauthorized();
    }
    if (!hasScope(auth.scopes, PAYMENTS_READ_SCOPE)) {
      return apiForbidden('This key is not allowed to read payments.');
    }

    // Polling endpoint — per-key read bucket keeps a runaway agent from
    // starving the user's other keys. Session reads are unmetered (parity
    // with the internal status route).
    if (auth.source === 'integration_key' && auth.integrationKeyId) {
      const rl = await rateLimitIntegrationKeyRead(auth.integrationKeyId);
      if (!rl.success) {
        return apiRateLimited('Too many status checks. Please slow down.', retryAfterSeconds(rl));
      }
    }

    // checkPaymentStatus enforces buyer/seller access itself, so the
    // service-role client is safe for sessionless callers.
    const supabase =
      auth.source === 'session'
        ? ((await createServerClient()) as unknown as SupabaseClient)
        : (createAdminClient() as unknown as SupabaseClient);

    const result = await checkPaymentStatus(supabase, id, auth.userId);
    return apiSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Status check failed';
    logger.error('v1 payment status check failed', { error });

    if (message.includes('not found')) {
      return apiNotFound('Payment not found');
    }
    if (message.includes('Access denied')) {
      return apiForbidden('Access denied');
    }
    return apiInternalError('Failed to check payment status');
  }
}
