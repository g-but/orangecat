/**
 * Group Invitations API
 *
 * Handles invitation management for groups.
 *
 * GET /api/groups/[slug]/invitations - List invitations (admin only)
 * POST /api/groups/[slug]/invitations - Create invitation (admin only)
 */

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiCreated,
  apiForbidden,
  apiNotFound,
  apiValidationError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { z } from 'zod';

// Type definitions for Supabase tables not in generated types
interface GroupRow {
  id: string;
  name?: string;
}

interface GroupMemberRow {
  id: string;
  role: string;
}

interface GroupInvitationRow {
  id: string;
  group_id: string;
  user_id?: string | null;
  email?: string | null;
  role: string;
  status: string;
  token?: string | null;
  expires_at: string;
  invited_by: string;
  message?: string | null;
  inviter?: { name: string | null; avatar_url: string | null } | null;
  invitee?: { name: string | null; avatar_url: string | null } | null;
}

// Validation schema for creating invitations
const createInvitationSchema = z
  .object({
    user_id: z.string().uuid().optional(),
    email: z.string().email().optional(),
    create_link: z.boolean().optional(),
    role: z.enum(['admin', 'member']).optional().default('member'),
    message: z.string().max(500).optional(),
    expires_in_days: z.number().int().min(1).max(30).optional().default(7),
  })
  .refine(data => data.user_id || data.email || data.create_link, {
    message: 'Must provide user_id, email, or create_link',
  });

/**
 * GET /api/groups/[slug]/invitations
 * List invitations for a group
 */
export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ slug: string }> }) => {
    try {
      const { slug } = await params;
      const { user } = req;
      const supabase = await createServerClient();
      const { searchParams } = new URL(req.url);

      // Get group by slug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: group, error: groupError } = (await (
        supabase.from(DATABASE_TABLES.GROUPS) as any
      )
        .select('id')
        .eq('slug', slug)
        .single()) as { data: GroupRow | null; error: Error | null };

      if (groupError || !group) {
        return apiNotFound('Group not found');
      }

      // Check if user is admin/founder
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membership } = (await (supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as any)
        .select('role')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle()) as { data: GroupMemberRow | null };

      if (!membership || !['founder', 'admin'].includes(membership.role)) {
        return apiForbidden('Only admins can view invitations');
      }

      // Parse query params
      const status = searchParams.get('status') || 'pending';
      const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
      const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

      // Build query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as any)
        .select(
          `
        *,
        inviter:profiles!group_invitations_invited_by_fkey (
          name,
          avatar_url
        ),
        invitee:profiles!group_invitations_user_id_fkey (
          name,
          avatar_url
        )
      `,
          { count: 'exact' }
        )
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const {
        data: invitations,
        count,
        error,
      } = (await query) as {
        data: GroupInvitationRow[] | null;
        count: number | null;
        error: Error | null;
      };

      if (error) {
        logger.error('Failed to fetch invitations', { error, groupId: group.id }, 'Groups');
        return handleApiError(error);
      }

      return apiSuccess({
        invitations: invitations || [],
        total: count || 0,
        hasMore: (invitations?.length || 0) === limit,
      });
    } catch (error) {
      logger.error('Invitations GET error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);

/**
 * POST /api/groups/[slug]/invitations
 * Create a new invitation
 */
export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ slug: string }> }) => {
    try {
      const { slug } = await params;
      const { user } = req;
      const supabase = await createServerClient();

      // Get group by slug
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: group, error: groupError } = (await (
        supabase.from(DATABASE_TABLES.GROUPS) as any
      )
        .select('id, name')
        .eq('slug', slug)
        .single()) as { data: GroupRow | null; error: Error | null };

      if (groupError || !group) {
        return apiNotFound('Group not found');
      }

      // Check if user is admin/founder
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: membership } = (await (supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as any)
        .select('role')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .maybeSingle()) as { data: GroupMemberRow | null };

      if (!membership || !['founder', 'admin'].includes(membership.role)) {
        return apiForbidden('Only admins can create invitations');
      }

      // Parse and validate request body
      const body = await req.json();
      const validation = createInvitationSchema.safeParse(body);

      if (!validation.success) {
        return apiValidationError('Invalid request data', {
          fields: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      const { user_id, email, create_link, role, message, expires_in_days } = validation.data;

      // If inviting a specific user, check if already a member
      if (user_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingMember } = (await (
          supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as any
        )
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user_id)
          .maybeSingle()) as { data: { id: string } | null };

        if (existingMember) {
          return apiValidationError('User is already a member of this group');
        }

        // Check for existing pending invitation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingInvite } = (await (
          supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as any
        )
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user_id)
          .eq('status', 'pending')
          .maybeSingle()) as { data: { id: string } | null };

        if (existingInvite) {
          return apiValidationError('User already has a pending invitation');
        }
      }

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);

      // Build invitation data
      const invitationData: Record<string, unknown> = {
        group_id: group.id,
        role,
        message: message || null,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      };

      if (user_id) {
        invitationData.user_id = user_id;
      }

      if (email) {
        invitationData.email = email.toLowerCase().trim();
      }

      if (create_link) {
        // Generate secure token
        const tokenBytes = new Uint8Array(24);
        crypto.getRandomValues(tokenBytes);
        invitationData.token = btoa(String.fromCharCode(...tokenBytes))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      }

      // Create invitation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invitation, error: insertError } = (await (
        supabase.from(DATABASE_TABLES.GROUP_INVITATIONS) as any
      )
        .insert(invitationData)
        .select()
        .single()) as { data: GroupInvitationRow | null; error: Error | null };

      if (insertError || !invitation) {
        logger.error(
          'Failed to create invitation',
          { error: insertError, groupId: group.id },
          'Groups'
        );
        return handleApiError(insertError);
      }

      // Build invite URL if token was created
      const inviteUrl = invitation.token
        ? `${process.env.NEXT_PUBLIC_APP_URL}/groups/join/${invitation.token}`
        : undefined;

      return apiCreated({
        invitation: {
          id: invitation.id,
          group_id: invitation.group_id,
          user_id: invitation.user_id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expires_at: invitation.expires_at,
          invite_url: inviteUrl,
        },
      });
    } catch (error) {
      logger.error('Invitations POST error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);
