/**
 * My Cat Context Summary API
 *
 * GET /api/cat/context - Returns summary of what My Cat knows about the user.
 * Powers the "What My Cat Knows" transparency panel.
 */

import { fetchFullContextForCat } from '@/services/ai/document-context';
import { buildContextSummary } from '@/services/cat/context-summary';
import { logger } from '@/utils/logger';
import { apiSuccess, apiInternalError } from '@/lib/api/standardResponse';
import { withAuth, type AuthenticatedRequest } from '@/lib/api/withAuth';

export const GET = withAuth(async (request: AuthenticatedRequest) => {
  const { user, supabase } = request;
  try {
    const context = await fetchFullContextForCat(supabase, user.id);
    return apiSuccess(buildContextSummary(context));
  } catch (error) {
    logger.error('Error fetching cat context', error, 'CatContextAPI');
    return apiInternalError('Failed to fetch context');
  }
});
