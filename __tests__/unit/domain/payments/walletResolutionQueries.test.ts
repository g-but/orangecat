/**
 * Wallet resolution — the query itself is the safety property.
 *
 * Resolution decides WHO GETS THE MONEY, and most of that decision lives in
 * filters and orderings rather than in branches: `is_active`, `profile_id`,
 * `group_id`, primary-first. Mutation testing showed those were unconstrained —
 * every filter could be deleted and the suite stayed green, because the old
 * doubles returned a fixed row no matter what was asked.
 *
 * These tests run against a fake that actually applies the query
 * (test-utils/fakeSupabase), and each one is written so that removing a single
 * filter changes which wallet is chosen:
 *  - a deactivated wallet is present and must NOT win,
 *  - someone else's wallet is present and must NEVER win,
 *  - the primary wallet is listed second so ordering has to do real work.
 */

import {
  resolveUserWallet,
  resolveSpecificUserWallet,
  resolveSellerWallet,
} from '@/domain/payments/walletResolutionService';
import { DATABASE_TABLES } from '@/config/database-tables';
import { createFakeSupabase, type Row } from '../../../../test-utils/fakeSupabase';

jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/lib/supabase/admin', () => ({ getAdminClient: jest.fn() }));
// Identity decrypt: these tests assert which wallet wins, not the crypto.
jest.mock('@/domain/payments/encryptionService', () => ({
  decrypt: jest.fn((s: string) => s),
}));

import { getAdminClient } from '@/lib/supabase/admin';
import { decrypt } from '@/domain/payments/encryptionService';
const getAdminClientMock = getAdminClient as jest.Mock;
const decryptMock = decrypt as jest.Mock;

const OWNER = 'user-1';
const STRANGER = 'user-2';

function wallet(over: Row): Row {
  return {
    id: 'w',
    profile_id: OWNER,
    is_active: true,
    is_primary: false,
    wallet_type: 'onchain',
    nwc_connection_uri: null,
    lightning_address: null,
    address_or_xpub: null,
    created_at: '2026-01-01',
    ...over,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  decryptMock.mockImplementation((s: string) => s);
});

describe('resolveUserWallet — the wallet set it is allowed to choose from', () => {
  it('never resolves to a deactivated wallet, even when it is the only one with a rail', async () => {
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.WALLETS]: [
        wallet({ id: 'w-dead', is_active: false, is_primary: true, lightning_address: 'dead@ln' }),
      ],
    });

    expect(await resolveUserWallet(client, OWNER)).toBeNull();
  });

  it('never resolves to another user’s wallet', async () => {
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.WALLETS]: [
        wallet({ id: 'w-theirs', profile_id: STRANGER, lightning_address: 'theirs@ln' }),
      ],
    });

    expect(await resolveUserWallet(client, OWNER)).toBeNull();
  });

  it('prefers the primary wallet when several are equally capable', async () => {
    // Deliberately listed non-primary first: only a real primary-first ordering
    // picks w-primary here.
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.WALLETS]: [
        wallet({ id: 'w-secondary', lightning_address: 'second@ln', created_at: '2026-01-01' }),
        wallet({
          id: 'w-primary',
          is_primary: true,
          lightning_address: 'first@ln',
          created_at: '2026-06-01',
        }),
      ],
    });

    const resolved = await resolveUserWallet(client, OWNER);

    expect(resolved).toEqual({
      method: 'lightning_address',
      wallet_id: 'w-primary',
      lightning_address: 'first@ln',
    });
  });

  it('breaks ties between non-primary wallets by age, oldest first', async () => {
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.WALLETS]: [
        wallet({ id: 'w-new', lightning_address: 'new@ln', created_at: '2026-06-01' }),
        wallet({ id: 'w-old', lightning_address: 'old@ln', created_at: '2026-01-01' }),
      ],
    });

    expect(await resolveUserWallet(client, OWNER)).toMatchObject({ wallet_id: 'w-old' });
  });

  it('prefers NWC over a Lightning address held by a different wallet', async () => {
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.WALLETS]: [
        wallet({ id: 'w-ln', is_primary: true, lightning_address: 'me@ln' }),
        wallet({ id: 'w-nwc', nwc_connection_uri: 'nostr+walletconnect://relay' }),
      ],
    });

    expect(await resolveUserWallet(client, OWNER)).toEqual({
      method: 'nwc',
      wallet_id: 'w-nwc',
      nwc_uri: 'nostr+walletconnect://relay',
    });
  });

  it('falls through to Lightning when the NWC secret cannot be decrypted', async () => {
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.WALLETS]: [
        wallet({ id: 'w-nwc', nwc_connection_uri: 'CORRUPT' }),
        wallet({ id: 'w-ln', lightning_address: 'me@ln' }),
      ],
    });
    decryptMock.mockImplementation((s: string) => {
      if (s === 'CORRUPT') {
        throw new Error('bad key');
      }
      return s;
    });

    expect(await resolveUserWallet(client, OWNER)).toEqual({
      method: 'lightning_address',
      wallet_id: 'w-ln',
      lightning_address: 'me@ln',
    });
  });

  it('rejects an xpub as a payable address and carries the key instead', async () => {
    // Handing `bitcoin:zpub...` to a payer is a QR no wallet can pay; it shipped
    // once. The key must travel as onchain_xpub so an address is derived later.
    const zpub =
      'zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs';
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.WALLETS]: [
        wallet({ id: 'w-xpub', wallet_type: 'xpub', address_or_xpub: zpub }),
      ],
    });

    const resolved = await resolveUserWallet(client, OWNER);

    expect(resolved).toEqual({ method: 'onchain', wallet_id: 'w-xpub', onchain_xpub: zpub });
    expect(resolved).not.toHaveProperty('onchain_address');
  });
});

