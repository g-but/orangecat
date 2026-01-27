/**
 * SearchDropdownSections Components
 *
 * Reusable dropdown sections for the enhanced search bar.
 * Extracted from EnhancedSearchBar component.
 */

'use client';

import {
  Search,
  History,
  TrendingUp,
  Users,
  Target,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface DropdownItemProps {
  onClick: () => void;
  isFocused: boolean;
  children: React.ReactNode;
  itemRef: (el: HTMLButtonElement | null) => void;
}

function DropdownItem({ onClick, isFocused, children, itemRef }: DropdownItemProps) {
  return (
    <button
      ref={itemRef}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left ${
        isFocused ? 'bg-orange-50 border border-orange-200 text-orange-900' : ''
      }`}
      role="option"
      aria-selected={isFocused}
    >
      {children}
    </button>
  );
}

interface QuickActionsSectionProps {
  actions: Array<{ label: string; action: () => void }>;
  focusedIndex: number;
  startIndex: number;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

export function QuickActionsSection({
  actions,
  focusedIndex,
  startIndex,
  itemRefs,
}: QuickActionsSectionProps) {
  const icons = [
    <Users key="users" className="w-4 h-4" />,
    <Target key="target" className="w-4 h-4" />,
    <TrendingUp key="trending" className="w-4 h-4" />,
  ];

  return (
    <div className="p-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Quick Actions</h4>
      </div>
      <div className="space-y-1">
        {actions.map((action, index) => {
          const currentIndex = startIndex + index;
          return (
            <DropdownItem
              key={index}
              onClick={action.action}
              isFocused={focusedIndex === currentIndex}
              itemRef={el => {
                itemRefs.current[currentIndex] = el;
              }}
            >
              <div className="text-orange-500">{icons[index]}</div>
              <span>{action.label}</span>
              <ArrowUpRight className="w-3 h-3 ml-auto text-gray-400" />
            </DropdownItem>
          );
        })}
      </div>
    </div>
  );
}

interface SearchHistorySectionProps {
  history: string[];
  onSearch: (query: string) => void;
  onClear: () => void;
  focusedIndex: number;
  startIndex: number;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

export function SearchHistorySection({
  history,
  onSearch,
  onClear,
  focusedIndex,
  startIndex,
  itemRefs,
}: SearchHistorySectionProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="p-3 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
          <History className="w-3 h-3" />
          Recent Searches
        </h4>
        <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700">
          Clear
        </button>
      </div>
      <div className="space-y-1">
        {history.map((item, index) => {
          const currentIndex = startIndex + index;
          return (
            <DropdownItem
              key={index}
              onClick={() => onSearch(item)}
              isFocused={focusedIndex === currentIndex}
              itemRef={el => {
                itemRefs.current[currentIndex] = el;
              }}
            >
              <Clock className="w-3 h-3 text-gray-400" />
              <span>{item}</span>
            </DropdownItem>
          );
        })}
      </div>
    </div>
  );
}

interface TrendingSearchesSectionProps {
  trending: string[];
  onSearch: (query: string) => void;
  focusedIndex: number;
  startIndex: number;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

export function TrendingSearchesSection({
  trending,
  onSearch,
  focusedIndex,
  startIndex,
  itemRefs,
}: TrendingSearchesSectionProps) {
  return (
    <div className="p-3 border-b border-gray-100">
      <div className="flex items-center mb-2">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Trending
        </h4>
      </div>
      <div className="space-y-1">
        {trending.map((item, index) => {
          const currentIndex = startIndex + index;
          return (
            <DropdownItem
              key={index}
              onClick={() => onSearch(item)}
              isFocused={focusedIndex === currentIndex}
              itemRef={el => {
                itemRefs.current[currentIndex] = el;
              }}
            >
              <TrendingUp className="w-3 h-3 text-orange-500" />
              <span>{item}</span>
            </DropdownItem>
          );
        })}
      </div>
    </div>
  );
}

interface SuggestionsSectionProps {
  query: string;
  suggestions: string[];
  loading: boolean;
  onSearch: (query: string) => void;
  focusedIndex: number;
  startIndex: number;
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
}

export function SuggestionsSection({
  query,
  suggestions,
  loading,
  onSearch,
  focusedIndex,
  startIndex,
  itemRefs,
}: SuggestionsSectionProps) {
  const searchQueryIndex = startIndex + suggestions.length;

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">Suggestions</h4>
        {loading && (
          <div className="w-3 h-3 border border-orange-200 border-t-orange-500 rounded-full animate-spin" />
        )}
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => {
            const currentIndex = startIndex + index;
            return (
              <DropdownItem
                key={index}
                onClick={() => onSearch(suggestion)}
                isFocused={focusedIndex === currentIndex}
                itemRef={el => {
                  itemRefs.current[currentIndex] = el;
                }}
              >
                <Search className="w-3 h-3 text-gray-400" />
                <span>{suggestion}</span>
              </DropdownItem>
            );
          })}
        </div>
      ) : (
        !loading && <div className="text-sm text-gray-500 px-3 py-2">No suggestions found</div>
      )}

      {/* Search for exact query */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <button
          ref={el => {
            itemRefs.current[searchQueryIndex] = el;
          }}
          onClick={() => onSearch(query)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium ${
            focusedIndex === searchQueryIndex
              ? 'bg-orange-100 border border-orange-300 text-orange-800'
              : ''
          }`}
          role="option"
          aria-selected={focusedIndex === searchQueryIndex}
        >
          <Search className="w-3 h-3" />
          <span>Search for "{query}"</span>
          <ArrowUpRight className="w-3 h-3 ml-auto" />
        </button>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="p-6 text-center">
      <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-sm text-gray-500">Start typing to search</p>
      <p className="text-xs text-gray-400 mt-1">Find projects, people, and organizations</p>
      <p className="text-xs text-gray-400 mt-2">Use ↑↓ arrows to navigate, Enter to select</p>
    </div>
  );
}
