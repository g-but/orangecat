/**
 * USE SUGGESTIONS HOOK
 * Fetches the prompts the Cat recommends this user send it.
 *
 * Starts from the registry-derived starter fork so the empty state is never
 * blank, then replaces it with generated, state-grounded prompts.
 */

import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';
import { STARTER_PROMPTS, type CatPromptSuggestion } from '@/config/cat-prompts';

/** The payload crosses the network, so trust only what type-checks here. */
function parseSuggestions(value: unknown): CatPromptSuggestion[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const parsed = value
    .filter(
      (s): s is CatPromptSuggestion =>
        !!s &&
        typeof (s as CatPromptSuggestion).prompt === 'string' &&
        !!(s as CatPromptSuggestion).prompt.trim()
    )
    .map(s => ({ prompt: s.prompt, ...(typeof s.reason === 'string' ? { reason: s.reason } : {}) }));
  return parsed.length > 0 ? parsed : null;
}

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<CatPromptSuggestion[]>(STARTER_PROMPTS);
  const [hasContext, setHasContext] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(API_ROUTES.CAT.SUGGESTIONS, { signal: controller.signal });
        if (controller.signal.aborted) {
          return;
        }
        if (res.ok) {
          const data = await res.json();
          if (controller.signal.aborted) {
            return;
          }
          const parsed = data.success ? parseSuggestions(data.data?.suggestions) : null;
          if (parsed) {
            setSuggestions(parsed);
            setHasContext(data.data.hasContext || false);
          }
        }
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') {
          return;
        }
        // Keep the starter prompts on error
        logger.error('Failed to fetch suggestions', { error: e }, 'useSuggestions');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    };

    void fetchSuggestions();
    return () => controller.abort();
  }, []);

  return {
    suggestions,
    hasContext,
    isLoadingSuggestions,
  };
}
