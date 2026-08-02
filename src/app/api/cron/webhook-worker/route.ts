/**
 * GET /api/cron/webhook-worker — thin cron wrapper.
 *
 * All delivery logic lives in src/services/webhooks/worker.ts (see its header
 * for the claim/sign/POST/retry contract). This route only: verifies the cron
 * secret, runs one batch, and shapes the HTTP response.
 */

import { logger } from '@/utils/logger';
import { apiSuccess, apiError, apiUnauthorized } from '@/lib/api/standardResponse';
import { verifyCronSecret } from '@/lib/api/cronAuth';
import { runWebhookWorkerBatch, LOG_SOURCE } from '@/services/webhooks/worker';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiUnauthorized();
  }

  try {
    const result = await runWebhookWorkerBatch();
    return apiSuccess(result);
  } catch (error) {
    logger.error(
      'Webhook worker failed',
      { error: error instanceof Error ? error.message : error },
      LOG_SOURCE
    );
    return apiError('Internal error', 'INTERNAL_ERROR', 500);
  }
}
