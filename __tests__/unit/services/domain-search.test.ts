/**
 * Domain search has exactly one way to be dangerous: telling somebody a name
 * is free when it is not. They act on that — they plan a brand around it, or
 * they stop looking.
 *
 * The naive version of this feature (ask a redirector, treat 404 as available)
 * fails precisely that way, and it fails on this project's own domain: .ch
 * runs no public RDAP service, so orangecat.ch — registered, in production,
 * serving the app these tests belong to — comes back 404. So does .io, and
 * so does .co.
 *
 * These tests hold the rule that prevents it: `unregistered` is reachable ONLY
 * for a TLD in IANA's RDAP bootstrap that answered 404. Every other path —
 * unsupported TLD, timeout, transport error, odd status, missing bootstrap —
 * is `unknown`. Nothing here talks to the network.
 */

import {
  checkDomain,
  checkDomains,
  domainCacheSize,
  parseDomain,
  resetDomainCaches,
} from '@/services/domains/availability';
import { suggestDomains, toSeed } from '@/services/domains/suggest';
import { CANDIDATE_TLDS, DOMAIN_RESULT_CACHE_MAX, MAX_CANDIDATES } from '@/config/domain-search';

const RDAP_TLDS = new Set(['com', 'ai', 'dev', 'org', 'net', 'xyz']);

const originalFetch = global.fetch;

/**
 * True when a URL's HOST is exactly IANA's bootstrap host.
 *
 * Not a substring test on the raw URL — that also matches
 * `https://data.iana.org.evil.example/` and `https://evil.example/?x=data.iana.org`,
 * so it is the wrong shape to teach in a test that other lookups get copied from.
 */
function isBootstrapUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'data.iana.org';
  } catch {
    return false;
  }
}

function mockFetch(impl: (url: string) => Promise<Partial<Response>> | Partial<Response>) {
  global.fetch = vi.fn(async (input: RequestInfo | URL) =>
    impl(String(input))
  ) as unknown as typeof fetch;
}

