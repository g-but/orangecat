import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  search, 
  getTrending, 
  getSearchSuggestions,
  SearchResult, 
  SearchType, 
  SortOption, 
  SearchFilters,
  SearchResponse 
} from '@/services/search'

// Custom debounce function to avoid lodash dependency
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout
  
  const debouncedFunc = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
  
  debouncedFunc.cancel = () => {
    clearTimeout(timeoutId)
  }
  
  return debouncedFunc
}

interface UseSearchSuggestionsResult {
  suggestions: string[]
  loading: boolean
  error: string | null
}

export interface UseSearchOptions {
  initialQuery?: string
  initialType?: SearchType
  initialSort?: SortOption
  initialFilters?: SearchFilters
  autoSearch?: boolean
  debounceMs?: number
}

export interface UseSearchReturn {
  // State
  query: string
  searchType: SearchType
  sortBy: SortOption
  filters: SearchFilters
  results: SearchResult[]
  loading: boolean
  error: string | null
  totalResults: number
  hasMore: boolean
  suggestions: string[]
  
  // Actions
  setQuery: (query: string) => void
  setSearchType: (type: SearchType) => void
  setSortBy: (sort: SortOption) => void
  setFilters: (filters: SearchFilters) => void
  executeSearch: () => Promise<void>
  loadMore: () => Promise<void>
  clearSearch: () => void
  clearError: () => void
  
  // Computed
  isEmpty: boolean
  isSearching: boolean
  hasResults: boolean
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    initialQuery = '',
    initialType = 'all',
    initialSort = 'relevance',
    initialFilters = {},
    autoSearch = true,
    debounceMs = 300
  } = options

  // Core state
  const [query, setQuery] = useState(initialQuery)
  const [searchType, setSearchType] = useState<SearchType>(initialType)
  const [sortBy, setSortBy] = useState<SortOption>(initialSort)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  
  // Results state
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)
  
  // Suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  // Debounced query
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)
    
    return () => clearTimeout(timer)
  }, [query, debounceMs])

  // Execute search function
  const executeSearch = useCallback(async (offset = 0, append = false) => {
    try {
      setLoading(true)
      setError(null)
      
      let response: SearchResponse
      
      // Show trending content when no search query and no active filters
      const hasActiveFilters = Object.values(filters).some(value =>
        value !== undefined && value !== null && value !== '' &&
        !(Array.isArray(value) && value.length === 0)
      );

      if (!debouncedQuery && searchType === 'all' && !hasActiveFilters) {
        response = await getTrending()
      } else {
        // Perform search
        response = await search({
          query: debouncedQuery || undefined,
          type: searchType,
          sortBy,
          filters,
          limit: 20,
          offset
        })
      }
      
      if (append) {
        setResults(prev => [...prev, ...response.results])
      } else {
        setResults(response.results)
        setCurrentOffset(0)
      }
      
      setTotalResults(response.totalCount)
      setHasMore(response.hasMore)
      setCurrentOffset(offset + response.results.length)
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to perform search')
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, searchType, sortBy, filters])

  // Load more results
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) {return}
    await executeSearch(currentOffset, true)
  }, [hasMore, loading, currentOffset, executeSearch])

  // Get search suggestions
  const loadSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([])
      return
    }
    
    try {
      const newSuggestions = await getSearchSuggestions(searchQuery, 5)
      setSuggestions(newSuggestions)
    } catch {
      setSuggestions([])
    }
  }, [])

  // Auto-search when dependencies change
  useEffect(() => {
    if (autoSearch) {
      executeSearch()
    }
  }, [executeSearch, autoSearch])

  // Load suggestions when query changes
  useEffect(() => {
    loadSuggestions(debouncedQuery)
  }, [debouncedQuery, loadSuggestions])

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('')
    setSearchType('all')
    setSortBy('relevance')
    setFilters({})
    setResults([])
    setError(null)
    setTotalResults(0)
    setHasMore(false)
    setCurrentOffset(0)
    setSuggestions([])
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Computed values
  const isEmpty = useMemo(() => results.length === 0, [results])
  const isSearching = useMemo(() => loading, [loading])
  const hasResults = useMemo(() => results.length > 0, [results])

  return {
    // State
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
    
    // Actions
    setQuery,
    setSearchType,
    setSortBy,
    setFilters,
    executeSearch: () => executeSearch(),
    loadMore,
    clearSearch,
    clearError,
    
    // Computed
    isEmpty,
    isSearching,
    hasResults
  }
}

// Hook for search suggestions only
export function useSearchSuggestions(query: string, enabled: boolean = true): UseSearchSuggestionsResult {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable debounced search function using useMemo
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string, isEnabled: boolean) => {
      if (!searchQuery.trim() || !isEnabled) {
        setSuggestions([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Use real database suggestions from search service
        const realSuggestions = await getSearchSuggestions(searchQuery, 5)
        setSuggestions(realSuggestions)
      } catch {
        setError('Failed to fetch suggestions')
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [] // Empty deps - debounce wrapper is stable
  )

  useEffect(() => {
    if (enabled) {
      debouncedSearch(query, enabled)
    } else {
      setSuggestions([])
      setLoading(false)
    }

    return () => {
      debouncedSearch.cancel()
    }
  }, [query, enabled, debouncedSearch])

  return { suggestions, loading, error }
}

// Hook for trending content
export function useTrending() {
  const [trending, setTrending] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadTrending = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getTrending()
      setTrending(response.results)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to load trending content')
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    loadTrending()
  }, [loadTrending])
  
  return {
    trending,
    loading,
    error,
    refresh: loadTrending
  }
}

// Additional search utilities
export function useRecentSearches(userId?: string) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`search-history-${userId}`)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    }
  }, [userId])

  const addToHistory = (query: string) => {
    if (!userId || !query.trim()) {return}

    const newHistory = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10)
    setRecentSearches(newHistory)
    localStorage.setItem(`search-history-${userId}`, JSON.stringify(newHistory))
  }

  const clearHistory = () => {
    if (!userId) {return}
    setRecentSearches([])
    localStorage.removeItem(`search-history-${userId}`)
  }

  return { recentSearches, addToHistory, clearHistory }
}

export function useSearchFilters() {
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'projects' | 'profiles' | 'organizations',
    category: 'all',
    location: '',
    dateRange: 'all' as 'all' | 'week' | 'month' | 'year',
    sortBy: 'relevance' as 'relevance' | 'recent' | 'popular' | 'funding'
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFilter = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      type: 'all',
      category: 'all',
      location: '',
      dateRange: 'all',
      sortBy: 'relevance'
    })
  }

  return { filters, updateFilter, resetFilters }
} 