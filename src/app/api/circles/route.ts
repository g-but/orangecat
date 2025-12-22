import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userCircleSchema } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiInternalError,
  handleApiError,
} from '@/lib/api/standardResponse';
import { logger } from '@/utils/logger';
import { compose } from '@/lib/api/compose';
import { withZodBody } from '@/lib/api/withZod';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { createCircle, listEntitiesPage } from '@/domain/commerce/service';
import { withRequestId } from '@/lib/api/withRequestId';
import { getPagination, getString } from '@/lib/api/query';
import { rateLimitWrite } from '@/lib/rate-limit';
import { apiRateLimited } from '@/lib/api/standardResponse';

export interface CircleMember {
  id: string;
  user_id: string;
  circle_id: string;
  role: 'owner' | 'admin' | 'member' | 'moderator';
  joined_at: string;
  invited_by?: string;
  status: 'active' | 'pending' | 'inactive';
  contribution_amount?: number;
  last_activity?: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  category: string;
  visibility: 'public' | 'private' | 'hidden';
  max_members?: number;
  member_approval: 'auto' | 'manual' | 'invite';
  bitcoin_address?: string;
  wallet_purpose?: string;
  location_restricted: boolean;
  location_radius_km?: number;
  contribution_required: boolean;
  contribution_amount?: number;
  activity_level: 'casual' | 'regular' | 'intensive';
  meeting_frequency: 'none' | 'weekly' | 'monthly' | 'quarterly';
  enable_projects: boolean;
  enable_events: boolean;
  enable_discussions: boolean;
  require_member_intro: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  treasury_balance?: number;
}

// GET /api/circles - Get circles with advanced filtering
export const GET = compose(
  withRequestId(),
  withRateLimit('read')
)(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const category = getString(request.url, 'category');
    const visibility = getString(request.url, 'visibility') as
      | 'public'
      | 'private'
      | 'hidden'
      | undefined;
    const activityLevel = getString(request.url, 'activity_level') as
      | 'casual'
      | 'regular'
      | 'intensive'
      | undefined;
    const hasWallet = getString(request.url, 'has_wallet') === 'true';
    const locationRestricted = getString(request.url, 'location_restricted') === 'true';
    const search = getString(request.url, 'search');
    const userCirclesOnly = getString(request.url, 'my_circles') === 'true';

    // Build filters
    const filters: Record<string, any> = {};

    if (category) {
      filters.category = category;
    }
    if (visibility) {
      filters.visibility = visibility;
    }
    if (activityLevel) {
      filters.activity_level = activityLevel;
    }
    if (hasWallet) {
      filters.bitcoin_address = { not: null };
    }
    if (locationRestricted) {
      filters.location_restricted = true;
    }

    // Search functionality
    if (search) {
      filters.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If user is requesting their own circles, filter by membership
    if (userCirclesOnly && user) {
      const { data: userCircleIds } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (userCircleIds) {
        const circleIds = userCircleIds.map(cm => cm.circle_id);
        filters.id = { in: circleIds };
      }
    }

    // For non-public circles, only show circles the user is a member of
    if (user && !userCirclesOnly) {
      const { data: userCircleIds } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const memberCircleIds = userCircleIds?.map(cm => cm.circle_id) || [];

      // Show public circles OR circles user is member of
      filters.OR = filters.OR || [];
      filters.OR.push({ visibility: 'public' }, { id: { in: memberCircleIds } });
    } else if (!user) {
      // Anonymous users can only see public circles
      filters.visibility = 'public';
    }

    const { items, total } = await listEntitiesPage('circles', {
      limit,
      offset,
      filters,
      includeMemberCount: true,
      includeTreasuryBalance: true,
    });

    return apiSuccess(items, {
      page: Math.floor(offset / limit) + 1,
      limit,
      total,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

// POST /api/circles - Create new circle with advanced features
export const POST = compose(
  withRequestId(),
  withZodBody(userCircleSchema)
)(async (request: NextRequest, ctx) => {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Rate limit circle creation
    const rl = rateLimitWrite(user.id);
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000);
      logger.warn('Circle creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many circle creation requests. Please slow down.', retryAfter);
    }

    // Create the circle
    const circle = await createCircle(user.id, ctx.body, supabase);

    // Add creator as owner member
    const { error: memberError } = await supabase.from('circle_members').insert({
      circle_id: circle.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    if (memberError) {
      logger.error('Failed to add circle creator as member', {
        error: memberError,
        circleId: circle.id,
      });
      // Don't fail the request, but log the error
    }

    // Initialize circle features based on settings
    if (ctx.body.enable_discussions) {
      // Create default discussion category
      await supabase.from('circle_discussion_categories').insert({
        circle_id: circle.id,
        name: 'General',
        description: 'General discussion and announcements',
        is_default: true,
      });
    }

    logger.info('Circle created successfully', {
      circleId: circle.id,
      creatorId: user.id,
      category: circle.category,
      visibility: circle.visibility,
    });

    return apiSuccess(circle, { status: 201 });
  } catch (error) {
    logger.error('Circle creation failed', { error, userId: request.headers.get('x-user-id') });
    return handleApiError(error);
  }
});
