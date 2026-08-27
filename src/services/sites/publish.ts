/**
 * Publishing a group as a website — the domain half.
 *
 * The route beside this (`/api/groups/[slug]/site`) is HTTP: auth, rate limit,
 * status codes, cache invalidation. Everything that decides WHETHER and WHAT
 * lives here, so the rules are testable without a request and so a second
 * caller — the group settings UI, FleetCrown, a script — cannot end up with a
 * different answer.
 *
 * Deliberately imports nothing from `next/`. It did import `revalidateTag`, and
 * that single line dragged Next's whole server runtime into any test that
 * touched these rules. Dropping a framework cache is the route's job anyway.
 */

import {
  SITE_FEATURE_KEY,
  siteCanonicalHost,
  toHostedSite,
  type SiteConfigInput,
} from '@/config/hosted-site';
import { isReservedSubdomain, isValidSiteSlug, reservedSubdomainReason } from '@/config/sites';

/** The three group fields publishing needs. */
export interface SiteGroup {
  id: string;
  name: string;
  slug: string;
  is_public: boolean | null;
}

/** Minimal client shape, so this module does not care which client it is given. */
type Client = {
  from: (table: string) => any;
};

export async function resolveGroupForSite(
  supabase: Client,
  slug: string
): Promise<SiteGroup | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, slug, is_public')
    .eq('slug', slug)
    .maybeSingle();
  return error || !data ? null : (data as SiteGroup);
}

/**
 * Why this group may not be published, or null if it may.
 *
 * A site's address IS its group slug, so a slug that cannot be a hostname can
 * never resolve. Saying so once, here, is much kinder than a published site
 * that silently never answers.
 */
export function publishRefusal(group: SiteGroup): string | null {
  if (!isValidSiteSlug(group.slug)) {
    return `"${group.slug}" cannot be a hostname. A site address may contain only letters, numbers and hyphens, and may not start or end with one.`;
  }
  if (isReservedSubdomain(group.slug)) {
    return `"${group.slug}.orangecat.ch" is reserved — ${reservedSubdomainReason(group.slug)}.`;
  }
  // A published site is public by definition, and the RLS policy enforces it.
  // Refusing here beats publishing a website nobody can load.
  if (group.is_public === false) {
    return 'A private group cannot publish a public website. Make the group public first.';
  }
  return null;
}

/** Where this group's site is, or would be. */
export function siteAddress(group: SiteGroup, config: unknown) {
  const site = toHostedSite({ slug: group.slug, name: group.name }, config ?? {});
  return {
    url: `https://${siteCanonicalHost(site)}`,
    // Reachable with or without DNS — this is the preview link, and it is what
    // makes a site checkable before anybody points a domain at anything.
    previewPath: `/sites/${group.slug}`,
  };
}

export async function readSiteFeature(
  supabase: Client,
  groupId: string
): Promise<{ enabled: boolean; config: unknown }> {
  const { data, error } = await supabase
    .from('group_features')
    .select('enabled, config')
    .eq('group_id', groupId)
    .eq('feature_key', SITE_FEATURE_KEY)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return { enabled: Boolean(data?.enabled), config: data?.config ?? {} };
}

export async function publishSite(
  supabase: Client,
  group: SiteGroup,
  config: SiteConfigInput,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('group_features').upsert(
    {
      group_id: group.id,
      feature_key: SITE_FEATURE_KEY,
      enabled: true,
      config,
      enabled_by: userId,
    },
    { onConflict: 'group_id,feature_key' }
  );
  if (error) {
    throw error;
  }
}

export async function unpublishSite(supabase: Client, group: SiteGroup): Promise<void> {
  // Disabled, not deleted. `enabled = false` is what both the RLS policy and
  // the resolver read, and keeping the row keeps the configuration — taking a
  // site down for a week must not lose its custom domain.
  const { error } = await supabase
    .from('group_features')
    .update({ enabled: false })
    .eq('group_id', group.id)
    .eq('feature_key', SITE_FEATURE_KEY);
  if (error) {
    throw error;
  }
}
