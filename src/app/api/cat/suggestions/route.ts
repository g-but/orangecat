/**
 * My Cat - Context-Aware Suggestions API
 *
 * GET /api/cat/suggestions - Returns personalized quick prompts based on user's documents
 * These suggestions appear in the empty state of My Cat chat
 */

import { apiSuccess } from '@/lib/api/standardResponse';
import { createServerClient } from '@/lib/supabase/server';
import { fetchDocumentsForCat } from '@/services/ai/document-context';
import { generateSuggestions, DEFAULT_SUGGESTIONS } from '@/services/ai/suggestions';
import { logger } from '@/utils/logger';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiSuccess({ suggestions: DEFAULT_SUGGESTIONS, hasContext: false });
    }

    const documents = await fetchDocumentsForCat(supabase, user.id);
    const suggestions = generateSuggestions(documents);

    return apiSuccess({ suggestions, hasContext: documents.length > 0, documentCount: documents.length });
  } catch (error) {
    logger.error('Cat Suggestions error', error, 'CatSuggestionsAPI');
    return apiSuccess({ suggestions: DEFAULT_SUGGESTIONS, hasContext: false });
  }
}
