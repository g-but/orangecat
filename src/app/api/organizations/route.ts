/**
 * ORGANIZATIONS API ROUTE
 *
 * Handles organization CRUD operations.
 *
 * Created: 2025-12-16
 * Last Modified: 2025-12-16
 * Last Modified Summary: Initial implementation for unified EntityForm support
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { organizationSchema, type OrganizationFormData } from '@/lib/validation';
import { createOrganization } from '@/domain/commerce/service';
import {
  apiSuccess,
  apiUnauthorized,
  apiValidationError,
  apiInternalError,
  handleApiError,
  handleSupabaseError,
  apiRateLimited,
} from '@/lib/api/standardResponse';
import { rateLimit, rateLimitWrite, createRateLimitResponse } from '@/lib/rate-limit';
import { logger } from '@/utils/logger';
import { withRequestId } from '@/lib/api/withRequestId';
import { compose } from '@/lib/api/compose';
import { withZodBody } from '@/lib/api/withZod';

// GET /api/organizations - Get all organizations
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
    const type = searchParams.get('type');

    let query = supabase
      .from('organizations')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add optional filter
    if (type) {
      query = query.eq('type', type);
    }

    const { data: organizations, error } = await query;

    if (error) {
      return apiInternalError('Failed to fetch organizations', { details: error.message });
    }

    return apiSuccess(organizations || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/organizations - Create new organization
export const POST = compose(withRequestId(), withZodBody(organizationSchema))(async (request: NextRequest, ctx) => {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized();

    const rl = rateLimitWrite(user.id)
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.resetTime - Date.now()) / 1000)
      logger.warn('Organization creation rate limit exceeded', { userId: user.id })
      return apiRateLimited('Too many organization creation requests. Please slow down.', retryAfter)
    }

    const organization = await createOrganization(user.id, ctx.body, supabase)
    logger.info('Organization created successfully', { organizationId: organization.id });
    return apiSuccess(organization, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
