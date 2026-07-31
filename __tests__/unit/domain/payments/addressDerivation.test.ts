/**
 * Derivation is checked against the published BIP44/49/84 test vectors (the
 * standard "abandon … about" mnemonic). Deriving a wrong-but-valid address is
 * the worst failure mode in this codebase — money goes somewhere the
 * recipient's wallet never scans — so nothing short of the spec's own numbers
 * counts as proof.
 */

import { deriveOnchainAddress } from '@/domain/payments/addressDerivation';

const XPUB =
  'xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSWGFNbi8Aw6ZRc1brxMyWMzG3DSSSSoekkudhUd9yLb6qx39T9nMdj';
const YPUB =
  'ypub6Ww3ibxVfGzLrAH1PNcjyAWenMTbbAosGNB6VvmSEgytSER9azLDWCxoJwW7Ke7icmizBMXrzBx9979FfaHxHcrArf3zbeJJJUZPf663zsP';
const ZPUB =
  'zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs';

describe('deriveOnchainAddress', () => {
  it('derives BIP84 native-segwit addresses from a zpub (spec vectors)', () => {
    expect(deriveOnchainAddress(ZPUB, 0)).toBe('bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu');
    expect(deriveOnchainAddress(ZPUB, 1)).toBe('bc1qnjg0jd8228aq7egyzacy8cys3knf9xvrerkf9g');
  });

  it('derives BIP49 wrapped-segwit addresses from a ypub (spec vector)', () => {
    expect(deriveOnchainAddress(YPUB, 0)).toBe('37VucYSaXLCAsxYyAPfbSi9eh4iEcbShgf');
  });

  it('derives BIP44 legacy addresses from an xpub (spec vector)', () => {
    expect(deriveOnchainAddress(XPUB, 0)).toBe('1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA');
  });

  it('every index yields a distinct address — uniqueness is the whole point', () => {
    const addresses = new Set(Array.from({ length: 25 }, (_, i) => deriveOnchainAddress(ZPUB, i)));
    expect(addresses.size).toBe(25);
  });

  it('rejects testnet keys — a testnet address shown to a mainnet payer loses money', () => {
    const TPUB =
      'tpubDC5FSnBiZDMmhiuCmWAYsLwgLYrrT9rAqvTySfuCCrgsWz8wxMXUS9Tb9iVMvcRbvFcAHGkMD5Kx8koh4GquNGNTfohfk7pgjhaPCdXpoba';
    expect(() => deriveOnchainAddress(TPUB, 0)).toThrow(/Unsupported extended key prefix/);
  });

  it('rejects garbage and out-of-range indexes', () => {
    expect(() => deriveOnchainAddress('not-a-key', 0)).toThrow();
    expect(() => deriveOnchainAddress(ZPUB, -1)).toThrow(/out of range/);
    expect(() => deriveOnchainAddress(ZPUB, 1.5)).toThrow(/out of range/);
    expect(() => deriveOnchainAddress(ZPUB, 0x80000000)).toThrow(/out of range/);
  });
});
