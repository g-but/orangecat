/**
 * Hosted sites — the host math, and nothing else.
 *
 * `/domains` sells one sentence: "a working site, hosted and managed at
 * yourname.orangecat.ch — free. Move to your own domain when you are ready."
 * This file answers the only question the EDGE has to answer to deliver it:
 * *given a Host header, which site slug is this request for?*
 *
 * WHY THIS IS A PATTERN AND NOT A LIST
 *
 * It used to be a list. A list means every new customer is a code change, a
 * pull request, a CI run and a deploy before their domain resolves — which is
 * the opposite of the product. So the rule is now positional: any label on
 * `orangecat.ch` that is not reserved is a candidate site slug, and whether a
 * site actually EXISTS is decided downstream by `/sites/<slug>`, which can read
 * the database because it is a page, not middleware.
 *
 * That split is the whole design:
 *
 *   this file (edge, pure)     — is this host SHAPED like a hosted site?
 *   services/sites (page, DB)  — is there a published site at that slug?
 *
 * Resolving "shaped like" without a database is what keeps `middleware.ts` free
 * of a query on the hot path of every request to the entire app. Guessing wrong
 * is cheap and safe: an unclaimed slug rewrites to `/sites/<slug>` and 404s.
 *
 * Three ways a request reaches a site:
 *   substrata.orangecat.ch     — the free subdomain every hosted site starts on
 *   substrata.localhost:3020   — local development, so the rewrite is testable
 *   substrata.example          — a custom domain (resolved from the database,
 *                                since no pattern can recognise one)
 *
 * The path form `/sites/<slug>` always works on any host. That is what makes a
 * site previewable before its DNS exists, and it is the URL the tests use.
 */

/** The domain every hosted site gets a free subdomain on. */
export const SITES_BASE_DOMAIN = 'orangecat.ch';

/** URL prefix the middleware rewrites a matched host onto. */
export const SITES_PATH_PREFIX = '/sites';

/**
 * Labels on `orangecat.ch` that must never resolve to a customer's site.
 *
 * Two different harms, kept in one list because one lookup should answer both:
 *
 *  - **Infrastructure.** These hosts already serve something else on this box.
 *    A site claiming one would either be shadowed by its Caddy block or, worse,
 *    shadow it — and the whole point of on-demand TLS is that Caddy asks US
 *    which hostnames are real, so this list is load-bearing for certificates.
 *  - **Impersonation.** A site at `security.orangecat.ch` is a phish with a
 *    valid certificate and our domain in the URL bar. `RESERVED_USERNAMES`
 *    already refuses these as handles for the same reason; a subdomain is a
 *    stronger claim than a handle, so it cannot be a weaker check.
 *
 * Keep in sync with `/etc/caddy/Caddyfile` — `scripts/ci/check-reserved-subdomains.sh`
 * fails the build if a live host on the box is missing here.
 */
export const RESERVED_SUBDOMAINS: ReadonlyArray<{ label: string; why: string }> = [
  // Live on the box today (one Caddy block each, on their own ports).
  { label: 'www', why: 'the platform itself' },
  { label: 'bridge', why: 'the agent bridge (port 4001)' },
  { label: 'fleetcrown', why: 'FleetCrown (port 4002)' },
  { label: 'evig', why: 'Evig (port 4004)' },
  { label: 'revampit', why: 'redirects to evig' },
  { label: 'supabase', why: 'the database and its auth endpoints' },
  { label: 'solon', why: 'Solon governance' },

  // Infrastructure names a future block will want, claimed before a customer can.
  { label: 'api', why: 'the public API surface' },
  { label: 'app', why: 'reads as the platform itself' },
  { label: 'cdn', why: 'asset host' },
  { label: 'static', why: 'asset host' },
  { label: 'assets', why: 'asset host' },
  { label: 'mail', why: 'mail host — an MX name is a phishing primitive' },
  { label: 'smtp', why: 'mail host' },
  { label: 'imap', why: 'mail host' },
  { label: 'ns1', why: 'nameserver' },
  { label: 'ns2', why: 'nameserver' },
  { label: 'mx', why: 'mail host' },
  { label: 'vpn', why: 'network infrastructure' },
  { label: 'db', why: 'database host' },
  { label: 'status', why: 'status page — must be trustworthy during an incident' },
  { label: 'staging', why: 'deploy environment' },
  { label: 'dev', why: 'deploy environment' },
  { label: 'test', why: 'deploy environment' },
  { label: 'preview', why: 'deploy environment' },

  // Impersonation. Mirrors RESERVED_USERNAMES — a subdomain claims more, not less.
  { label: 'admin', why: 'impersonates platform staff' },
  { label: 'support', why: 'impersonates platform staff' },
  { label: 'help', why: 'impersonates platform staff' },
  { label: 'security', why: 'impersonates platform staff — the highest-value phish' },
  { label: 'billing', why: 'impersonates platform staff on a money topic' },
  { label: 'payments', why: 'impersonates platform staff on a money topic' },
  { label: 'pay', why: 'impersonates platform staff on a money topic' },
  { label: 'wallet', why: 'impersonates platform staff on a money topic' },
  { label: 'login', why: 'a credential-harvesting host under our own certificate' },
  { label: 'signin', why: 'a credential-harvesting host under our own certificate' },
  { label: 'auth', why: 'a credential-harvesting host under our own certificate' },
  { label: 'account', why: 'a credential-harvesting host under our own certificate' },
  { label: 'accounts', why: 'a credential-harvesting host under our own certificate' },
  { label: 'system', why: 'impersonates the platform' },
  { label: 'official', why: 'impersonates the platform' },
  { label: 'orangecat', why: 'the platform itself' },
  { label: 'root', why: 'impersonates the platform' },
];

