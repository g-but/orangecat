/**
 * resolveSpecificUserWallet — the /receive wallet switcher's resolver.
 *
 * The owner picked a wallet explicitly, so no cross-wallet priority applies —
 * but ownership is non-negotiable: a wallet id belonging to someone else (or
 * inactive) must resolve to null, never to a payable rail.
 */

import { resolveSpecificUserWallet } from '@/domain/payments/walletResolutionService';
import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/lib/supabase/admin', () => ({ getAdminClient: jest.fn() }));
jest.mock('@/domain/payments/encryptionService', () => ({
  decrypt: jest.fn((v: string) => `decrypted:${v}`),
  canDecrypt: jest.fn(() => true),
}));

const USER = 'user-1';
const WALLET = 'wallet-1';

/** Client whose maybeSingle returns the given row; records applied filters. */
function makeSupabase(row: Record<string, unknown> | null) {
  const filters: Array<[string, unknown]> = [];
  const builder: Record<string, unknown> = {};
  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn((col: string, val: unknown) => {
    filters.push([col, val]);
    return builder;
  });
  builder.maybeSingle = jest.fn(() => Promise.resolve({ data: row, error: null }));
  return {
    client: { from: jest.fn(() => builder) } as unknown as SupabaseClient,
    filters,
  };
}

describe('resolveSpecificUserWallet', () => {
  it('scopes the query to owner + active — ownership is part of the query', async () => {
    const { client, filters } = makeSupabase(null);
    const res = await resolveSpecificUserWallet(client, USER, WALLET);
    expect(res).toBeNull();
    expect(filters).toEqual(
      expect.arrayContaining([
        ['id', WALLET],
        ['profile_id', USER],
        ['is_active', true],
      ])
    );
  });

  it('resolves NWC first within the wallet', async () => {
    const { client } = makeSupabase({
      id: WALLET,
      nwc_connection_uri: 'enc',
      lightning_address: 'a@b.c',
      address_or_xpub: null,
    });
    const res = await resolveSpecificUserWallet(client, USER, WALLET);
    expect(res).toEqual({ method: 'nwc', wallet_id: WALLET, nwc_uri: 'decrypted:enc' });
  });

  it('falls back to the Lightning address, then on-chain', async () => {
    const { client } = makeSupabase({
      id: WALLET,
      nwc_connection_uri: null,
      lightning_address: 'a@b.c',
      address_or_xpub: null,
    });
    const res = await resolveSpecificUserWallet(client, USER, WALLET);
    expect(res).toEqual({
      method: 'lightning_address',
      wallet_id: WALLET,
      lightning_address: 'a@b.c',
    });
  });

  it('returns null for a wallet with no usable payment detail', async () => {
    const { client } = makeSupabase({
      id: WALLET,
      nwc_connection_uri: null,
      lightning_address: null,
      address_or_xpub: '',
    });
    expect(await resolveSpecificUserWallet(client, USER, WALLET)).toBeNull();
  });
});
