/**
 * What a hosted site IS — the record, and where it is stored.
 *
 * `sites.ts` answers "which slug is this host asking for". This file answers
 * "what is a site, and what may its owner configure". They are separate because
 * the first runs at the edge with no database and the second is a database row.
 *
 * WHERE THE ROW LIVES, AND WHY THERE IS NO NEW TABLE
 *
 * A hosted site is stored as a `group_features` row with `feature_key = 'site'`.
 * That table already exists, already has `enabled`, and already has a `config`
 * jsonb column; `group-features.ts` already says in its own header that adding
 * a feature is "adding an entry here, no code changes needed". Publishing a
 * website is a capability a group switches on, exactly like treasury or events.
 *
 * A `hosted_sites` table would have duplicated the group_id, the enabled flag,
 * the enabled_by audit column and the RLS policy that already guards them — and
 * it would have created a second answer to "what has this group turned on".
 * One source of truth for that question; a site is not special.
 *
 * The jsonb is validated HERE, at the boundary, because jsonb is `any` wearing
 * a hat. Everything downstream receives a `HostedSite` and can stop worrying.
 */

import { z } from 'zod';
import { SITE_SLUG_PATTERN, normaliseHost } from './sites';

/** The `group_features.feature_key` that means "this group publishes a website". */
export const SITE_FEATURE_KEY = 'site';

/**
 * Sites whose PAGES are hand-written code rather than generated from the
 * profile. The escape hatch, deliberately narrow.
 *
 * A bespoke builder is justified when a site's content is genuinely not
 * profile-shaped — Substrata's is a research corpus with tables, meters and a
 * coverage ledger, which no generic renderer should try to guess. Everything
 * else gets the profile builder and needs no entry here, which is the point:
 * the normal path costs zero lines of code.
 *
 * A slug appearing here does NOT publish it. The database still decides that,
 * except for slugs in `ALWAYS_PUBLISHED` below.
 */
export const BESPOKE_BUILDERS = ['substrata'] as const;
export type BespokeBuilder = (typeof BESPOKE_BUILDERS)[number];

export function isBespokeBuilder(slug: string): slug is BespokeBuilder {
  return (BESPOKE_BUILDERS as readonly string[]).includes(slug);
}

/** A resolved hosted site. What every renderer downstream actually receives. */
export interface HostedSite {
  /** Path segment and registry key: `/sites/<slug>`. Equals the group slug. */
  slug: string;
  /** Browser tab title / OG title for the whole site. */
  title: string;
  /** Canonical custom domain, or null while the site lives on its subdomain. */
  customDomain: string | null;
  /** Extra hostnames answered but never advertised. */
  aliasHosts: readonly string[];
  /** The OrangeCat profile this site renders. */
  profile: { kind: 'group'; slug: string };
  /** Named bespoke builder, or null to render from the profile. */
  builder: BespokeBuilder | null;
}

/**
 * Sites that render without the database having been asked, and the record each
 * one resolves to.
 *
 * Only for sites whose content is entirely in the repository. Substrata's is,
 * which is what lets it be statically generated at build time and previewed
 * before its group has ever been seeded — and what stops a build-time render of
 * a fully static site failing on a network blip. A profile-built site can never
 * be listed here: its content IS the database.
 *
 * This is the ONLY place a site is described in code. Adding an ordinary
 * customer here would be the mistake the rest of this design exists to prevent.
 */
export const HOSTED_SITE_FALLBACKS: Readonly<Record<string, HostedSite>> = {
  substrata: {
    slug: 'substrata',
    title: 'Substrata',
    customDomain: null,
    // substrata.ch is the intended home and appears free — .ch publishes no
    // RDAP, so that has to be confirmed at a registrar rather than by us.
    // substrataintel.com is the .com fallback, since substrata.com is taken.
    aliasHosts: ['substrata.ch', 'substrataintel.com'],
    profile: { kind: 'group', slug: 'substrata' },
    builder: 'substrata',
  },
};

export const ALWAYS_PUBLISHED: readonly string[] = Object.keys(HOSTED_SITE_FALLBACKS);

/**
 * The owner-configurable part of a site: everything stored in
 * `group_features.config`.
 *
 * Deliberately small. Every field here is a field somebody has to understand
 * before their site works, and the answer to "what should I put here" must be
 * "nothing, it already works". Defaults come from the group profile.
 */
export const siteConfigSchema = z.object({
  /**
   * Browser tab title. Defaults to the group's name — which is right often
   * enough that most sites will never set it.
   */
  title: z.string().trim().min(1).max(120).optional().catch(undefined),
  /** Custom domain once the owner points DNS here. Canonical when set. */
  customDomain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,63}$/, 'must be a hostname')
    .nullish()
    .catch(null),
  /**
   * Extra hostnames this site also answers on.
   *
   * Wired ahead of ownership on purpose: a host only reaches this check if
   * somebody already pointed DNS at our box, so listing a domain not yet held
   * costs nothing and means the site works the hour it is bought, with no
   * deploy. Never canonical.
   */
  aliasHosts: z.array(z.string().trim().toLowerCase()).max(20).optional().catch(undefined),
});

// Every field carries its own `.catch`, so one bad value costs THAT FIELD and
// never the whole object. A malformed alias host must not take a customer's
// website down — and jsonb written by a client will eventually contain one.

export type SiteConfigInput = z.infer<typeof siteConfigSchema>;

/**
 * Turn a group row plus its raw `group_features.config` into a `HostedSite`.
 *
 * Invalid config is DROPPED FIELD BY FIELD rather than failing the request: a
 * malformed alias host should cost that alias, not the customer's whole
 * website. What cannot be defaulted — the slug and the name — comes from the
 * group row, which the database constrains.
 */
export function toHostedSite(
  group: { slug: string; name: string },
  rawConfig: unknown
): HostedSite {
  const parsed = siteConfigSchema.safeParse(rawConfig ?? {});
  const config: SiteConfigInput = parsed.success ? parsed.data : {};

  return {
    slug: group.slug,
    title: config.title?.trim() || group.name,
    customDomain: config.customDomain ? normaliseHost(config.customDomain) : null,
    aliasHosts: (config.aliasHosts ?? [])
      .map(normaliseHost)
      .filter(host => host.length > 0 && host.includes('.')),
    profile: { kind: 'group', slug: group.slug },
    builder: isBespokeBuilder(group.slug) ? group.slug : null,
  };
}

/** The public address the site advertises as its own. */
export function siteCanonicalHost(site: HostedSite): string {
  return site.customDomain ?? `${site.slug}.orangecat.ch`;
}

/**
 * Every hostname a site answers on — used to decide whether Caddy should issue
 * a certificate for a name, so it must be exact rather than generous.
 */
export function siteHostnames(site: HostedSite): string[] {
  const hosts = [`${site.slug}.orangecat.ch`];
  if (site.customDomain) {
    hosts.push(site.customDomain);
  }
  hosts.push(...site.aliasHosts);
  return hosts.filter(host => SITE_SLUG_PATTERN.test(host.split('.')[0]));
}
