/**
 * Webhook delivery worker.
 *
 * Schedule: systemd timer `orangecat-webhook-worker.timer` on bitbaum,
 * every minute (installed 2026-06-13).
 *
 * For each due delivery row:
 *   1. Optimistically claim (atomic UPDATE WHERE attempt_count = expected)
 *   2. Fetch the endpoint's signing context (url + plaintext secret)
 *   3. POST the JSON payload with X-OrangeCat-Signature + X-OrangeCat-Event-Id
 *   4. 2xx → markDelivered; non-2xx / error → markFailedOrRetry (which
 *      either reschedules with exp-backoff or flips to status='failed'
 *      after MAX_ATTEMPTS).
 *
 * Concurrency: two cron invocations can interleave; the optimistic claim
 * (attempt_count match) prevents double-processing. If we lose the race
 * we just skip the row — the winner processes it.
 *
 * Created: 2026-06-03
 */

import { logger } from '@/utils/logger';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/standardResponse';
import { verifyCronSecret } from '@/lib/api/cronAuth';
import {
  pickDueDeliveries,
  claimDelivery,
  markDelivered,
  markFailedOrRetry,
  type DeliveryRow,
} from '@/services/webhooks/deliveryService';
import {
  getEndpointSigningContext,
  touchEndpointLastDelivery,
} from '@/services/webhooks/webhookEndpointsService';
import { signWebhookPayload } from '@/services/webhooks/signing';
import { checkPublicUrl } from '@/lib/security/ssrfGuard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const LOG_SOURCE = 'CronWebhookWorker';
const BATCH_SIZE = 20;
const POST_TIMEOUT_MS = 5_000;

interface DeliveryOutcome {
  deliveryId: string;
  outcome: 'delivered' | 'retry' | 'failed' | 'skipped';
  responseStatus: number | null;
}

async function processDelivery(delivery: DeliveryRow): Promise<DeliveryOutcome> {
  // 1. Claim. If we lose the race, skip — another worker has it.
  const claimed = await claimDelivery(delivery.id, delivery.attempt_count);
  if (!claimed) {
    return { deliveryId: delivery.id, outcome: 'skipped', responseStatus: null };
  }
  const claimedDelivery: DeliveryRow = {
    ...delivery,
    attempt_count: delivery.attempt_count + 1,
  };

  // 2. Fetch the endpoint. Revoked / deleted → mark delivered (drop on
  //    floor; the partial active index excludes revoked rows, so this
  //    only happens if the user revoked between enqueue and fire).
  const ctx = await getEndpointSigningContext(delivery.endpoint_id);
  if (!ctx) {
    await markDelivered(delivery.id, 0, '[endpoint revoked]');
    return { deliveryId: delivery.id, outcome: 'delivered', responseStatus: 0 };
  }

  // 3. SSRF re-check at fire time — mint-time validation alone would miss a
  //    DNS record that later flips to an internal address. Dev skips it so
  //    localhost receivers keep working (mirrors the mint route's policy).
  if (process.env.NODE_ENV === 'production') {
    const urlCheck = await checkPublicUrl(ctx.url);
    if (!urlCheck.ok) {
      await markFailedOrRetry(claimedDelivery, null, `[ssrf-blocked] ${urlCheck.reason}`);
      const outcome = claimedDelivery.attempt_count > 6 ? ('failed' as const) : ('retry' as const);
      return { deliveryId: delivery.id, outcome, responseStatus: null };
    }
  }

  // 4. Sign + POST.
  const rawBody = JSON.stringify(delivery.payload);
  const signature = signWebhookPayload(rawBody, ctx.secret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);

  try {
    const res = await fetch(ctx.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OrangeCat-Signature': signature,
        'X-OrangeCat-Event-Id': delivery.event_id,
        'X-OrangeCat-Event-Type': delivery.event_type,
        'User-Agent': 'OrangeCat-Webhooks/1.0',
      },
      body: rawBody,
      signal: controller.signal,
    });

    const responseText = await res.text().catch(() => '');

    if (res.status >= 200 && res.status < 300) {
      await markDelivered(delivery.id, res.status, responseText);
      void touchEndpointLastDelivery(delivery.endpoint_id);
      return { deliveryId: delivery.id, outcome: 'delivered', responseStatus: res.status };
    }

    await markFailedOrRetry(claimedDelivery, res.status, responseText);
    // Match the boundary used by computeNextAttempt — failure happens
    // when attempt_count is STRICTLY above MAX_ATTEMPTS.
    const outcome = claimedDelivery.attempt_count > 6 ? ('failed' as const) : ('retry' as const);
    return { deliveryId: delivery.id, outcome, responseStatus: res.status };
  } catch (err) {
    // Network error / timeout.
    const reason = err instanceof Error ? err.message : 'unknown';
    await markFailedOrRetry(claimedDelivery, null, `[network] ${reason}`);
    // Match the boundary used by computeNextAttempt — failure happens
    // when attempt_count is STRICTLY above MAX_ATTEMPTS.
    const outcome = claimedDelivery.attempt_count > 6 ? ('failed' as const) : ('retry' as const);
    return { deliveryId: delivery.id, outcome, responseStatus: null };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiUnauthorized();
  }

  try {
    const due = await pickDueDeliveries(BATCH_SIZE);
    if (due.length === 0) {
      return apiSuccess({ processed: 0, ranAt: new Date().toISOString() });
    }

    // Process sequentially within the budget — webhook receivers may be
    // slow, and the timer fires every minute so latency is fine.
    const outcomes: DeliveryOutcome[] = [];
    for (const delivery of due) {
      const outcome = await processDelivery(delivery);
      outcomes.push(outcome);
    }

    const summary = outcomes.reduce(
      (acc, o) => {
        acc[o.outcome] = (acc[o.outcome] ?? 0) + 1;
        return acc;
      },
      { delivered: 0, retry: 0, failed: 0, skipped: 0 } as Record<
        DeliveryOutcome['outcome'],
        number
      >
    );

    logger.info('Webhook worker batch complete', { summary, processed: due.length }, LOG_SOURCE);
    return apiSuccess({
      processed: due.length,
      summary,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error(
      'Webhook worker failed',
      { error: error instanceof Error ? error.message : error },
      LOG_SOURCE
    );
    return apiError('Internal error', 'INTERNAL_ERROR', 500);
  }
}
