/**
 * Invitation Response API
 *
 * Handles responding to a specific invitation.
 *
 * POST /api/invitations/[id] - Accept or decline invitation
 * DELETE /api/invitations/[id] - Revoke invitation (admin only)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { z } from 'zod';

const responseSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

/**
 * POST /api/invitations/[id]
 * Accept or decline an invitation
 */
export const POST = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: invitationId } = await params;
    const { user } = req;
    const supabase = await createServerClient();

    // Parse request body
    const body = await req.json();
    const validation = responseSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError('Invalid request', {
        fields: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { action } = validation.data;

    // Get invitation
    const { data: invitationData, error: inviteError } = await (supabase
      .from('group_invitations') as any)
      .select('*, groups(slug)')
      .eq('id', invitationId)
      .single();
    const invitation = invitationData as any;

    if (inviteError || !invitation) {
      return apiNotFound('Invitation not found');
    }

    // Verify ownership
    if (invitation.user_id && invitation.user_id !== user.id) {
      return apiForbidden('This invitation is for another user');
    }

    // Check if already responded
    if (invitation.status !== 'pending') {
      return apiValidationError('Invitation has already been responded to');
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await (supabase
        .from('group_invitations') as any)
        .update({ status: 'expired' })
        .eq('id', invitationId);
      return apiValidationError('Invitation has expired');
    }

    if (action === 'accept') {
      // Check if already a member
      const { data: existingMember } = await (supabase
        .from('group_members') as any)
        .select('id')
        .eq('group_id', invitation.group_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        // Already a member, just update invitation status
        await (supabase
          .from('group_invitations') as any)
          .update({ status: 'accepted', responded_at: new Date().toISOString() })
          .eq('id', invitationId);

        const group = invitation.groups as { slug: string };
        return apiSuccess({
          message: 'You are already a member of this group',
          group_slug: group.slug,
        });
      }

      // Add as member
      const { error: memberError } = await (supabase.from('group_members') as any).insert({
        group_id: invitation.group_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
      });

      if (memberError) {
        logger.error('Failed to add member', { error: memberError, invitationId }, 'Groups');
        return handleApiError(memberError);
      }

      // Update invitation status
      await (supabase
        .from('group_invitations') as any)
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', invitationId);

      const group = invitation.groups as { slug: string };
      return apiSuccess({
        message: 'Successfully joined the group',
        group_slug: group.slug,
      });
    } else {
      // Decline
      await (supabase
        .from('group_invitations') as any)
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', invitationId);

      return apiSuccess({ message: 'Invitation declined' });
    }
  } catch (error) {
    logger.error('Invitation response error', { error }, 'Groups');
    return handleApiError(error);
  }
});

/**
 * DELETE /api/invitations/[id]
 * Revoke an invitation (admin only)
 */
export const DELETE = withAuth(async (
  req: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id: invitationId } = await params;
    const { user } = req;
    const supabase = await createServerClient();

    // Get invitation
    const { data: invitationData2, error: inviteError } = await (supabase
      .from('group_invitations') as any)
      .select('group_id, status')
      .eq('id', invitationId)
      .single();
    const invitation = invitationData2 as any;

    if (inviteError || !invitation) {
      return apiNotFound('Invitation not found');
    }

    // Check if user is admin/founder
    const { data: membershipData } = await (supabase
      .from('group_members') as any)
      .select('role')
      .eq('group_id', invitation.group_id)
      .eq('user_id', user.id)
      .maybeSingle();
    const membership = membershipData as any;

    if (!membership || !['founder', 'admin'].includes(membership.role)) {
      return apiForbidden('Only admins can revoke invitations');
    }

    if (invitation.status !== 'pending') {
      return apiValidationError('Can only revoke pending invitations');
    }

    // Revoke
    const { error } = await (supabase
      .from('group_invitations') as any)
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    if (error) {
      logger.error('Failed to revoke invitation', { error, invitationId }, 'Groups');
      return handleApiError(error);
    }

    return apiSuccess({ message: 'Invitation revoked' });
  } catch (error) {
    logger.error('Invitation revoke error', { error }, 'Groups');
    return handleApiError(error);
  }
});
