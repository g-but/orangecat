/**
 * Invitation Response API
 *
 * POST   /api/invitations/[id] - Accept or decline invitation
 * DELETE /api/invitations/[id] - Revoke invitation (admin only)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { STATUS } from '@/config/database-constants';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { validateUUID, getValidationError } from '@/lib/api/validation';
import { checkGroupAdmin } from '@/domain/groups/helpers.server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedTable = any;

const responseSchema = z.object({ action: z.enum(['accept', 'decline']) });

async function handleAccept(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  inv: { group_id: string; role: string; invited_by: string; groups: { slug: string } | null },
  invitationId: string,
  userId: string
) {
  const { data: existingMember } = await (supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as UntypedTable)
    .select('id').eq('group_id', inv.group_id).eq('user_id', userId).maybeSingle();

  const updateInvite = () => (supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as UntypedTable)
    .update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', invitationId);

  if (existingMember) {
    await updateInvite();
    return apiSuccess({ message: 'You are already a member of this group', group_slug: inv.groups?.slug });
  }

  const { error: memberError } = await (supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as UntypedTable).insert({
    group_id: inv.group_id, user_id: userId, role: inv.role, invited_by: inv.invited_by,
  });
  if (memberError) return handleApiError(memberError);

  await updateInvite();
  return apiSuccess({ message: 'Successfully joined the group', group_slug: inv.groups?.slug });
}

export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: invitationId } = await params;
    const idValidation = getValidationError(validateUUID(invitationId, 'invitation ID'));
    if (idValidation) return idValidation;
    try {
      const { user } = req;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        return apiRateLimited('Too many invitation requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));
      }

      const supabase = await createServerClient();

      const body = await req.json();
      const validation = responseSchema.safeParse(body);
      if (!validation.success) {
        return apiValidationError('Invalid request', {
          fields: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        });
      }

      const { action } = validation.data;

      const { data: inv, error: inviteError } = await (
        supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as UntypedTable
      ).select('*, groups(slug)').eq('id', invitationId).single();

      if (inviteError || !inv) return apiNotFound('Invitation not found');
      if (inv.user_id && inv.user_id !== user.id) return apiForbidden('This invitation is for another user');
      if (inv.status !== STATUS.GROUP_INVITATIONS.PENDING) return apiValidationError('Invitation has already been responded to');

      if (new Date(inv.expires_at) < new Date()) {
        await (supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as UntypedTable).update({ status: 'expired' }).eq('id', invitationId);
        return apiValidationError('Invitation has expired');
      }

      if (action === 'accept') return handleAccept(supabase, inv, invitationId, user.id);

      await (supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as UntypedTable)
        .update({ status: 'declined', responded_at: new Date().toISOString() }).eq('id', invitationId);

      return apiSuccess({ message: 'Invitation declined' });
    } catch (error) {
      logger.error('Invitation response error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);

export const DELETE = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: invitationId } = await params;
    const idValidation = getValidationError(validateUUID(invitationId, 'invitation ID'));
    if (idValidation) return idValidation;
    try {
      const { user } = req;

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));
      }

      const supabase = await createServerClient();

      const { data: invitation, error: inviteError } = await (
        supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as UntypedTable
      ).select('group_id, status').eq('id', invitationId).single();

      if (inviteError || !invitation) return apiNotFound('Invitation not found');

      const adminRole = await checkGroupAdmin(supabase, invitation.group_id, user.id);
      if (!adminRole) return apiForbidden('Only admins can revoke invitations');

      if (invitation.status !== STATUS.GROUP_INVITATIONS.PENDING) return apiValidationError('Can only revoke pending invitations');

      const { error } = await (supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as UntypedTable)
        .update({ status: 'revoked' }).eq('id', invitationId);

      if (error) {
        logger.error('Failed to revoke invitation', { error, invitationId }, 'Groups');
        return handleApiError(error);
      }

      return apiSuccess({ message: 'Invitation revoked' });
    } catch (error) {
      logger.error('Invitation revoke error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);
