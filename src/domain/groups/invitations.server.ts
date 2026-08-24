/**
 * Group invitation domain logic (server-only).
 *
 * The accept/decline/revoke business rules — membership checks, status
 * transitions, expiry, admin gating — live here so the API route stays a thin
 * validate → delegate → respond wrapper. Each function returns a discriminated
 * result the route maps to an HTTP response (no HTTP concerns in this layer).
 */

import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { checkGroupAdmin, resolveGroupBySlug } from '@/domain/groups/helpers.server';
import { logger } from '@/utils/logger';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/constants/pagination';
import type { AnySupabaseClient } from '@/lib/supabase/types';

/** Outcome codes the route maps to apiForbidden / apiNotFound / apiValidationError. */
export type InvitationErrorCode = 'not_found' | 'forbidden' | 'invalid';

export type InvitationResult =
  | { ok: true; message: string; group_slug?: string }
  | { ok: false; code: InvitationErrorCode; message: string }
  | { ok: false; dbError: unknown };

/** Generic discriminated result for the list/create collection operations. */
export type InvitationCollectionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: InvitationErrorCode; message: string }
  | { ok: false; dbError: unknown };

/** Validated create-invitation input (shape mirrors the route's zod schema). */
export type CreateInvitationInput = {
  user_id?: string;
  email?: string;
  create_link?: boolean;
  role: 'admin' | 'member';
  message?: string;
  expires_in_days: number;
};

type InvitationRow = {
  user_id: string | null;
  status: string;
  expires_at: string;
  group_id: string;
  role: string;
  invited_by: string;
  groups: { slug: string } | null;
};

async function acceptInvitation(
  supabase: AnySupabaseClient,
  inv: InvitationRow,
  invitationId: string,
  userId: string
): Promise<InvitationResult> {
  const { data: existingMember } = await supabase
    .from(DATABASE_TABLES.GROUP_MEMBERS)
    .select('id')
    .eq('group_id', inv.group_id)
    .eq('user_id', userId)
    .maybeSingle();

  const markAccepted = () =>
    supabase
      .from(DATABASE_TABLES.GROUP_INVITATIONS)
      .update({ status: STATUS.GROUP_INVITATIONS.ACCEPTED, responded_at: new Date().toISOString() })
      .eq('id', invitationId);

  if (existingMember) {
    await markAccepted();
    return {
      ok: true,
      message: 'You are already a member of this group',
      group_slug: inv.groups?.slug,
    };
  }

  const { error: memberError } = await supabase.from(DATABASE_TABLES.GROUP_MEMBERS).insert({
    group_id: inv.group_id,
    user_id: userId,
    role: inv.role,
    invited_by: inv.invited_by,
  });
  if (memberError) {
    return { ok: false, dbError: memberError };
  }

  await markAccepted();
  return { ok: true, message: 'Successfully joined the group', group_slug: inv.groups?.slug };
}

/** Accept or decline an invitation addressed to `userId`. */
export async function respondToInvitation(
  supabase: AnySupabaseClient,
  invitationId: string,
  userId: string,
  action: 'accept' | 'decline'
): Promise<InvitationResult> {
  const { data: inv, error } = await supabase
    .from(DATABASE_TABLES.GROUP_INVITATIONS)
    .select('*, groups(slug)')
    .eq('id', invitationId)
    .single();

  if (error || !inv) {
    return { ok: false, code: 'not_found', message: 'Invitation not found' };
  }
  if (inv.user_id && inv.user_id !== userId) {
    return { ok: false, code: 'forbidden', message: 'This invitation is for another user' };
  }
  if (inv.status !== STATUS.GROUP_INVITATIONS.PENDING) {
    return { ok: false, code: 'invalid', message: 'Invitation has already been responded to' };
  }
  if (new Date(inv.expires_at) < new Date()) {
    await supabase
      .from(DATABASE_TABLES.GROUP_INVITATIONS)
      .update({ status: STATUS.GROUP_INVITATIONS.EXPIRED })
      .eq('id', invitationId);
    return { ok: false, code: 'invalid', message: 'Invitation has expired' };
  }

  if (action === 'accept') {
    return acceptInvitation(supabase, inv as InvitationRow, invitationId, userId);
  }

  await supabase
    .from(DATABASE_TABLES.GROUP_INVITATIONS)
    .update({ status: STATUS.GROUP_INVITATIONS.DECLINED, responded_at: new Date().toISOString() })
    .eq('id', invitationId);
  return { ok: true, message: 'Invitation declined' };
}

/** Revoke a pending invitation (group admins only). */
export async function revokeInvitation(
  supabase: AnySupabaseClient,
  invitationId: string,
  userId: string
): Promise<InvitationResult> {
  const { data: invitation, error } = await supabase
    .from(DATABASE_TABLES.GROUP_INVITATIONS)
    .select('group_id, status')
    .eq('id', invitationId)
    .single();

  if (error || !invitation) {
    return { ok: false, code: 'not_found', message: 'Invitation not found' };
  }

  const adminRole = await checkGroupAdmin(supabase, invitation.group_id, userId);
  if (!adminRole) {
    return { ok: false, code: 'forbidden', message: 'Only admins can revoke invitations' };
  }
  if (invitation.status !== STATUS.GROUP_INVITATIONS.PENDING) {
    return { ok: false, code: 'invalid', message: 'Can only revoke pending invitations' };
  }

  const { error: updateError } = await supabase
    .from(DATABASE_TABLES.GROUP_INVITATIONS)
    .update({ status: STATUS.GROUP_INVITATIONS.REVOKED })
    .eq('id', invitationId);

  if (updateError) {
    return { ok: false, dbError: updateError };
  }
  return { ok: true, message: 'Invitation revoked' };
}

