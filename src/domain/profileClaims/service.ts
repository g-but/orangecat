/**
 * Profile claim domain logic (server-only).
 *
 * `public.profile_claims` has no anon/authenticated RLS policies — every
 * function here reads and writes it through the service-role admin client.
 * See the migration for why a permissive "pending rows are viewable" policy
 * would leak every draft platform-wide instead of just the one the caller
 * holds the credential for.
 *
 * TWO ADDRESSES, ON PURPOSE (ADR-0004 D4). `token` is the credential: it is
 * what `/claim/<token>` carries, and it addresses every PUBLIC operation —
 * preview, claim, decline. `id` is the row's identity and addresses the
 * CREATOR's operations — list, revoke. They used to be the same column, which
 * meant a claim could never be named anywhere public, because its public name
 * was its password.
 *
 * Applying a claimed draft to the recipient's own `profiles` row uses the
 * *caller's* request-scoped client instead — that update stays inside
 * existing "users can update their own profile" RLS, no elevated
 * privilege needed for it.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { reservedReason } from '@/config/usernames';
import { getAdminClient } from '@/lib/supabase/admin';
import { looseClient } from '@/lib/supabase/untyped';
import { logger } from '@/utils/logger';
import type { AnySupabaseClient } from '@/lib/supabase/types';
import { buildProfileFill, type ExistingProfileFields } from './fill';
import type {
  ProfileClaimDraft,
  ProfileClaimPreview,
  ProfileClaimResult,
  ProfileClaimRow,
} from './types';

const MAX_USERNAME_SUFFIX_ATTEMPTS = 6;

// Every function below calls `.from(DATABASE_TABLES.PROFILE_CLAIMS)` inline —
// deliberately not through a shared helper. scripts/db/audit-schema-drift.mjs
// (the CD schema-drift gate) statically resolves `.select()`/`.eq()`/
// `.update()` calls by scanning the text window after the *nearest preceding*
// literal `.from(DATABASE_TABLES.X)` in the file; a wrapper that hides that
// call behind a function name makes it invisible to the scanner, and every
// column reference after it gets silently misattributed to whichever table
// the scanner last resolved (here: `profiles`, from the lookup in
// getProfileClaimPreview) — false-positive drift that blocked deploy 2026-08-18.

function isExpired(row: Pick<ProfileClaimRow, 'expires_at'>): boolean {
  return new Date(row.expires_at).getTime() < Date.now();
}

export async function createProfileClaim(input: {
  createdBy: string;
  draft: ProfileClaimDraft;
  suggestedUsername?: string;
}): Promise<ProfileClaimResult<{ id: string; token: string }>> {
  const { data, error } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .insert({
      created_by: input.createdBy,
      draft: input.draft,
      suggested_username: input.suggestedUsername?.trim().toLowerCase() || null,
    })
    .select('id, token')
    .single();

  if (error || !data) {
    logger.error('Failed to create profile claim', { error, createdBy: input.createdBy });
    return { ok: false, dbError: error };
  }
  // `id` addresses the row for its creator; `token` is the credential that
  // goes in the link. Callers building a URL must use the token.
  return { ok: true, data: { id: data.id as string, token: data.token as string } };
}

export async function listProfileClaimsCreatedBy(
  createdBy: string
): Promise<ProfileClaimResult<ProfileClaimRow[]>> {
  const { data, error } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .select('*')
    .eq('created_by', createdBy)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to list profile claims', { error, createdBy });
    return { ok: false, dbError: error };
  }
  return { ok: true, data: (data ?? []) as ProfileClaimRow[] };
}

/**
 * Public preview for the claim landing page — no auth required to view.
 *
 * Addressed by TOKEN, never by id: the landing page is a public URL, and the
 * thing in that URL must be the credential rather than the row's identity.
 */
