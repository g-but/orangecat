/**
 * Which rail gets asked, and what its answer is allowed to change.
 *
 * Settlement detection is a dispatch: each payment method has exactly one
 * authority that can say "the money arrived" — the NWC relay, the LUD-21 verify
 * URL, the mempool. Mutation testing showed the dispatch was unconstrained: an
 * on-chain intent could be routed to the Lightning checker, or a rail could be
 * asked without the field it needs, and nothing failed.
 *
 * Getting this wrong is the worst failure the product has: marking money as
 * received when it was not, or losing a payment that did arrive.
 */

import { reconcilePaymentIntent, sellerConfirmPayment } from '@/domain/payments/paymentFlowService';
import {
  checkNWCPaymentStatus,
  checkOnchainPaymentStatus,
  checkLnurlVerifyPaymentStatus,
} from '@/domain/payments/paymentStatusService';
import { STATUS } from '@/config/database-constants';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { PaymentIntent } from '@/domain/payments/types';
import { createFakeSupabase, type Row } from '../../../../test-utils/fakeSupabase';

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

import { getAdminClient } from '@/lib/supabase/admin';
const getAdminClientMock = getAdminClient as jest.Mock;
const nwcMock = checkNWCPaymentStatus as jest.Mock;
const onchainMock = checkOnchainPaymentStatus as jest.Mock;
const lnurlMock = checkLnurlVerifyPaymentStatus as jest.Mock;

const ALIVE = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const DEAD = new Date(Date.now() - 60 * 60 * 1000).toISOString();

function intent(over: Row = {}): PaymentIntent {
  return {
    id: 'pi-1',
    buyer_id: 'buyer-1',
    seller_id: 'seller-1',
    entity_type: 'product',
    entity_id: 'prod-1',
    amount_btc: 0.001,
    payment_method: 'nwc',
    intent_kind: 'purchase',
    receiving_wallet_id: 'w-1',
    bolt11: 'lnbc...',
    payment_hash: 'hash-1',
    onchain_address: null,
    lnurl_verify_url: null,
    status: STATUS.PAYMENT_INTENTS.INVOICE_READY,
    description: 'Payment for: Beans',
    expires_at: ALIVE,
    paid_at: null,
    created_at: '2026-08-01',
    updated_at: '2026-08-01',
    public_status_token_hash: null,
    ...over,
  } as PaymentIntent;
}

function world(pi: PaymentIntent) {
  const fake = createFakeSupabase({
    [DATABASE_TABLES.PAYMENT_INTENTS]: [pi as unknown as Row],
  });
  getAdminClientMock.mockReturnValue(fake.client);
  return fake;
}

beforeEach(() => {
  jest.clearAllMocks();
  nwcMock.mockResolvedValue(false);
  lnurlMock.mockResolvedValue(false);
  onchainMock.mockResolvedValue('none');
});

describe('each method asks its own authority and no other', () => {
  it('asks the NWC relay for an NWC payment', async () => {
    const pi = intent();
    await reconcilePaymentIntent(world(pi).client, pi);

    expect(nwcMock).toHaveBeenCalledTimes(1);
    expect(lnurlMock).not.toHaveBeenCalled();
    expect(onchainMock).not.toHaveBeenCalled();
  });

  it('asks the verify URL for a verifiable Lightning address', async () => {
    const pi = intent({
      payment_method: 'lightning_address',
      payment_hash: null,
      lnurl_verify_url: 'https://ln.example/verify/1',
    });
    await reconcilePaymentIntent(world(pi).client, pi);

    expect(lnurlMock).toHaveBeenCalledTimes(1);
    expect(nwcMock).not.toHaveBeenCalled();
    expect(onchainMock).not.toHaveBeenCalled();
  });

  it('asks the mempool for an on-chain payment', async () => {
    const pi = intent({
      payment_method: 'onchain',
      payment_hash: null,
      onchain_address: 'bc1qexample',
    });
    await reconcilePaymentIntent(world(pi).client, pi);

    expect(onchainMock).toHaveBeenCalledTimes(1);
    expect(nwcMock).not.toHaveBeenCalled();
    expect(lnurlMock).not.toHaveBeenCalled();
  });
});

describe('a rail is never asked without what it needs to answer', () => {
  it('does not query the relay for an NWC intent with no payment hash', async () => {
    const pi = intent({ payment_hash: null });
    await reconcilePaymentIntent(world(pi).client, pi);

    expect(nwcMock).not.toHaveBeenCalled();
  });

  it('does not query the mempool for an on-chain intent with no address', async () => {
    const pi = intent({ payment_method: 'onchain', payment_hash: null, onchain_address: null });
    await reconcilePaymentIntent(world(pi).client, pi);

    expect(onchainMock).not.toHaveBeenCalled();
  });

  it('does not query a verify URL a bare Lightning address does not have', async () => {
    const pi = intent({ payment_method: 'lightning_address', payment_hash: null });
    await reconcilePaymentIntent(world(pi).client, pi);

    expect(lnurlMock).not.toHaveBeenCalled();
  });
});

