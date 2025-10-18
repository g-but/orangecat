'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  History, 
  TrendingUp, 
  Users, 
  Target, 
  Clock,
  X,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { useSearchSuggestions } from '@/hooks/useSearch'
import { useAuth } from '@/hooks/useAuth'

interface SearchResult {
  id: string
  type: 'profile' | 'campaign' | 'trending'
  title: string
  subtitle?: string
  icon?: React.ReactNode
  url: string
}

interface EnhancedSearchBarProps {
  className?: string
  placeholder?: string
  showQuickActions?: boolean
  autoFocus?: boolean
}

export default function EnhancedSearchBar({ 
  className = '', 
  placeholder = 'Search campaigns, people, organizations...',
  showQuickActions = true,
  autoFocus = false
}: EnhancedSearchBarProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const { suggestions, loading } = useSearchSuggestions(query, isOpen && query.length > 1)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Calculate all visible items for keyboard navigation
  const getVisibleItems = () => {
    const items: Array<{ text: string; action: () => void }> = []
    
    if (query.length === 0) {
      // Quick Actions
      if (showQuickActions) {
        quickActions.forEach(action => {
          items.push({ text: action.label, action: action.action })
        })
      }
      
      // Search History
      searchHistory.forEach(historyItem => {
        items.push({ text: historyItem, action: () => handleSearch(historyItem) })
      })
      
      // Trending
      trendingSearches.forEach(trending => {
        items.push({ text: trending, action: () => handleSearch(trending) })
      })
    } else if (query.length > 1) {
      // Suggestions
      suggestions.forEach(suggestion => {
        items.push({ text: suggestion, action: () => handleSearch(suggestion) })
      })
      
      // Search for exact query
      items.push({ text: `Search for "${query}"`, action: () => handleSearch(query) })
    }
    
    return items
  }

  // Load search history from localStorage
  useEffect(() => {
    if (user) {
      const history = localStorage.getItem(`search-history-${user.id}`)
      if (history) {
        setSearchHistory(JSON.parse(history).slice(0, 5))
      }
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // ⌘K / Ctrl+K to focus search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
        setFocusedIndex(-1)
        return
      }

      // Only handle dropdown navigation when search is open
      if (!isOpen) {return}

      const visibleItems = getVisibleItems()
      const maxIndex = visibleItems.length - 1

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          setIsOpen(false)
          setFocusedIndex(-1)
          inputRef.current?.blur()
          break
          
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            const nextIndex = prev < maxIndex ? prev + 1 : 0
            // Scroll focused item into view
            setTimeout(() => {
              itemRefs.current[nextIndex]?.scrollIntoView({ 
                block: 'nearest', 
                behavior: 'smooth' 
              })
            }, 0)
            return nextIndex
          })
          break
          
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => {
            const nextIndex = prev > 0 ? prev - 1 : maxIndex
            // Scroll focused item into view
            setTimeout(() => {
              itemRefs.current[nextIndex]?.scrollIntoView({ 
                block: 'nearest', 
                behavior: 'smooth' 
              })
            }, 0)
            return nextIndex
          })
          break
          
        case 'Enter':
          event.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < visibleItems.length) {
            visibleItems[focusedIndex].action()
          } else {
            handleSearch(query)
          }
          break
          
        case 'Tab':
          // Allow normal tab behavior but close dropdown
          setIsOpen(false)
          setFocusedIndex(-1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, focusedIndex, query, suggestions, searchHistory])

  // Reset focused index when dropdown content changes
  useEffect(() => {
    setFocusedIndex(-1)
  }, [query, suggestions, searchHistory])

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) {return}

    // Save to search history
    if (user) {
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 5)
      setSearchHistory(newHistory)
      localStorage.setItem(`search-history-${user.id}`, JSON.stringify(newHistory))
    }

    // Navigate to search results
    router.push(`/discover?q=${encodeURIComponent(searchQuery)}`)
    setIsOpen(false)
    setQuery('')
    setFocusedIndex(-1)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const clearHistory = () => {
    setSearchHistory([])
    if (user) {
      localStorage.removeItem(`search-history-${user.id}`)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    // Prevent form submission when navigating with Enter in dropdown
    if (e.key === 'Enter' && isOpen && focusedIndex >= 0) {
      e.preventDefault()
    }
    // Open dropdown on arrow down
    if (e.key === 'ArrowDown' && !isOpen) {
      e.preventDefault()
      setIsOpen(true)
      setFocusedIndex(0)
    }
  }

  const quickActions = [
    {
      icon: <Users className="w-4 h-4" />,
      label: 'Find People',
      action: () => router.push('/discover?type=profiles')
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: 'Browse Campaigns', 
      action: () => router.push('/discover?type=campaigns')
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      label: 'Trending',
      action: () => router.push('/discover?trending=true')
    }
  ]

  const trendingSearches = [
    'Bitcoin Lightning Network',
    'Open Source Projects', 
    'Education Initiatives',
    'Environmental Campaigns'
  ]

  // Create a flat array of all items for keyboard navigation
  let itemIndex = -1

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 placeholder-gray-500"
          aria-label="Search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center text-xs text-gray-400">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-xs">⌘K</kbd>
        </div>
      </form>

      {/* Search Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* Quick Actions */}
          {showQuickActions && query.length === 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Quick Actions</h4>
              </div>
              <div className="space-y-1">
                {quickActions.map((action, index) => {
                  itemIndex++
                  const currentIndex = itemIndex
                  return (
                    <button
                      key={index}
                      ref={(el) => (itemRefs.current[currentIndex] = el)}
                      onClick={action.action}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${
                        focusedIndex === currentIndex 
                          ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                          : ''
                      }`}
                      role="option"
                      aria-selected={focusedIndex === currentIndex}
                    >
                      <div className="text-orange-500">{action.icon}</div>
                      <span>{action.label}</span>
                      <ArrowUpRight className="w-3 h-3 ml-auto text-gray-400" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Search History */}
          {query.length === 0 && searchHistory.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  <History className="w-3 h-3" />
                  Recent Searches
                </h4>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {searchHistory.map((historyItem, index) => {
                  itemIndex++
                  const currentIndex = itemIndex
                  return (
                    <button
                      key={index}
                      ref={(el) => (itemRefs.current[currentIndex] = el)}
                      onClick={() => handleSearch(historyItem)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left ${
                        focusedIndex === currentIndex 
                          ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                          : ''
                      }`}
                      role="option"
                      aria-selected={focusedIndex === currentIndex}
                    >
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{historyItem}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Trending Searches */}
          {query.length === 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center mb-2">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Trending
                </h4>
              </div>
              <div className="space-y-1">
                {trendingSearches.map((trending, index) => {
                  itemIndex++
                  const currentIndex = itemIndex
                  return (
                    <button
                      key={index}
                      ref={(el) => (itemRefs.current[currentIndex] = el)}
                      onClick={() => handleSearch(trending)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left ${
                        focusedIndex === currentIndex 
                          ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                          : ''
                      }`}
                      role="option"
                      aria-selected={focusedIndex === currentIndex}
                    >
                      <TrendingUp className="w-3 h-3 text-orange-500" />
                      <span>{trending}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Real-time Suggestions */}
          {query.length > 1 && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Suggestions</h4>
                {loading && (
                  <div className="w-3 h-3 border border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                )}
              </div>
              
              {suggestions.length > 0 ? (
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => {
                    itemIndex++
                    const currentIndex = itemIndex
                    return (
                      <button
                        key={index}
                        ref={(el) => (itemRefs.current[currentIndex] = el)}
                        onClick={() => handleSearch(suggestion)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left ${
                          focusedIndex === currentIndex 
                            ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                            : ''
                        }`}
                        role="option"
                        aria-selected={focusedIndex === currentIndex}
                      >
                        <Search className="w-3 h-3 text-gray-400" />
                        <span>{suggestion}</span>
                      </button>
                    )
                  })}
                </div>
              ) : !loading && (
                <div className="text-sm text-gray-500 px-3 py-2">
                  No suggestions found
                </div>
              )}
              
              {/* Search for exact query */}
              <div className="mt-2 pt-2 border-t border-gray-100">
                {(() => {
                  itemIndex++
                  const currentIndex = itemIndex
                  return (
                    <button
                      ref={(el) => (itemRefs.current[currentIndex] = el)}
                      onClick={() => handleSearch(query)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium ${
                        focusedIndex === currentIndex 
                          ? 'bg-orange-100 border border-orange-300 text-orange-800' 
                          : ''
                      }`}
                      role="option"
                      aria-selected={focusedIndex === currentIndex}
                    >
                      <Search className="w-3 h-3" />
                      <span>Search for "{query}"</span>
                      <ArrowUpRight className="w-3 h-3 ml-auto" />
                    </button>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Empty State */}
          {query.length === 0 && searchHistory.length === 0 && (
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Start typing to search</p>
              <p className="text-xs text-gray-400 mt-1">
                Find campaigns, people, and organizations
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Use ↑↓ arrows to navigate, Enter to select
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 