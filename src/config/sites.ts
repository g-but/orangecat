/**
 * Hosted sites — SSOT for "a profile spins up a whole website".
 *
 * /domains sells this: "a working site, hosted and managed at
 * yourname.orangecat.ch — free. Move to your own domain when you are ready."
 * This file is the mechanism behind that sentence. It maps a HOSTNAME to an
 * OrangeCat profile, and `src/middleware.ts` rewrites the request onto
 * `/sites/<slug>`, where a standalone website renders from that profile's own
 * structured data.
 *
 * The point is that the website is not separately authored. Substrate's
 * mandate, desks, catalogue and coverage universe already exist as config
 * because the profile needed them; the site is those same objects rendered for
 * a different audience on a different domain. Adding a second site is an entry
 * in HOSTED_SITES plus a content builder — not a new codebase.
 *
 * Three ways a request reaches a site, all resolved by `siteForHost`:
 *   substrate.orangecat.ch     — the free subdomain every hosted site starts on
 *   substrate.example          — a custom domain, once the owner points DNS
 *   substrate.localhost:3020   — local development, so the rewrite is testable
 *
 * The path form `/sites/substrate` always works too, on any host. That is what
 * makes the site previewable before DNS exists, and it is the URL the
 * screenshots and the E2E tests use.
 *
 * Created: 2026-08-26
 */

/** The domain every hosted site gets a free subdomain on. */
export const SITES_BASE_DOMAIN = 'orangecat.ch';

/** URL prefix the middleware rewrites a matched host onto. */
export const SITES_PATH_PREFIX = '/sites';

export interface HostedSite {
  /** Path segment and registry key: /sites/<slug>. */
  slug: string;
  /** Free subdomain: <subdomain>.orangecat.ch. */
  subdomain: string;
  /** Custom domain once DNS is pointed here, else null. */
  customDomain: string | null;
  /** Browser tab title / OG title for the whole site. */
  title: string;
  /** The OrangeCat profile this site renders. */
  profile: {
    kind: 'group';
    /** `groups.slug` — the profile at /groups/<slug>. */
    slug: string;
  };
}

export const HOSTED_SITES: readonly HostedSite[] = [
  {
    slug: 'substrate',
    subdomain: 'substrate',
    customDomain: null,
    title: 'Substrate',
    profile: { kind: 'group', slug: 'substrate' },
  },
];

/** Strip the port and lowercase, so `Substrate.localhost:3020` matches. */
function normaliseHost(host: string): string {
  return host.trim().toLowerCase().split(':')[0];
}

/**
 * Resolve a request Host header to a hosted site.
 *
 * Deliberately pure and allocation-light: this runs in edge middleware on
 * every request, so it may not touch the database. A site that exists in the
 * database but not in this list simply does not resolve — which is the safe
 * direction, since the alternative is a DB read in the hot path of every
 * request to the main app.
 */
export function siteForHost(host: string | null | undefined): HostedSite | null {
  if (!host) {
    return null;
  }
  const hostname = normaliseHost(host);
  const bare = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

  for (const site of HOSTED_SITES) {
    if (bare === `${site.subdomain}.${SITES_BASE_DOMAIN}`) {
      return site;
    }
    // Local development: substrate.localhost resolves to 127.0.0.1 in every
    // major browser, which makes the rewrite testable without touching DNS.
    if (bare === `${site.subdomain}.localhost`) {
      return site;
    }
    if (site.customDomain && bare === normaliseHost(site.customDomain)) {
      return site;
    }
  }
  return null;
}

/** @returns the hosted site with this slug, or null. */
export function siteBySlug(slug: string): HostedSite | null {
  return HOSTED_SITES.find(site => site.slug === slug) ?? null;
}

/**
 * Build an in-site link.
 *
 * Always emits the `/sites/<slug>/...` path form rather than an absolute URL on
 * the site's own domain. On the custom domain the middleware rewrite means this
 * path resolves to the same page, and on orangecat.ch it is the only form that
 * works at all — so one form is correct everywhere and no link needs to know
 * which host it was rendered on.
 */
export function siteHref(site: HostedSite, path = ''): string {
  const suffix = path && path !== '/' ? `/${path.replace(/^\/+/, '')}` : '';
  return `${SITES_PATH_PREFIX}/${site.slug}${suffix}`;
}

/** The public address the site advertises as its own. */
export function siteCanonicalHost(site: HostedSite): string {
  return site.customDomain ?? `${site.subdomain}.${SITES_BASE_DOMAIN}`;
}