export async function getProfileClaimPreview(
  token: string,
  options?: {
    /**
     * Record this read in the funnel. Off by default and opted into exactly
     * once per page load: Next calls `generateMetadata` and the page body
     * separately, so counting inside the fetch itself made every visit look
     * like two.
     */
    countView?: boolean;
  }
): Promise<ProfileClaimResult<ProfileClaimPreview>> {
  const { data: row, error } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) {
    logger.error('Failed to load profile claim', { error });
    return { ok: false, dbError: error };
  }
  if (!row) {
    return { ok: false, code: 'not_found', message: 'This claim link doesn’t exist.' };
  }

  const typed = row as ProfileClaimRow;
  let claimedUsername: string | null = null;
  if (typed.status === 'claimed' && typed.claimed_by) {
    const { data: profile } = await looseClient(getAdminClient())
      .from(DATABASE_TABLES.PROFILES)
      .select('username')
      .eq('id', typed.claimed_by)
      .maybeSingle();
    claimedUsername = (profile?.username as string | undefined) ?? null;
  }

  // "Sent but never opened" and "opened and ignored" are the two ends of the
  // funnel a creator actually needs to tell apart before nudging. Recorded
  // best-effort: a failure here must never stop a recipient seeing the page.
  if (options?.countView && typed.status === 'pending') {
    const { error: viewError } = await looseClient(getAdminClient())
      .from(DATABASE_TABLES.PROFILE_CLAIMS)
      .update({
        first_viewed_at: typed.first_viewed_at ?? new Date().toISOString(),
        view_count: (typed.view_count ?? 0) + 1,
      })
      .eq('token', token);
    if (viewError) {
      logger.warn('Failed to record claim view', { error: viewError });
    }
  }

  return {
    ok: true,
    data: {
      token: typed.token,
      draft: typed.draft,
      suggestedUsername: typed.suggested_username,
      status: typed.status,
      isExpired: typed.status === 'pending' && isExpired(typed),
      claimedUsername,
    },
  };
}

/** Creator-only: pull a link before anyone uses it. */
export async function revokeProfileClaim(
  id: string,
  requestedBy: string
): Promise<ProfileClaimResult<null>> {
  const { data: row, error: fetchError } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .select('created_by, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, dbError: fetchError };
  }
  if (!row) {
    return { ok: false, code: 'not_found', message: 'Claim not found' };
  }
  if (row.created_by !== requestedBy) {
    return { ok: false, code: 'not_found', message: 'Claim not found' };
  }
  if (row.status !== 'pending') {
    return { ok: false, code: 'already_claimed', message: 'Only a pending claim can be revoked' };
  }

  const { error } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .update({ status: 'revoked' })
    .eq('id', id);
  if (error) {
    return { ok: false, dbError: error };
  }
  return { ok: true, data: null };
}

/**
 * The recipient says no.
 *
 * Deliberately needs no account and no login. Requiring someone to register in
 * order to refuse something they never asked for would make "no" more
 * expensive than "yes", which is not consent. Holding the token is the whole
 * authorisation — the same credential that would have let them accept.
 *
 * Distinct from `revoked`, which is the creator withdrawing the link.
 */
export async function declineProfileClaim(token: string): Promise<ProfileClaimResult<null>> {
  const { data: row, error: fetchError } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .select('status')
    .eq('token', token)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, dbError: fetchError };
  }
  if (!row) {
    return { ok: false, code: 'not_found', message: 'This claim link doesn’t exist.' };
  }
  if (row.status === 'claimed') {
    return {
      ok: false,
      code: 'already_claimed',
      message: 'This has already been claimed.',
    };
  }
  // Declining twice is a no-op, not an error: someone tapping "no thanks"
  // again should not be told they did something wrong.
  if (row.status === 'declined') {
    return { ok: true, data: null };
  }

  const { error } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .update({ status: 'declined', declined_at: new Date().toISOString() })
    .eq('token', token)
    .eq('status', 'pending');

  if (error) {
    return { ok: false, dbError: error };
  }
  return { ok: true, data: null };
}

async function findAvailableUsername(
  supabase: AnySupabaseClient,
  desired: string,
  userId: string
): Promise<string | null> {
  const base = desired
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '');
  if (!base) {
    return null;
  }

  for (let attempt = 0; attempt < MAX_USERNAME_SUFFIX_ATTEMPTS; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;

    // A draft written before the route validated against the shared schema can
    // still carry a reserved name, and the `-2` suffixes are built here rather
    // than validated anywhere. Ask the SSOT for every candidate.
    if (reservedReason(candidate) !== null) {
      continue;
    }

    // `username_lower` is a STORED generated column and carries the UNIQUE
    // index. Probing `username` with `.eq` is case-SENSITIVE while uniqueness
    // is not, so a candidate differing only in case read as free and then
    // failed the insert — after the claim had already been flipped to
    // `claimed`, landing in the rollback path.
    const { data: taken } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('id')
      .eq('username_lower', candidate.toLowerCase())
      .neq('id', userId)
      .maybeSingle();
    if (!taken) {
      return candidate;
    }
  }
  return null;
}

