/**
 * Profile claim domain logic (server-only).
 *
 * `public.profile_claims` has no anon/authenticated RLS policies — every
 * function here reads and writes it through the service-role admin client.
 * The row's own id is the claim's only credential (like a password-reset
 * link); see the migration for why a permissive "pending rows are viewable"
 * policy would leak every draft platform-wide instead of just the one the
 * caller holds the id for.
 *
 * Applying a claimed draft to the recipient's own `profiles` row uses the
 * *caller's* request-scoped client instead — that update stays inside
 * existing "users can update their own profile" RLS, no elevated
 * privilege needed for it.
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { getAdminClient } from '@/lib/supabase/admin';
import { looseClient } from '@/lib/supabase/untyped';
import { logger } from '@/utils/logger';
import type { AnySupabaseClient } from '@/lib/supabase/types';
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
}): Promise<ProfileClaimResult<{ id: string }>> {
  const { data, error } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .insert({
      created_by: input.createdBy,
      draft: input.draft,
      suggested_username: input.suggestedUsername?.trim().toLowerCase() || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    logger.error('Failed to create profile claim', { error, createdBy: input.createdBy });
    return { ok: false, dbError: error };
  }
  return { ok: true, data: { id: data.id as string } };
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

/** Public preview for the claim landing page — no auth required to view. */
export async function getProfileClaimPreview(
  id: string
): Promise<ProfileClaimResult<ProfileClaimPreview>> {
  const { data: row, error } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error('Failed to load profile claim', { error, id });
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

  return {
    ok: true,
    data: {
      id: typed.id,
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
    const { data: taken } = await supabase
      .from(DATABASE_TABLES.PROFILES)
      .select('id')
      .eq('username', candidate)
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
  claimId: string;
  userId: string;
  userSupabase: AnySupabaseClient;
}): Promise<ProfileClaimResult<{ username: string | null }>> {
  const { claimId, userId, userSupabase } = params;

  const { data: existing, error: fetchError } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .select('*')
    .eq('id', claimId)
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
  if (row.status === 'claimed') {
    return { ok: false, code: 'already_claimed', message: 'This profile has already been claimed.' };
  }
  if (isExpired(row)) {
    return { ok: false, code: 'expired', message: 'This claim link has expired.' };
  }

  const nowIso = new Date().toISOString();
  const { data: won, error: casError } = await looseClient(getAdminClient())
    .from(DATABASE_TABLES.PROFILE_CLAIMS)
    .update({ status: 'claimed', claimed_by: userId, claimed_at: nowIso })
    .eq('id', claimId)
    .eq('status', 'pending')
    .select('draft, suggested_username')
    .maybeSingle();

  if (casError) {
    return { ok: false, dbError: casError };
  }
  if (!won) {
    // Someone else won the race between our read and this update.
    return { ok: false, code: 'already_claimed', message: 'This profile has already been claimed.' };
  }

  const draft = won.draft as ProfileClaimDraft;
  let username: string | null = null;
  if (won.suggested_username) {
    username = await findAvailableUsername(userSupabase, won.suggested_username as string, userId);
  }

  const profileUpdate: Record<string, unknown> = {
    name: draft.name,
    bio: draft.bio ?? null,
    ...(draft.avatarUrl && { avatar_url: draft.avatarUrl }),
    ...(draft.bannerUrl && { banner_url: draft.bannerUrl }),
    ...(draft.website && { website: draft.website }),
    ...(draft.socialLinks?.length && { social_links: { links: draft.socialLinks } }),
    ...(username && { username }),
  };

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
      .eq('id', claimId);
    logger.error('Failed to apply claimed draft to profile', { error: profileError, claimId, userId });
    return { ok: false, dbError: profileError };
  }

  return { ok: true, data: { username: (updatedProfile.username as string | undefined) ?? null } };
}
