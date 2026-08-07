import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';

export function getPagination(url: string, opts?: { defaultLimit?: number; maxLimit?: number }) {
  const u = new URL(url);
  const def = opts?.defaultLimit ?? 20;
  const max = opts?.maxLimit ?? 100;
  const limitRaw = parseInt(u.searchParams.get('limit') || `${def}`);
  const offsetRaw = parseInt(u.searchParams.get('offset') || '0');
  const limit = isFinite(limitRaw) ? Math.max(1, Math.min(max, limitRaw)) : def;
  const offset = isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0;
  return { limit, offset };
}

export function getString(url: string, key: string) {
  const val = new URL(url).searchParams.get(key);
  return val ?? undefined;
}

/**
 * Resolve the owner filter of a list endpoint from `?user_id=` or `?username=`.
 *
 * `?username=` used to be accepted by nobody and ignored by everybody: the
 * projects list read only `?user_id=`, so `?username=anything` — including a
 * handle that does not exist — returned the FULL public list. A caller scoping
 * a request to one person got everyone's data back, and nothing in the
 * response said the filter had been dropped.
 *
 * The rule this encodes: a filter that cannot be honoured must narrow the
 * result to nothing, never silently widen it to everything. An unknown handle
 * is an empty result, not an unfiltered one.
 *
 * `user_id` wins when both are present — it is the unambiguous identifier, and
 * it is what the drafts guard downstream compares against the authenticated
 * user.
 */
export async function resolveOwnerFilter(
  url: string
): Promise<{ userId: string | undefined; unresolved: boolean }> {
  const params = new URL(url).searchParams;

  const userId = params.get('user_id');
  if (userId) {
    return { userId, unresolved: false };
  }

  const username = params.get('username')?.trim();
  if (!username) {
    return { userId: undefined, unresolved: false };
  }

  // Whether a username exists is already public (/profiles/<username> answers
  // 404 vs 200), so resolving one here reveals nothing new.
  const supabase = await createServerClient();
  const { data } = await supabase
    .from(DATABASE_TABLES.PROFILES)
    .select('id')
    .eq('username', username)
    .maybeSingle();

  const resolved = (data as { id: string } | null)?.id;
  return { userId: resolved, unresolved: !resolved };
}
