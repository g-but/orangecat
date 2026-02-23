import { withOptionalAuth } from '@/lib/api/withAuth';
import { createServerClient } from '@/lib/supabase/server';
import { DATABASE_TABLES } from '@/config/database-tables';
import { apiSuccess, apiForbidden, handleApiError } from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';

// Type definitions for Supabase tables not in generated types
interface GroupRow {
  id: string;
  is_public: boolean;
}

interface GroupMemberRow {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  permission_overrides?: string[] | null;
  joined_at?: string;
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    transparency_score?: number | null;
    bio?: string | null;
  } | null;
}

export const GET = withOptionalAuth(
  async (req, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: organizationId } = await params;
      const { user } = req;
      const supabase = await createServerClient();

      // Check access permissions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: member } = (await (supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as any)
        .select('user_id')
        .eq('group_id', organizationId)
        .eq('user_id', user?.id || '')
        .maybeSingle()) as { data: GroupMemberRow | null };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: group } = (await (supabase.from(DATABASE_TABLES.GROUPS) as any)
        .select('is_public')
        .eq('id', organizationId)
        .single()) as { data: GroupRow | null };

      if (!group?.is_public && !member) {
        return apiForbidden('Access denied');
      }

      // Get members with profile information
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: members, error } = (await (supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as any)
        .select(
          `
        *,
        profiles (
          id,
          display_name,
          avatar_url,
          transparency_score,
          bio
        )
      `
        )
        .eq('group_id', organizationId)
        .order('joined_at', { ascending: false })) as {
        data: GroupMemberRow[] | null;
        error: Error | null;
      };

      if (error) {
        logger.error('Stakeholders fetch error', { error, organizationId }, 'Organizations');
        return handleApiError(error);
      }

      // Map group_members to stakeholders format for backward compatibility
      const stakeholders =
        members?.map(m => ({
          ...m,
          role_type: m.role,
          organization_id: m.group_id,
          voting_weight: 1.0, // group_members doesn't have voting_weight
          equity_percentage: null, // group_members doesn't have equity_percentage
          permissions: m.permission_overrides || [],
        })) || [];

      const groupedStakeholders = {
        founders: stakeholders.filter(s => s.role === 'founder') || [],
        employees: stakeholders.filter(s => s.role === 'admin') || [],
        contractors: stakeholders.filter(s => s.role === 'admin') || [], // Map admin to contractors too
        shareholders: stakeholders.filter(s => s.role === 'member') || [],
        lenders: [] as typeof stakeholders, // No lenders in new system
        donors: [] as typeof stakeholders, // No donors in new system
      };

      // Calculate summary statistics
      const summary = {
        total: stakeholders.length || 0,
        founders: groupedStakeholders.founders.length,
        employees: groupedStakeholders.employees.length,
        contractors: groupedStakeholders.contractors.length,
        shareholders: groupedStakeholders.shareholders.length,
        lenders: groupedStakeholders.lenders.length,
        donors: groupedStakeholders.donors.length,
        total_voting_power: stakeholders.length || 0, // Each member has 1.0 voting weight
        total_equity: 0, // No equity in new system
      };

      return apiSuccess({
        stakeholders: groupedStakeholders,
        summary,
      });
    } catch (error) {
      logger.error(
        'Stakeholders GET error',
        { error, organizationId: (await params).id },
        'Organizations'
      );
      return handleApiError(error);
    }
  }
);

import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';
import { z } from 'zod';
import { apiCreated, apiConflict, apiValidationError } from '@/lib/api/standardResponse';

const addStakeholderSchema = z.object({
  user_id: z.string().uuid(),
  role_type: z.enum(['founder', 'employee', 'contractor', 'shareholder', 'lender', 'donor']),
  voting_weight: z.number().min(0).optional().default(1.0),
  permissions: z.array(z.string()).optional().default([]),
  equity_percentage: z.number().min(0).max(100).optional().default(0),
});

export const POST = withAuth(
  async (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: organizationId } = await params;
      const { user } = req;
      const supabase = await createServerClient();

      // Check if user is a founder or admin (only founders/admins can manage members)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: member2 } = (await (supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as any)
        .select('role')
        .eq('group_id', organizationId)
        .eq('user_id', user.id)
        .in('role', ['founder', 'admin'])
        .maybeSingle()) as { data: GroupMemberRow | null };

      if (!member2) {
        return apiForbidden('Only founders and admins can manage members');
      }

      // Parse and validate request body
      const body = await req.json();
      const validation = addStakeholderSchema.safeParse(body);

      if (!validation.success) {
        return apiValidationError('Invalid request data', {
          fields: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      const {
        user_id,
        role_type,
        // voting_weight and equity_percentage are validated but not used in current schema
        // as group_members doesn't have these fields
        voting_weight: _voting_weight,
        permissions,
        equity_percentage: _equity_percentage,
      } = validation.data;

      // Map old role_type to new role
      const roleTypeToRole: Record<string, string> = {
        founder: 'founder',
        employee: 'admin',
        contractor: 'admin',
        shareholder: 'member',
        lender: 'member',
        donor: 'member',
      };

      const role = roleTypeToRole[role_type] || 'member';

      // Check if user is already a member
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingMember } = (await (supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as any)
        .select('id')
        .eq('group_id', organizationId)
        .eq('user_id', user_id)
        .maybeSingle()) as { data: { id: string } | null };

      if (existingMember) {
        return apiConflict('User is already a member of this group');
      }

      // Add member
      const memberData = {
        group_id: organizationId,
        user_id,
        role,
        permission_overrides: permissions && permissions.length > 0 ? permissions : null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newMember, error: insertError } = (await (
        supabase.from(DATABASE_TABLES.GROUP_MEMBERS) as any
      )
        .insert(memberData)
        .select(
          `
        *,
        profiles (
          display_name,
          avatar_url
        )
      `
        )
        .single()) as { data: GroupMemberRow | null; error: Error | null };

      if (insertError) {
        logger.error(
          'Member addition error',
          { error: insertError, organizationId, userId: user.id },
          'Groups'
        );
        return handleApiError(insertError);
      }

      // Map back to stakeholder format for backward compatibility
      const newStakeholder = newMember
        ? {
            ...newMember,
            role_type: newMember.role,
            organization_id: newMember.group_id,
            voting_weight: 1.0,
            equity_percentage: null,
            permissions: newMember.permission_overrides || [],
          }
        : null;

      return apiCreated(newStakeholder);
    } catch (error) {
      logger.error(
        'Stakeholder POST error',
        { error, organizationId: (await params).id, userId: req.user.id },
        'Organizations'
      );
      return handleApiError(error);
    }
  }
);
