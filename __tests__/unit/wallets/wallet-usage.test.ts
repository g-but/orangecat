/**
 * getSharedWalletUsage — the shared-wallet disclosure contract.
 *
 * Pins: bare-count semantics (self excluded), the owner-default flag,
 * xpub → fresh-address (no warning), group wallets → null, and that a
 * resolution failure degrades to null instead of breaking the page.
 */

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const mockResolve = jest.fn();
jest.mock('@/domain/payments', () => ({
  resolveSellerWallet: (...args: unknown[]) => mockResolve(...args),
}));

// Admin client: route wallets vs entity_wallets queries to separate results.
let walletRow: { id: string; is_primary: boolean } | null = null;
let linkRows: Array<{ entity_type: string; entity_id: string }> = [];
jest.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({
    from: (table: string) => {
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: async () => ({ data: walletRow }),
        then: (resolve: (v: { data: unknown }) => void) =>
          resolve({ data: table === 'entity_wallets' ? linkRows : null }),
      };
      return table === 'wallets'
        ? chain
        : {
            select: () => ({
              eq: async () => ({ data: linkRows }),
            }),
          };
    },
  }),
}));

import { getSharedWalletUsage } from '@/domain/wallets/walletUsage';

const supabase = {} as never;
const ENTITY_ID = '11111111-2222-3333-4444-555555555555';

beforeEach(() => {
  mockResolve.mockReset();
  walletRow = { id: 'w1', is_primary: false };
  linkRows = [];
});

describe('getSharedWalletUsage', () => {
  it('returns null when no wallet resolves', async () => {
    mockResolve.mockResolvedValue(null);
    expect(await getSharedWalletUsage(supabase, 'product', ENTITY_ID)).toBeNull();
  });

  it('counts sibling links but never the entity itself', async () => {
    mockResolve.mockResolvedValue({ method: 'onchain', wallet_id: 'w1' });
    linkRows = [
      { entity_type: 'product', entity_id: ENTITY_ID }, // self — excluded
      { entity_type: 'project', entity_id: 'other-1' },
      { entity_type: 'cause', entity_id: 'other-2' },
    ];
    const usage = await getSharedWalletUsage(supabase, 'product', ENTITY_ID);
    expect(usage).toEqual({
      shared_count: 2,
      is_owner_default: false,
      fresh_address_per_payment: false,
    });
  });

  it('flags the owner-default wallet (implicit sharing beyond explicit links)', async () => {
    mockResolve.mockResolvedValue({ method: 'lightning_address', wallet_id: 'w1' });
    walletRow = { id: 'w1', is_primary: true };
    const usage = await getSharedWalletUsage(supabase, 'product', ENTITY_ID);
    expect(usage?.is_owner_default).toBe(true);
    expect(usage?.shared_count).toBe(0);
  });

  it('flags xpub wallets as fresh-address (payments not linkable)', async () => {
    mockResolve.mockResolvedValue({
      method: 'onchain',
      wallet_id: 'w1',
      onchain_xpub: 'zpub6xyz',
    });
    const usage = await getSharedWalletUsage(supabase, 'product', ENTITY_ID);
    expect(usage?.fresh_address_per_payment).toBe(true);
  });

  it('returns null for group treasuries (wallet not in wallets table)', async () => {
    mockResolve.mockResolvedValue({ method: 'nwc', wallet_id: 'gw1' });
    walletRow = null;
    expect(await getSharedWalletUsage(supabase, 'group', ENTITY_ID)).toBeNull();
  });

  it('degrades to null when resolution throws — disclosure never breaks the page', async () => {
    mockResolve.mockRejectedValue(new Error('rail down'));
    expect(await getSharedWalletUsage(supabase, 'product', ENTITY_ID)).toBeNull();
  });
});
