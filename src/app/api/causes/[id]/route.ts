import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userCauseSchema, type UserCauseFormData } from '@/lib/validation';
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

// GET /api/causes/[id] - Get specific cause
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const causeId = params.id;

    const { data: cause, error } = await supabase
      .from('user_causes')
      .select('*')
      .eq('id', causeId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Cause not found');
      }
      return apiInternalError('Failed to fetch cause', { details: error.message });
    }

    // Cause is ready to return as-is
    const causeWithProfile = cause;

    return apiSuccess(causeWithProfile);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/causes/[id] - Update cause
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

    const causeId = params.id;

    // Check if cause exists and belongs to user
    const { data: existingCause, error: fetchError } = await supabase
      .from('user_causes')
      .select('user_id')
      .eq('id', causeId)
      .single();

    if (fetchError || !existingCause) {
      return apiNotFound('Cause not found');
    }

    if (existingCause.user_id !== user.id) {
      return apiUnauthorized('You can only update your own causes');
    }

    // Rate limiting check
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many update requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userCauseSchema.parse(body);

    const updatePayload = {
      title: validatedData.title,
      description: validatedData.description,
      cause_category: validatedData.cause_category,
      goal_sats: validatedData.goal_sats,
      currency: validatedData.currency ?? 'SATS',
      bitcoin_address: validatedData.bitcoin_address,
      lightning_address: validatedData.lightning_address,
      distribution_rules: validatedData.distribution_rules,
      beneficiaries: validatedData.beneficiaries ?? [],
      updated_at: new Date().toISOString(),
    };

    const { data: cause, error } = await supabase
      .from('user_causes')
      .update(updatePayload)
      .eq('id', causeId)
      .select('*')
      .single();

    if (error) {
      logger.error('Cause update failed', {
        userId: user.id,
        causeId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Cause updated successfully', { userId: user.id, causeId });
    return apiSuccess(cause);
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

// DELETE /api/causes/[id] - Delete cause
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

    const causeId = params.id;

    // Check if cause exists and belongs to user
    const { data: existingCause, error: fetchError } = await supabase
      .from('user_causes')
      .select('user_id, title')
      .eq('id', causeId)
      .single();

    if (fetchError || !existingCause) {
      return apiNotFound('Cause not found');
    }

    if (existingCause.user_id !== user.id) {
      return apiUnauthorized('You can only delete your own causes');
    }

    const { error } = await supabase
      .from('user_causes')
      .delete()
      .eq('id', causeId);

    if (error) {
      logger.error('Cause deletion failed', {
        userId: user.id,
        causeId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Cause deleted successfully', { userId: user.id, causeId });
    return apiSuccess({ message: 'Cause deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

