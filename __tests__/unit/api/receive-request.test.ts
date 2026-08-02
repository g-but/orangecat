/**
 * POST /api/receive/request — the owner-side "get paid" mint.
 *
 * Guards under test:
 *  - amount bounds enforced (same sane caps as tips);
 *  - a wallet_id is resolved ONLY within the authenticated user's own active
 *    wallets (someone else's wallet id → clean 400, no intent minted);
 *  - no usable wallet → clean 400, not a 500;
 *  - happy path returns the invoice shape from the shared tips engine.
 */

import { POST } from '@/app/api/receive/request/route';
import {
  resolveUserWallet,
  resolveSpecificUserWallet,
} from '@/domain/payments/walletResolutionService';
import { initiateTip } from '@/domain/payments/paymentFlowService';
import { RECEIVE_MAX_BTC } from '@/config/receive';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/lib/api/withAuth', () => ({
  withAuth:
    (handler: (req: unknown) => Promise<unknown>) =>
    (req: unknown): Promise<unknown> =>
      handler(Object.assign(req as object, { user: { id: 'owner-1' }, supabase: {} })),
}));
jest.mock('@/lib/rate-limit', () => ({
  rateLimitWriteAsync: jest.fn().mockResolvedValue({ success: true }),
  retryAfterSeconds: () => 0,
}));
jest.mock('@/lib/api/standardResponse', () => ({
  apiSuccess: jest.fn((data: unknown) => ({ status: 200, data })),
  apiBadRequest: jest.fn((error: string) => ({ status: 400, error })),
  apiRateLimited: jest.fn(() => ({ status: 429 })),
  apiInternalError: jest.fn(() => ({ status: 500 })),
}));
jest.mock('@/lib/supabase/admin', () => ({
  getAdminClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: { username: 'lena', display_name: 'Lena' }, error: null }),
    })),
  })),
}));
jest.mock('@/domain/payments/walletResolutionService', () => ({
  resolveUserWallet: jest.fn(),
  resolveSpecificUserWallet: jest.fn(),
}));
jest.mock('@/domain/payments/paymentFlowService', () => ({
  initiateTip: jest.fn(),
}));

const resolvePrimaryMock = resolveUserWallet as jest.Mock;
const resolveSpecificMock = resolveSpecificUserWallet as jest.Mock;
const initiateTipMock = initiateTip as jest.Mock;

const WALLET = { method: 'lightning_address', wallet_id: 'w1', lightning_address: 'a@b.c' };
const TIP_RESULT = {
  payment_intent: { id: 'pi-1', payment_method: 'lightning_address' },
  status_token: 'tok',
  qr_data: 'LNBC...',
  method_label: 'Lightning Address',
  expires_in_seconds: 3600,
};

function makeRequest(body: unknown) {
  return { json: () => Promise.resolve(body) } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  initiateTipMock.mockResolvedValue(TIP_RESULT);
});

describe('POST /api/receive/request', () => {
  it('mints a request against the primary wallet by default', async () => {
    resolvePrimaryMock.mockResolvedValue(WALLET);
    const res = (await POST(makeRequest({ amount_btc: 0.0001 }))) as {
      status: number;
      data: Record<string, unknown>;
    };
    expect(res.status).toBe(200);
    expect(res.data.intentId).toBe('pi-1');
    expect(resolveSpecificMock).not.toHaveBeenCalled();
    expect(initiateTipMock).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: 'owner-1', amountBtc: 0.0001, wallet: WALLET })
    );
  });

  it('resolves an explicit wallet_id only within the owner scope', async () => {
    resolveSpecificMock.mockResolvedValue(WALLET);
    const res = (await POST(
      makeRequest({ amount_btc: 0.0001, wallet_id: '550e8400-e29b-41d4-a716-446655440000' })
    )) as { status: number };
    expect(res.status).toBe(200);
    expect(resolveSpecificMock).toHaveBeenCalledWith(
      expect.anything(),
      'owner-1',
      '550e8400-e29b-41d4-a716-446655440000'
    );
    expect(resolvePrimaryMock).not.toHaveBeenCalled();
  });

  it("refuses a wallet_id that isn't the owner's (resolver returns null) — no intent minted", async () => {
    resolveSpecificMock.mockResolvedValue(null);
    const res = (await POST(
      makeRequest({ amount_btc: 0.0001, wallet_id: '550e8400-e29b-41d4-a716-446655440000' })
    )) as { status: number };
    expect(res.status).toBe(400);
    expect(initiateTipMock).not.toHaveBeenCalled();
  });

  it('refuses when no wallet can receive — clean 400, not a 500', async () => {
    resolvePrimaryMock.mockResolvedValue(null);
    const res = (await POST(makeRequest({ amount_btc: 0.0001 }))) as { status: number };
    expect(res.status).toBe(400);
    expect(initiateTipMock).not.toHaveBeenCalled();
  });

  it('enforces amount bounds', async () => {
    resolvePrimaryMock.mockResolvedValue(WALLET);
    const over = (await POST(makeRequest({ amount_btc: RECEIVE_MAX_BTC + 1 }))) as {
      status: number;
    };
    expect(over.status).toBe(400);
    const zero = (await POST(makeRequest({ amount_btc: 0 }))) as { status: number };
    expect(zero.status).toBe(400);
    expect(initiateTipMock).not.toHaveBeenCalled();
  });
});
