/**
 * `expires_at` means "can a new payment still be made?" — a fact about the
 * rail. These tests pin that meaning, because conflating it with "how long we
 * watch" is what silently loses on-chain money: a fabricated deadline makes the
 * record terminal, the reconciliation sweep skips terminal rows, and a late
 * payment settles with no notification, no contribution row, no funding total.
 */

import {
  resolveIntentExpiry,
  expiresInSecondsFrom,
  LIGHTNING_FALLBACK_EXPIRY_MS,
} from '@/domain/payments/intentExpiry';

describe('resolveIntentExpiry', () => {
  it('never expires an on-chain intent — a Bitcoin address keeps accepting money', () => {
    expect(resolveIntentExpiry('onchain', null)).toBeNull();
  });

  it('ignores an expiry wrongly supplied for on-chain rather than trusting it', () => {
    // Defence in depth: even if a caller invents a deadline, the rail has none.
    const invented = new Date(Date.now() + 60_000).toISOString();
    expect(resolveIntentExpiry('onchain', invented)).toBeNull();
  });

  it("keeps a Lightning invoice's own expiry — the bolt11 really does die", () => {
    const stated = new Date(Date.now() + 900_000).toISOString();
    expect(resolveIntentExpiry('lightning_address', stated)).toBe(stated);
    expect(resolveIntentExpiry('nwc', stated)).toBe(stated);
  });

  it('falls back to an hour only when a Lightning provider stated no expiry', () => {
    const before = Date.now();
    const resolved = resolveIntentExpiry('nwc', null);
    expect(resolved).not.toBeNull();

    const deltaMs = new Date(resolved as string).getTime() - before;
    expect(deltaMs).toBeGreaterThan(LIGHTNING_FALLBACK_EXPIRY_MS - 5_000);
    expect(deltaMs).toBeLessThanOrEqual(LIGHTNING_FALLBACK_EXPIRY_MS + 5_000);
  });

  it('agrees across authenticated and account-free flows for the same rail', () => {
    // The regression this replaces: authed on-chain never expired while public
    // on-chain was handed an hour, so the same address behaved differently
    // depending on who was paying.
    expect(resolveIntentExpiry('onchain', null)).toBe(resolveIntentExpiry('onchain', null));
    expect(resolveIntentExpiry('onchain', null)).toBeNull();
  });
});

describe('expiresInSecondsFrom', () => {
  it('returns null when there is no deadline, never 0', () => {
    // 0 would render the payer's on-chain QR as already expired, telling them a
    // perfectly valid address is dead.
    expect(expiresInSecondsFrom(null)).toBeNull();
  });

  it('counts down to a real deadline', () => {
    const inTenMinutes = new Date(Date.now() + 600_000).toISOString();
    const secs = expiresInSecondsFrom(inTenMinutes);
    expect(secs).toBeGreaterThan(595);
    expect(secs).toBeLessThanOrEqual(600);
  });

  it('clamps a past deadline to 0 rather than going negative', () => {
    const anHourAgo = new Date(Date.now() - 3_600_000).toISOString();
    expect(expiresInSecondsFrom(anHourAgo)).toBe(0);
  });
});
