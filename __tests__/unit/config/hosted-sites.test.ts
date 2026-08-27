/**
 * A hosted site is the claim /domains makes, turned into code: a profile's own
 * data, served as a whole website on its own hostname. Three things have to
 * hold for that claim to be true, and none of them is obvious from reading a
 * component.
 *
 * 1. Host resolution has to work for the free subdomain, a custom domain and
 *    local development — and has to REFUSE everything else, because a
 *    too-eager match would silently swallow orangecat.ch itself.
 * 2. The site surface has to be a surface, not a chrome override, or a hosted
 *    site quietly grows OrangeCat's header on somebody else's domain.
 * 3. The pages have to be generated from the profile config rather than
 *    authored beside it, or the "spins up a website" claim is a copy-paste.
 */

import {
  RESERVED_SUBDOMAINS,
  isReservedSubdomain,
  siteHref,
  siteSlugForHost,
} from '@/config/sites';
import {
  ALWAYS_PUBLISHED,
  HOSTED_SITE_FALLBACKS,
  siteCanonicalHost,
  toHostedSite,
} from '@/config/hosted-site';
import {
  pageRendersOwnHeader,
  sitePageAt,
  sitePagesFor,
  siteChromeFor,
} from '@/config/site-content';
import { getRouteSurface, isHostedSiteRequest } from '@/config/routes';
import { COMPANY, MANDATE_CURVES, MATERIALS } from '@/config/substrata';
import { CHOKEPOINTS, COVERAGE, coverageProgress } from '@/config/substrata-coverage';

const site = HOSTED_SITE_FALLBACKS.substrata;

describe('hosted sites — host resolution', () => {
  it('resolves the free subdomain, with or without www and port', () => {
    expect(siteSlugForHost('substrata.orangecat.ch')).toBe('substrata');
    expect(siteSlugForHost('www.substrata.orangecat.ch')).toBe('substrata');
    expect(siteSlugForHost('Substrata.OrangeCat.ch:443')).toBe('substrata');
  });

  it('resolves the local development host, so the rewrite is testable without DNS', () => {
    expect(siteSlugForHost('substrata.localhost:3020')).toBe('substrata');
  });

  /**
   * Resolution is now positional rather than an allowlist — that is what makes a
   * new customer zero deploys. The safety therefore has to come from SHAPE, and
   * these are the shapes that must never resolve.
   */
  it('refuses everything else — a greedy match would swallow OrangeCat itself', () => {
    for (const host of [
      'orangecat.ch',
      'www.orangecat.ch',
      'localhost:3000',
      'substrata.evil.example',
      'substrata.orangecat.ch.evil.example',
      'a.b.orangecat.ch',
      '.orangecat.ch',
      'sub_domain.orangecat.ch',
      '-leading.orangecat.ch',
      'trailing-.orangecat.ch',
      '',
      null,
      undefined,
    ]) {
      expect(siteSlugForHost(host)).toBeNull();
    }
  });

  /**
   * An unclaimed slug MUST resolve, because the page is what knows whether a
   * site exists. If this ever returned null the whole no-deploy path would be
   * gone and every customer would need a code change again.
   */
  it('resolves a slug no site has claimed, leaving existence to the page', () => {
    expect(siteSlugForHost('a-brand-new-customer.orangecat.ch')).toBe('a-brand-new-customer');
  });

  /**
   * The dangerous half of a positional match. `security.orangecat.ch` under our
   * own certificate is a phish; `supabase.orangecat.ch` is the database. Neither
   * may ever be handed to a group that happens to pick that slug.
   */
  it('refuses every reserved subdomain, infrastructure and impersonation alike', () => {
    for (const { label } of RESERVED_SUBDOMAINS) {
      expect(isReservedSubdomain(label)).toBe(true);
      expect(siteSlugForHost(`${label}.orangecat.ch`)).toBeNull();
      expect(siteSlugForHost(`${label.toUpperCase()}.orangecat.ch`)).toBeNull();
    }
  });

  it('reserves the hosts that are actually live on the box', () => {
    // Every one of these has its own Caddy block today. A site claiming one
    // would be shadowed by it, or would shadow it.
    for (const live of ['www', 'bridge', 'fleetcrown', 'evig', 'supabase']) {
      expect(isReservedSubdomain(live)).toBe(true);
    }
  });

  it('advertises the custom domain once one is set, and the subdomain until then', () => {
    const bare = toHostedSite({ slug: 'acme', name: 'Acme' }, {});
    expect(siteCanonicalHost(bare)).toBe('acme.orangecat.ch');

    const custom = toHostedSite({ slug: 'acme', name: 'Acme' }, { customDomain: 'acme.example' });
    expect(siteCanonicalHost(custom)).toBe('acme.example');
  });
});

