/**
 * EnhancedSearchBar Component
 *
 * Search bar with suggestions, history, and keyboard navigation.
 * Logic extracted to useEnhancedSearch hook,
 * dropdown sections to SearchDropdownSections.
 */

'use client';

import { Search } from 'lucide-react';
import { useEnhancedSearch } from './useEnhancedSearch';
import {
  QuickActionsSection,
  SearchHistorySection,
  TrendingSearchesSection,
  SuggestionsSection,
  EmptyState,
} from './SearchDropdownSections';

interface EnhancedSearchBarProps {
  className?: string;
  placeholder?: string;
  showQuickActions?: boolean;
  autoFocus?: boolean;
}

export default function EnhancedSearchBar({
  className = '',
  placeholder = 'Search projects, people, organizations...',
  showQuickActions = true,
  autoFocus = false,
}: EnhancedSearchBarProps) {
  const {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    searchHistory,
    focusedIndex,
    suggestions,
    loading,
    searchRef,
    inputRef,
    itemRefs,
    quickActions,
    trendingSearches,
    handleSearch,
    handleSubmit,
    clearHistory,
    handleInputKeyDown,
  } = useEnhancedSearch({ showQuickActions, autoFocus });

  // Calculate start indices for each section
  let currentIndex = 0;
  const quickActionsStartIndex = currentIndex;
  if (showQuickActions && query.length === 0) {
    currentIndex += quickActions.length;
  }

  const historyStartIndex = currentIndex;
  if (query.length === 0) {
    currentIndex += searchHistory.length;
  }

  const trendingStartIndex = currentIndex;
  if (query.length === 0) {
    currentIndex += trendingSearches.length;
  }

  const suggestionsStartIndex = 0; // Reset for suggestions mode

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          autoFocus={autoFocus}
          className="w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 placeholder-gray-500"
          aria-label="Search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          aria-autocomplete="list"
          aria-controls="search-results-listbox"
        />
        <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 flex items-center text-xs text-gray-400">
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 bg-gray-100 rounded border text-xs">
            ⌘K
          </kbd>
        </div>
      </form>

      {/* Search Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-96 overflow-y-auto"
          role="listbox"
          aria-label="Search suggestions"
        >
          {query.length === 0 ? (
            <>
              {showQuickActions && (
                <QuickActionsSection
                  actions={quickActions}
                  focusedIndex={focusedIndex}
                  startIndex={quickActionsStartIndex}
                  itemRefs={itemRefs}
                />
              )}

              <SearchHistorySection
                history={searchHistory}
                onSearch={handleSearch}
                onClear={clearHistory}
                focusedIndex={focusedIndex}
                startIndex={historyStartIndex}
                itemRefs={itemRefs}
              />

              <TrendingSearchesSection
                trending={trendingSearches}
                onSearch={handleSearch}
                focusedIndex={focusedIndex}
                startIndex={trendingStartIndex}
                itemRefs={itemRefs}
              />

              {searchHistory.length === 0 && <EmptyState />}
            </>
          ) : query.length > 1 ? (
            <SuggestionsSection
              query={query}
              suggestions={suggestions}
              loading={loading}
              onSearch={handleSearch}
              focusedIndex={focusedIndex}
              startIndex={suggestionsStartIndex}
              itemRefs={itemRefs}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
