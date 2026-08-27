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
 * Adding an ordinary site costs NO code: `site-profile.ts` renders any group
 * from the profile it already has, and the database decides which groups are
 * published. A builder is written only when a site's content is genuinely not
 * profile-shaped — Substrata's lives in `site-substrata.ts` and is built
 * entirely from the config the profile already needed, so nothing on that
 * website is authored twice either.
 *
 * Created: 2026-08-26
 */

import type { BespokeBuilder, HostedSite } from './hosted-site';
import { substrataSiteChrome, substrataSitePages } from './site-substrata';
import { profileSiteChrome, profileSitePages, type SiteProfile } from './site-profile';

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
 * Sites whose pages are hand-written rather than generated from the profile.
 *
 * This was a `switch` when there was one site and the comment here said it
 * should stay one until there were three. What changed is not the count — it is
 * that ordinary sites no longer appear here AT ALL. `profileSitePages` renders
 * any group from its own profile, so this map holds only the exceptions, and an
 * exception is exactly the thing that belongs in a lookup table rather than in
 * control flow. Substrata is an exception because a research corpus of tables,
 * meters and a coverage ledger is not profile-shaped.
 *
 * Keys are `BESPOKE_BUILDERS`, so a builder cannot be referenced without being
 * declared, and cannot be declared without being implemented.
 */
const BESPOKE_SITES: Record<BespokeBuilder, { pages: () => SitePage[]; chrome: () => SiteChrome }> =
  {
    substrata: { pages: substrataSitePages, chrome: substrataSiteChrome },
  };

/**
 * The pages of a site.
 *
 * @param profile the group snapshot, for a site rendered from its profile.
 *   Bespoke sites ignore it; profile sites return nothing without it.
 */
export function sitePagesFor(site: HostedSite, profile: SiteProfile | null): SitePage[] {
  if (site.builder) {
    return BESPOKE_SITES[site.builder].pages();
  }
  return profile ? profileSitePages(profile) : [];
}

export function siteChromeFor(site: HostedSite, profile: SiteProfile | null): SiteChrome | null {
  if (site.builder) {
    return BESPOKE_SITES[site.builder].chrome();
  }
  return profile ? profileSiteChrome(profile) : null;
}

/**
 * True when the page opens with its own hero, in which case the shell must not
 * also print a title block. One rule, checked in one place, so a page can never
 * render two competing headers.
 */
export function pageRendersOwnHeader(page: SitePage): boolean {
  return page.sections[0]?.kind === 'hero';
}

/**
 * The nav's view of a page: a label and where it goes, nothing else.
 *
 * This type exists because `SiteNav` is a client component. Every prop crossing
 * that boundary is serialised into the RSC payload of every page, so handing it
 * `SitePage[]` shipped the WHOLE SITE — all 92 producer rows, all 102
 * participants — into the HTML of all eight pages, 60 KB of it, to render eight
 * links totalling 0.33 KB. A client component takes the narrowest shape that
 * answers its question, and this is that shape.
 */
export interface SiteNavItem {
  path: string;
  label: string;
}

/** Nav entries for a site, in page order. Pages without a `navLabel` are omitted. */
export function siteNavItems(pages: SitePage[]): SiteNavItem[] {
  return pages
    .filter((page): page is SitePage & { navLabel: string } => Boolean(page.navLabel))
    .map(page => ({ path: page.path, label: page.navLabel }));
}

/** @returns the page at this path within these pages, or null. */
export function sitePageAt(pages: SitePage[], path: string): SitePage | null {
  const normalised = path.replace(/^\/+|\/+$/g, '');
  return pages.find(page => page.path === normalised) ?? null;
}
