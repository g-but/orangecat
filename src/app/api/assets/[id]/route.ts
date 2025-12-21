import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { assetSchema } from '@/lib/validation';
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
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: PageProps) {
  try {
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return apiUnauthorized();
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from('assets')
      .select('id, title, type, status, estimated_value, currency, created_at, verification_status, description, location, documents')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Asset not found');
      }
      return apiInternalError('Failed to fetch asset', { details: error.message });
    }

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: PageProps) {
  try {
    const supabase = await createServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return apiUnauthorized();
    }

    const { id } = await params;

    // Check if asset exists and belongs to user
    const { data: existingAsset, error: fetchError } = await supabase
      .from('assets')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAsset) {
      return apiNotFound('Asset not found');
    }

    if (existingAsset.owner_id !== user.id) {
      return apiUnauthorized('You can only update your own assets');
    }

    // Rate limiting check
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many update requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = assetSchema.parse(body);

    const updatePayload = {
      title: validatedData.title,
      type: validatedData.type,
      description: validatedData.description,
      location: validatedData.location,
      estimated_value: validatedData.estimated_value,
      currency: validatedData.currency,
      documents: validatedData.documents ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('assets')
      .update(updatePayload)
      .eq('id', id)
      .select('id, title, type, status, estimated_value, currency, created_at, verification_status, description, location, documents')
      .single();

    if (error) {
      logger.error('Asset update failed', {
        userId: user.id,
        assetId: id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Asset updated successfully', { userId: user.id, assetId: id });
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid asset data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: PageProps) {
  try {
    const supabase = await createServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      return apiUnauthorized();
    }

    const { id } = await params;

    // Check if asset exists and belongs to user
    const { data: existingAsset, error: fetchError } = await supabase
      .from('assets')
      .select('owner_id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingAsset) {
      return apiNotFound('Asset not found');
    }

    if (existingAsset.owner_id !== user.id) {
      return apiUnauthorized('You can only delete your own assets');
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Asset deletion failed', {
        userId: user.id,
        assetId: id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Asset deleted successfully', { userId: user.id, assetId: id });
    return apiSuccess({ message: 'Asset deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

































