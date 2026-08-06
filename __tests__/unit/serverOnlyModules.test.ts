/**
 * `.server.ts` must actually stay on the server.
 *
 * The suffix is a convention, and conventions don't fail builds. The stakes are
 * concrete: `services/currency/rateSource.server.ts` reaches a third party and
 * kicks off a refresh the moment it loads. Bundled into a client chunk it would
 * ship an outbound CoinGecko call to every visitor — a CSP violation, a privacy
 * leak, and one upstream request per person instead of one per minute for the
 * whole platform. Browsers get rates from our own /api/rates instead.
 *
 * A `'use client'` file importing anything `.server` is that mistake, so this
 * catches it in CI rather than in a network tab.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const IMPORT_SERVER = /(?:from|import\()\s*['"][^'"]*\.server['"]/;

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      sourceFiles(path, out);
    } else if (/\.tsx?$/.test(name)) {
      out.push(path);
    }
  }
  return out;
}

describe("'use client' modules never import server-only code", () => {
  it('finds no client file importing a *.server module', () => {
    const offenders = sourceFiles('src').filter(file => {
      const source = readFileSync(file, 'utf8');
      return /^\s*['"]use client['"]/m.test(source) && IMPORT_SERVER.test(source);
    });

    expect(offenders).toEqual([]);
  });
});
