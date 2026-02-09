/**
 * Task Requests API
 *
 * GET /api/task-requests - Get pending task requests for current user
 *
 * Returns both direct requests AND broadcasts (where requested_user_id is null)
 *
 * Created: 2026-02-05
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ApiResponses, createSuccessResponse } from '@/lib/api/responses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { logger } from '@/utils/logger';

/**
 * GET /api/task-requests
 *
 * Get all pending task requests for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return ApiResponses.authenticationRequired();
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const includeBroadcasts = searchParams.get('include_broadcasts') !== 'false';

    // Build query for requests
    // Include direct requests (requested_user_id = current user)
    // AND broadcasts (requested_user_id is null) if includeBroadcasts is true
    let query = supabase
      .from(DATABASE_TABLES.TASK_REQUESTS)
      .select(
        `
        *,
        task:tasks(
          id,
          title,
          description,
          category,
          priority,
          current_status,
          estimated_minutes
        )
      `
      )
      .order('created_at', { ascending: false });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter to show requests for this user OR broadcasts
    if (includeBroadcasts) {
      query = query.or(`requested_user_id.eq.${user.id},requested_user_id.is.null`);
    } else {
      query = query.eq('requested_user_id', user.id);
    }

    // Exclude requests the user made themselves
    query = query.neq('requested_by', user.id);

    const { data: requests, error } = await query;

    if (error) {
      logger.error('Failed to fetch task requests', { error }, 'TaskRequestsAPI');
      return ApiResponses.internalServerError('Failed to fetch requests');
    }

    return createSuccessResponse({ requests });
  } catch (err) {
    logger.error('Exception in GET /api/task-requests', { error: err }, 'TaskRequestsAPI');
    return ApiResponses.internalServerError();
  }
}
