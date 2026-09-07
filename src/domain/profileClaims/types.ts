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

/**
 * `revoked` is the CREATOR withdrawing the link. `declined` is the RECIPIENT
 * refusing it. Collapsing them would make "Karl said no" indistinguishable
 * from "Karl hasn't looked yet", which is the difference between a product
 * that stops nudging and one that cannot.
 */
export type ProfileClaimStatus = 'pending' | 'claimed' | 'revoked' | 'declined';

export interface ProfileClaimRow {
  id: string;
  /**
   * The claim credential. `/claim/<token>` is the link that gets sent.
   * Split from `id` so a claim can be referenced publicly without handing
   * over the ability to take it — see ADR-0004 D4.
   */
  token: string;
  created_by: string | null;
  suggested_username: string | null;
  draft: ProfileClaimDraft;
  status: ProfileClaimStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  /** Resume ledger (ADR-0004 D3) — what this claim has already created. */
  materialized: Record<string, unknown> | null;
  delivered_at: string | null;
  delivered_channel: string | null;
  first_viewed_at: string | null;
  view_count: number;
  declined_at: string | null;
}

/**
 * What the claim landing page needs — never exposes `created_by`/`claimed_by`
 * ids to the client, and never the row's `id` either: the page is reached by
 * token, and the internal id is not the visitor's business.
 */
export interface ProfileClaimPreview {
  token: string;
  draft: ProfileClaimDraft;
  suggestedUsername: string | null;
  status: ProfileClaimStatus;
  isExpired: boolean;
  /** Set once claimed, so the page can send visitors straight to the live profile. */
  claimedUsername: string | null;
}

export type ProfileClaimErrorCode =
  | 'not_found'
  | 'expired'
  | 'already_claimed'
  | 'revoked'
  | 'declined';

export type ProfileClaimResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: ProfileClaimErrorCode; message: string }
  | { ok: false; dbError: unknown };
