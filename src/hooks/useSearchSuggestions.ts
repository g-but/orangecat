import { useState, useEffect, useMemo } from 'react';
import { getSearchSuggestions } from '@/services/search';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout;

  const debouncedFunc = (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };

  debouncedFunc.cancel = () => {
    clearTimeout(timeoutId);
  };

  return debouncedFunc;
}

interface UseSearchSuggestionsResult {
  suggestions: string[];
  loading: boolean;
  error: string | null;
}

export function useSearchSuggestions(
  query: string,
  enabled: boolean = true
): UseSearchSuggestionsResult {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string, isEnabled: boolean) => {
        if (!searchQuery.trim() || !isEnabled) {
          setSuggestions([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const realSuggestions = await getSearchSuggestions(searchQuery, 5);
          setSuggestions(realSuggestions);
        } catch {
          setError('Failed to fetch suggestions');
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 300),
    []
  );

  useEffect(() => {
    if (enabled) {
      debouncedSearch(query, enabled);
    } else {
      setSuggestions([]);
      setLoading(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [query, enabled, debouncedSearch]);

  return { suggestions, loading, error };
}
