/**
 * Groups Invitation Mutation Functions
 *
 * Handles invitation creation and response operations.
 *
 * Created: 2025-12-30
 * Last Modified: 2025-12-30
 * Last Modified Summary: Initial implementation
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { getCurrentUserId, isGroupMember, getUserRole } from '../utils/helpers';
import { logGroupActivity } from '../utils/activity';
import { canPerformAction } from '../permissions/resolver';

// ==================== TYPES ====================

export interface CreateInvitationInput {
  group_id: string;
  user_id?: string;
  email?: string;
  role?: 'admin' | 'member';
  message?: string;
  create_token?: boolean;
  expires_in_days?: number;
}

export interface InvitationResponse {
  success: boolean;
  invitation?: {
    id: string;
    group_id: string;
    user_id?: string;
    email?: string;
    token?: string;
    role: string;
    status: string;
    expires_at: string;
  };
  error?: string;
}

export interface InvitationsListResponse {
  success: boolean;
  invitations?: Array<{
    id: string;
    group_id: string;
    user_id?: string;
    email?: string;
    token?: string;
    role: string;
    message?: string;
    status: string;
    invited_by: string;
    inviter_name?: string;
    inviter_avatar_url?: string;
    expires_at: string;
    created_at: string;
  }>;
  error?: string;
}

// ==================== CREATE INVITATION ====================

/**
 * Create an invitation to join a group
 */
export async function createInvitation(
  input: CreateInvitationInput
): Promise<InvitationResponse> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Check permissions
    const permResult = await canPerformAction(userId, input.group_id, 'invite_members');
    if (!permResult.allowed) {
      return { success: false, error: permResult.reason || 'Insufficient permissions' };
    }

    // Validate input - must have user_id, email, or create_token
    if (!input.user_id && !input.email && !input.create_token) {
      return { success: false, error: 'Must provide user_id, email, or create_token' };
    }

    // If inviting a specific user, check if already a member
    if (input.user_id) {
      const alreadyMember = await isGroupMember(input.group_id, input.user_id);
      if (alreadyMember) {
        return { success: false, error: 'User is already a member of this group' };
      }

      // Check for existing pending invitation
      const { data: existing } = await (supabase
        .from('group_invitations') as any)
        .select('id')
        .eq('group_id', input.group_id)
        .eq('user_id', input.user_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'User already has a pending invitation' };
      }
    }

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.expires_in_days || 7));

    // Create invitation
    const invitationData: Record<string, unknown> = {
      group_id: input.group_id,
      role: input.role || 'member',
      message: input.message || null,
      invited_by: userId,
      expires_at: expiresAt.toISOString(),
    };

    if (input.user_id) {
      invitationData.user_id = input.user_id;
    }

    if (input.email) {
      invitationData.email = input.email.toLowerCase().trim();
    }

    if (input.create_token) {
      // Generate a secure token
      const tokenBytes = new Uint8Array(24);
      crypto.getRandomValues(tokenBytes);
      invitationData.token = btoa(String.fromCharCode(...tokenBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    }

    const { data: invData, error } = await (supabase
      .from('group_invitations') as any)
      .insert(invitationData)
      .select()
      .single();
    const data = invData as any;

    if (error) {
      logger.error('Failed to create invitation', error, 'Groups');
      return { success: false, error: error.message };
    }

    // Log activity
    const targetDesc = input.user_id
      ? 'a user'
      : input.email
        ? input.email
        : 'a shareable link';
    await logGroupActivity(
      input.group_id,
      userId,
      'member_added', // Reusing activity type
      `Created invitation for ${targetDesc}`
    );

    return {
      success: true,
      invitation: {
        id: data.id,
        group_id: data.group_id,
        user_id: data.user_id || undefined,
        email: data.email || undefined,
        token: data.token || undefined,
        role: data.role,
        status: data.status,
        expires_at: data.expires_at,
      },
    };
  } catch (error) {
    logger.error('Exception creating invitation', error, 'Groups');
    return { success: false, error: 'Failed to create invitation' };
  }
}

// ==================== RESPOND TO INVITATION ====================

/**
 * Accept an invitation
 */
export async function acceptInvitation(
  invitationId: string
): Promise<{ success: boolean; group_id?: string; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Use the database function for atomic operation
    const { data, error } = await (supabase.rpc as any)('accept_group_invitation', {
      invitation_id: invitationId,
    });

    if (error) {
      logger.error('Failed to accept invitation', error, 'Groups');
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string; group_id?: string };

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Log activity if we have group_id
    if (result.group_id) {
      await logGroupActivity(result.group_id, userId, 'joined_group', 'Accepted invitation');
    }

    return { success: true, group_id: result.group_id };
  } catch (error) {
    logger.error('Exception accepting invitation', error, 'Groups');
    return { success: false, error: 'Failed to accept invitation' };
  }
}

/**
 * Decline an invitation
 */
export async function declineInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Use the database function
    const { data, error } = await (supabase.rpc as any)('decline_group_invitation', {
      invitation_id: invitationId,
    });

    if (error) {
      logger.error('Failed to decline invitation', error, 'Groups');
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    logger.error('Exception declining invitation', error, 'Groups');
    return { success: false, error: 'Failed to decline invitation' };
  }
}

/**
 * Accept invitation by token (for link invites)
 */
export async function acceptInvitationByToken(
  token: string
): Promise<{ success: boolean; group_id?: string; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Find invitation by token
    const { data: invitationData, error: findError } = await (supabase
      .from('group_invitations') as any)
      .select('id, group_id, status, expires_at')
      .eq('token', token)
      .eq('status', 'pending')
      .maybeSingle();
    const invitation = invitationData as any;

    if (findError) {
      logger.error('Failed to find invitation by token', findError, 'Groups');
      return { success: false, error: 'Invalid invitation link' };
    }

    if (!invitation) {
      return { success: false, error: 'Invalid or expired invitation link' };
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false, error: 'This invitation has expired' };
    }

    // Check if already a member
    const alreadyMember = await isGroupMember(invitation.group_id, userId);
    if (alreadyMember) {
      return { success: true, group_id: invitation.group_id };
    }

    // Accept using the ID
    return acceptInvitation(invitation.id);
  } catch (error) {
    logger.error('Exception accepting invitation by token', error, 'Groups');
    return { success: false, error: 'Failed to accept invitation' };
  }
}

// ==================== REVOKE INVITATION ====================

/**
 * Revoke a pending invitation
 */
export async function revokeInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    // Get invitation to check group
    const { data: invitationData2, error: findError } = await (supabase
      .from('group_invitations') as any)
      .select('group_id, status')
      .eq('id', invitationId)
      .single();
    const invitation = invitationData2 as any;

    if (findError || !invitation) {
      return { success: false, error: 'Invitation not found' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Can only revoke pending invitations' };
    }

    // Check permissions
    const permResult = await canPerformAction(userId, invitation.group_id, 'invite_members');
    if (!permResult.allowed) {
      return { success: false, error: permResult.reason || 'Insufficient permissions' };
    }

    // Revoke
    const { error } = await (supabase
      .from('group_invitations') as any)
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    if (error) {
      logger.error('Failed to revoke invitation', error, 'Groups');
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('Exception revoking invitation', error, 'Groups');
    return { success: false, error: 'Failed to revoke invitation' };
  }
}
