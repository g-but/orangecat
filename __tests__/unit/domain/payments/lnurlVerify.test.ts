/**
 * LNURL-verify (LUD-21) — trustless settlement for lightning_address payments.
 *
 * Money path: a payment must only flip to PAID on an explicit `settled: true`
 * from the provider's verify endpoint. Provider errors, malformed bodies, and
 * unsettled invoices must all read as "not paid yet".
 */

import { checkLnurlVerifyPaymentStatus } from '@/domain/payments/paymentStatusService';
import { checkPaymentStatus } from '@/domain/payments/paymentFlowService';
import { STATUS } from '@/config/database-constants';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/lib/email/send-seller-notification', () => ({
  sendSellerPaymentNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/notifications/dispatcher', () => ({
  NotificationDispatcher: { dispatch: jest.fn().mockResolvedValue(undefined) },
}));

const VERIFY_URL = 'https://getalby.com/lnurlp/oc/verify/abc123';

function mockFetchOnce(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

describe('checkLnurlVerifyPaymentStatus', () => {
  it('returns true only on explicit settled=true', async () => {
    mockFetchOnce({ status: 'OK', settled: true, preimage: 'aa' });
    await expect(
      checkLnurlVerifyPaymentStatus({ id: 'pi-1', lnurl_verify_url: VERIFY_URL })
    ).resolves.toBe(true);
  });

  it('returns false when not yet settled', async () => {
    mockFetchOnce({ status: 'OK', settled: false, preimage: null });
    await expect(
      checkLnurlVerifyPaymentStatus({ id: 'pi-1', lnurl_verify_url: VERIFY_URL })
    ).resolves.toBe(false);
  });

  it('returns false on provider error status', async () => {
    mockFetchOnce({ status: 'ERROR', reason: 'not found' });
    await expect(
      checkLnurlVerifyPaymentStatus({ id: 'pi-1', lnurl_verify_url: VERIFY_URL })
    ).resolves.toBe(false);
  });

  it('returns false on HTTP failure', async () => {
    mockFetchOnce({}, false);
    await expect(
      checkLnurlVerifyPaymentStatus({ id: 'pi-1', lnurl_verify_url: VERIFY_URL })
    ).resolves.toBe(false);
  });

  it('returns false (never throws) on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('timeout')) as unknown as typeof fetch;
    await expect(
      checkLnurlVerifyPaymentStatus({ id: 'pi-1', lnurl_verify_url: VERIFY_URL })
    ).resolves.toBe(false);
  });

  it('returns false when no verify URL is stored (pre-LUD-21 intents)', async () => {
    global.fetch = jest.fn() as unknown as typeof fetch;
    await expect(
      checkLnurlVerifyPaymentStatus({ id: 'pi-1', lnurl_verify_url: null })
    ).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('checkPaymentStatus — lightning_address + verify URL', () => {
  const PI = {
    id: 'pi-1',
    buyer_id: 'buyer-1',
    seller_id: 'seller-1',
    entity_type: 'cause',
    entity_id: 'ent-1',
    amount_btc: 0.0001,
    status: STATUS.PAYMENT_INTENTS.INVOICE_READY,
    payment_method: 'lightning_address',
    lnurl_verify_url: VERIFY_URL,
    paid_at: null,
    expires_at: null,
    description: 'Cause: Test',
  };

  function makeSupabase(intent: Record<string, unknown>) {
    const update = jest.fn();
    const builder: Record<string, unknown> = {};
    for (const m of ['select', 'update', 'eq', 'neq', 'in']) {
      builder[m] = jest.fn((...args: unknown[]) => {
        if (m === 'update') update(...args);
        return builder;
      });
    }
    builder.single = jest.fn(() => Promise.resolve({ data: intent, error: null }));
    // The paid transition is a conditional UPDATE … .neq('status','paid').select('id'):
    // a returned row means THIS caller won the claim and owns the side-effects.
    builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve({ data: [{ id: intent.id }], error: null }).then(resolve, reject);
    return { client: { from: jest.fn(() => builder) } as never, update };
  }

  it('flips to PAID when the verify endpoint reports settled', async () => {
    mockFetchOnce({ status: 'OK', settled: true });
    const { client, update } = makeSupabase(PI);
    const res = await checkPaymentStatus(client, PI.id, PI.buyer_id);
    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid' }));
  });

  it('stays invoice_ready when not settled', async () => {
    mockFetchOnce({ status: 'OK', settled: false });
    const { client, update } = makeSupabase(PI);
    const res = await checkPaymentStatus(client, PI.id, PI.buyer_id);
    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.INVOICE_READY);
    expect(update).not.toHaveBeenCalled();
  });
});
