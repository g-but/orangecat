/**
 * Settlement side-effects run exactly once, no matter how many observers see
 * the same payment.
 *
 * OrangeCat is non-custodial, so it never owns the fact of payment — it learns
 * about it by asking (the payer's browser polling every 3s, a background sweep,
 * the recipient confirming). Several observers can therefore report the same
 * settlement at the same moment. The transition to `paid` is a conditional
 * UPDATE, so exactly one of them wins, and only the winner may run the
 * side-effects: inventory decrement, Supporter grant, notification, webhook.
 *
 * A lost race must be a silent no-op — NOT a second notification, and above all
 * NOT a second inventory decrement (that oversells real stock).
 */

import { checkPaymentStatus } from '@/domain/payments/paymentFlowService';
import { STATUS } from '@/config/database-constants';
import { checkOnchainPaymentStatus } from '@/domain/payments/paymentStatusService';
import { NotificationDispatcher } from '@/services/notifications/dispatcher';

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
}));

const onchainMock = checkOnchainPaymentStatus as jest.Mock;
const dispatchMock = NotificationDispatcher.dispatch as jest.Mock;

const PI_ID = 'pi-race';
const SELLER = 'seller-1';

const intent = {
  id: PI_ID,
  buyer_id: 'buyer-1',
  seller_id: SELLER,
  status: STATUS.PAYMENT_INTENTS.INVOICE_READY,
  payment_method: 'onchain',
  intent_kind: 'purchase',
  onchain_address: 'bc1qxyz',
  entity_type: 'product',
  entity_id: 'prod-1',
  amount_btc: 0.01,
  description: 'Product: Blue Mug',
  paid_at: null,
  expires_at: null,
};

/**
 * @param claimWon whether the conditional paid-transition matched a row. false
 *        models "another observer already settled this one microsecond ago":
 *        PostgREST returns an empty array, no error.
 */
function makeSupabase(claimWon: boolean) {
  const rpc = jest.fn(() => Promise.resolve({ error: null }));
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'update', 'eq', 'neq', 'in']) {
    builder[m] = jest.fn(() => builder);
  }
  builder.single = jest.fn(() => Promise.resolve({ data: intent, error: null }));
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve({ data: claimWon ? [{ id: PI_ID }] : [], error: null }).then(resolve, reject);
  return { from: jest.fn(() => builder), rpc } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  onchainMock.mockResolvedValue('confirmed');
});

describe('exactly-once settlement', () => {
  it('runs the side-effects when this observer wins the transition', async () => {
    const supabase = makeSupabase(true);
    const res = await checkPaymentStatus(supabase, PI_ID, SELLER);

    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
    expect(dispatchMock).toHaveBeenCalledTimes(1);
  });

  it('runs NO side-effects when another observer already settled it', async () => {
    const supabase = makeSupabase(false);
    const res = await checkPaymentStatus(supabase, PI_ID, SELLER);

    // The payment really is paid — the caller must still be told so.
    expect(res.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
    // ...but nothing may fire a second time.
    expect(dispatchMock).not.toHaveBeenCalled();
    // Above all: no second inventory decrement (that would oversell).
    expect((supabase as unknown as { rpc: jest.Mock }).rpc).not.toHaveBeenCalled();
  });

  it('notifies once when two observers report the same payment concurrently', async () => {
    // First caller claims the row; the second finds it already paid.
    let claimed = false;
    const rpc = jest.fn(() => Promise.resolve({ error: null }));
    const builder: Record<string, unknown> = {};
    for (const m of ['select', 'update', 'eq', 'neq', 'in']) {
      builder[m] = jest.fn(() => builder);
    }
    builder.single = jest.fn(() => Promise.resolve({ data: intent, error: null }));
    builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
      const won = !claimed;
      claimed = true;
      return Promise.resolve({ data: won ? [{ id: PI_ID }] : [], error: null }).then(
        resolve,
        reject
      );
    };
    const supabase = { from: jest.fn(() => builder), rpc } as never;

    await Promise.all([
      checkPaymentStatus(supabase, PI_ID, SELLER),
      checkPaymentStatus(supabase, PI_ID, SELLER),
    ]);

    expect(dispatchMock).toHaveBeenCalledTimes(1);
  });
});
