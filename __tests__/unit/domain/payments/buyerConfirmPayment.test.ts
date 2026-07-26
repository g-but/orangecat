/**
 * buyerConfirmPayment — state-transition correctness + trust-boundary guard.
 *
 * A buyer acknowledging an unverifiable payment flips only the intent to
 * BUYER_CONFIRMED. It must not mark money or an order paid: the recipient
 * still has to verify their wallet. A swallowed DB error used to let this
 * return success while the intent stayed stale; these tests lock in that
 * failures surface instead of silently diverging money state from reality.
 *
 * They also lock the trust boundary: manual self-attestation is refused on any
 * rail we confirm automatically (NWC, verify-capable Lightning addresses,
 * on-chain). Only a bare Lightning address with no LUD-21 verify URL may be
 * self-attested — the buyer's word must never flip an order to paid over a
 * trustworthy on-rail signal.
 */

import {
  buyerConfirmPayment,
  sellerConfirmPayment,
} from '@/domain/payments/paymentFlowService';
import { STATUS } from '@/config/database-constants';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
// Break the resend/email import chain (ESM-only, not transformed by jest).
jest.mock('@/lib/email/send-seller-notification', () => ({
  sendSellerPaymentNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/notifications/dispatcher', () => ({
  NotificationDispatcher: { dispatch: jest.fn().mockResolvedValue(undefined) },
}));

const PI_ID = 'pi-1';
const BUYER = 'buyer-1';

/**
 * Supabase stub for buyerConfirmPayment's two operations, in call order:
 *  1. from(PAYMENT_INTENTS).select().eq().eq().single()  -> the intent row
 *  2. from(PAYMENT_INTENTS).update().eq()                -> status flip (awaited)
 */
function makeSupabase(opts: {
  intent: Record<string, unknown> | null;
  statusUpdateError?: unknown;
}) {
  const awaitQueue: Array<{ error: unknown }> = [{ error: opts.statusUpdateError ?? null }];

  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'update', 'eq', 'in']) {
    builder[m] = jest.fn(() => builder);
  }
  builder.single = jest.fn(() => Promise.resolve({ data: opts.intent, error: null }));
  builder.maybeSingle = jest.fn(() => Promise.resolve({ data: opts.intent, error: null }));
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(awaitQueue.shift() ?? { error: null }).then(resolve, reject);

  return { from: jest.fn(() => builder) } as never;
}

const fixedPriceIntent = {
  id: PI_ID,
  status: STATUS.PAYMENT_INTENTS.INVOICE_READY,
  entity_type: 'product',
  paid_at: null,
  // A bare Lightning address (no LUD-21 verify URL) is the ONLY rail eligible for
  // manual confirmation; every other method is auto-detected and now refused.
  payment_method: 'lightning_address',
  lnurl_verify_url: null,
};

describe('buyerConfirmPayment', () => {
  it('throws when the payment intent is not found', async () => {
    const supabase = makeSupabase({ intent: null });
    await expect(buyerConfirmPayment(supabase, PI_ID, BUYER)).rejects.toThrow('Payment not found');
  });

  it('is idempotent when already paid', async () => {
    const supabase = makeSupabase({
      intent: { ...fixedPriceIntent, status: STATUS.PAYMENT_INTENTS.PAID, paid_at: 'ts' },
    });
    const res = await buyerConfirmPayment(supabase, PI_ID, BUYER);
    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
  });

  it('confirms and returns BUYER_CONFIRMED on success', async () => {
    const supabase = makeSupabase({ intent: fixedPriceIntent });
    const res = await buyerConfirmPayment(supabase, PI_ID, BUYER);
    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED);
  });

  it('surfaces a failed intent status update instead of reporting success', async () => {
    const supabase = makeSupabase({
      intent: fixedPriceIntent,
      statusUpdateError: { message: 'db down' },
    });
    await expect(buyerConfirmPayment(supabase, PI_ID, BUYER)).rejects.toThrow(
      'Failed to update payment status'
    );
  });

  it('does not finalize an order before the recipient confirms receipt', async () => {
    const supabase = makeSupabase({ intent: fixedPriceIntent });
    const res = await buyerConfirmPayment(supabase, PI_ID, BUYER);
    expect(res).toEqual({
      status: STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
      paid_at: null,
    });
  });

  it.each([
    ['NWC', { payment_method: 'nwc', payment_hash: 'h' }],
    ['on-chain', { payment_method: 'onchain', onchain_address: 'bc1qxyz' }],
    [
      'a verify-capable Lightning address',
      { payment_method: 'lightning_address', lnurl_verify_url: 'https://ln/verify' },
    ],
  ])('refuses manual confirmation for an auto-detected rail: %s', async (_label, rail) => {
    // Detectable rail → the guard throws before any state change (no write reached).
    const supabase = makeSupabase({ intent: { ...fixedPriceIntent, ...rail } });
    await expect(buyerConfirmPayment(supabase, PI_ID, BUYER)).rejects.toThrow(
      'This payment is confirmed automatically'
    );
  });
});

describe('sellerConfirmPayment', () => {
  const publicSupportIntent = {
    ...fixedPriceIntent,
    buyer_id: null,
    seller_id: 'seller-1',
    status: STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
    entity_type: 'project',
    entity_id: 'project-1',
    intent_kind: 'support',
    amount_btc: 0.0001,
    description: 'Support: Neighbourhood club',
  };

  it('marks an acknowledged bare-Lightning payment paid after recipient verification', async () => {
    const supabase = makeSupabase({ intent: publicSupportIntent });
    const res = await sellerConfirmPayment(supabase, PI_ID, 'seller-1');
    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
  });

  it('refuses recipient confirmation unless the payment awaits it', async () => {
    const supabase = makeSupabase({
      intent: {
        ...publicSupportIntent,
        status: STATUS.PAYMENT_INTENTS.INVOICE_READY,
      },
    });
    await expect(sellerConfirmPayment(supabase, PI_ID, 'seller-1')).rejects.toThrow(
      'Payment is not awaiting recipient confirmation'
    );
  });
});
