import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import supabaseAdmin from '@/services/supabase/admin';
import { userProductSchema, type UserProductFormData } from '@/lib/validation';
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

// GET /api/products - Get all active products
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
      .from('user_products')
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

    const { data: products, error } = await query;

    if (error) {
      return apiInternalError('Failed to fetch products', { details: error.message });
    }

    // Products are ready to return as-is
    const productsWithProfiles = products || [];

    return apiSuccess(productsWithProfiles, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/products - Create new product
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
      logger.warn('Product creation rate limit exceeded', { userId: user.id });
      return apiRateLimited('Too many product creation requests. Please slow down.', retryAfter);
    }

    const body = await request.json();
    const validatedData = userProductSchema.parse(body);

    const insertPayload = {
      user_id: user.id,
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
      status: 'draft', // Products start as draft
      is_featured: validatedData.is_featured ?? false,
    };

    // Use admin client to bypass RLS for server-side inserts
    // The user is already authenticated via supabase.auth.getUser()
    const { data: product, error } = await supabaseAdmin
      .from('user_products')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) {
      logger.error('Product creation failed', {
        userId: user.id,
        error: error.message,
        code: error.code,
      });
      return handleSupabaseError(error);
    }

    logger.info('Product created successfully', { userId: user.id, productId: product.id });
    return apiSuccess(product, { status: 201 });
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

