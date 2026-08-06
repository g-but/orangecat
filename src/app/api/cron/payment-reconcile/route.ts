/**
 * GET /api/cron/payment-reconcile — thin cron wrapper.
 *
 * Runs every reconciliation sweep OrangeCat has: money OUT to recipients
 * (payment_intents) and money IN to the treasury (cat_credit_topups). Both
 * answer the same question — "did a payment land that nobody's browser was
 * watching?" — so they share one tick rather than needing a second systemd
 * timer that a deploy would never install. Sweep logic lives in the services;
 * see each file's header for why the backstop exists.
 *
 * The two are independent: one rail being unreachable must not stop the other
 * from reconciling, so neither failure aborts the request. Only a total failure
 * is a 500.
 */

import { verifyCronSecret } from '@/lib/api/cronAuth';
import { apiSuccess, apiUnauthorized, apiInternalError } from '@/lib/api/standardResponse';
import { runPaymentReconcileSweep } from '@/services/payments/reconcile';
import { runTopUpReconcileSweep } from '@/services/cat/topup-reconcile';
import { logger } from '@/utils/logger';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return apiUnauthorized();
  }

  const payments = await runPaymentReconcileSweep().catch(error => {
    logger.error('Payment reconciliation sweep failed', { error }, 'PaymentSweep');
    return null;
  });
  const credits = await runTopUpReconcileSweep().catch(error => {
    logger.error('Top-up reconciliation sweep failed', { error }, 'CatCreditsSweep');
    return null;
  });

  if (!payments && !credits) {
    return apiInternalError('Reconciliation sweep failed');
  }
  return apiSuccess({ ...(payments ?? {}), payments, credits });
}