describe('hosted sites — the config a site owner may set', () => {
  /**
   * `group_features.config` is jsonb, which is `any` wearing a hat. Whatever a
   * client wrote there reaches this function, so a bad field must cost that
   * field and never the customer's whole website.
   */
  it('falls back to the group name and drops malformed fields', () => {
    const site = toHostedSite(
      { slug: 'acme', name: 'Acme Corp' },
      { title: '   ', customDomain: 'not a hostname', aliasHosts: ['ok.example', 'nodot', ''] }
    );
    expect(site.title).toBe('Acme Corp');
    expect(site.customDomain).toBeNull();
    expect(site.aliasHosts).toEqual(['ok.example']);
  });

  it('survives config that is not an object at all', () => {
    for (const junk of [null, undefined, 42, 'string', []]) {
      expect(toHostedSite({ slug: 'acme', name: 'Acme' }, junk).title).toBe('Acme');
    }
  });

  it('marks only repo-resident sites as bespoke, so everyone else renders from their profile', () => {
    expect(toHostedSite({ slug: 'substrata', name: 'Substrata' }, {}).builder).toBe('substrata');
    expect(toHostedSite({ slug: 'acme', name: 'Acme' }, {}).builder).toBeNull();
  });
});

describe('hosted sites — the rewrite must not leak OrangeCat onto a customer domain', () => {
  /**
   * This is the case that shipped broken.
   *
   * A hosted site is served by a REWRITE, so the browser path stays "/" while
   * `/sites/<slug>` renders. Everything that decided chrome from the visible
   * path therefore classified a customer's website as OrangeCat's public
   * marketing surface, and substrata.orangecat.ch came up with OrangeCat's
   * header, "Sign In", our Google Analytics, our Organization schema and the
   * internal FleetCrown feedback widget on it.
   *
   * The old tests all asked `getRouteSurface('/sites/substrata')` — the path
   * form, which was never broken. None of them asked what happens when the path
   * is "/" and only a header knows better.
   */
  function headersOf(map: Record<string, string>) {
    return (name: string) => map[name] ?? null;
  }

  it('recognises a rewritten request, whose visible path is only "/"', () => {
    expect(getRouteSurface('/')).toBe('public');
    expect(isHostedSiteRequest(headersOf({ 'x-pathname': '/' }))).toBe(false);

    // The rewrite sets this. Without it the request is indistinguishable from
    // a visit to orangecat.ch itself.
    expect(
      isHostedSiteRequest(headersOf({ 'x-pathname': '/', 'x-hosted-site': 'substrata' }))
    ).toBe(true);
  });

  it('recognises a deep page on a hosted site', () => {
    expect(
      isHostedSiteRequest(headersOf({ 'x-pathname': '/map', 'x-hosted-site': 'substrata' }))
    ).toBe(true);
  });

  it('recognises the preview form, which has no rewrite and no header', () => {
    expect(isHostedSiteRequest(headersOf({ 'x-pathname': '/sites/substrata' }))).toBe(true);
    expect(isHostedSiteRequest(headersOf({ 'x-pathname': '/sites/substrata/map' }))).toBe(true);
  });

  it('leaves ordinary OrangeCat requests alone, header absent', () => {
    for (const path of ['/', '/dashboard', '/about', '/groups/substrata', '/auth']) {
      expect(isHostedSiteRequest(headersOf({ 'x-pathname': path }))).toBe(false);
    }
    expect(isHostedSiteRequest(headersOf({}))).toBe(false);
  });
});

describe('hosted sites — links', () => {
  it('always emits the path form, which resolves on every host', () => {
    expect(siteHref(site.slug)).toBe('/sites/substrata');
    expect(siteHref(site.slug, 'map')).toBe('/sites/substrata/map');
    expect(siteHref(site.slug, '/map')).toBe('/sites/substrata/map');
    expect(siteHref(site.slug, '/')).toBe('/sites/substrata');
  });
});

describe('hosted sites — chrome isolation', () => {
  it('classifies a hosted site as its own surface, not app or public', () => {
    expect(getRouteSurface('/sites/substrata')).toBe('site');
    expect(getRouteSurface('/sites/substrata/map')).toBe('site');
  });

  it('leaves the rest of the app classified as it was', () => {
    expect(getRouteSurface('/dashboard')).toBe('app');
    expect(getRouteSurface('/about')).toBe('public');
    expect(getRouteSurface('/auth')).toBe('auth');
    expect(getRouteSurface('/groups/substrata')).toBe('app');
  });
});

