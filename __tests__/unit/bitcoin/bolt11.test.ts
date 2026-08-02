/**
 * The BOLT11 reader exists so nobody confirms a payment whose amount we never
 * showed them. It is deliberately parse-only — the amounts here are checked
 * against the BOLT11 spec's own examples plus the invoices this codebase has
 * actually minted in production.
 */

import { parseBolt11, isPayableBolt11, normalizeBolt11 } from '@/lib/bitcoin/bolt11';

// Minted live by /api/receive/request against a real wallet (0.0001 BTC = 100u).
const REAL_INVOICE = 'LNBC100U1P4X7MCDSP5DLUR9Z6KLRLZNJMAELF96XRG5W5YHQAUSXW2R4KAN';

describe('normalizeBolt11', () => {
  it('strips the lightning: scheme a QR or wallet prepends', () => {
    expect(normalizeBolt11('lightning:lnbc100u1pabc')).toBe('lnbc100u1pabc');
    expect(normalizeBolt11('LIGHTNING:LNBC100U1PABC')).toBe('lnbc100u1pabc');
  });

  it('trims surrounding whitespace from a paste', () => {
    expect(normalizeBolt11('  lnbc100u1pabc \n')).toBe('lnbc100u1pabc');
  });
});

describe('parseBolt11 amounts', () => {
  it.each([
    ['milli', 'lnbc1m1pabc', 0.001],
    ['micro', 'lnbc100u1pabc', 0.0001],
    ['nano', 'lnbc1000n1pabc', 0.000001],
    ['pico', 'lnbc10000p1pabc', 0.00000001],
    ['whole BTC', 'lnbc11pabc', 1],
  ])('reads a %s-denominated amount', (_label, invoice, expected) => {
    expect(parseBolt11(invoice)?.amountBtc).toBeCloseTo(expected, 12);
  });

  it('reads the amount from a real production invoice', () => {
    expect(parseBolt11(REAL_INVOICE)?.amountBtc).toBeCloseTo(0.0001, 12);
  });

  it('reports null — not zero — for an any-amount invoice', () => {
    expect(parseBolt11('lnbc1pabc')).toEqual({ network: 'mainnet', amountBtc: null });
  });

  it('rounds a sub-satoshi amount to null rather than showing dust', () => {
    expect(parseBolt11('lnbc1p1pabc')?.amountBtc).toBeNull();
  });
});

describe('parseBolt11 networks', () => {
  it.each([
    ['lnbc100u1pabc', 'mainnet'],
    ['lntb100u1pabc', 'testnet'],
    ['lnbcrt100u1pabc', 'regtest'],
    ['lntbs100u1pabc', 'signet'],
  ])('identifies %s as %s', (invoice, network) => {
    expect(parseBolt11(invoice)?.network).toBe(network);
  });

  it('does not mistake regtest for mainnet — prefix order matters', () => {
    expect(parseBolt11('lnbcrt1m1pabc')?.network).toBe('regtest');
    expect(isPayableBolt11('lnbcrt1m1pabc')).toBe(false);
  });

  it('accepts only mainnet as payable', () => {
    expect(isPayableBolt11(REAL_INVOICE)).toBe(true);
    expect(isPayableBolt11('lntb100u1pabc')).toBe(false);
  });
});

describe('parseBolt11 rejections', () => {
  it.each([
    ['empty', ''],
    ['a lightning address', 'lena@orangecat.ch'],
    ['an on-chain address', 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'],
    ['arbitrary text', 'pay me please'],
    ['a non-numeric amount field', 'lnbcxyzu1pabc'],
  ])('returns null for %s', (_label, input) => {
    expect(parseBolt11(input)).toBeNull();
    expect(isPayableBolt11(input)).toBe(false);
  });
});
