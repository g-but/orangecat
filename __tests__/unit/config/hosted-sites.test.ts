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

import { HOSTED_SITES, siteBySlug, siteCanonicalHost, siteForHost, siteHref } from '@/config/sites';
import {
  pageRendersOwnHeader,
  sitePageAt,
  sitePagesFor,
  siteChromeFor,
} from '@/config/site-content';
import { getRouteSurface } from '@/config/routes';
import { CATALOGUE, COMPANY, MANDATE_CURVES } from '@/config/substrata-intel';
import { COVERAGE, coverageProgress } from '@/config/substrata-intel-coverage';

const site = siteBySlug('substrataintel');

describe('hosted sites — host resolution', () => {
  it('resolves the free subdomain, with or without www and port', () => {
    expect(siteForHost('substrataintel.orangecat.ch')?.slug).toBe('substrataintel');
    expect(siteForHost('www.substrataintel.orangecat.ch')?.slug).toBe('substrataintel');
    expect(siteForHost('SubstrataIntel.OrangeCat.ch:443')?.slug).toBe('substrataintel');
  });

  it('resolves the local development host, so the rewrite is testable without DNS', () => {
    expect(siteForHost('substrataintel.localhost:3020')?.slug).toBe('substrataintel');
  });

  it('refuses everything else — a greedy match would swallow OrangeCat itself', () => {
    for (const host of [
      'orangecat.ch',
      'www.orangecat.ch',
      'localhost:3000',
      'substrataintel.evil.example',
      'notsubstrataintel.orangecat.ch',
      'substrataintel.orangecat.ch.evil.example',
      '',
      null,
      undefined,
    ]) {
      expect(siteForHost(host)).toBeNull();
    }
  });

  it('advertises the custom domain once one is set, and the subdomain until then', () => {
    for (const site of HOSTED_SITES) {
      const expected = site.customDomain ?? `${site.subdomain}.orangecat.ch`;
      expect(siteCanonicalHost(site)).toBe(expected);
    }
  });
});

describe('hosted sites — links', () => {
  it('always emits the path form, which resolves on every host', () => {
    expect(site).not.toBeNull();
    expect(siteHref(site!)).toBe('/sites/substrataintel');
    expect(siteHref(site!, 'map')).toBe('/sites/substrataintel/map');
    expect(siteHref(site!, '/map')).toBe('/sites/substrataintel/map');
    expect(siteHref(site!, '/')).toBe('/sites/substrataintel');
  });
});

describe('hosted sites — chrome isolation', () => {
  it('classifies a hosted site as its own surface, not app or public', () => {
    expect(getRouteSurface('/sites/substrataintel')).toBe('site');
    expect(getRouteSurface('/sites/substrataintel/map')).toBe('site');
  });

  it('leaves the rest of the app classified as it was', () => {
    expect(getRouteSurface('/dashboard')).toBe('app');
    expect(getRouteSurface('/about')).toBe('public');
    expect(getRouteSurface('/auth')).toBe('auth');
    expect(getRouteSurface('/groups/substrataintel')).toBe('app');
  });
});

describe('hosted sites — every site renders', () => {
  it.each(HOSTED_SITES.map(site => [site.slug, site] as const))(
    '%s has chrome, a home page, and a nav where every entry resolves',
    (_slug, site) => {
      const chrome = siteChromeFor(site);
      const pages = sitePagesFor(site);

      expect(chrome).not.toBeNull();
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.some(page => page.path === '')).toBe(true);

      // Unique paths, or two nav entries fight over one URL.
      const paths = pages.map(page => page.path);
      expect(new Set(paths).size).toBe(paths.length);

      for (const page of pages) {
        // The builders return fresh objects per call, so compare by value.
        expect(sitePageAt(site, page.path)).toEqual(page);
        expect(page.title.length).toBeGreaterThan(0);
        expect(page.sections.length).toBeGreaterThan(0);
      }
    }
  );

  it('returns null for a path no page claims, so the route can 404', () => {
    expect(sitePageAt(site!, 'not-a-page')).toBeNull();
  });
});

describe('substrataintel.orangecat.ch — the site is the profile, not a copy of it', () => {
  const pages = sitePagesFor(site!);
  const text = JSON.stringify(pages);

  it('takes its name and tagline from the profile config', () => {
    const chrome = siteChromeFor(site!);
    expect(chrome?.name).toBe(COMPANY.name);
    expect(chrome?.tagline).toBe(COMPANY.tagline);
  });

  it('renders every material on the desk, from the same catalogue the profile lists', () => {
    for (const listing of CATALOGUE) {
      expect(text).toContain(listing.title);
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
    const mapPage = sitePageAt(site!, 'map');
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
    const mapPage = sitePageAt(site!, 'map')!;
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
    const home = sitePageAt(site!, '')!;
    expect(home.sections[0].kind).toBe('hero');
    expect(pageRendersOwnHeader(home)).toBe(true);

    // Inner pages take the standard header instead.
    expect(pageRendersOwnHeader(sitePageAt(site!, 'map')!)).toBe(false);
  });

  it('says on the desk page that prices are indicative rather than quotes', () => {
    const deskPage = sitePageAt(site!, 'desk');
    expect(JSON.stringify(deskPage)).toContain('not a quote');
  });
});
