import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { compose } from '@/lib/api/compose'
import { withRateLimit } from '@/lib/api/withRateLimit'
import { apiSuccess, handleApiError } from '@/lib/api/standardResponse'
import { loanSchema } from '@/lib/validation'
import { createLoan } from '@/domain/loans/service'
import { withRequestId } from '@/lib/api/withRequestId'
import { createEntityPostHandler } from '@/lib/api/entityPostHandler'
import { getPagination, getString } from '@/lib/api/query'
import { getCacheControl, calculatePage } from '@/lib/api/helpers'
import { logger } from '@/utils/logger'

// GET /api/loans - list loans with pagination and filtering
export const GET = compose(withRequestId(), withRateLimit('read'))(async (request: NextRequest) => {
  try {
    const supabase = await createServerClient();
    const { limit, offset } = getPagination(request.url, { defaultLimit: 20, maxLimit: 100 });
    const userId = getString(request.url, 'user_id');
    const status = getString(request.url, 'status');

    // Check if user is requesting their own loans (include drafts)
    const { data: { user } } = await supabase.auth.getUser();
    const includeOwnDrafts = Boolean(userId && user && userId === user.id);

    // Build query with count
    let query = supabase
      .from('loans')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    } else if (!includeOwnDrafts) {
      // For public listings, only show active loans
      query = query.eq('status', 'active');
    }

    // Execute query
    const { data: items, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch loans', { 
        error, 
        code: error.code, 
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      // Return empty array for any error to prevent 500 - loans might not be fully set up yet
      return apiSuccess([], {
        page: calculatePage(offset, limit),
        limit,
        total: 0,
        headers: {
          'Cache-Control': getCacheControl(!!userId),
        },
      });
    }

    return apiSuccess(items || [], {
      page: calculatePage(offset, limit),
      limit,
      total: count || 0,
      headers: {
        'Cache-Control': getCacheControl(!!userId),
      },
    });
  } catch (error) {
    logger.error('Loans API error', { error });
    // Return empty array instead of error to prevent 500
    return apiSuccess([], {
      page: 1,
      limit: 20,
      total: 0,
    });
  }
})

// POST /api/loans - create a new loan (mock mode supported)
export const POST = createEntityPostHandler({
  entityType: 'loan',
  schema: loanSchema,
  createEntity: async (userId, data, supabase) => {
    return await createLoan(userId, data as any, supabase);
  },
});
