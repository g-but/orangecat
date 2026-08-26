/**
 * How many active wallets a profile publicly offers — server-only.
 *
 * The profile page used to ask Postgres for this through an RPC called
 * `get_entity_wallets`. That function has never existed: it appears in no
 * migration, and calling it against production returns PGRST202 ("could not find
 * the function"). The call sat inside a try/catch whose comment read "if it errs
 * we just show 0" — so the error path was not a fallback, it was the only path,
 * and it had been for as long as the code existed.
 *
 * The visible consequence: `walletCount` was always 0, and ProfileLayout hides
 * the Wallets tab from visitors unless `walletCount > 0` or the profile still
 * carries a legacy `bitcoin_address`/`lightning_address`. A profile whose
 * receive methods live in the modern wallets table therefore showed a visitor no
 * way to pay it. Measured 2026-08-26: 3 of 83 profiles have an active wallet,
 * only 1 has a legacy address, so 2 profiles were affected — small only because
 * wallet adoption is small. It scales with exactly the thing we want to grow.
 *
 * WHY THE ADMIN CLIENT, AND WHY NOT A NEW DATABASE FUNCTION
 * `wallets` is owner-only at the RLS level (an anonymous read returns []), which
 * is why an RPC was reached for in the first place. But GET /api/wallets already
 * solves this, deliberately: it serves the public wallets listing through the
 * admin client behind a CURATED field list, and its comment states the intent —
 * "the API is the one public surface, so raw PostgREST can no longer enumerate
 * balances or other wallet internals". Adding a SECURITY DEFINER function would
 * create a second public surface over a table that holds `nwc_connection_uri`, a
 * write-only secret. Counting through the same admin path adds no surface at
 * all: this returns a number and never a row.
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { getTableName } from '@/config/entity-registry';
import { logger } from '@/utils/logger';

/**
 * @returns the number of active wallets attached to `profileId`, or 0 if the
 *   count cannot be read. Zero is the safe answer for a badge — it hides a tab
 *   rather than promising a payment method that might not be there — but unlike
 *   the RPC it replaces, a failure here is LOGGED rather than swallowed
 *   silently, so a permanently-broken count cannot hide again.
 */
export async function countActiveProfileWallets(profileId: string): Promise<number> {
  try {
    const { count, error } = await getAdminClient()
      .from(getTableName('wallet'))
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to count profile wallets', {
        profileId,
        error: error.message,
        code: error.code,
      });
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    logger.error('Unexpected error counting profile wallets', {
      profileId,
      error: error instanceof Error ? error.message : String(error),
    });
    return 0;
  }
}
