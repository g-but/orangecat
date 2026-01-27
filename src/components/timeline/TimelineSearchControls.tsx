/**
 * TimelineSearchControls Component
 *
 * Renders search input and controls for timeline feeds.
 */

'use client';

import Button from '@/components/ui/Button';
import { Search, Loader2, X } from 'lucide-react';

interface TimelineSearchControlsProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
  searching: boolean;
  searchError: string | null;
  searchResultsCount: number;
  searchTotal: number | null;
}

export function TimelineSearchControls({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  onClearSearch,
  isSearchActive,
  searching,
  searchError,
  searchResultsCount,
  searchTotal,
}: TimelineSearchControlsProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-3">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
            placeholder="Search posts (title or description)..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <Button type="submit" size="sm" disabled={searching} className="gap-2">
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {searching ? 'Searching' : 'Search'}
        </Button>
        {isSearchActive && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClearSearch}
            className="text-gray-600"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </form>
      {searchError && <p className="text-sm text-red-600 mt-2">{searchError}</p>}
      {isSearchActive && !searchError && (
        <p className="text-xs text-gray-500 mt-2">
          Showing {searchResultsCount} of {searchTotal ?? searchResultsCount} results
        </p>
      )}
    </div>
  );
}
