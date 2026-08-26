/**
 * Hosted-site content model.
 *
 * A hosted site is a list of pages, and a page is a list of sections drawn
 * from a small closed set of shapes. That constraint is the design: it means a
 * profile can produce a whole website out of the structured data it already
 * has, without anybody hand-writing JSX per customer, and it means every
 * hosted site inherits typography, spacing and dark mode from one renderer
 * instead of drifting into fifty bespoke stylesheets.
 *
 * Adding a site is therefore: an entry in `sites.ts`, and a function that
 * returns `SitePage[]`. Substrata Intel's lives in `site-substrata-intel.ts` and is built
 * entirely from the config the profile already needed — the mandate, the
 * desks, the catalogue, the coverage universe. Nothing on the website is
 * authored twice.
 *
 * Created: 2026-08-26
 */

import type { HostedSite } from './sites';
import { substrataIntelSiteChrome, substrataIntelSitePages } from './site-substrata-intel';

// =====================================================================
// SECTIONS
// =====================================================================

/** A stat worth putting at the top of a page. */
export interface SiteStat {
  label: string;
  value: string;
  note?: string;
}

export interface SiteCard {
  title: string;
  body: string;
  /** Short trailing line — a price, a status, a jurisdiction. */
  meta?: string;
}

export interface SiteDefinition {
  term: string;
  detail: string;
}

export interface SiteIndexEntry {
  label: string;
  /** Small trailing figure — a count, a desk name. Rendered in mono. */
  meta?: string;
  /** Fragment this entry jumps to; must match a section's `anchor`. */
  anchor: string;
}

export type SiteSection =
  /**
   * Opens a page in place of the standard title block. An eyebrow, one display
   * statement, and the lead. Only ever the FIRST section of a page — the shell
   * checks for it and suppresses its own header so the two cannot both render.
   */
  | { kind: 'hero'; eyebrow?: string; statement: string; lead: string[] }
  | { kind: 'prose'; heading?: string; paragraphs: string[] }
  | { kind: 'stats'; heading?: string; stats: SiteStat[] }
  /**
   * One number that deserves a picture. Used for research coverage, where the
   * gap between `value` and `of` IS the message — an empty bar is the honest
   * rendering of "nothing sourced yet", and it should look empty.
   */
  | { kind: 'meter'; heading?: string; label: string; value: number; of: number; caption?: string }
  | { kind: 'cards'; heading?: string; blurb?: string; columns?: 2 | 3; cards: SiteCard[] }
  | { kind: 'definitions'; heading?: string; blurb?: string; items: SiteDefinition[] }
  /** Jump list for a long page. Without one, fifteen tables is a scroll, not a document. */
  | { kind: 'index'; heading?: string; blurb?: string; entries: SiteIndexEntry[] }
  | {
      kind: 'table';
      heading?: string;
      blurb?: string;
      /** Fragment id, so an `index` entry can link straight here. */
      anchor?: string;
      columns: string[];
      rows: string[][];
      /** Column indices rendered in mono — codes, figures, statuses. */
      monoColumns?: number[];
      /** Column index whose cell text is also a status keyword to dot-colour. */
      statusColumn?: number;
      note?: string;
    };

// =====================================================================
// PAGES
// =====================================================================

export interface SitePage {
  /** '' is the home page; otherwise a single path segment, e.g. 'map'. */
  path: string;
  /** Label in the site's own navigation. Omit to keep a page out of the nav. */
  navLabel?: string;
  /** <title> and the page's h1. */
  title: string;
  /** One line under the h1. */
  intro?: string;
  sections: SiteSection[];
}

/** Everything the site chrome needs: the masthead, the nav, the footer. */
export interface SiteChrome {
  name: string;
  tagline: string;
  /** Line in the footer — who runs this and under what rules. */
  footerNote: string;
}

// =====================================================================
// DISPATCH
// =====================================================================

/**
 * With one hosted site this is a switch, and it should stay a switch until
 * there are three — at which point the shape of the third will show whether
 * the right abstraction is a registry of builders or something else. Guessing
 * now would be inventing a CMS for a customer base of one.
 */
export function sitePagesFor(site: HostedSite): SitePage[] {
  switch (site.slug) {
    case 'substrataintel':
      return substrataIntelSitePages();
    default:
      return [];
  }
}

export function siteChromeFor(site: HostedSite): SiteChrome | null {
  switch (site.slug) {
    case 'substrataintel':
      return substrataIntelSiteChrome();
    default:
      return null;
  }
}

/**
 * True when the page opens with its own hero, in which case the shell must not
 * also print a title block. One rule, checked in one place, so a page can never
 * render two competing headers.
 */
export function pageRendersOwnHeader(page: SitePage): boolean {
  return page.sections[0]?.kind === 'hero';
}

/** @returns the page at this path within the site, or null. */
export function sitePageAt(site: HostedSite, path: string): SitePage | null {
  const normalised = path.replace(/^\/+|\/+$/g, '');
  return sitePagesFor(site).find(page => page.path === normalised) ?? null;
}
