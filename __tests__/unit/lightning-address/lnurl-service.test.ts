/**
 * lnurl-service — username→recipient resolution, Lightning-only wallet gating,
 * and metadata shape. Mocks the admin client (profiles lookup) and the reused
 * wallet resolver so we test the LNURL layer in isolation.
 */

import {
  resolveLnurlRecipient,
  resolveLnurlWallet,
  buildLnurlMetadata,
} from '@/domain/lightning-address/lnurl-service';
import { resolveUserWallet } from '@/domain/payments/walletResolutionService';
import { getAdminClient } from '@/lib/supabase/admin';

jest.mock('@/domain/payments/walletResolutionService', () => ({
  resolveUserWallet: jest.fn(),
}));
jest.mock('@/lib/supabase/admin', () => ({
  getAdminClient: jest.fn(),
}));

const mockResolveWallet = resolveUserWallet as jest.MockedFunction<typeof resolveUserWallet>;
const mockGetAdmin = getAdminClient as jest.MockedFunction<typeof getAdminClient>;

/** Admin stub whose profiles `.ilike(...).maybeSingle()` resolves to `profile`. */
function adminReturning(profile: Record<string, unknown> | null) {
  return {
    from: () => ({
      select: () => ({
        ilike: () => ({
          maybeSingle: async () => ({ data: profile, error: null }),
        }),
      }),
    }),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('resolveLnurlRecipient', () => {
  it('returns null for an unknown username', async () => {
    mockGetAdmin.mockReturnValue(adminReturning(null) as never);
    expect(await resolveLnurlRecipient('ghost')).toBeNull();
  });

  it('returns null for a blank username without querying', async () => {
    expect(await resolveLnurlRecipient('   ')).toBeNull();
    expect(mockGetAdmin).not.toHaveBeenCalled();
  });

  it('resolves a known username to its owner', async () => {
    mockGetAdmin.mockReturnValue(
      adminReturning({ id: 'u1', username: 'satoshi', display_name: 'Satoshi' }) as never
    );
    expect(await resolveLnurlRecipient('SATOSHI')).toEqual({
      userId: 'u1',
      username: 'satoshi',
      displayName: 'Satoshi',
    });
  });
});

describe('resolveLnurlWallet', () => {
  it('returns null when the only wallet is on-chain (not a Lightning rail)', async () => {
    mockResolveWallet.mockResolvedValue({ method: 'onchain', wallet_id: 'w1', onchain_address: 'bc1x' });
    expect(await resolveLnurlWallet('u1')).toBeNull();
  });

  it('returns null when the user has no wallet', async () => {
    mockResolveWallet.mockResolvedValue(null);
    expect(await resolveLnurlWallet('u1')).toBeNull();
  });

  it('returns a Lightning-capable wallet (nwc)', async () => {
    const wallet = { method: 'nwc' as const, wallet_id: 'w1', nwc_uri: 'nostr+walletconnect://x' };
    mockResolveWallet.mockResolvedValue(wallet);
    expect(await resolveLnurlWallet('u1')).toEqual(wallet);
  });
});

describe('buildLnurlMetadata', () => {
  it('produces a LUD-16 metadata array with plain text and identifier', () => {
    const meta = buildLnurlMetadata(
      { userId: 'u1', username: 'satoshi', displayName: 'Satoshi' },
      'orangecat.ch'
    );
    expect(JSON.parse(meta)).toEqual([
      ['text/plain', 'Pay Satoshi on OrangeCat'],
      ['text/identifier', 'satoshi@orangecat.ch'],
    ]);
  });
});
