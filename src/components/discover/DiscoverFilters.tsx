'use client';

import { Search, Grid3X3, List, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { simpleCategories } from '@/config/categories';
import { SortOption } from '@/services/search';

// Status styles mapping for Tailwind (dynamic classes don't work)
const STATUS_STYLES = {
  active: {
    selected: 'bg-green-100 border-green-300 text-green-700',
    label: 'Active',
  },
  paused: {
    selected: 'bg-yellow-100 border-yellow-300 text-yellow-700',
    label: 'Paused',
  },
  completed: {
    selected: 'bg-blue-100 border-blue-300 text-blue-700',
    label: 'Completed',
  },
  cancelled: {
    selected: 'bg-gray-100 border-gray-300 text-gray-700',
    label: 'Cancelled',
  },
} as const;

type StatusKey = keyof typeof STATUS_STYLES;
type ViewMode = 'grid' | 'list';

interface DiscoverFiltersProps {
  variant: 'desktop' | 'mobile';
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
  // Sort
  sortBy: SortOption;
  onSortChange: (value: string) => void;
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Statuses
  selectedStatuses: StatusKey[];
  onToggleStatus: (status: StatusKey) => void;
  showStatusFilter?: boolean;
  // Categories
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  showCategoryFilter?: boolean;
  // Geography
  country: string;
  onCountryChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  postal: string;
  onPostalChange: (value: string) => void;
  radiusKm: number;
  onRadiusChange: (value: number) => void;
  // Actions
  onClearFilters: () => void;
}

export default function DiscoverFilters({
  variant,
  searchTerm,
  onSearchChange,
  loading = false,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  selectedStatuses,
  onToggleStatus,
  showStatusFilter = true,
  selectedCategories,
  onToggleCategory,
  showCategoryFilter = true,
  country,
  onCountryChange,
  city,
  onCityChange,
  postal,
  onPostalChange,
  radiusKm,
  onRadiusChange,
  onClearFilters,
}: DiscoverFiltersProps) {
  const isMobile = variant === 'mobile';

  return (
    <>
      {/* Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 text-sm bg-white/80 border-gray-200/80 rounded-xl"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Sort & View - layout differs between mobile and desktop */}
      {isMobile ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
            >
              <option value="recent">Newest</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-1 flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="flex-1 h-8"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="flex-1 h-8"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Sort */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
            >
              <option value="recent">Newest</option>
              <option value="relevance">Relevance</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-1 flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="flex-1 h-8"
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="flex-1 h-8"
              >
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Project Status */}
      {showStatusFilter && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Project Status</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_STYLES) as StatusKey[]).map(statusKey => (
              <button
                key={statusKey}
                onClick={() => onToggleStatus(statusKey)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  selectedStatuses.includes(statusKey)
                    ? STATUS_STYLES[statusKey].selected
                    : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {STATUS_STYLES[statusKey].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Draft projects are not shown in search results
          </p>
        </div>
      )}

      {/* Categories */}
      {showCategoryFilter && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {simpleCategories.map(cat => (
              <button
                key={cat.value}
                onClick={() => onToggleCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  selectedCategories.includes(cat.value)
                    ? 'bg-orange-100 border-orange-300 text-orange-700'
                    : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Geography */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium text-gray-700">Location</label>
        <input
          value={country}
          onChange={e => onCountryChange(e.target.value)}
          placeholder="Country"
          className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
        />
        <input
          value={city}
          onChange={e => onCityChange(e.target.value)}
          placeholder="City/Region"
          className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
        />
        <input
          value={postal}
          onChange={e => onPostalChange(e.target.value)}
          placeholder="Postal code"
          className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
        />
        <select
          value={radiusKm}
          onChange={e => onRadiusChange(Number(e.target.value))}
          className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
        >
          <option value={0}>Anywhere</option>
          <option value={10}>Within 10 km</option>
          <option value={25}>Within 25 km</option>
          <option value={50}>Within 50 km</option>
          <option value={100}>Within 100 km</option>
        </select>
      </div>

      {/* Active filters summary - desktop only */}
      {!isMobile &&
        (searchTerm ||
          selectedCategories.length > 0 ||
          country ||
          city ||
          postal ||
          radiusKm ||
          sortBy !== 'recent') && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Active filters</label>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  &quot;{searchTerm}&quot;
                </span>
              )}
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  {cat}
                </span>
              ))}
              {(country || city || postal) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  {country || city || postal}
                </span>
              )}
              {sortBy !== 'recent' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                  {sortBy}
                </span>
              )}
            </div>
          </div>
        )}

      <div className={isMobile ? '' : 'pt-2'}>
        <Button onClick={onClearFilters} variant="outline" size="sm" className="w-full">
          Clear all
        </Button>
      </div>
    </>
  );
}

// Export status types for use in parent components
export type { StatusKey };
export { STATUS_STYLES };
