/**
 * POST /api/solon/events — inbound webhook from Solon.
 *
 * Doorbell, not courier: the HMAC-verified payload only tells us WHICH
 * decision finalized. Nothing in it is acted on directly — decision-verify
 * fetches the decision document itself and re-verifies every signature
 * against the pinned trusted keys before anything activates. A forged or
 * replayed webhook can therefore at worst trigger a verification that fails.
 *
 * Env-gated: inert (503) until SOLON_WEBHOOK_SECRET is set. Missed deliveries
 * are healed by the daily /api/cron/solon-sync reconciliation.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAndApplyDecision } from '@/services/solon/decision-verify';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.SOLON_WEBHOOK_SECRET;
  if (!secret) {
    return apiError('Solon webhook not configured', 'SERVICE_UNAVAILABLE', 503);
  }

  const body = await request.text();
  const signature = request.headers.get('x-solon-signature') ?? '';
  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    logger.warn('Solon webhook signature rejected', {}, 'Solon');
    return apiUnauthorized();
  }

  let event: { event?: string; decision_id?: string };
  try {
    event = JSON.parse(body);
  } catch {
    return apiError('Invalid JSON body', 'BAD_REQUEST', 400);
  }

  if (event.event !== 'decision.finalized' || !event.decision_id) {
    // Unknown events are acknowledged, not errored — Solon may grow new ones.
    return apiSuccess({ ignored: true });
  }

  const result = await verifyAndApplyDecision(createAdminClient(), event.decision_id);
  logger.info(
    'Solon decision.finalized processed',
    { decisionId: event.decision_id, ...result },
    'Solon'
  );
  return apiSuccess(result);
}
