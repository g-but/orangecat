/**
 * GET /api/payments/can-receive?profile_id=X — public: can this user be paid?
 *
 * Answered by the SAME wallet resolution the payment flow runs — never by
 * inspecting wallet rows from the client (wallet rows are owner-readable
 * only). The answer is a single boolean; no wallet details leave the server.
 * Anonymous access is allowed (payment buttons render on public pages),
 * rate-limited per IP.
 */

import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { rateLimit, createRateLimitResponse } from '@/lib/rate-limit';
import { apiBadRequest, apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { getAdminClient } from '@/lib/supabase/admin';
import { resolveUserWallet } from '@/domain/payments/walletResolutionService';
import { logger } from '@/utils/logger';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const rl = await rateLimit(request);
    if (!rl.success) {
      return createRateLimitResponse(rl);
    }

    const profileId = request.nextUrl.searchParams.get('profile_id');
    if (!profileId || !UUID_REGEX.test(profileId)) {
      return apiBadRequest('profile_id must be a valid UUID');
    }

    const admin = getAdminClient() as unknown as SupabaseClient;
    const wallet = await resolveUserWallet(admin, profileId).catch(() => null);

    return apiSuccess({ canReceive: !!wallet }, { cache: 'SHORT' });
  } catch (error) {
    logger.error('can-receive check failed', { error }, 'Payments');
    return apiInternalError('Could not check payment capability.');
  }
}
