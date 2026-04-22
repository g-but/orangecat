/**
 * Group Invitations API
 *
 * GET  /api/groups/[slug]/invitations - List invitations (admin only)
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
  apiRateLimited,
  handleApiError,
} from '@/lib/api/standardResponse';
import { rateLimitWriteAsync } from '@/lib/rate-limit';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';
import { z } from 'zod';
import { resolveGroupBySlug, checkGroupAdmin } from '@/domain/groups/helpers.server';

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
}

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

export const GET = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    try {
      const { user } = req;
      const supabase = await createServerClient();
      const { searchParams } = new URL(req.url);

      const group = await resolveGroupBySlug(supabase, slug);
      if (!group) return apiNotFound('Group not found');

      const role = await checkGroupAdmin(supabase, group.id, user.id);
      if (!role) return apiForbidden('Only admins can view invitations');

      const status = searchParams.get('status') || 'pending';
      const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10) || 20, 100);
      const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from(DATABASE_TABLES.GROUP_INVITATIONS)
        .select(
          `*, inviter:profiles!group_invitations_invited_by_fkey (name, avatar_url),
           invitee:profiles!group_invitations_user_id_fkey (name, avatar_url)`,
          { count: 'exact' }
        )
        .eq('group_id', group.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status !== 'all') query = query.eq('status', status);

      const { data: invitations, count, error } = await query;

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

export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    try {
      const { user } = req;
      const supabase = await createServerClient();

      const rl = await rateLimitWriteAsync(user.id);
      if (!rl.success) {
        return apiRateLimited('Too many requests. Please slow down.', Math.ceil((rl.resetTime - Date.now()) / 1000));
      }

      const group = await resolveGroupBySlug(supabase, slug);
      if (!group) return apiNotFound('Group not found');

      const adminRole = await checkGroupAdmin(supabase, group.id, user.id);
      if (!adminRole) return apiForbidden('Only admins can create invitations');

      const body = await req.json();
      const validation = createInvitationSchema.safeParse(body);
      if (!validation.success) {
        return apiValidationError('Invalid request data', {
          fields: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message })),
        });
      }

      const { user_id, email, create_link, role, message, expires_in_days } = validation.data;

      if (user_id) {
        const { data: existingMember } = await supabase
          .from(DATABASE_TABLES.GROUP_MEMBERS)
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user_id)
          .maybeSingle();
        if (existingMember) return apiValidationError('User is already a member of this group');

        const { data: existingInvite } = await supabase
          .from(DATABASE_TABLES.GROUP_INVITATIONS)
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user_id)
          .eq('status', 'pending')
          .maybeSingle();
        if (existingInvite) return apiValidationError('User already has a pending invitation');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);

      const invitationData: Record<string, unknown> = {
        group_id: group.id,
        role,
        message: message || null,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        ...(user_id && { user_id }),
        ...(email && { email: email.toLowerCase().trim() }),
      };

      if (create_link) {
        const tokenBytes = new Uint8Array(24);
        crypto.getRandomValues(tokenBytes);
        invitationData.token = btoa(String.fromCharCode(...tokenBytes))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invitation, error: insertError } = await (supabase as any)
        .from(DATABASE_TABLES.GROUP_INVITATIONS)
        .insert(invitationData)
        .select()
        .single();

      if (insertError || !invitation) {
        logger.error('Failed to create invitation', { error: insertError, groupId: group.id }, 'Groups');
        return handleApiError(insertError);
      }

      const inv = invitation as GroupInvitationRow;
      const inviteUrl = inv.token
        ? `${process.env.NEXT_PUBLIC_APP_URL}/groups/join/${inv.token}`
        : undefined;

      return apiCreated({
        invitation: {
          id: inv.id,
          group_id: inv.group_id,
          user_id: inv.user_id,
          email: inv.email,
          role: inv.role,
          status: inv.status,
          expires_at: inv.expires_at,
          invite_url: inviteUrl,
        },
      });
    } catch (error) {
      logger.error('Invitations POST error', { error }, 'Groups');
      return handleApiError(error);
    }
  }
);