describe('only the authority can settle a payment', () => {
  it('settles when the relay confirms', async () => {
    nwcMock.mockResolvedValue(true);
    const pi = intent();

    const result = await reconcilePaymentIntent(world(pi).client, pi);

    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
    expect(result.paid_at).not.toBeNull();
  });

  it('settles when the verify URL confirms', async () => {
    lnurlMock.mockResolvedValue(true);
    const pi = intent({
      payment_method: 'lightning_address',
      payment_hash: null,
      lnurl_verify_url: 'https://ln.example/verify/1',
    });

    const result = await reconcilePaymentIntent(world(pi).client, pi);

    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
  });

  it('settles on a confirmed on-chain transaction', async () => {
    onchainMock.mockResolvedValue('confirmed');
    const pi = intent({
      payment_method: 'onchain',
      payment_hash: null,
      onchain_address: 'bc1qexample',
    });

    const result = await reconcilePaymentIntent(world(pi).client, pi);

    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
  });

  it('does NOT settle an unconfirmed on-chain transaction — mempool is not money', async () => {
    onchainMock.mockResolvedValue('in_mempool');
    const pi = intent({
      payment_method: 'onchain',
      payment_hash: null,
      onchain_address: 'bc1qexample',
    });
    const fake = world(pi);

    const result = await reconcilePaymentIntent(fake.client, pi);

    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.PENDING_CONFIRMATION);
    expect(result.paid_at).toBeNull();
    expect(fake.updates.map(u => u.patch.status)).toEqual([
      STATUS.PAYMENT_INTENTS.PENDING_CONFIRMATION,
    ]);
  });

  it('does not re-write a transaction that is already pending confirmation', async () => {
    onchainMock.mockResolvedValue('in_mempool');
    const pi = intent({
      payment_method: 'onchain',
      payment_hash: null,
      onchain_address: 'bc1qexample',
      status: STATUS.PAYMENT_INTENTS.PENDING_CONFIRMATION,
    });
    const fake = world(pi);

    await reconcilePaymentIntent(fake.client, pi);

    expect(fake.updates).toEqual([]);
  });

  it('leaves the intent alone when the rail says nothing arrived', async () => {
    const pi = intent();
    const fake = world(pi);

    const result = await reconcilePaymentIntent(fake.client, pi);

    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.INVOICE_READY);
    expect(fake.updates).toEqual([]);
  });
});

describe('expiry is only the truth after the rail has said no', () => {
  it('honours a payment that landed in the final seconds before expiry', async () => {
    // The rail is asked FIRST. Declaring "expired" up front lost real money
    // that had already arrived.
    nwcMock.mockResolvedValue(true);
    const pi = intent({ expires_at: DEAD });

    const result = await reconcilePaymentIntent(world(pi).client, pi);

    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
  });

  it('expires only once the rail confirms nothing arrived', async () => {
    const pi = intent({ expires_at: DEAD });
    const fake = world(pi);

    const result = await reconcilePaymentIntent(fake.client, pi);

    expect(nwcMock).toHaveBeenCalled();
    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.EXPIRED);
    expect(fake.updates.map(u => u.patch.status)).toEqual([STATUS.PAYMENT_INTENTS.EXPIRED]);
  });

  it('never expires an intent that has no deadline', async () => {
    // On-chain intents do not expire — the address stays payable.
    const pi = intent({
      payment_method: 'onchain',
      payment_hash: null,
      onchain_address: 'bc1qexample',
      expires_at: null,
    });
    const fake = world(pi);

    const result = await reconcilePaymentIntent(fake.client, pi);

    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.INVOICE_READY);
    expect(fake.updates).toEqual([]);
  });

  it('returns a terminal status without asking any rail', async () => {
    const pi = intent({ status: STATUS.PAYMENT_INTENTS.PAID, paid_at: '2026-08-01T10:00:00Z' });

    const result = await reconcilePaymentIntent(world(pi).client, pi);

    expect(result).toEqual({
      status: STATUS.PAYMENT_INTENTS.PAID,
      paid_at: '2026-08-01T10:00:00Z',
    });
    expect(nwcMock).not.toHaveBeenCalled();
  });
});

describe('sellerConfirmPayment — the recipient settles what no rail can', () => {
  const SELLER = 'seller-1';

  it('settles a claimed bare-Lightning payment', async () => {
    const pi = intent({
      payment_method: 'lightning_address',
      payment_hash: null,
      status: STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
    });
    const fake = world(pi);

    const result = await sellerConfirmPayment(fake.client, 'pi-1', SELLER);

    expect(result.status).toBe(STATUS.PAYMENT_INTENTS.PAID);
  });

  it('refuses when the payer has not claimed yet', async () => {
    const pi = intent({ payment_method: 'lightning_address', payment_hash: null });
    const fake = world(pi);

    await expect(sellerConfirmPayment(fake.client, 'pi-1', SELLER)).rejects.toThrow(
      'not awaiting recipient confirmation'
    );
  });

  it('refuses on a rail that confirms itself', async () => {
    const pi = intent({
      payment_method: 'lightning_address',
      payment_hash: null,
      lnurl_verify_url: 'https://ln.example/verify/1',
      status: STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
    });
    const fake = world(pi);

    await expect(sellerConfirmPayment(fake.client, 'pi-1', SELLER)).rejects.toThrow(
      'not awaiting recipient confirmation'
    );
  });

  it('refuses a stranger — only the recipient of THIS payment may confirm it', async () => {
    const pi = intent({
      payment_method: 'lightning_address',
      payment_hash: null,
      status: STATUS.PAYMENT_INTENTS.BUYER_CONFIRMED,
    });
    const fake = world(pi);

    await expect(sellerConfirmPayment(fake.client, 'pi-1', 'someone-else')).rejects.toThrow(
      'Payment not found'
    );
  });
});
