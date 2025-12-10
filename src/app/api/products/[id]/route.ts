import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { userProductSchema, type UserProductFormData } from '@/lib/validation';
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

// GET /api/products/[id] - Get specific product
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limiting check
    const rateLimitResult = rateLimit(request);
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    const supabase = await createServerClient();
    const productId = params.id;

    const { data: product, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiNotFound('Product not found');
      }
      return apiInternalError('Failed to fetch product', { details: error.message });
    }

    // Product is ready to return as-is
    const productWithProfile = product;

    return apiSuccess(productWithProfile);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/products/[id] - Update product
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

    const productId = params.id;

    // Check if product exists and belongs to user
    const { data: existingProduct, error: fetchError } = await supabase
      .from('user_products')
      .select('user_id')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct) {
      return apiNotFound('Product not found');
    }

    if (existingProduct.user_id !== user.id) {
      return apiUnauthorized('You can only update your own products');
    }

    // Rate limiting check
    const rateLimitResult = rateLimitWrite(user.id);
    if (!rateLimitResult.success) {
      const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);
      return apiRateLimited('Too many update requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userProductSchema.parse(body);

    const updatePayload = {
      title: validatedData.title,
      description: validatedData.description,
      price_sats: validatedData.price_sats,
      currency: validatedData.currency ?? 'SATS',
      product_type: validatedData.product_type ?? 'physical',
      images: validatedData.images ?? [],
      thumbnail_url: validatedData.thumbnail_url,
      inventory_count: validatedData.inventory_count ?? -1,
      fulfillment_type: validatedData.fulfillment_type ?? 'manual',
      category: validatedData.category,
      tags: validatedData.tags ?? [],
      is_featured: validatedData.is_featured ?? false,
      updated_at: new Date().toISOString(),
    };

    const { data: product, error } = await supabase
      .from('user_products')
      .update(updatePayload)
      .eq('id', productId)
      .select('*')
      .single();

    if (error) {
      logger.error('Product update failed', {
        userId: user.id,
        productId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Product updated successfully', { userId: user.id, productId });
    return apiSuccess(product);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as any;
      return apiValidationError('Invalid product data', {
        details: zodError.errors || zodError.message,
      });
    }
    return handleApiError(error);
  }
}

// DELETE /api/products/[id] - Delete product
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

    const productId = params.id;

    // Check if product exists and belongs to user
    const { data: existingProduct, error: fetchError } = await supabase
      .from('user_products')
      .select('user_id, title')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct) {
      return apiNotFound('Product not found');
    }

    if (existingProduct.user_id !== user.id) {
      return apiUnauthorized('You can only delete your own products');
    }

    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('id', productId);

    if (error) {
      logger.error('Product deletion failed', {
        userId: user.id,
        productId,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Product deleted successfully', { userId: user.id, productId });
    return apiSuccess({ message: 'Product deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

