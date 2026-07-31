/**
 * An extended public key is not a payment address.
 *
 * `address_or_xpub` holds either, and nothing in this codebase derives an
 * address from an xpub — `bip32` and `bitcoinjs-lib` are dependencies that no
 * module imports. Before this, an xpub-only wallet resolved to
 * `method: 'onchain'` with the xpub as the address, so the payer was shown
 * `bitcoin:xpub6...` — a QR no wallet can pay — while the product reported the
 * seller as ready to receive. The wallets page recommends xpubs, so following
 * our own advice was the way to break receiving.
 */

import { resolveUserWallet } from '@/domain/payments/walletResolutionService';
import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));
jest.mock('@/domain/payments/encryptionService', () => ({ decrypt: (v: string) => v }));

/** Minimal stub of the chained select used by resolveUserWallet. */
function clientReturning(wallets: Array<Record<string, unknown>>): SupabaseClient {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq']) {
    builder[m] = jest.fn(() => builder);
  }
  let orderCalls = 0;
  builder.order = jest.fn(() => {
    orderCalls += 1;
    // Second .order() resolves the query.
    return orderCalls >= 2 ? Promise.resolve({ data: wallets, error: null }) : builder;
  });
  return { from: () => builder } as unknown as SupabaseClient;
}

const XPUB =
  'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz';
const ADDRESS = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

describe('on-chain payment address resolution', () => {
  it('refuses to hand an xpub to the payer as if it were an address', async () => {
    const resolved = await resolveUserWallet(
      clientReturning([{ id: 'w1', address_or_xpub: XPUB, wallet_type: 'xpub', is_primary: true }]),
      'user-1'
    );

    // No payment method at all is the honest answer — the same one the owner's
    // receive status gives — rather than an unpayable bitcoin: URI.
    expect(resolved).toBeNull();
  });

  it('still resolves a real address', async () => {
    const resolved = await resolveUserWallet(
      clientReturning([
        { id: 'w1', address_or_xpub: ADDRESS, wallet_type: 'onchain', is_primary: true },
      ]),
      'user-1'
    );

    expect(resolved).toMatchObject({ method: 'onchain', onchain_address: ADDRESS });
  });

  it('skips an xpub wallet to reach a payable one behind it', async () => {
    // The fallback branch used to take wallets[0] unconditionally, so an xpub
    // sitting first shadowed a perfectly good address further down.
    const resolved = await resolveUserWallet(
      clientReturning([
        { id: 'w1', address_or_xpub: XPUB, wallet_type: 'xpub', is_primary: true },
        { id: 'w2', address_or_xpub: ADDRESS, wallet_type: 'general', is_primary: false },
      ]),
      'user-1'
    );

    expect(resolved).toMatchObject({ method: 'onchain', wallet_id: 'w2' });
  });

  it('prefers Lightning over an on-chain address, unchanged', async () => {
    const resolved = await resolveUserWallet(
      clientReturning([
        { id: 'w1', address_or_xpub: ADDRESS, wallet_type: 'onchain', is_primary: true },
        { id: 'w2', lightning_address: 'mao@orangecat.ch', wallet_type: 'lightning' },
      ]),
      'user-1'
    );

    expect(resolved).toMatchObject({ method: 'lightning_address' });
  });
});
