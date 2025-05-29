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
      
      // Show trending content when no search query and no filters
      if (!debouncedQuery && searchType === 'all' && Object.keys(filters).length === 0) {
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
      
    } catch (err: any) {
      console.error('Search error:', err)
      setError(err.message || 'Failed to perform search')
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, searchType, sortBy, filters])

  // Load more results
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
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
    } catch (err) {
      console.error('Error loading suggestions:', err)
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
export function useSearchSuggestions(query: string, enabled = true) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (!enabled || !query || query.length < 2) {
      setSuggestions([])
      return
    }
    
    const loadSuggestions = async () => {
      setLoading(true)
      try {
        const results = await getSearchSuggestions(query, 5)
        setSuggestions(results)
      } catch (error) {
        console.error('Error loading suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }
    
    const timer = setTimeout(loadSuggestions, 300)
    return () => clearTimeout(timer)
  }, [query, enabled])
  
  return { suggestions, loading }
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
    } catch (err: any) {
      console.error('Error loading trending:', err)
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