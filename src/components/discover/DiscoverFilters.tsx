'use client';

import { Search, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { simpleCategories } from '@/config/categories';
import { SortOption } from '@/services/search';
import { SortViewControl, type ViewMode } from './SortViewControl';
import { FilterChip } from './FilterChip';

const RADIUS_OPTIONS = [
  { value: 0, label: 'Anywhere' },
  { value: 10, label: 'Within 10 km' },
  { value: 25, label: 'Within 25 km' },
  { value: 50, label: 'Within 50 km' },
  { value: 100, label: 'Within 100 km' },
] as const;

const STATUS_LABELS = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const;

type StatusKey = keyof typeof STATUS_LABELS;

interface DiscoverFiltersProps {
  variant: 'desktop' | 'mobile';
  searchTerm: string;
  onSearchChange: (value: string) => void;
  loading?: boolean;
  sortBy: SortOption;
  onSortChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedStatuses: StatusKey[];
  onToggleStatus: (status: StatusKey) => void;
  showStatusFilter?: boolean;
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  showCategoryFilter?: boolean;
  country: string;
  onCountryChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  postal: string;
  onPostalChange: (value: string) => void;
  radiusKm: number;
  onRadiusChange: (value: number) => void;
  onClearFilters: () => void;
  searchPlaceholder?: string;
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
  searchPlaceholder = 'Search…',
}: DiscoverFiltersProps) {
  const isMobile = variant === 'mobile';

  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium text-fg-primary mb-2">Search</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-fg-tertiary" />
          </div>
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="rounded-md border-default bg-surface-base py-2 pl-10 pr-4 text-sm"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-fg-tertiary" />
            </div>
          )}
        </div>
      </div>

      <SortViewControl
        isMobile={isMobile}
        sortBy={sortBy}
        onSortChange={onSortChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />

      {showStatusFilter && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-fg-primary mb-2">Project Status</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_LABELS) as StatusKey[]).map(statusKey => (
              <FilterChip
                key={statusKey}
                label={STATUS_LABELS[statusKey]}
                selected={selectedStatuses.includes(statusKey)}
                onClick={() => onToggleStatus(statusKey)}
              />
            ))}
          </div>
          <p className="text-xs text-fg-secondary mt-2">
            Draft projects are not shown in search results
          </p>
        </div>
      )}

      {showCategoryFilter && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-fg-primary mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {simpleCategories.map(cat => (
              <FilterChip
                key={cat.value}
                label={cat.label}
                selected={selectedCategories.includes(cat.value)}
                onClick={() => onToggleCategory(cat.value)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium text-fg-primary">Location</label>
        <Input
          value={country}
          onChange={e => onCountryChange(e.target.value)}
          placeholder="Country"
        />
        <Input
          value={city}
          onChange={e => onCityChange(e.target.value)}
          placeholder="City/Region"
        />
        <Input
          value={postal}
          onChange={e => onPostalChange(e.target.value)}
          placeholder="Postal code"
        />
        <Select value={String(radiusKm)} onValueChange={v => onRadiusChange(Number(v))}>
          <SelectTrigger aria-label="Search radius">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADIUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!isMobile &&
        (searchTerm ||
          selectedCategories.length > 0 ||
          country ||
          city ||
          postal ||
          radiusKm ||
          sortBy !== 'recent') && (
          <div className="mb-6 pb-6 border-b border-default">
            <label className="block text-sm font-medium text-fg-primary mb-2">Active filters</label>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-surface-raised text-fg-primary">
                  &quot;{searchTerm}&quot;
                </span>
              )}
              {selectedCategories.map(cat => (
                <span
                  key={cat}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-surface-raised text-fg-primary"
                >
                  {cat}
                </span>
              ))}
              {(country || city || postal) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-surface-raised text-fg-primary">
                  {country || city || postal}
                </span>
              )}
              {sortBy !== 'recent' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-surface-raised text-fg-primary">
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

export type { StatusKey };
export { STATUS_LABELS };
