import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import supabaseAdmin from '@/services/supabase/admin';
import { userServiceSchema, type UserServiceFormData } from '@/lib/validation';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
} from '@/lib/api/standardResponse';
import { rateLimit, rateLimitWrite, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { apiRateLimited } from '@/lib/api/standardResponse';

// GET /api/services - Get all active services
export async function GET(request: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const userId = searchParams.get('user_id');

    let query = supabase
      .from('user_services')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add optional filters
    if (category) {
      query = query.eq('category', category);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: services, error } = await query;

    if (error) {
      return apiInternalError('Failed to fetch services', { details: error.message });
    }

    // Services are ready to return as-is
    const servicesWithProfiles = services || [];

    return apiSuccess(servicesWithProfiles, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/services - Create new service
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiUnauthorized();
    }

    // Rate limiting check - 20 writes per minute per user
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      logger.warn('Service creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many service creation requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userServiceSchema.parse(body);

    const insertPayload = {
      user_id: user.id,
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
      status: 'draft', // Services start as draft
    };

    // Use admin client to bypass RLS for server-side inserts
    const { data: service, error } = await supabaseAdmin
      .from('user_services')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      logger.error('Service creation failed', {
        userId: user.id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Service created successfully', { userId: user.id, serviceId: service.id });
    return apiSuccess(service, { status: 201 });
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