/**
 * Complete a claim: atomically flip the draft to `claimed` (compare-and-swap
 * on `status = 'pending'` so two tabs can't both win), then copy its content
 * into the caller's own profile.
 *
 * `userSupabase` must be the caller's request-scoped client — the profiles
 * update runs through it so it stays inside normal "own row" RLS.
 */
export async function claimProfileClaim(params: {
  claimToken: string;
  userId: string;
  userSupabase: AnySupabaseClient;
}): Promise<ProfileClaimResult<{ username: string | null }>> {
  const { claimToken, userId, userSupabase } = params;

  const { data: existing, error: fetchError } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .select('*')
    .eq('token', claimToken)
    .maybeSingle();
  if (fetchError) {
    return { ok: false, dbError: fetchError };
  }
  if (!existing) {
    return { ok: false, code: 'not_found', message: 'This claim link doesn’t exist.' };
  }
  const row = existing as ProfileClaimRow;
  if (row.status === 'revoked') {
    return { ok: false, code: 'revoked', message: 'This claim link was revoked.' };
  }
  if (row.status === 'declined') {
    // The recipient already said no. Re-claiming would quietly undo a refusal.
    return { ok: false, code: 'declined', message: 'This was declined.' };
  }
  if (row.status === 'claimed') {
    return {
      ok: false,
      code: 'already_claimed',
      message: 'This profile has already been claimed.',
    };
  }
  if (isExpired(row)) {
    return { ok: false, code: 'expired', message: 'This claim link has expired.' };
  }

  const nowIso = new Date().toISOString();
  const { data: won, error: casError } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .update({ status: 'claimed', claimed_by: userId, claimed_at: nowIso })
    .eq('token', claimToken)
    .eq('status', 'pending')
    .select('draft, suggested_username')
    .maybeSingle();

  if (casError) {
    return { ok: false, dbError: casError };
  }
  if (!won) {
    // Someone else won the race between our read and this update.
    return {
      ok: false,
      code: 'already_claimed',
      message: 'This profile has already been claimed.',
    };
  }

  const draft = won.draft as ProfileClaimDraft;
  let username: string | null = null;
  if (won.suggested_username) {
    username = await findAvailableUsername(userSupabase, won.suggested_username as string, userId);
  }

  // Fill only what is EMPTY (ADR-0004 D6).
  //
  // This used to write `name` and `bio` unconditionally, so a friend who
  // already had an account lost their own name and bio the moment they opened
  // a link someone made for them. A claim is a gift, not an overwrite: it may
  // add to a profile, never replace what its owner already wrote.
  const { data: current } = await userSupabase
    .from(DATABASE_TABLES.PROFILES)
    .select('name, bio, avatar_url, banner_url, website, social_links, username')
    .eq('id', userId)
    .maybeSingle();

  const profileUpdate = buildProfileFill(draft, current as ExistingProfileFields, username);

  // An established user claiming a gift may have nothing blank left to fill.
  // That is a success, not an empty UPDATE — which PostgREST rejects.
  if (Object.keys(profileUpdate).length === 0) {
    const { data: unchanged } = await userSupabase
      .from(DATABASE_TABLES.PROFILES)
      .select('username')
      .eq('id', userId)
      .maybeSingle();
    return { ok: true, data: { username: (unchanged?.username as string | undefined) ?? null } };
  }

  const { data: updatedProfile, error: profileError } = await userSupabase
    .from(DATABASE_TABLES.PROFILES)
    .update(profileUpdate)
    .eq('id', userId)
    .select('username')
    .single();

  if (profileError || !updatedProfile) {
    // Best-effort rollback so a failed profile write doesn't leave the claim
    // permanently stuck in "claimed" with nothing to show for it.
    await looseClient(getAdminClient())
      .from(DATABASE_TABLES.PROFILE_CLAIMS)
      .update({ status: 'pending', claimed_by: null, claimed_at: null })
      .eq('token', claimToken);
    logger.error('Failed to apply claimed draft to profile', {
      error: profileError,
      userId,
    });
    return { ok: false, dbError: profileError };
  }

  return { ok: true, data: { username: (updatedProfile.username as string | undefined) ?? null } };
}