describe('hosted sites — every site renders', () => {
  it.each(ALWAYS_PUBLISHED.map(slug => [slug, HOSTED_SITE_FALLBACKS[slug]] as const))(
    '%s has chrome, a home page, and a nav where every entry resolves',
    (_slug, site) => {
      const chrome = siteChromeFor(site, null);
      const pages = sitePagesFor(site, null);

      expect(chrome).not.toBeNull();
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.some(page => page.path === '')).toBe(true);

      // Unique paths, or two nav entries fight over one URL.
      const paths = pages.map(page => page.path);
      expect(new Set(paths).size).toBe(paths.length);

      for (const page of pages) {
        // The builders return fresh objects per call, so compare by value.
        expect(sitePageAt(sitePagesFor(site, null), page.path)).toEqual(page);
        expect(page.title.length).toBeGreaterThan(0);
        expect(page.sections.length).toBeGreaterThan(0);
      }
    }
  );

  it('returns null for a path no page claims, so the route can 404', () => {
    expect(sitePageAt(sitePagesFor(site, null), 'not-a-page')).toBeNull();
  });
});

describe('substrata.orangecat.ch — the site is the profile, not a copy of it', () => {
  const pages = sitePagesFor(site, null);
  const text = JSON.stringify(pages);

  it('takes its name and tagline from the profile config', () => {
    const chrome = siteChromeFor(site);
    expect(chrome?.name).toBe(COMPANY.name);
    expect(chrome?.tagline).toBe(COMPANY.tagline);
  });

  it('renders every material under coverage, from the same config the profile uses', () => {
    for (const material of MATERIALS) {
      expect(text).toContain(material.title);
    }
  });

  it('renders every producer in the coverage universe', () => {
    for (const entry of COVERAGE) {
      for (const producer of entry.producers) {
        expect(text).toContain(producer.name);
      }
    }
  });

  it('states the mandate the profile states', () => {
    for (const curve of MANDATE_CURVES) {
      expect(text).toContain(curve.label);
    }
  });

  it('reports coverage honestly — unsourced rows read as leads, not findings', () => {
    const mapPage = sitePageAt(sitePagesFor(site, null), 'map');
    const rows = JSON.stringify(mapPage);
    const { sourced, total } = coverageProgress();

    // Every row the config has not sourced must be labelled as unverified on
    // the public page. This is the test that stops the website becoming the
    // place where the caveat quietly gets dropped.
    if (sourced < total) {
      expect(rows).toContain('Unverified lead');
    }

    // And the meter must carry the same two numbers, so the picture and the
    // table can never disagree about how much is actually done.
    const meter = mapPage!.sections.find(section => section.kind === 'meter');
    expect(meter).toMatchObject({ value: sourced, of: total });
  });

  it('gives the map a jump index whose every anchor lands on a real table', () => {
    const mapPage = sitePageAt(sitePagesFor(site, null), 'map')!;
    const index = mapPage.sections.find(section => section.kind === 'index');
    expect(index).toBeDefined();

    const anchors = new Set(
      mapPage.sections.flatMap(section =>
        section.kind === 'table' && section.anchor ? [section.anchor] : []
      )
    );
    const entries = index!.kind === 'index' ? index.entries : [];
    expect(entries.length).toBe(COVERAGE.length);
    for (const entry of entries) {
      expect(anchors.has(entry.anchor)).toBe(true);
    }
  });

  it('opens the home page with a hero, and never doubles it with a title block', () => {
    const home = sitePageAt(sitePagesFor(site, null), '')!;
    expect(home.sections[0].kind).toBe('hero');
    expect(pageRendersOwnHeader(home)).toBe(true);

    // Inner pages take the standard header instead.
    expect(pageRendersOwnHeader(sitePageAt(sitePagesFor(site, null), 'map')!)).toBe(false);
  });

  it('has no desk page, because there is no desk', () => {
    expect(sitePageAt(sitePagesFor(site, null), 'desk')).toBeNull();
    const navLabels = sitePagesFor(site, null).map(page => page.navLabel);
    expect(navLabels).not.toContain('The desk');
  });

  it('carries the non-material chokepoints, so the site shows the whole universe', () => {
    const page = sitePageAt(sitePagesFor(site, null), 'chokepoints');
    expect(page).not.toBeNull();
    const text = JSON.stringify(page);
    for (const point of CHOKEPOINTS) {
      expect(text).toContain(point.name);
    }
  });

  it('says nowhere that the firm trades, quotes or takes a position', () => {
    // The whole site, not one page: if a price or an invitation to deal ever
    // reappears anywhere, this is what catches it before a reader does.
    const everything = JSON.stringify(sitePagesFor(site, null));
    for (const phrase of ['RFQ', 'per kg', 'Indicative CHF', 'Settlement in Bitcoin']) {
      expect(`${phrase}: ${everything.includes(phrase)}`).toBe(`${phrase}: false`);
    }
    expect(everything).toContain('no trading desk');
  });
});
