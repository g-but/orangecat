/**
 * Resolving a handle a profile no longer uses.
 *
 * A username here is a public profile URL AND a Lightning address
 * (`<username>@orangecat.ch`). So when an account is renamed — which the fleet
 * has to do for the 77 profiles still publishing their email local part — every
 * saved payment address and inbound link pointing at the old handle would
 * silently stop working. Silently: a wallet gets "no such recipient", nobody
 * gets an error report, and the money simply does not arrive.
 *
 * profile_username_history keeps the old handle resolving forever, so a rename
 * changes what a profile is CALLED without changing what can still find it.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The profile id a retired handle used to belong to, or null.
 *
 * Matches on `lower(old_username)` rather than `ilike`. `ilike` treats `_` as a
 * single-character wildcard and `_` is a legal username character — with every
 * newly minted handle now shaped `user_<hex>`, an `ilike` lookup for
 * `user_823e4d9d2714` would also match `userX823e4d9d2714`. On a lookup that
 * decides where money goes, "close enough" is the wrong matcher.
 */
export async function resolveHistoricalUsername(
  client: SupabaseClient,
  handle: string
): Promise<string | null> {
  const trimmed = handle.trim();
  if (!trimmed) {
    return null;
  }
  const { data } = await client
    .from(DATABASE_TABLES.PROFILE_USERNAME_HISTORY)
    .select('profile_id')
    .eq('old_username', trimmed.toLowerCase())
    .maybeSingle();

  const row = data as { profile_id?: string } | null;
  return row?.profile_id ?? null;
}
