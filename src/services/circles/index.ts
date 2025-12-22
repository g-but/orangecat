/**
 * CIRCLES SERVICE - Community Groups Management
 *
 * Comprehensive circles management system for OrangeCat:
 * - Circle creation and management
 * - Member management with roles
 * - Multi-wallet support per circle
 * - Activity tracking and permissions
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-03
 * Last Modified Summary: Initial implementation of comprehensive circles service
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import {
  Circle,
  CircleMember,
  CircleWallet,
  CircleInvitation,
  CircleActivity,
  UserCircleSummary,
  CircleMemberDetail,
  CircleWalletSummary,
  CreateCircleRequest,
  UpdateCircleRequest,
  CreateCircleWalletRequest,
  UpdateCircleWalletRequest,
  InviteToCircleRequest,
  UpdateCircleMemberRequest,
  CircleResponse,
  CirclesListResponse,
  CircleMembersResponse,
  CircleWalletsResponse,
  CircleActivitiesResponse,
  CircleInvitationResponse,
  CirclesQuery,
  CircleActivitiesQuery,
  Pagination,
  CirclePermissions,
  DEFAULT_CIRCLE_PERMISSIONS,
} from '@/types/circles';

class CirclesService {
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_PAGE_SIZE = 100;

  // ==================== CIRCLE MANAGEMENT ====================

  /**
   * Create a new circle
   */
  async createCircle(request: CreateCircleRequest): Promise<CircleResponse> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }

      // Validate request
      const validation = this.validateCreateCircleRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.errors[0]?.message || 'Invalid request' };
      }

      // Use database function for atomic creation
      try {
        const { data, error } = await supabase.rpc('create_circle', {
          p_name: request.name,
          p_description: request.description,
          p_created_by: user.id,
          p_category: request.category,
          p_is_public: request.is_public ?? true,
        });

        if (error) {
          logger.warn('Database function failed, using fallback', error, 'Circles');
          throw error;
        }

        if (!data?.success) {
          return { success: false, error: data?.error || 'Failed to create circle' };
        }

        // Get the created circle
        const { data: circle, error: fetchError } = await supabase
          .from('circles')
          .select()
          .eq('id', data.circle_id)
          .single();

        if (fetchError) {
          logger.error('Failed to fetch created circle', fetchError, 'Circles');
          return { success: false, error: 'Circle created but failed to retrieve' };
        }

        logger.info('Circle created successfully', { circleId: circle.id }, 'Circles');
        return { success: true, circle };
      } catch (dbError) {
        logger.warn('Using fallback circle creation', dbError, 'Circles');

        // Fallback: direct creation
        const { data, error } = await supabase
          .from('circles')
          .insert({
            ...request,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) {
          logger.error('Fallback circle creation failed', error, 'Circles');
          return { success: false, error: error.message };
        }

        return { success: true, circle: data };
      }
    } catch (error) {
      logger.error('Exception creating circle', error, 'Circles');
      return { success: false, error: 'Failed to create circle' };
    }
  }

  /**
   * Update an existing circle
   */
  async updateCircle(circleId: string, request: UpdateCircleRequest): Promise<CircleResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Check permissions
      const canManage = await this.checkCirclePermission(circleId, userId, 'canManageSettings');
      if (!canManage) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const { data, error } = await supabase
        .from('circles')
        .update(request)
        .eq('id', circleId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update circle', error, 'Circles');
        return { success: false, error: error.message };
      }

      return { success: true, circle: data };
    } catch (error) {
      logger.error('Exception updating circle', error, 'Circles');
      return { success: false, error: 'Failed to update circle' };
    }
  }

  /**
   * Get a specific circle
   */
  async getCircle(circleId: string): Promise<CircleResponse> {
    try {
      const userId = await this.getCurrentUserId();

      let query = supabase.from('circles').select('*').eq('id', circleId);

      // If user is not authenticated, only show public circles
      if (!userId) {
        query = query.eq('is_public', true);
      } else {
        // Show public circles or circles the user is a member of
        query = query.or(`is_public.eq.true,id.in.(${await this.getUserCircleIds(userId)})`);
      }

      const { data, error } = await query.single();

      if (error) {
        logger.error('Failed to get circle', error, 'Circles');
        return { success: false, error: error.message };
      }

      return { success: true, circle: data };
    } catch (error) {
      logger.error('Exception getting circle', error, 'Circles');
      return { success: false, error: 'Failed to get circle' };
    }
  }

  /**
   * Get circles for current user
   */
  async getUserCircles(
    query?: CirclesQuery,
    pagination?: Pagination
  ): Promise<CirclesListResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Use database function for efficiency
      const { data, error } = await supabase.rpc('get_user_circles', { p_user_id: userId });

      if (error) {
        logger.warn('Database function failed, using fallback', error, 'Circles');

        // Fallback query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('circles')
          .select(
            `
            *,
            circle_members!inner(user_id, role, joined_at)
          `,
            { count: 'exact' }
          )
          .eq('circle_members.user_id', userId)
          .eq('circle_members.status', 'active');

        if (fallbackError) {
          logger.error('Fallback query failed', fallbackError, 'Circles');
          return { success: false, error: fallbackError.message };
        }

        return { success: true, circles: fallbackData || [], total: fallbackData?.length || 0 };
      }

      return { success: true, circles: data || [], total: data?.length || 0 };
    } catch (error) {
      logger.error('Exception getting user circles', error, 'Circles');
      return { success: false, error: 'Failed to get circles' };
    }
  }

  /**
   * Get public circles available for discovery
   */
  async getAvailableCircles(
    query?: CirclesQuery,
    pagination?: Pagination
  ): Promise<CirclesListResponse> {
    try {
      const userId = await this.getCurrentUserId();

      let dbQuery = supabase.from('circles').select('*', { count: 'exact' }).eq('is_public', true);

      // Apply filters
      if (query?.category) {
        dbQuery = dbQuery.eq('category', query.category);
      }
      if (query?.visibility) {
        dbQuery = dbQuery.eq('visibility', query.visibility);
      }
      if (query?.member_count_min) {
        dbQuery = dbQuery.gte('member_count', query.member_count_min);
      }
      if (query?.member_count_max) {
        dbQuery = dbQuery.lte('member_count', query.member_count_max);
      }

      // Apply sorting
      const sortBy = query?.sort_by || 'created_at';
      const sortOrder = query?.sort_order || 'desc';
      dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const pageSize = Math.min(pagination?.pageSize || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const page = pagination?.page || 1;
      const offset = (page - 1) * pageSize;

      dbQuery = dbQuery.range(offset, offset + pageSize - 1);

      const { data, error, count } = await dbQuery;

      if (error) {
        logger.error('Failed to get available circles', error, 'Circles');
        return { success: false, error: error.message };
      }

      return { success: true, circles: data || [], total: count || 0 };
    } catch (error) {
      logger.error('Exception getting available circles', error, 'Circles');
      return { success: false, error: 'Failed to get available circles' };
    }
  }

  /**
   * Delete a circle (only owners can delete)
   */
  async deleteCircle(circleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Check if user is owner
      const { data: membership } = await supabase
        .from('circle_members')
        .select('role')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!membership || membership.role !== 'owner') {
        return { success: false, error: 'Only circle owners can delete circles' };
      }

      const { error } = await supabase.from('circles').delete().eq('id', circleId);

      if (error) {
        logger.error('Failed to delete circle', error, 'Circles');
        return { success: false, error: error.message };
      }

      logger.info('Circle deleted successfully', { circleId }, 'Circles');
      return { success: true };
    } catch (error) {
      logger.error('Exception deleting circle', error, 'Circles');
      return { success: false, error: 'Failed to delete circle' };
    }
  }

  // ==================== MEMBER MANAGEMENT ====================

  /**
   * Join a circle
   */
  async joinCircle(circleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Check if circle allows joining
      const { data: circle } = await supabase
        .from('circles')
        .select('join_policy, is_public')
        .eq('id', circleId)
        .single();

      if (!circle) {
        return { success: false, error: 'Circle not found' };
      }

      if (circle.join_policy === 'closed') {
        return { success: false, error: 'This circle is closed to new members' };
      }

      if (circle.join_policy === 'invite_only' && !circle.is_public) {
        return { success: false, error: 'This circle requires an invitation to join' };
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('circle_members')
        .select('id, status')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        if (existingMember.status === 'active') {
          return { success: false, error: 'Already a member of this circle' };
        }
        // Reactivate membership
        const { error } = await supabase
          .from('circle_members')
          .update({ status: 'active', status_changed_at: new Date().toISOString() })
          .eq('id', existingMember.id);

        if (error) {
          logger.error('Failed to reactivate membership', error, 'Circles');
          return { success: false, error: error.message };
        }
      } else {
        // Create new membership
        const { error } = await supabase.from('circle_members').insert({
          circle_id: circleId,
          user_id: userId,
          role: 'member',
        });

        if (error) {
          logger.error('Failed to join circle', error, 'Circles');
          return { success: false, error: error.message };
        }
      }

      // Log activity
      await this.logCircleActivity(circleId, userId, 'joined', 'Joined the circle');

      return { success: true };
    } catch (error) {
      logger.error('Exception joining circle', error, 'Circles');
      return { success: false, error: 'Failed to join circle' };
    }
  }

  /**
   * Leave a circle
   */
  async leaveCircle(circleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Check if user is owner (owners can't leave)
      const { data: membership } = await supabase
        .from('circle_members')
        .select('role')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (membership?.role === 'owner') {
        return {
          success: false,
          error: 'Circle owners cannot leave. Transfer ownership or delete the circle.',
        };
      }

      const { error } = await supabase
        .from('circle_members')
        .update({
          status: 'left',
          status_changed_at: new Date().toISOString(),
        })
        .eq('circle_id', circleId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to leave circle', error, 'Circles');
        return { success: false, error: error.message };
      }

      // Log activity
      await this.logCircleActivity(circleId, userId, 'left', 'Left the circle');

      return { success: true };
    } catch (error) {
      logger.error('Exception leaving circle', error, 'Circles');
      return { success: false, error: 'Failed to leave circle' };
    }
  }

  /**
   * Get circle members
   */
  async getCircleMembers(circleId: string): Promise<CircleMembersResponse> {
    try {
      const userId = await this.getCurrentUserId();

      // Check if user can view members
      const canView = await this.checkCirclePermission(circleId, userId || '', 'canView');
      if (!canView) {
        return { success: false, error: 'Cannot view circle members' };
      }

      // Use database function
      const { data, error } = await supabase.rpc('get_circle_members', { p_circle_id: circleId });

      if (error) {
        logger.warn('Database function failed, using fallback', error, 'Circles');
        // Fallback would go here
        return { success: false, error: error.message };
      }

      return { success: true, members: data || [], total: data?.length || 0 };
    } catch (error) {
      logger.error('Exception getting circle members', error, 'Circles');
      return { success: false, error: 'Failed to get circle members' };
    }
  }

  /**
   * Update member role/permissions
   */
  async updateMember(
    circleId: string,
    memberId: string,
    request: UpdateCircleMemberRequest
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Check permissions
      const canManage = await this.checkCirclePermission(circleId, userId, 'canManageMembers');
      if (!canManage) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const { error } = await supabase
        .from('circle_members')
        .update(request)
        .eq('circle_id', circleId)
        .eq('user_id', memberId);

      if (error) {
        logger.error('Failed to update member', error, 'Circles');
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Exception updating member', error, 'Circles');
      return { success: false, error: 'Failed to update member' };
    }
  }

  // ==================== WALLET MANAGEMENT ====================

  /**
   * Create a circle wallet
   */
  async createCircleWallet(request: CreateCircleWalletRequest): Promise<CircleWalletsResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Check permissions
      const canManage = await this.checkCirclePermission(
        request.circle_id,
        userId,
        'canManageWallets'
      );
      if (!canManage) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const { data, error } = await supabase
        .from('circle_wallets')
        .insert({
          ...request,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create circle wallet', error, 'Circles');
        return { success: false, error: error.message };
      }

      // Log activity
      await this.logCircleActivity(
        request.circle_id,
        userId,
        'created_wallet',
        `Created wallet: ${request.name}`
      );

      return { success: true, wallets: [data] };
    } catch (error) {
      logger.error('Exception creating circle wallet', error, 'Circles');
      return { success: false, error: 'Failed to create wallet' };
    }
  }

  /**
   * Get circle wallets
   */
  async getCircleWallets(circleId: string): Promise<CircleWalletsResponse> {
    try {
      const userId = await this.getCurrentUserId();

      // Use database function
      const { data, error } = await supabase.rpc('get_circle_wallets', {
        p_circle_id: circleId,
        p_user_id: userId,
      });

      if (error) {
        logger.warn('Database function failed, using fallback', error, 'Circles');
        return { success: false, error: error.message };
      }

      return { success: true, wallets: data || [] };
    } catch (error) {
      logger.error('Exception getting circle wallets', error, 'Circles');
      return { success: false, error: 'Failed to get wallets' };
    }
  }

  // ==================== INVITATION MANAGEMENT ====================

  /**
   * Invite user to circle
   */
  async inviteToCircle(request: InviteToCircleRequest): Promise<CircleInvitationResponse> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Authentication required' };
      }

      // Check permissions
      const canInvite = await this.checkCirclePermission(request.circle_id, userId, 'canInvite');
      if (!canInvite) {
        return { success: false, error: 'Insufficient permissions' };
      }

      const { data, error } = await supabase
        .from('circle_invitations')
        .insert({
          ...request,
          invited_by: userId,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create invitation', error, 'Circles');
        return { success: false, error: error.message };
      }

      // Log activity
      await this.logCircleActivity(
        request.circle_id,
        userId,
        'invited_member',
        'Sent invitation to join circle'
      );

      return { success: true, invitation: data };
    } catch (error) {
      logger.error('Exception creating invitation', error, 'Circles');
      return { success: false, error: 'Failed to create invitation' };
    }
  }

  // ==================== ACTIVITY TRACKING ====================

  /**
   * Get circle activities
   */
  async getCircleActivities(
    circleId: string,
    query?: CircleActivitiesQuery,
    pagination?: Pagination
  ): Promise<CircleActivitiesResponse> {
    try {
      const userId = await this.getCurrentUserId();

      // Check permissions
      const canView = await this.checkCirclePermission(circleId, userId || '', 'canView');
      if (!canView) {
        return { success: false, error: 'Cannot view circle activities' };
      }

      let dbQuery = supabase
        .from('circle_activities')
        .select('*', { count: 'exact' })
        .eq('circle_id', circleId);

      // Apply filters
      if (query?.activity_type) {
        dbQuery = dbQuery.eq('activity_type', query.activity_type);
      }
      if (query?.user_id) {
        dbQuery = dbQuery.eq('user_id', query.user_id);
      }
      if (query?.date_from) {
        dbQuery = dbQuery.gte('created_at', query.date_from);
      }
      if (query?.date_to) {
        dbQuery = dbQuery.lte('created_at', query.date_to);
      }

      // Apply sorting
      const sortBy = query?.sort_by || 'created_at';
      const sortOrder = query?.sort_order || 'desc';
      dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const pageSize = Math.min(pagination?.pageSize || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const page = pagination?.page || 1;
      const offset = (page - 1) * pageSize;

      dbQuery = dbQuery.range(offset, offset + pageSize - 1);

      const { data, error, count } = await dbQuery;

      if (error) {
        logger.error('Failed to get circle activities', error, 'Circles');
        return { success: false, error: error.message };
      }

      return { success: true, activities: data || [], total: count || 0 };
    } catch (error) {
      logger.error('Exception getting circle activities', error, 'Circles');
      return { success: false, error: 'Failed to get activities' };
    }
  }

  // ==================== PERMISSIONS & UTILITIES ====================

  /**
   * Check if user has specific permission in circle
   */
  async checkCirclePermission(
    circleId: string,
    userId: string,
    permission: keyof CirclePermissions
  ): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      const { data: membership } = await supabase
        .from('circle_members')
        .select(
          'role, can_invite_members, can_manage_wallets, can_create_projects, can_manage_settings'
        )
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!membership) {
        return false;
      }

      const rolePermissions = DEFAULT_CIRCLE_PERMISSIONS[membership.role];

      // Check role-based permissions
      if (rolePermissions[permission]) {
        return true;
      }

      // Check custom permissions
      switch (permission) {
        case 'canInvite':
          return membership.can_invite_members;
        case 'canManageWallets':
          return membership.can_manage_wallets;
        case 'canCreateProjects':
          return membership.can_create_projects;
        case 'canManageSettings':
          return membership.can_manage_settings;
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error checking circle permission', error, 'Circles');
      return false;
    }
  }

  /**
   * Get user's circle IDs for permission checks
   */
  private async getUserCircleIds(userId: string): Promise<string> {
    try {
      const { data } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      return data?.map(m => m.circle_id).join(',') || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Log circle activity
   */
  private async logCircleActivity(
    circleId: string,
    userId: string,
    activityType: string,
    description: string
  ): Promise<void> {
    try {
      await supabase.from('circle_activities').insert({
        circle_id: circleId,
        user_id: userId,
        activity_type: activityType,
        description,
      });
    } catch (error) {
      logger.error('Failed to log circle activity', error, 'Circles');
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      return null;
    }
  }

  private validateCreateCircleRequest(request: CreateCircleRequest): {
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
  } {
    const errors: Array<{ field: string; message: string }> = [];

    if (!request.name || request.name.trim().length < 3) {
      errors.push({ field: 'name', message: 'Circle name must be at least 3 characters' });
    }

    if (request.name && request.name.length > 100) {
      errors.push({ field: 'name', message: 'Circle name cannot exceed 100 characters' });
    }

    if (request.description && request.description.length > 2000) {
      errors.push({ field: 'description', message: 'Description cannot exceed 2000 characters' });
    }

    return { valid: errors.length === 0, errors };
  }
}

// Export singleton instance
const circlesService = new CirclesService();
export default circlesService;

// Export class for testing
export { CirclesService };
