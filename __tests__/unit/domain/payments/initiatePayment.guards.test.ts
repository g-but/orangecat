/**
 * Guard-rail coverage for initiatePayment — the entry point to every money flow.
 *
 * These guards are security-relevant: they stop a payment before any intent is
 * created when the entity isn't published (the buyer's own RLS read is the
 * gate), when the seller can't be resolved, when a buyer tries to purchase
 * their own entity, or when the seller has no wallet to receive funds.
 */

import { initiatePayment } from '@/domain/payments/paymentFlowService';
import { getSellerUserId, resolveSellerWallet } from '@/domain/payments/walletResolutionService';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/domain/payments/walletResolutionService', () => ({
  getSellerUserId: jest.fn(),
  resolveSellerWallet: jest.fn(),
}));
// Break the resend/email import chain (ESM-only, not transformed by jest).
jest.mock('@/lib/email/send-seller-notification', () => ({
  sendSellerPaymentNotification: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/notifications/dispatcher', () => ({
  NotificationDispatcher: { dispatch: jest.fn().mockResolvedValue(undefined) },
}));

const getSellerUserIdMock = getSellerUserId as jest.Mock;
const resolveSellerWalletMock = resolveSellerWallet as jest.Mock;

/**
 * Caller-scoped client serving only the publication-gate read. `visible`
 * models what the buyer's RLS lets them see: null = draft/hidden entity.
 */
function makeSupabase(visible: boolean) {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) {
    builder[m] = jest.fn(() => builder);
  }
  builder.maybeSingle = jest.fn(() =>
    Promise.resolve({ data: visible ? { id: 'prod-1' } : null, error: null })
  );
  return { from: jest.fn(() => builder) } as never;
}

const BUYER = 'buyer-1';
const input = { entity_type: 'product' as const, entity_id: 'prod-1' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('initiatePayment — guards', () => {
  it('refuses an entity the buyer cannot see (draft/unpublished)', async () => {
    // Regression (found live 2026-08-02): seller + wallet resolution run on the
    // admin client, so without this gate an authenticated user could mint an
    // invoice + order against a DRAFT entity the owner never published.
    await expect(initiatePayment(makeSupabase(false), BUYER, input)).rejects.toThrow(
      'Entity is not publicly available'
    );
    expect(getSellerUserIdMock).not.toHaveBeenCalled();
    expect(resolveSellerWalletMock).not.toHaveBeenCalled();
  });

  it('throws when the entity owner cannot be resolved', async () => {
    getSellerUserIdMock.mockResolvedValue(null);
    await expect(initiatePayment(makeSupabase(true), BUYER, input)).rejects.toThrow(
      'Entity owner not found'
    );
    expect(resolveSellerWalletMock).not.toHaveBeenCalled();
  });

  it('refuses a buyer purchasing their own entity', async () => {
    getSellerUserIdMock.mockResolvedValue(BUYER);
    await expect(initiatePayment(makeSupabase(true), BUYER, input)).rejects.toThrow(
      'Cannot purchase your own entity'
    );
    expect(resolveSellerWalletMock).not.toHaveBeenCalled();
  });

  it('throws when the seller has no wallet connected', async () => {
    getSellerUserIdMock.mockResolvedValue('seller-1');
    resolveSellerWalletMock.mockResolvedValue(null);
    await expect(initiatePayment(makeSupabase(true), BUYER, input)).rejects.toThrow(
      'Seller has no wallet connected. Payment not available.'
    );
  });
});