/**
 * List a group's invitations (admins only), newest first, paginated.
 * `opts` carries the raw URL query values; defaulting/clamping is applied here
 * so the route stays free of pagination logic.
 */
export async function listGroupInvitations(
  supabase: AnySupabaseClient,
  slug: string,
  userId: string,
  opts: { status?: string | null; limit?: string | null; offset?: string | null }
): Promise<
  InvitationCollectionResult<{ invitations: unknown[]; total: number; hasMore: boolean }>
> {
  const group = await resolveGroupBySlug(supabase, slug);
  if (!group) {
    return { ok: false, code: 'not_found', message: 'Group not found' };
  }
  if (!(await checkGroupAdmin(supabase, group.id, userId))) {
    return { ok: false, code: 'forbidden', message: 'Only admins can view invitations' };
  }

  const status = opts.status || STATUS.GROUP_INVITATIONS.PENDING;
  const limit = Math.min(
    parseInt(opts.limit || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE
  );
  const offset = Math.max(parseInt(opts.offset || '0', 10) || 0, 0);

  let query = supabase
    .from(DATABASE_TABLES.GROUP_INVITATIONS)
    .select(
      `*, inviter:profiles!group_invitations_invited_by_fkey (name, avatar_url), invitee:profiles!group_invitations_user_id_fkey (name, avatar_url)`,
      { count: 'exact' }
    )
    .eq('group_id', group.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: invitations, count, error } = await query;
  if (error) {
    logger.error('Failed to fetch invitations', { error, groupId: group.id }, 'Groups');
    return { ok: false, dbError: error };
  }

  return {
    ok: true,
    data: {
      invitations: invitations || [],
      total: count || 0,
      hasMore: (invitations?.length || 0) === limit,
    },
  };
}

/**
 * Authorize invitation creation: resolve the group and confirm the actor is an
 * admin. Split from the create step so the route can keep its original ordering
 * (permission gate before body validation). Returns the group id on success.
 */
export async function authorizeGroupInvitationCreate(
  supabase: AnySupabaseClient,
  slug: string,
  userId: string
): Promise<InvitationCollectionResult<{ groupId: string }>> {
  const group = await resolveGroupBySlug(supabase, slug);
  if (!group) {
    return { ok: false, code: 'not_found', message: 'Group not found' };
  }
  if (!(await checkGroupAdmin(supabase, group.id, userId))) {
    return { ok: false, code: 'forbidden', message: 'Only admins can create invitations' };
  }
  return { ok: true, data: { groupId: group.id } };
}

/**
 * Create an invitation for an already-authorized group. Guards against inviting
 * an existing member or duplicating a pending invite (targeted invites only),
 * computes expiry, optionally mints a share token, and returns the row plus its
 * join URL when a link was requested.
 */
export async function createGroupInvitation(
  supabase: AnySupabaseClient,
  groupId: string,
  invitedBy: string,
  input: CreateInvitationInput
): Promise<InvitationCollectionResult<{ invitation: Record<string, unknown> }>> {
  const { user_id, email, create_link, role, message, expires_in_days } = input;

  if (user_id) {
    const [{ data: existingMember }, { data: existingInvite }] = await Promise.all([
      supabase
        .from(DATABASE_TABLES.GROUP_MEMBERS)
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user_id)
        .maybeSingle(),
      supabase
        .from(DATABASE_TABLES.GROUP_INVITATIONS)
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user_id)
        .eq('status', STATUS.GROUP_INVITATIONS.PENDING)
        .maybeSingle(),
    ]);
    if (existingMember) {
      return { ok: false, code: 'invalid', message: 'User is already a member of this group' };
    }
    if (existingInvite) {
      return { ok: false, code: 'invalid', message: 'User already has a pending invitation' };
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expires_in_days);

  const invitationData: Record<string, unknown> = {
    group_id: groupId,
    role,
    message: message || null,
    invited_by: invitedBy,
    expires_at: expiresAt.toISOString(),
    ...(user_id && { user_id }),
    ...(email && { email: email.toLowerCase().trim() }),
  };

  if (create_link) {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    invitationData.token = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  const { data: invitation, error: insertError } = await supabase
    .from(DATABASE_TABLES.GROUP_INVITATIONS)
    .insert(invitationData)
    .select()
    .single();

  if (insertError || !invitation) {
    logger.error('Failed to create invitation', { error: insertError, groupId }, 'Groups');
    return { ok: false, dbError: insertError };
  }

  const inviteUrl = invitation.token
    ? `${process.env.NEXT_PUBLIC_APP_URL}/organizations/join/${invitation.token}`
    : undefined;
  return { ok: true, data: { invitation: { ...invitation, invite_url: inviteUrl } } };
}
