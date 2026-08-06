/**
 * Cat Credits — Lightning top-up (money IN).
 *
 * This is the path that credits real Bitcoin into a user's ledger the moment
 * PLATFORM_NWC_URI is provisioned. It had zero tests. This suite pins the rules
 * that protect money and honesty of balance:
 *   - both entry points hard-gate on platformReceiveEnabled(),
 *   - top-up amounts are bounded (and NaN/out-of-range never mint an invoice),
 *   - settlement credits the top-up's recorded OWNER, idempotent on payment_hash,
 *   - an already-paid row is never credited twice,
 *   - an unsettled invoice past its window expires instead of hanging pending.
 * BTC is the unit; sats appear only at the Lightning protocol boundary.
 */

import {
  initiateTopUp,
  checkTopUp,
  MIN_TOPUP_BTC,
  MAX_TOPUP_BTC,
  TOPUP_EXPIRY_GRACE_MS,
} from '@/services/cat/credit-topup';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const platformReceiveEnabled = jest.fn();
const getPlatformNwcClient = jest.fn();
jest.mock('@/lib/bitcoin/platform-wallet', () => ({
  platformReceiveEnabled: () => platformReceiveEnabled(),
  getPlatformNwcClient: () => getPlatformNwcClient(),
}));

const appendCreditEntry = jest.fn();
const getCreditBalance = jest.fn();
jest.mock('@/services/cat/credits', () => ({
  appendCreditEntry: (...a: unknown[]) => appendCreditEntry(...a),
  getCreditBalance: (...a: unknown[]) => getCreditBalance(...a),
}));

const adminFrom = jest.fn();
jest.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({ from: (...a: unknown[]) => adminFrom(...a) }),
}));

/**
 * Minimal fluent query-builder stub. Chain methods return the builder; awaiting
 * the builder (e.g. `.update().eq()`) resolves to `awaitResult`; `.single()` /
 * `.maybeSingle()` resolve to the configured terminal.
 */
function qb(
  opts: {
    terminal?: unknown;
    awaitResult?: unknown;
    onUpdate?: (payload: Record<string, unknown>) => void;
  } = {}
) {
  const terminal = opts.terminal ?? { data: null, error: null };
  const awaitResult = opts.awaitResult ?? { data: null, error: null };
  const builder: Record<string, unknown> = {
    insert: () => builder,
    update: (payload: Record<string, unknown>) => {
      opts.onUpdate?.(payload);
      return builder;
    },
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    single: async () => terminal,
    maybeSingle: async () => terminal,
    then: (resolve: (v: unknown) => unknown) => resolve(awaitResult),
  };
  return builder;
}

function nwcClient(over: Record<string, unknown> = {}) {
  return {
    makeInvoice: jest.fn().mockResolvedValue({ invoice: 'lnbc1...', payment_hash: 'ph_abc' }),
    lookupInvoice: jest.fn().mockResolvedValue({ settled_at: null }),
    disconnect: jest.fn(),
    ...over,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  platformReceiveEnabled.mockReturnValue(true);
});

