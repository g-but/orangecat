/**
 * Domain search — SSOT for the availability check /domains offers.
 *
 * Finding a name is the rung BEFORE the two services /domains already sells
 * (build me a site, host it at yourname.orangecat.ch). Somebody who does not
 * yet have a domain cannot buy hosting for one, so this closes the front of
 * that funnel — and it is the same capability FleetCrown needs when it stands
 * up a customer, which is why the check lives behind a public v1 endpoint
 * rather than inside a React component.
 *
 * WHY THIS IS BUILT ON THE IANA BOOTSTRAP, NOT ON "404 MEANS FREE"
 *
 * RDAP (RFC 7482) is the registries' own structured successor to WHOIS: free,
 * keyless, authoritative for the registries that run it. The naive
 * implementation asks rdap.org for a domain and calls a 404 "available".
 * That implementation would have told this project that ORANGECAT.CH — its own
 * production domain — was free, because .ch operates no public RDAP service
 * and a redirector cannot distinguish "no such domain" from "no such registry".
 * The same false positive applies to .io and .co.
 *
 * So a TLD earns a definitive answer only by appearing in IANA's RDAP
 * bootstrap. Everything else returns `unknown`, and the UI says so. A search
 * tool that guesses is worse than one that admits the gap, because the guess
 * is what someone acts on.
 *
 * Created: 2026-08-26
 */

/** IANA's registry of which TLDs actually run RDAP. The gate for a real answer. */
export const RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

/** Redirector that forwards a domain query to the registry's own RDAP server. */
export const RDAP_QUERY_BASE = 'https://rdap.org/domain';

/** Bootstrap is republished rarely; an hour of staleness costs nothing. */
export const RDAP_BOOTSTRAP_TTL_MS = 60 * 60 * 1000;

/** Per-domain result cache. Registrations do not change minute to minute. */
export const DOMAIN_RESULT_TTL_MS = 10 * 60 * 1000;

/**
 * Hard cap on remembered lookups.
 *
 * The cache key is a domain the CALLER chose, so without a ceiling this map
 * grows for as long as the process does — and on a self-hosted box that process
 * runs for weeks. A TTL alone does not bound it: expired entries are only
 * noticed when the same key is asked for again, which an enumerating caller
 * never does.
 */
export const DOMAIN_RESULT_CACHE_MAX = 5000;

/** One lookup's ceiling. A slow registry must not hold the whole search open. */
export const RDAP_TIMEOUT_MS = 8000;

/** Concurrent RDAP requests. Polite to the registries, fast enough for a page. */
export const RDAP_CONCURRENCY = 6;

/** Hard cap on candidates per search, so one query cannot fan out unbounded. */
export const MAX_CANDIDATES = 24;

/**
 * TLDs offered by default, best-first.
 *
 * `.ch` leads despite having no RDAP because this is a Swiss platform and it
 * is the right domain for most of its users — it simply comes back as
 * "check manually" rather than as a confident yes.
 */
export const CANDIDATE_TLDS: readonly string[] = [
  'com',
  'ch',
  'ai',
  'io',
  'dev',
  'org',
  'net',
  'xyz',
];

/**
 * Name shapes tried around a seed word. Deliberately short: a wall of
 * machine-generated names is noise, and the good name is usually the seed
 * itself or the seed plus one honest qualifier.
 */
export const NAME_PATTERNS: readonly { id: string; render: (seed: string) => string }[] = [
  { id: 'bare', render: seed => seed },
  { id: 'intel', render: seed => `${seed}intel` },
  { id: 'research', render: seed => `${seed}research` },
  { id: 'labs', render: seed => `${seed}labs` },
  { id: 'group', render: seed => `${seed}group` },
  { id: 'get', render: seed => `get${seed}` },
];

/** What a lookup can conclude. `unknown` is a first-class answer, not a failure. */
export type DomainStatus = 'registered' | 'unregistered' | 'unknown';

export const DOMAIN_STATUS_COPY: Record<DomainStatus, { label: string; detail: string }> = {
  registered: {
    label: 'Taken',
    detail: 'The registry holds a registration record for this name.',
  },
  unregistered: {
    label: 'No registration found',
    detail:
      'The registry reports no record. Premium pricing, registry reservations and ' +
      'trademark conflicts are not visible here — confirm at a registrar before you count on it.',
  },
  unknown: {
    label: 'Check manually',
    detail:
      'This registry runs no public RDAP service, so nothing can be concluded either way. ' +
      'A registrar lookup is the only reliable answer for this TLD.',
  },
};

/** Labels a domain the platform already knows about, so search never mis-sells one. */
export const DOMAIN_SEARCH_DISCLAIMER =
  'Availability is reported from registry RDAP records, not from a registrar. ' +
  'It is not a reservation, a price, or a guarantee that a name can be registered.';
