/**
 * One place names a wallet provider.
 *
 * Three surfaces used to tell a user which Bitcoin wallet to get — the public
 * guide, the wallets page, and the field tips — each with its own copy of the
 * names, URLs and platform lists. They had already drifted (the guide's top pick
 * was Primal; the wallets page's was BlueWallet; neither knew about the other),
 * and none of them was reachable by the Cat, which is the surface that actually
 * meets someone with no wallet.
 *
 * This test is the reason a fourth copy cannot appear: adding a provider URL
 * anywhere but the registry fails the build.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { WALLET_PROVIDERS, LIGHTNING_ADDRESS_PROVIDERS } from '@/config/wallet-providers';

const SSOT_FILE = join('src', 'config', 'wallet-providers.ts');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe('wallet provider registry is the only place providers are named', () => {
  it('no source file outside the registry hardcodes a provider website', () => {
    const websites = Object.values(WALLET_PROVIDERS).map(p => p.website);
    const offenders: string[] = [];

    for (const file of sourceFiles('src')) {
      if (file === SSOT_FILE) {
        continue;
      }
      const contents = readFileSync(file, 'utf8');
      for (const website of websites) {
        if (contents.includes(website)) {
          offenders.push(`${file} hardcodes ${website}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('every provider carries the facts a recommendation needs', () => {
    for (const provider of Object.values(WALLET_PROVIDERS)) {
      expect(provider.website).toMatch(/^https:\/\//);
      expect(provider.platforms.length).toBeGreaterThan(0);
      expect(provider.oneLiner.length).toBeGreaterThan(0);
      // A provider that hands out a Lightning address has to say how long that
      // takes, because the shortlist is ordered by it — an undeclared one would
      // silently sort last and never be recommended.
      if (provider.lightningAddress) {
        expect(provider.minutesToLightningAddress).toBeGreaterThan(0);
      }
    }
  });

  it('the Lightning-address shortlist is ordered fastest-first', () => {
    const minutes = LIGHTNING_ADDRESS_PROVIDERS.map(p => p.minutesToLightningAddress ?? 99);
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
  });

  it('a wallet that cannot give a Lightning address never reaches the shortlist', () => {
    // The distinction the old copies blurred: "supports Lightning" is not
    // "gives you an address OrangeCat can store".
    expect(LIGHTNING_ADDRESS_PROVIDERS.every(p => p.lightningAddress)).toBe(true);
    expect(Object.values(WALLET_PROVIDERS).some(p => p.lightning && !p.lightningAddress)).toBe(
      true
    );
  });
});
