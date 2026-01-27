/**
 * USE SUGGESTIONS HOOK
 * Fetches context-aware suggestions on mount
 */

import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';

const DEFAULT_SUGGESTIONS = [
  'Help me write a product description',
  'Explain Bitcoin Lightning Network',
  'Give me ideas for my crowdfunding project',
  'How can I improve my service offering?',
];

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [hasContext, setHasContext] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/cat/suggestions');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data.suggestions) {
            setSuggestions(data.data.suggestions);
            setHasContext(data.data.hasContext || false);
          }
        }
      } catch (e) {
        // Keep default suggestions on error
        logger.error('Failed to fetch suggestions', { error: e }, 'useSuggestions');
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    void fetchSuggestions();
  }, []);

  return {
    suggestions,
    hasContext,
    isLoadingSuggestions,
  };
}
