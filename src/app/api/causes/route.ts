import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import supabaseAdmin from '@/services/supabase/admin';
import { userCauseSchema, type UserCauseFormData } from '@/lib/validation';
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

// GET /api/causes - Get all active causes
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
      .from('user_causes')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add optional filters
    if (category) {
      query = query.eq('cause_category', category);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: causes, error } = await query;

    if (error) {
      return apiInternalError('Failed to fetch causes', { details: error.message });
    }

    // Causes are ready to return as-is
    const causesWithProfiles = causes || [];

    return apiSuccess(causesWithProfiles, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/causes - Create new cause
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
      logger.warn('Cause creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many cause creation requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userCauseSchema.parse(body);

    const insertPayload = {
      user_id: user.id,
      title: validatedData.title,
      description: validatedData.description,
      cause_category: validatedData.cause_category,
      goal_sats: validatedData.goal_sats,
      currency: validatedData.currency ?? 'SATS',
      bitcoin_address: validatedData.bitcoin_address,
      lightning_address: validatedData.lightning_address,
      distribution_rules: validatedData.distribution_rules,
      beneficiaries: validatedData.beneficiaries ?? [],
      status: 'draft', // Causes start as draft
    };

    // Use admin client to bypass RLS for server-side inserts
    const { data: cause, error } = await supabaseAdmin
      .from('user_causes')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      logger.error('Cause creation failed', {
        userId: user.id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Cause created successfully', { userId: user.id, causeId: cause.id });
    return apiSuccess(cause, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid cause data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}