describe('initiateTopUp', () => {
  it('returns null when top-up is not enabled (no wallet), without minting anything', async () => {
    platformReceiveEnabled.mockReturnValue(false);
    await expect(initiateTopUp('u1', 0.001)).resolves.toBeNull();
    expect(getPlatformNwcClient).not.toHaveBeenCalled();
  });

  it.each([
    ['below the minimum', MIN_TOPUP_BTC / 2],
    ['above the maximum', MAX_TOPUP_BTC * 2],
    ['NaN', NaN],
  ])('rejects an out-of-bounds amount (%s) before touching the wallet', async (_label, amt) => {
    await expect(initiateTopUp('u1', amt as number)).resolves.toBeNull();
    expect(getPlatformNwcClient).not.toHaveBeenCalled();
  });

  it('mints an invoice for the exact sats, records a pending top-up, and disconnects', async () => {
    const client = nwcClient();
    getPlatformNwcClient.mockResolvedValue(client);
    adminFrom.mockReturnValue(qb({ terminal: { data: { id: 'tp1' }, error: null } }));

    const res = await initiateTopUp('u1', 0.0005); // 50k sats
    expect(res).toMatchObject({
      topupId: 'tp1',
      bolt11: 'lnbc1...',
      paymentHash: 'ph_abc',
      amountBtc: 0.0005,
    });
    // Sats only at the protocol boundary: 0.0005 BTC = 50_000 sats.
    expect(client.makeInvoice).toHaveBeenCalledWith(50000, expect.any(String), expect.any(Number));
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });

  it('returns null (and still disconnects) when recording the top-up row fails', async () => {
    const client = nwcClient();
    getPlatformNwcClient.mockResolvedValue(client);
    adminFrom.mockReturnValue(qb({ terminal: { data: null, error: { message: 'db down' } } }));

    await expect(initiateTopUp('u1', 0.001)).resolves.toBeNull();
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });

  it('returns null when the platform wallet client is unavailable', async () => {
    getPlatformNwcClient.mockResolvedValue(null);
    await expect(initiateTopUp('u1', 0.001)).resolves.toBeNull();
  });
});

