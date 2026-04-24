/**
 * My Cat - Context-Aware Suggestions API
 *
 * GET /api/cat/suggestions - Returns personalised quick prompts based on the user's full context
 * (profile, entities, documents, tasks, wallets — not just documents).
 * These suggestions appear in the empty state of My Cat chat.
 */

import { apiSuccess } from '@/lib/api/standardResponse';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { fetchFullContextForCat } from '@/services/ai/document-context';
import { generateSuggestionsFromContext, hasRichContext, DEFAULT_SUGGESTIONS } from '@/services/ai/suggestions';
import { logger } from '@/utils/logger';

export const GET = withOptionalAuth(async (request) => {
  try {
    const { user, supabase } = request;

    if (!user) {
      return apiSuccess({ suggestions: DEFAULT_SUGGESTIONS, hasContext: false });
    }

    const context = await fetchFullContextForCat(supabase, user.id);
    const rich = hasRichContext(context);
    const suggestions = generateSuggestionsFromContext(context);

    return apiSuccess({ suggestions, hasContext: rich });
  } catch (error) {
    logger.error('Cat Suggestions error', error, 'CatSuggestionsAPI');
    return apiSuccess({ suggestions: DEFAULT_SUGGESTIONS, hasContext: false });
  }
});
