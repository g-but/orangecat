import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  search,
  getTrending,
  getSearchSuggestions,
  SearchResult,
  SearchType,
  SortOption,
  SearchFilters,
  SearchResponse,
} from '@/services/search';

export interface UseSearchOptions {
  initialQuery?: string;
  initialType?: SearchType;
  initialSort?: SortOption;
  initialFilters?: SearchFilters;
  autoSearch?: boolean;
  debounceMs?: number;
}

export interface UseSearchReturn {
  // State
  query: string;
  searchType: SearchType;
  sortBy: SortOption;
  filters: SearchFilters;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  totalResults: number;
  hasMore: boolean;
  suggestions: string[];

  // Actions
  setQuery: (query: string) => void;
  setSearchType: (type: SearchType) => void;
  setSortBy: (sort: SortOption) => void;
  setFilters: (filters: SearchFilters) => void;
  executeSearch: () => Promise<void>;
  loadMore: () => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;

  // Computed
  isEmpty: boolean;
  isSearching: boolean;
  hasResults: boolean;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialQuery = '',
    initialType = 'all',
    initialSort = 'relevance',
    initialFilters = {},
    autoSearch = true,
    debounceMs = 300,
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<SearchType>(initialType);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const executeSearch = useCallback(
    async (offset = 0, append = false) => {
      try {
        setLoading(true);
        setError(null);

        let response: SearchResponse;

        const hasActiveFilters = Object.values(filters).some(
          value =>
            value !== undefined &&
            value !== null &&
            value !== '' &&
            !(Array.isArray(value) && value.length === 0)
        );

        if (!debouncedQuery && searchType === 'all' && !hasActiveFilters) {
          response = await getTrending();
        } else {
          response = await search({
            query: debouncedQuery || undefined,
            type: searchType,
            sortBy,
            filters,
            limit: 20,
            offset,
          });
        }

        if (append) {
          setResults(prev => [...prev, ...response.results]);
        } else {
          setResults(response.results);
          setCurrentOffset(0);
        }

        setTotalResults(response.totalCount);
        setHasMore(response.hasMore);
        setCurrentOffset(offset + response.results.length);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message || 'Failed to perform search');
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery, searchType, sortBy, filters]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) {
      return;
    }
    await executeSearch(currentOffset, true);
  }, [hasMore, loading, currentOffset, executeSearch]);

  const loadSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const newSuggestions = await getSearchSuggestions(searchQuery, 5);
      setSuggestions(newSuggestions);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (autoSearch) {
      executeSearch();
    }
  }, [executeSearch, autoSearch]);

  useEffect(() => {
    loadSuggestions(debouncedQuery);
  }, [debouncedQuery, loadSuggestions]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchType('all');
    setSortBy('relevance');
    setFilters({});
    setResults([]);
    setError(null);
    setTotalResults(0);
    setHasMore(false);
    setCurrentOffset(0);
    setSuggestions([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isEmpty = useMemo(() => results.length === 0, [results]);
  const isSearching = useMemo(() => loading, [loading]);
  const hasResults = useMemo(() => results.length > 0, [results]);

  return {
    query,
    searchType,
    sortBy,
    filters,
    results,
    loading,
    error,
    totalResults,
    hasMore,
    suggestions,

    setQuery,
    setSearchType,
    setSortBy,
    setFilters,
    executeSearch: () => executeSearch(),
    loadMore,
    clearSearch,
    clearError,

    isEmpty,
    isSearching,
    hasResults,
  };
}