describe('checkTopUp', () => {
  const pendingRow = {
    id: 'tp1',
    user_id: 'owner',
    amount_btc: 0.0005,
    payment_hash: 'ph_abc',
    status: 'pending',
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
  };

  it('reports not_enabled when the platform wallet is unset', async () => {
    platformReceiveEnabled.mockReturnValue(false);
    await expect(checkTopUp('owner', 'tp1')).resolves.toEqual({ status: 'not_enabled' });
  });

  it('reports not_found when the row does not belong to the caller', async () => {
    adminFrom.mockReturnValue(qb({ terminal: { data: null } }));
    await expect(checkTopUp('owner', 'nope')).resolves.toEqual({ status: 'not_found' });
    expect(getPlatformNwcClient).not.toHaveBeenCalled();
  });

  it('an already-paid row returns its balance and is NOT credited again', async () => {
    adminFrom.mockReturnValue(qb({ terminal: { data: { ...pendingRow, status: 'paid' } } }));
    getCreditBalance.mockResolvedValue(0.0005);

    await expect(checkTopUp('owner', 'tp1')).resolves.toEqual({
      status: 'paid',
      balanceBtc: 0.0005,
    });
    expect(appendCreditEntry).not.toHaveBeenCalled();
    expect(getPlatformNwcClient).not.toHaveBeenCalled();
  });

  it('credits the OWNER (idempotent on payment_hash) when the invoice has settled', async () => {
    adminFrom.mockReturnValue(qb({ terminal: { data: pendingRow } }));
    getPlatformNwcClient.mockResolvedValue(
      nwcClient({ lookupInvoice: jest.fn().mockResolvedValue({ settled_at: 1_700_000_000 }) })
    );
    // The new balance comes straight from the atomic append (no extra read).
    appendCreditEntry.mockResolvedValue(0.0005);

    const res = await checkTopUp('owner', 'tp1');
    expect(res).toEqual({ status: 'paid', balanceBtc: 0.0005 });

    expect(appendCreditEntry).toHaveBeenCalledTimes(1);
    const [, creditedUser, entry] = appendCreditEntry.mock.calls[0] as [unknown, string, any];
    expect(creditedUser).toBe('owner'); // the row's owner, never the caller argument alone
    expect(entry.kind).toBe('topup');
    expect(entry.amountBtc).toBe(0.0005);
    expect(entry.ref).toBe('ph_abc'); // idempotency key = payment hash
  });

  it('stays pending (never marks paid) when a settled invoice fails to credit — no lost payment', async () => {
    // Settlement detected, but the atomic credit append fails (transient DB
    // error → null). The top-up must NOT be flipped to 'paid', or the next poll
    // short-circuits and the user's paid sats vanish with no credit. Staying
    // pending lets the next poll retry the idempotent credit.
    let paidUpdate = false;
    adminFrom.mockImplementation(() => ({
      insert: () => adminFrom(),
      select: () => adminFrom(),
      eq: () => adminFrom(),
      order: () => adminFrom(),
      limit: () => adminFrom(),
      maybeSingle: async () => ({ data: pendingRow }),
      single: async () => ({ data: pendingRow }),
      update: (patch: { status?: string }) => {
        if (patch?.status === 'paid') {
          paidUpdate = true;
        }
        return adminFrom();
      },
      then: (resolve: (v: unknown) => unknown) => resolve({ data: null, error: null }),
    }));
    getPlatformNwcClient.mockResolvedValue(
      nwcClient({ lookupInvoice: jest.fn().mockResolvedValue({ settled_at: 1_700_000_000 }) })
    );
    appendCreditEntry.mockResolvedValue(null); // crediting failed

    await expect(checkTopUp('owner', 'tp1')).resolves.toEqual({ status: 'pending' });
    expect(appendCreditEntry).toHaveBeenCalledTimes(1);
    expect(paidUpdate).toBe(false); // critically, never marked paid
  });

  it('stays pending on a transient lookup failure (client polls again)', async () => {
    adminFrom.mockReturnValue(qb({ terminal: { data: pendingRow } }));
    getPlatformNwcClient.mockResolvedValue(
      nwcClient({ lookupInvoice: jest.fn().mockRejectedValue(new Error('relay timeout')) })
    );
    await expect(checkTopUp('owner', 'tp1')).resolves.toEqual({ status: 'pending' });
    expect(appendCreditEntry).not.toHaveBeenCalled();
  });

  it('expires an unsettled invoice once its window has passed', async () => {
    adminFrom.mockReturnValue(
      qb({
        terminal: {
          data: { ...pendingRow, expires_at: new Date(Date.now() - 1000).toISOString() },
        },
      })
    );
    getPlatformNwcClient.mockResolvedValue(nwcClient()); // settled_at: null
    await expect(checkTopUp('owner', 'tp1')).resolves.toEqual({ status: 'expired' });
    expect(appendCreditEntry).not.toHaveBeenCalled();
  });

  it('tells the user "expired" without RECORDING it while a payment could still land', async () => {
    // Two different claims, deliberately decoupled: "start a new invoice" is
    // safe to say the moment our own expires_at passes, but `expired` in the
    // row is terminal — the branch above returns early and never looks the
    // invoice up again. expires_at is our local Date.now()+1h guess, so writing
    // it on that alone would strand a payment still in flight.
    const updated: Array<Record<string, unknown>> = [];
    adminFrom.mockReturnValue(
      qb({
        terminal: {
          data: { ...pendingRow, expires_at: new Date(Date.now() - 1000).toISOString() },
        },
        onUpdate: (payload: Record<string, unknown>) => updated.push(payload),
      })
    );
    getPlatformNwcClient.mockResolvedValue(nwcClient()); // settled_at: null

    await expect(checkTopUp('owner', 'tp1')).resolves.toEqual({ status: 'expired' });
    expect(updated).toHaveLength(0);
  });

  it('records expired only once no payment can still arrive (past grace)', async () => {
    const updated: Array<Record<string, unknown>> = [];
    adminFrom.mockReturnValue(
      qb({
        terminal: {
          data: {
            ...pendingRow,
            expires_at: new Date(Date.now() - TOPUP_EXPIRY_GRACE_MS - 1000).toISOString(),
          },
        },
        onUpdate: (payload: Record<string, unknown>) => updated.push(payload),
      })
    );
    getPlatformNwcClient.mockResolvedValue(nwcClient()); // settled_at: null

    await expect(checkTopUp('owner', 'tp1')).resolves.toEqual({ status: 'expired' });
    expect(updated).toContainEqual({ status: 'expired' });
  });
});
