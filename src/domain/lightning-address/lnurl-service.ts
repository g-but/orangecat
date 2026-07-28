/**
 * Lightning Address (LUD-16) for every OrangeCat user: `<username>@orangecat.ch`.
 *
 * NON-CUSTODIAL by construction. OrangeCat only serves the LNURL-pay discovery
 * document and, on the callback, asks the user's OWN connected wallet to mint an
 * invoice (NWC `make_invoice`, or a proxied request to their existing Lightning-
 * address provider — see invoiceGenerationService). The sats settle straight to
 * the user; OrangeCat never holds, routes, or touches funds — so there is no
 * custody, no money-transmitter/VASP status, and nothing for an attacker to
 * drain. The address is just a memorable pointer to a wallet the user controls.
 *
 * On-chain-only users can't have a Lightning address (it's a Lightning rail) and
 * resolve to null here.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase/admin';
import { DATABASE_TABLES } from '@/config/database-tables';
import { resolveUserWallet } from '@/domain/payments/walletResolutionService';
import type { ResolvedWallet } from '@/domain/payments/types';

/** LNURL amount bounds, in millisats. min = 1 sat, max = 1 BTC. */
export const LNURL_MIN_SENDABLE_MSAT = 1_000;
export const LNURL_MAX_SENDABLE_MSAT = 100_000_000_000;

export interface LnurlRecipient {
  userId: string;
  username: string;
  displayName: string;
}

function admin(): SupabaseClient {
  return getAdminClient() as unknown as SupabaseClient;
}

/** Resolve a username (case-insensitive) to its owner, or null if unknown. */
export async function resolveLnurlRecipient(username: string): Promise<LnurlRecipient | null> {
  const handle = username.trim();
  if (!handle) {
    return null;
  }
  const { data } = await admin()
    .from(DATABASE_TABLES.PROFILES)
    .select('id, username, display_name:name')
    .ilike('username', handle)
    .maybeSingle();

  const row = data as { id?: string; username?: string; display_name?: string } | null;
  if (!row?.id || !row.username) {
    return null;
  }
  return {
    userId: row.id,
    username: row.username,
    displayName: row.display_name || row.username,
  };
}

/**
 * The wallet a Lightning-address payment settles into. Only Lightning-capable
 * rails (NWC / Lightning address) qualify — an on-chain-only user cannot serve a
 * Lightning address, and returns null.
 */
export async function resolveLnurlWallet(userId: string): Promise<ResolvedWallet | null> {
  const wallet = await resolveUserWallet(admin(), userId);
  if (!wallet || wallet.method === 'onchain') {
    return null;
  }
  return wallet;
}

/** LUD-06/16 metadata array (stringified) shown by the payer's wallet. */
export function buildLnurlMetadata(recipient: LnurlRecipient, domain: string): string {
  return JSON.stringify([
    ['text/plain', `Pay ${recipient.displayName} on OrangeCat`],
    ['text/identifier', `${recipient.username}@${domain}`],
  ]);
}
