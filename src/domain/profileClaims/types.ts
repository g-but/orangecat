/**
 * A pre-drafted profile a member fills in on someone else's behalf. Mirrors
 * the subset of `public.profiles` the claim writes on completion — see
 * supabase/migrations/20260818130000_profile_claims.sql.
 */
export interface ProfileClaimDraft {
  name: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  website?: string;
  socialLinks?: Array<{ platform: string; label?: string; value: string }>;
}

export type ProfileClaimStatus = 'pending' | 'claimed' | 'revoked';

export interface ProfileClaimRow {
  id: string;
  created_by: string | null;
  suggested_username: string | null;
  draft: ProfileClaimDraft;
  status: ProfileClaimStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

/** What the claim landing page needs — never exposes `created_by`/`claimed_by` ids to the client. */
export interface ProfileClaimPreview {
  id: string;
  draft: ProfileClaimDraft;
  suggestedUsername: string | null;
  status: ProfileClaimStatus;
  isExpired: boolean;
  /** Set once claimed, so the page can send visitors straight to the live profile. */
  claimedUsername: string | null;
}

export type ProfileClaimErrorCode = 'not_found' | 'expired' | 'already_claimed' | 'revoked';

export type ProfileClaimResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ProfileClaimErrorCode; message: string }
  | { ok: false; dbError: unknown };