const RESERVED_SET: ReadonlySet<string> = new Set(RESERVED_SUBDOMAINS.map(entry => entry.label));

/** @returns why this label is reserved, or null if it is free. */
export function reservedSubdomainReason(label: string): string | null {
  return RESERVED_SUBDOMAINS.find(entry => entry.label === label.toLowerCase())?.why ?? null;
}

export function isReservedSubdomain(label: string): boolean {
  return RESERVED_SET.has(label.toLowerCase());
}

/**
 * The shape a slug must have to be a subdomain at all.
 *
 * Stricter than a group slug on purpose: this string becomes a DNS label and a
 * certificate subject. No leading or trailing hyphen, no underscores, 1–63
 * characters, which is what RFC 1123 permits.
 */
export const SITE_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function isValidSiteSlug(slug: string): boolean {
  return SITE_SLUG_PATTERN.test(slug);
}

/** Strip the port and lowercase, so `Substrata.localhost:3020` matches. */
export function normaliseHost(host: string): string {
  return host.trim().toLowerCase().split(':')[0];
}

/**
 * The slug a Host header is asking for, by SHAPE alone.
 *
 * Pure, allocation-light and database-free: this runs in edge middleware on
 * every request to the whole app. It answers "could this be a hosted site?" —
 * never "does that site exist", which only the page can know.
 *
 * @returns the slug, or null when the host is not a hosted-site host.
 */
export function siteSlugForHost(host: string | null | undefined): string | null {
  if (!host) {
    return null;
  }
  const hostname = normaliseHost(host);
  const bare = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

  for (const suffix of [`.${SITES_BASE_DOMAIN}`, '.localhost']) {
    if (!bare.endsWith(suffix)) {
      continue;
    }
    const label = bare.slice(0, -suffix.length);
    // Exactly one label. `a.b.orangecat.ch` is not a hosted site — it is either
    // a mistake or somebody probing, and a greedy match would hand them one.
    if (!label || label.includes('.')) {
      return null;
    }
    if (isReservedSubdomain(label) || !isValidSiteSlug(label)) {
      return null;
    }
    return label;
  }
  return null;
}

/**
 * Build an in-site link.
 *
 * Always the `/sites/<slug>/...` path form rather than an absolute URL on the
 * site's own domain. On the custom domain the rewrite makes this path resolve
 * to the same page, and on orangecat.ch it is the only form that works at all —
 * so one form is correct everywhere and no link needs to know which host it was
 * rendered on.
 */
export function siteHref(slug: string, path = ''): string {
  const suffix = path && path !== '/' ? `/${path.replace(/^\/+/, '')}` : '';
  return `${SITES_PATH_PREFIX}/${slug}${suffix}`;
}

/** The free subdomain a slug gets, whether or not it has a custom domain yet. */
export function siteSubdomainHost(slug: string): string {
  return `${slug}.${SITES_BASE_DOMAIN}`;
}
