/**
 * My Cat Context Summary API
 *
 * GET /api/cat/context - Returns summary of what My Cat knows about the user.
 * Powers the "What My Cat Knows" transparency panel.
 */

import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchFullContextForCat } from '@/services/ai/document-context';
import { buildContextSummary } from '@/services/cat/context-summary';
import { logger } from '@/utils/logger';
import { apiSuccess, apiUnauthorized, apiInternalError } from '@/lib/api/standardResponse';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return apiUnauthorized();

    const context = await fetchFullContextForCat(supabase, user.id);
    return apiSuccess(buildContextSummary(context));
  } catch (error) {
    logger.error('Error fetching cat context', error, 'CatContextAPI');
    return apiInternalError('Failed to fetch context');
  }
}
