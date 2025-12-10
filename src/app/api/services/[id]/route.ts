import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userServiceSchema, type UserServiceFormData } from '@/lib/validation';
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

// GET /api/services/[id] - Get specific service
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const serviceId = params.id;

    const { data: service, error } = await supabase
      .from('user_services')
      .select('*')
      .eq('id', serviceId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Service not found');
      }
      return apiInternalError('Failed to fetch service', { details: error.message });
    }

    // Service is ready to return as-is
    const serviceWithProfile = service;

    return apiSuccess(serviceWithProfile);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/services/[id] - Update service
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const serviceId = params.id;

    // Check if service exists and belongs to user
    const { data: existingService, error: fetchError } = await supabase
      .from('user_services')
      .select('user_id')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      return apiNotFound('Service not found');
    }

    if (existingService.user_id !== user.id) {
      return apiUnauthorized('You can only update your own services');
    }

    // Rate limiting check
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many update requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userServiceSchema.parse(body);

    const updatePayload = {
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      hourly_rate_sats: validatedData.hourly_rate_sats,
      fixed_price_sats: validatedData.fixed_price_sats,
      currency: validatedData.currency ?? 'SATS',
      duration_minutes: validatedData.duration_minutes,
      availability_schedule: validatedData.availability_schedule,
      service_location_type: validatedData.service_location_type ?? 'remote',
      service_area: validatedData.service_area,
      images: validatedData.images ?? [],
      portfolio_links: validatedData.portfolio_links ?? [],
      updated_at: new Date().toISOString(),
    };

    const { data: service, error } = await supabase
      .from('user_services')
      .update(updatePayload)
      .eq('id', serviceId)
      .select('*')
      .single();

    if (error) {
      logger.error('Service update failed', {
        userId: user.id,
        serviceId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Service updated successfully', { userId: user.id, serviceId });
    return apiSuccess(service);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid service data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}

// DELETE /api/services/[id] - Delete service
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    const serviceId = params.id;

    // Check if service exists and belongs to user
    const { data: existingService, error: fetchError } = await supabase
      .from('user_services')
      .select('user_id, title')
      .eq('id', serviceId)
      .single();

    if (fetchError || !existingService) {
      return apiNotFound('Service not found');
    }

    if (existingService.user_id !== user.id) {
      return apiUnauthorized('You can only delete your own services');
    }

    const { error } = await supabase
      .from('user_services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      logger.error('Service deletion failed', {
        userId: user.id,
        serviceId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Service deleted successfully', { userId: user.id, serviceId });
    return apiSuccess({ message: 'Service deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

