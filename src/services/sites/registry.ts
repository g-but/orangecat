/**
 * Which sites exist, and at what hostnames — the database half of hosted sites.
 *
 * `src/config/sites.ts` decides, at the edge and without a query, whether a Host
 * header is SHAPED like a hosted site. This module answers the question that
 * actually needs data: is there a published site at that slug, and what is it?
 *
 * Read as ANON on purpose. `createPublicClient` carries no session, so every
 * answer here is one an anonymous visitor could have got for themselves — which
 * is the correct definition of "published", and it means the RLS policy added in
 * `20260827090000_hosted_sites_public_read.sql` is the authority rather than a
 * condition duplicated in TypeScript. Unpublishing is `enabled = false`, and it
 * takes effect here without any code knowing it happened.
 */

import { unstable_cache } from 'next/cache';
import { createPublicClient } from '@/lib/supabase/public';
import {
  ALWAYS_PUBLISHED,
  HOSTED_SITE_FALLBACKS,
  SITE_FEATURE_KEY,
  siteCanonicalHost,
  toHostedSite,
  type HostedSite,
} from '@/config/hosted-site';
import type { SiteProfile } from '@/config/site-profile';
import { isValidSiteSlug, normaliseHost, SITES_BASE_DOMAIN } from '@/config/sites';
import { logger } from '@/utils/logger';

/**
 * How long a resolved site is held.
 *
 * Short, because this is the latency between a customer flipping the switch in
 * FleetCrown and their website answering — the "few clicks" promise is measured
 * through this constant. A minute is fast enough to feel immediate and long
 * enough that a page of a busy site is not eight queries.
 */
const SITE_CACHE_TTL_SECONDS = 60;

const SITE_SELECT =
  'config, groups!inner(slug, name, description, label, tags, is_public, bitcoin_address, lightning_address)';

interface SiteFeatureRow {
  config: unknown;
  groups: {
    slug: string;
    name: string;
    description: string | null;
    label: string | null;
    tags: string[] | null;
    is_public: boolean | null;
    bitcoin_address: string | null;
    lightning_address: string | null;
  } | null;
}

/**
 * A published site and the profile it renders from, together.
 *
 * One shape because they come from one row. Returning them separately would
 * mean two queries and, worse, a moment where a site exists but its content
 * does not.
 */
export interface ResolvedSite {
  site: HostedSite;
  /** Null for a bespoke site, whose content is in the repository. */
  profile: SiteProfile | null;
}

function rowToResolved(row: SiteFeatureRow | null): ResolvedSite | null {
  if (!row?.groups || row.groups.is_public === false) {
    return null;
  }
  const group = row.groups;
  const site = toHostedSite({ slug: group.slug, name: group.name }, row.config);
  return {
    site,
    profile: site.builder
      ? null
      : {
          slug: group.slug,
          name: group.name,
          description: group.description,
          label: group.label,
          tags: group.tags ?? [],
          bitcoinAddress: group.bitcoin_address,
          lightningAddress: group.lightning_address,
          canonicalHost: siteCanonicalHost(site),
        },
  };
}

/**
 * The site published at this slug, or null.
 *
 * Sites in `ALWAYS_PUBLISHED` short-circuit: their pages live entirely in the
 * repository, so making their existence depend on a reachable database would
 * mean a build-time render of a fully static site could fail on a network blip.
 */
async function loadSiteBySlug(slug: string): Promise<ResolvedSite | null> {
  if (!isValidSiteSlug(slug)) {
    return null;
  }
  if (ALWAYS_PUBLISHED.includes(slug)) {
    const site = HOSTED_SITE_FALLBACKS[slug];
    return site ? { site, profile: null } : null;
  }

  try {
    const { data, error } = await createPublicClient()
      .from('group_features')
      .select(SITE_SELECT)
      .eq('feature_key', SITE_FEATURE_KEY)
      .eq('enabled', true)
      .eq('groups.slug', slug)
      .maybeSingle<SiteFeatureRow>();

    if (error) {
      logger.warn('Hosted site lookup failed', { slug, error: error.message }, 'Sites');
      return null;
    }
    return rowToResolved(data);
  } catch (error) {
    logger.warn('Hosted site lookup threw', { slug, error: String(error) }, 'Sites');
    return null;
  }
}

export const siteBySlug = unstable_cache(loadSiteBySlug, ['hosted-site-by-slug'], {
  revalidate: SITE_CACHE_TTL_SECONDS,
  tags: ['hosted-sites'],
});

/**
 * The site answering on this hostname, or null.
 *
 * Two shapes, in cost order. A free subdomain is decided by string arithmetic
 * plus one lookup by slug. A custom domain has no pattern to match — the
 * hostname is whatever the customer bought — so it costs a query against the
 * partial indexes the same migration created.
 */
async function loadSiteByHost(host: string): Promise<ResolvedSite | null> {
  const hostname = normaliseHost(host);
  const bare = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

  const suffix = `.${SITES_BASE_DOMAIN}`;
  if (bare.endsWith(suffix)) {
    const label = bare.slice(0, -suffix.length);
    if (label && !label.includes('.')) {
      return loadSiteBySlug(label);
    }
  }

  try {
    const client = createPublicClient();
    const { data, error } = await client
      .from('group_features')
      .select(SITE_SELECT)
      .eq('feature_key', SITE_FEATURE_KEY)
      .eq('enabled', true)
      .or(`config->>customDomain.eq.${bare},config->aliasHosts.cs.["${bare}"]`)
      .limit(1)
      .maybeSingle<SiteFeatureRow>();

    if (error) {
      logger.warn('Custom-domain lookup failed', { host: bare, error: error.message }, 'Sites');
      return null;
    }
    const resolved = rowToResolved(data);
    // Trust the row only if it really claims this hostname. `.or` is a filter,
    // not a proof, and a certificate is about to be issued on the strength of it.
    const site = resolved?.site;
    if (site && (site.customDomain === bare || site.aliasHosts.includes(bare))) {
      return resolved;
    }
    return null;
  } catch (error) {
    logger.warn('Custom-domain lookup threw', { host: bare, error: String(error) }, 'Sites');
    return null;
  }
}

export const siteByHost = unstable_cache(loadSiteByHost, ['hosted-site-by-host'], {
  revalidate: SITE_CACHE_TTL_SECONDS,
  tags: ['hosted-sites'],
});
