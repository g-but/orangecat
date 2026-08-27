/**
 * @jest-environment node
 *
 * Node rather than jsdom: this route is plain web-standard Request/Response,
 * which jsdom does not provide as globals.
 */
/**
 * This endpoint decides whether Caddy orders a TLS certificate, which makes it
 * the one place where being generous is expensive.
 *
 * Every 200 is an ACME order against our Let's Encrypt account, and that account
 * is rate-limited on failures. Anyone who points a hostname at this box and
 * requests it can spend that budget, so the rules being tested here are: only a
 * site that is published RIGHT NOW, never a reserved subdomain, and — the one
 * that is easy to get backwards — a denial rather than an approval when the
 * lookup itself fails.
 */

import { GET } from '@/app/api/internal/tls-check/route';
import { siteByHost } from '@/services/sites/registry';

jest.mock('@/services/sites/registry', () => ({ siteByHost: jest.fn() }));
jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

const mockSiteByHost = siteByHost as unknown as jest.Mock;

function ask(domain?: string) {
  const url = new URL('http://127.0.0.1:4003/api/internal/tls-check');
  if (domain !== undefined) {
    url.searchParams.set('domain', domain);
  }
  return GET(new Request(url));
}

const publishedSite = {
  site: {
    slug: 'acme',
    title: 'Acme',
    customDomain: 'acme.example',
    aliasHosts: [],
    profile: { kind: 'group' as const, slug: 'acme' },
    builder: null,
  },
  profile: null,
};

beforeEach(() => {
  mockSiteByHost.mockReset();
});

describe('tls-check — what earns a certificate', () => {
  it('approves a hostname a published site answers on', async () => {
    mockSiteByHost.mockResolvedValue(publishedSite);
    expect((await ask('acme.orangecat.ch')).status).toBe(200);
  });

  it('refuses a hostname no site claims', async () => {
    mockSiteByHost.mockResolvedValue(null);
    expect((await ask('nobody.orangecat.ch')).status).toBe(403);
  });

  it('refuses without a domain, and refuses a malformed one', async () => {
    expect((await ask()).status).toBe(403);
    expect((await ask('')).status).toBe(403);
    expect((await ask(`${'a'.repeat(300)}.example`)).status).toBe(403);
    expect(mockSiteByHost).not.toHaveBeenCalled();
  });
});

describe('tls-check — the refusals that matter', () => {
  /**
   * These already have certificates and their own Caddy blocks. Issuing a second
   * one is waste at best; `security.orangecat.ch` under our certificate is a
   * phish at worst. Refused BEFORE the lookup, so no database state can grant one.
   */
  it('refuses reserved subdomains without ever asking the database', async () => {
    mockSiteByHost.mockResolvedValue(publishedSite);

    for (const host of [
      'supabase.orangecat.ch',
      'fleetcrown.orangecat.ch',
      'security.orangecat.ch',
      'www.orangecat.ch',
      'kivvi.orangecat.ch',
    ]) {
      expect((await ask(host)).status).toBe(403);
    }
    expect(mockSiteByHost).not.toHaveBeenCalled();
  });

  it('refuses a multi-label subdomain, which no hosted site can have', async () => {
    mockSiteByHost.mockResolvedValue(publishedSite);
    expect((await ask('a.b.orangecat.ch')).status).toBe(403);
    expect(mockSiteByHost).not.toHaveBeenCalled();
  });

  /**
   * The one that is easy to get backwards. A database blip must not turn this
   * into an open certificate mint — an outage should cost new certificates, not
   * hand them out.
   */
  it('fails closed when the lookup throws', async () => {
    mockSiteByHost.mockRejectedValue(new Error('database unreachable'));
    expect((await ask('acme.example')).status).toBe(403);
  });
});
