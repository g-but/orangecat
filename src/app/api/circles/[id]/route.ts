import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userCircleSchema } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, rateLimitWrite, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { apiRateLimited } from '@/lib/api/standardResponse';

interface PageProps {
  params: Promise<{ id: string }>;
}

// GET /api/circles/[id] - Get specific circle
export async function GET(request: NextRequest, { params }: PageProps) {
  try {
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    const { id } = await params;

    // Check if circle exists
    const { data: circle, error } = await supabase
      .from('circles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Circle not found');
      }
      return apiInternalError('Failed to fetch circle', { details: error.message });
    }

    // Check if user can view this circle
    if (circle.visibility !== 'public') {
      if (!user) {
        return apiUnauthorized('This circle is private');
      }

      // Check if user is a member or creator
      const { data: membership } = await supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!membership && circle.created_by !== user.id) {
        return apiNotFound('Circle not found');
      }
    }

    // Get member count
    const { count: memberCount } = await supabase
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .eq('circle_id', id)
      .eq('status', 'active');

    return apiSuccess({
      ...circle,
      member_count: memberCount || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/circles/[id] - Update circle
export async function PUT(request: NextRequest, { params }: PageProps) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = await params;

    // Check if circle exists
    const { data: existingCircle, error: fetchError } = await supabase
      .from('circles')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingCircle) {
      return apiNotFound('Circle not found');
    }

    // Check if user is the creator or an admin/owner member
    if (existingCircle.created_by !== user.id) {
      const { data: membership } = await supabase
        .from('circle_members')
        .select('role')
        .eq('circle_id', id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .in('role', ['owner', 'admin'])
        .single();

      if (!membership) {
        return apiUnauthorized('You can only update circles you own or administer');
      }
    }

    // Rate limiting check
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many update requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userCircleSchema.parse(body);

    const updatePayload = {
      name: validatedData.name,
      description: validatedData.description,
      category: validatedData.category,
      visibility: validatedData.visibility ?? 'private',
      max_members: validatedData.max_members,
      member_approval: validatedData.member_approval ?? 'manual',
      location_restricted: validatedData.location_restricted ?? false,
      location_radius_km: validatedData.location_radius_km,
      bitcoin_address: validatedData.bitcoin_address,
      wallet_purpose: validatedData.wallet_purpose,
      contribution_required: validatedData.contribution_required ?? false,
      contribution_amount: validatedData.contribution_amount,
      activity_level: validatedData.activity_level ?? 'regular',
      meeting_frequency: validatedData.meeting_frequency ?? 'none',
      enable_projects: validatedData.enable_projects ?? false,
      enable_events: validatedData.enable_events ?? true,
      enable_discussions: validatedData.enable_discussions ?? true,
      require_member_intro: validatedData.require_member_intro ?? false,
      updated_at: new Date().toISOString(),
    };

    const { data: circle, error } = await supabase
      .from('circles')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      logger.error('Circle update failed', {
        userId: user.id,
        circleId: id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Circle updated successfully', { userId: user.id, circleId: id });
    return apiSuccess(circle);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid circle data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}

// DELETE /api/circles/[id] - Delete circle
export async function DELETE(request: NextRequest, { params }: PageProps) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const { id } = await params;

    // Check if circle exists and user is the creator
    const { data: existingCircle, error: fetchError } = await supabase
      .from('circles')
      .select('created_by, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingCircle) {
      return apiNotFound('Circle not found');
    }

    // Only the creator can delete a circle
    if (existingCircle.created_by !== user.id) {
      return apiUnauthorized('You can only delete circles you created');
    }

    // Delete circle members first (cascade should handle this, but being explicit)
    const { error: membersError } = await supabase
      .from('circle_members')
      .delete()
      .eq('circle_id', id);

    if (membersError) {
      logger.warn('Error deleting circle members', {
        circleId: id,
        error: membersError.message,
      });
      // Continue with circle deletion
    }

    // Delete the circle
    const { error } = await supabase.from('circles').delete().eq('id', id);

    if (error) {
      logger.error('Circle deletion failed', {
        userId: user.id,
        circleId: id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Circle deleted successfully', { userId: user.id, circleId: id });
    return apiSuccess({ message: 'Circle deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
