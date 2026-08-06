/**
 * My Cat — Prompt Suggestions API
 *
 * GET /api/cat/suggestions — returns the prompts THIS user should send the Cat,
 * generated from their real state (listings, drafts, payment setup, profile).
 * Rendered in the empty state of My Cat chat.
 *
 * Ordered; at most the first item carries a `reason` and is the recommendation.
 * Generation + ranking rules live in services/cat/prompt-suggestions.ts.
 */

import { apiSuccess } from '@/lib/api/standardResponse';
import { withOptionalAuth } from '@/lib/api/withAuth';
import { fetchFullContextForCat } from '@/services/ai/document-context';
import { generatePromptSuggestions, hasRichContext } from '@/services/cat/prompt-suggestions';
import { STARTER_PROMPTS } from '@/config/cat-prompts';
import { logger } from '@/utils/logger';

export const GET = withOptionalAuth(async request => {
  try {
    const { user, supabase } = request;

    if (!user) {
      return apiSuccess({ suggestions: STARTER_PROMPTS, hasContext: false });
    }

    const context = await fetchFullContextForCat(supabase, user.id);
    const rich = hasRichContext(context);
    const suggestions = await generatePromptSuggestions(user.id, context);

    return apiSuccess({ suggestions, hasContext: rich });
  } catch (error) {
    logger.error('Cat Suggestions error', error, 'CatSuggestionsAPI');
    return apiSuccess({ suggestions: STARTER_PROMPTS, hasContext: false });
  }
});
