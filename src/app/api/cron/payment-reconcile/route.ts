/**
 * GET /api/cron/payment-reconcile — thin cron wrapper.
 *
 * All sweep logic lives in src/services/payments/reconcile.ts (see its header
 * for why this backstop exists). This route only: verifies the cron secret,
 * runs the sweep, and shapes the HTTP response.
 */

import { verifyCronSecret } from '@/lib/api/cronAuth';
import { apiSuccess, apiUnauthorized, apiInternalError } from '@/lib/api/standardResponse';
import { runPaymentReconcileSweep } from '@/services/payments/reconcile';
import { logger } from '@/utils/logger';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiUnauthorized();
  }

  try {
    const result = await runPaymentReconcileSweep();
    return apiSuccess(result);
  } catch (error) {
    logger.error('Payment reconciliation sweep failed', { error }, 'PaymentSweep');
    return apiInternalError('Reconciliation sweep failed');
  }
}
