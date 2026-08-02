/**
 * Lifecycle of an UNDETECTABLE payment intent (bare Lightning address, no
 * LUD-21 verify URL) around expiry.
 *
 * Expiry bounds when a payment can be MADE, not when it can be REPORTED. The
 * buyer's "I've paid" claim is testimony about a payment that happened before
 * the invoice died — the recipient confirms or declines it — so the claim
 * window stays open for a grace period after expiry. Terminalizing at the
 * exact deadline (which the payer's own status poll used to do) slammed that
 * window shut on the most common case: page still open when the clock ran out.
 */

import { reconcilePaymentIntent } from '@/domain/payments/paymentFlowService';
import { BUYER_CLAIM_GRACE_MS } from '@/domain/payments/intentExpiry';
import { STATUS } from '@/config/database-constants';
import type { PaymentIntent } from '@/domain/payments/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase/admin';
const getAdminClientMock = getAdminClient as jest.Mock;

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/lib/email/send-seller-notification', () => ({
  sendSellerPaymentNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/notifications/dispatcher', () => ({
  NotificationDispatcher: { dispatch: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('@/domain/payments/paymentStatusService', () => ({
  checkNWCPaymentStatus: jest.fn(),
  checkOnchainPaymentStatus: jest.fn(),
  checkLnurlVerifyPaymentStatus: jest.fn(),
}));
jest.mock('@/lib/supabase/admin', () => ({ getAdminClient: jest.fn() }));

const updates: Array<Record<string, unknown>> = [];

function makeSupabase(): SupabaseClient {
  const builder: Record<string, unknown> = {};
  builder.update = jest.fn((patch: Record<string, unknown>) => {
    updates.push(patch);
    return builder;
  });
  builder.eq = jest.fn(() => Promise.resolve({ error: null }));
  const client = { from: jest.fn(() => builder) } as unknown as SupabaseClient;
  getAdminClientMock.mockReturnValue(client);
  return client;
}

function bareLightningIntent(expiresAt: string): PaymentIntent {
  return {
    id: 'pi-bare',
    status: STATUS.PAYMENT_INTENTS.INVOICE_READY,
    payment_method: 'lightning_address',
    lnurl_verify_url: null,
    payment_hash: null,
    onchain_address: null,
    paid_at: null,
    expires_at: expiresAt,
  } as unknown as PaymentIntent;
}

beforeEach(() => {
  jest.clearAllMocks();
  updates.length = 0;
});

describe('undetectable intent around expiry', () => {
  it('stays OPEN after invoice expiry while the claim window runs — the payer can still say "I paid"', async () => {
    const expiredAnHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const res = await reconcilePaymentIntent(makeSupabase(), bareLightningIntent(expiredAnHourAgo));

    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.INVOICE_READY);
    expect(updates).toHaveLength(0);
  });

  it('terminalizes honestly once the invoice is dead AND the claim window has closed', async () => {
    const longDead = new Date(Date.now() - BUYER_CLAIM_GRACE_MS - 3_600_000).toISOString();
    const res = await reconcilePaymentIntent(makeSupabase(), bareLightningIntent(longDead));

    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.EXPIRED);
    expect(updates.some(u => u.status === STATUS.PAYMENT_INTENTS.EXPIRED)).toBe(true);
  });

  it('never asks any rail about an undetectable intent — there is nothing to ask', async () => {
    const statusService = jest.requireMock('@/domain/payments/paymentStatusService');
    await reconcilePaymentIntent(
      makeSupabase(),
      bareLightningIntent(new Date(Date.now() + 600_000).toISOString())
    );

    expect(statusService.checkNWCPaymentStatus).not.toHaveBeenCalled();
    expect(statusService.checkLnurlVerifyPaymentStatus).not.toHaveBeenCalled();
    expect(statusService.checkOnchainPaymentStatus).not.toHaveBeenCalled();
  });
});