beforeEach(() => {
  resetDomainCaches();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('parseDomain', () => {
  it('accepts a plain domain and normalises it', () => {
    expect(parseDomain('SubstrataIntel.COM')).toEqual({ name: 'substrataintel', tld: 'com' });
    expect(parseDomain(' https://substrataintel.com/path ')).toEqual({
      name: 'substrataintel',
      tld: 'com',
    });
    expect(parseDomain('substrataintel.com.')).toEqual({ name: 'substrataintel', tld: 'com' });
  });

  it('rejects things that are not domains', () => {
    for (const input of ['substrataintel', '', '   ', '-bad.com', 'bad-.com', 'x.c', 'a b.com']) {
      expect(parseDomain(input)).toBeNull();
    }
  });
});

describe('availability — the rule that stops a false “available”', () => {
  it('reports unregistered only when a supported registry answers 404', async () => {
    mockFetch(() => ({ status: 404, ok: false }));
    const result = await checkDomain('substrataintel.com', RDAP_TLDS);

    expect(result.status).toBe('unregistered');
    expect(result.rdapSupported).toBe(true);
  });

  it('reports registered when the registry returns a record', async () => {
    mockFetch(() => ({ status: 200, ok: true }));
    const result = await checkDomain('google.com', RDAP_TLDS);
    expect(result.status).toBe('registered');
  });

  it.each(['ch', 'io', 'co'])(
    'never claims a .%s domain is free — that registry publishes no RDAP',
    async tld => {
      // A redirector 404s for these exactly as it does for a free name. If this
      // test ever goes green on 'unregistered', the feature is lying.
      mockFetch(() => ({ status: 404, ok: false }));
      const result = await checkDomain(`orangecat.${tld}`, RDAP_TLDS);

      expect(result.status).toBe('unknown');
      expect(result.rdapSupported).toBe(false);
      expect(result.reason).toContain('no RDAP service');
    }
  );

  it('treats a timeout as unresolved, never as free', async () => {
    mockFetch(() => {
      throw new Error('TimeoutError');
    });
    const result = await checkDomain('substrataintel.com', RDAP_TLDS);
    expect(result.status).toBe('unknown');
  });

  it('treats an unexpected registry status as unresolved', async () => {
    mockFetch(() => ({ status: 500, ok: false }));
    const result = await checkDomain('substrataintel.com', RDAP_TLDS);
    expect(result.status).toBe('unknown');
  });

  it('treats a missing bootstrap as unresolved rather than assuming anything', async () => {
    mockFetch(() => ({ status: 404, ok: false }));
    const result = await checkDomain('substrataintel.com', null);
    expect(result.status).toBe('unknown');
    expect(result.reason).toContain('could not be loaded');
  });

  it('rejects a malformed query without calling any registry', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await checkDomain('not a domain', RDAP_TLDS);
    expect(result.status).toBe('unknown');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('caches a result so a repeated lookup does not hit the registry twice', async () => {
    const fetchSpy = vi.fn(async () => ({ status: 404, ok: false }) as Partial<Response>);
    global.fetch = fetchSpy as unknown as typeof fetch;

    await checkDomain('substrataintel.com', RDAP_TLDS);
    await checkDomain('substrataintel.com', RDAP_TLDS);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('availability — batches', () => {
  it('checks every candidate and preserves order', async () => {
    mockFetch(url =>
      isBootstrapUrl(url)
        ? { ok: true, status: 200, json: async () => ({ services: [[['com', 'ai'], ['x']]] }) }
        : { status: 404, ok: false }
    );

    const results = await checkDomains(['a.com', 'b.ai', 'c.ch']);
    expect(results.map(r => r.domain)).toEqual(['a.com', 'b.ai', 'c.ch']);
    expect(results.map(r => r.status)).toEqual(['unregistered', 'unregistered', 'unknown']);
  });
});

describe('suggestions', () => {
  it('reduces a phrase to a usable label', () => {
    expect(toSeed('Substrata Intel')).toBe('substrataintel');
    expect(toSeed('  Café Ltd. ')).toBe('cafeltd');
    expect(toSeed('!!!')).toBe('');
  });

  it('leads with the exact domain when the user typed one', () => {
    const candidates = suggestDomains({ query: 'substrataintel.com' });
    expect(candidates[0]).toBe('substrataintel.com');
  });

  it('offers the bare name across every TLD before any invented variant', () => {
    const candidates = suggestDomains({ query: 'substrate' });
    const bare = CANDIDATE_TLDS.map(tld => `substrate.${tld}`);
    expect(candidates.slice(0, bare.length)).toEqual(bare);
  });

  it('honours a caller-supplied TLD list, which is how FleetCrown narrows it', () => {
    const candidates = suggestDomains({ query: 'substrate', tlds: ['.ch', 'COM'] });
    expect(candidates.slice(0, 2)).toEqual(['substrate.ch', 'substrate.com']);
  });

  it('never fans out past the cap, and never repeats a candidate', () => {
    const candidates = suggestDomains({ query: 'substrate' });
    expect(candidates.length).toBeLessThanOrEqual(MAX_CANDIDATES);
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  it('returns nothing usable for a query with no letters or digits', () => {
    expect(suggestDomains({ query: '???' })).toEqual([]);
  });
});

describe('availability — the result cache is bounded', () => {
  /**
   * The cache key is a domain the CALLER supplies. An unbounded map therefore
   * lets an anonymous caller decide how much memory this process holds, and the
   * process on the box runs for weeks. A TTL does not fix that on its own: an
   * expired entry is only noticed when its own key is looked up again, which an
   * enumerating caller never does.
   */
  it('never exceeds the cap, however many distinct names are asked for', async () => {
    mockFetch(url =>
      isBootstrapUrl(url)
        ? { ok: true, status: 200, json: async () => ({ services: [[['com'], ['x']]] }) }
        : { status: 404, ok: false }
    );

    const overflow = DOMAIN_RESULT_CACHE_MAX + 250;
    const names = Array.from({ length: overflow }, (_, i) => `enumerated-${i}.com`);
    await checkDomains(names);

    expect(domainCacheSize()).toBeLessThanOrEqual(DOMAIN_RESULT_CACHE_MAX);
  }, 30_000);

  it('still answers from cache for a name asked twice in a row', async () => {
    let lookups = 0;
    mockFetch(url => {
      if (isBootstrapUrl(url)) {
        return { ok: true, status: 200, json: async () => ({ services: [[['com'], ['x']]] }) };
      }
      lookups += 1;
      return { status: 404, ok: false };
    });

    await checkDomain('cached-name.com', new Set(['com']));
    await checkDomain('cached-name.com', new Set(['com']));

    expect(lookups).toBe(1);
  });
});