describe('resolveSpecificUserWallet — ownership is part of the query', () => {
  const rows = [
    wallet({ id: 'w-mine', lightning_address: 'mine@ln' }),
    wallet({ id: 'w-theirs', profile_id: STRANGER, lightning_address: 'theirs@ln' }),
    wallet({ id: 'w-dead', is_active: false, lightning_address: 'dead@ln' }),
  ];

  it('resolves the caller’s own wallet', async () => {
    const { client } = createFakeSupabase({ [DATABASE_TABLES.WALLETS]: rows });

    expect(await resolveSpecificUserWallet(client, OWNER, 'w-mine')).toEqual({
      method: 'lightning_address',
      wallet_id: 'w-mine',
      lightning_address: 'mine@ln',
    });
  });

  it('refuses a wallet id belonging to someone else', async () => {
    const { client } = createFakeSupabase({ [DATABASE_TABLES.WALLETS]: rows });

    expect(await resolveSpecificUserWallet(client, OWNER, 'w-theirs')).toBeNull();
  });

  it('refuses a deactivated wallet of the caller’s own', async () => {
    const { client } = createFakeSupabase({ [DATABASE_TABLES.WALLETS]: rows });

    expect(await resolveSpecificUserWallet(client, OWNER, 'w-dead')).toBeNull();
  });
});

describe('resolveSellerWallet — group entities', () => {
  const GROUP = 'group-1';

  function groupWallet(over: Row): Row {
    return {
      id: 'gw',
      group_id: GROUP,
      is_active: true,
      lightning_address: null,
      bitcoin_address: null,
      created_at: '2026-01-01',
      ...over,
    };
  }

  it('pays the group’s own wallet, never another group’s', async () => {
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.ENTITY_WALLETS]: [],
      [DATABASE_TABLES.GROUP_WALLETS]: [
        groupWallet({ id: 'gw-other', group_id: 'group-2', lightning_address: 'other@ln' }),
        groupWallet({ id: 'gw-ours', lightning_address: 'ours@ln' }),
      ],
    });
    getAdminClientMock.mockReturnValue(client);

    expect(await resolveSellerWallet({} as never, 'group', GROUP)).toEqual({
      method: 'lightning_address',
      wallet_id: 'gw-ours',
      lightning_address: 'ours@ln',
    });
  });

  it('ignores deactivated group wallets', async () => {
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.ENTITY_WALLETS]: [],
      [DATABASE_TABLES.GROUP_WALLETS]: [
        groupWallet({ id: 'gw-dead', is_active: false, lightning_address: 'dead@ln' }),
        groupWallet({ id: 'gw-live', bitcoin_address: 'bc1qlive' }),
      ],
    });
    getAdminClientMock.mockReturnValue(client);

    expect(await resolveSellerWallet({} as never, 'group', GROUP)).toEqual({
      method: 'onchain',
      wallet_id: 'gw-live',
      onchain_address: 'bc1qlive',
    });
  });

  it('returns null when the group has wallets but none can receive', async () => {
    const { client } = createFakeSupabase({
      [DATABASE_TABLES.ENTITY_WALLETS]: [],
      [DATABASE_TABLES.GROUP_WALLETS]: [groupWallet({ id: 'gw-empty' })],
    });
    getAdminClientMock.mockReturnValue(client);

    expect(await resolveSellerWallet({} as never, 'group', GROUP)).toBeNull();
  });
});
