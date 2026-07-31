/**
 * Address/xpub validation, tested against REAL cryptographic checks.
 *
 * These assertions were previously impossible: a global jest mock replaced the
 * validator with `() => true`, so any string — including a corrupted checksum —
 * "validated". These are the tests that mock silently prevented.
 */

import { validateAddressOrXpub, detectWalletType } from '@/types/wallet';

describe('validateAddressOrXpub', () => {
  it('accepts every mainnet address family', () => {
    // P2PKH (legacy), P2SH, P2WPKH (bech32), P2TR (taproot)
    for (const address of [
      '1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabA',
      '37VucYSaXLCAsxYyAPfbSi9eh4iEcbShgf',
      'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297',
    ]) {
      expect(validateAddressOrXpub(address)).toMatchObject({ valid: true, type: 'address' });
    }
  });

  it('rejects an address with a corrupted checksum — the case the old mock let through', () => {
    // Last character flipped on a valid P2PKH address.
    expect(validateAddressOrXpub('1LqBGSKuX5yYUonjxT5qGfpUsXKYYWeabB').valid).toBe(false);
    // Corrupted bech32.
    expect(validateAddressOrXpub('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5').valid).toBe(false);
  });

  it('rejects testnet addresses on this mainnet product', () => {
    expect(validateAddressOrXpub('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx').valid).toBe(false);
    expect(validateAddressOrXpub('mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn').valid).toBe(false);
  });

  it('accepts mainnet extended keys', () => {
    const ZPUB =
      'zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYs';
    expect(validateAddressOrXpub(ZPUB)).toMatchObject({ valid: true, type: 'xpub' });
  });

  it('rejects testnet extended keys at save time, where the mistake is fixable', () => {
    // A tpub used to validate, then fail at invoice-creation time instead —
    // the user learned their wallet was broken only when someone tried to pay.
    const TPUB =
      'tpubDC5FSnBiZDMmhiuCmWAYsLwgLYrrT9rAqvTySfuCCrgsWz8wxMXUS9Tb9iVMvcRbvFcAHGkMD5Kx8koh4GquNGNTfohfk7pgjhaPCdXpoba';
    const result = validateAddressOrXpub(TPUB);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/mainnet/);
  });

  it('rejects an extended key with a corrupted checksum', () => {
    const CORRUPTED =
      'zpub6rFR7y4Q2AijBEqTUquhVz398htDFrtymD9xYYfG1m4wAcvPhXNfE3EfH1r1ADqtfSdVCToUG868RvUUkgDKf31mGDtKsAYz2oz2AGutZYt';
    expect(validateAddressOrXpub(CORRUPTED).valid).toBe(false);
  });
});

describe('detectWalletType', () => {
  it('classifies extended keys (even testnet ones) as xpub, never as an address', () => {
    // Classification and validation are different questions: a tpub IS an
    // extended key — validation rejects it, but calling it an address would
    // send it down the bitcoin: URI path.
    expect(detectWalletType('zpub6rFR7y4Q2Aij...')).toBe('xpub');
    expect(detectWalletType('tpubDC5FSnBiZDMm...')).toBe('xpub');
    expect(detectWalletType('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe('address');
  });
});
