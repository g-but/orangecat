/**
 * Platform Search Service
 *
 * Enables Cat to search OrangeCat for users, projects, products,
 * services, events, and causes.
 *
 * Implementation: ILIKE pattern matching on title/description/bio.
 * Fast enough at current scale. Upgrade path: add pgvector when needed;
 * this interface stays stable so no code debt is introduced by waiting.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js';

type AnySupabaseClient = SupabaseClient<any, any, any>;

export type SearchType =
  | 'all'
  | 'people'
  | 'projects'
  | 'products'
  | 'services'
  | 'events'
  | 'causes';

export interface SearchResult {
  type: SearchType;
  title: string;
  description: string;
  url: string;
}

const MAX_RESULTS_PER_TYPE = 5;

/**
 * Search the platform for users and entities.
 * Returns up to 5 results per requested type (max 30 for 'all').
 */
export async function searchPlatform(
  supabase: AnySupabaseClient,
  query: string,
  type: SearchType = 'all'
): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }

  const pattern = `%${q}%`;
  const results: SearchResult[] = [];

  await Promise.all([
    type === 'all' || type === 'people'
      ? searchProfiles(supabase, pattern, results)
      : Promise.resolve(),
    type === 'all' || type === 'projects'
      ? searchTable(supabase, 'projects', 'projects', '/fund', pattern, results)
      : Promise.resolve(),
    type === 'all' || type === 'causes'
      ? searchTable(supabase, 'user_causes', 'causes', '/causes', pattern, results)
      : Promise.resolve(),
    type === 'all' || type === 'products'
      ? searchTable(supabase, 'user_products', 'products', '/market', pattern, results)
      : Promise.resolve(),
    type === 'all' || type === 'services'
      ? searchTable(supabase, 'user_services', 'services', '/services', pattern, results)
      : Promise.resolve(),
    type === 'all' || type === 'events'
      ? searchTable(supabase, 'events', 'events', '/events', pattern, results)
      : Promise.resolve(),
  ]);

  return results;
}

// ─── Private helpers ─────────────────────────────────────────────────────────

async function searchProfiles(
  supabase: AnySupabaseClient,
  pattern: string,
  results: SearchResult[]
): Promise<void> {
  const { data } = await supabase
    .from('profiles')
    .select('username, display_name, bio')
    .not('username', 'is', null)
    .or(`username.ilike.${pattern},display_name.ilike.${pattern},bio.ilike.${pattern}`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (!data?.length) {
    return;
  }

  for (const row of data as Array<{
    username: string;
    display_name: string | null;
    bio: string | null;
  }>) {
    results.push({
      type: 'people',
      title: row.display_name || row.username,
      description: row.bio?.slice(0, 200) || `@${row.username} on OrangeCat`,
      url: `/profile/${row.username}`,
    });
  }
}

async function searchTable(
  supabase: AnySupabaseClient,
  table: string,
  type: SearchType,
  basePath: string,
  pattern: string,
  results: SearchResult[]
): Promise<void> {
  const { data } = await supabase
    .from(table)
    .select('id, title, description, slug')
    .eq('status', 'active')
    .or(`title.ilike.${pattern},description.ilike.${pattern}`)
    .limit(MAX_RESULTS_PER_TYPE);

  if (!data?.length) {
    return;
  }

  for (const row of data as Array<{
    id: string;
    title: string;
    description: string | null;
    slug: string | null;
  }>) {
    results.push({
      type,
      title: row.title,
      description: row.description?.slice(0, 200) || '',
      url: `${basePath}/${row.slug || row.id}`,
    });
  }
}
