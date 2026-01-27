/**
 * AIProviderFilters Component
 *
 * Filter controls for AI provider discovery.
 * Extracted from AIProviderDiscovery component.
 */

'use client';

import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { PROVIDER_TYPE_LABELS, PROVIDER_DIFFICULTY_LABELS } from '@/data/aiProviders';
import type { FilterType, DifficultyFilter, BillingFilter } from './useAIProviderDiscovery';

interface AIProviderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: FilterType;
  onTypeChange: (type: FilterType) => void;
  difficultyFilter: DifficultyFilter;
  onDifficultyChange: (difficulty: DifficultyFilter) => void;
  billingFilter: BillingFilter;
  onBillingChange: (billing: BillingFilter) => void;
}

interface FilterButtonGroupProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
}

function FilterButtonGroup<T extends string>({
  options,
  value,
  onChange,
  getLabel,
}: FilterButtonGroupProps<T>) {
  return (
    <div className="flex gap-1">
      {options.map(option => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            'px-3 py-1.5 text-sm rounded-full transition-colors',
            value === option
              ? 'bg-tiffany-100 text-tiffany-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {getLabel(option)}
        </button>
      ))}
    </div>
  );
}

export function AIProviderFilters({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  difficultyFilter,
  onDifficultyChange,
  billingFilter,
  onBillingChange,
}: AIProviderFiltersProps) {
  const getTypeLabel = (type: FilterType) =>
    type === 'all' ? 'All Types' : PROVIDER_TYPE_LABELS[type];

  const getDifficultyLabel = (difficulty: DifficultyFilter) =>
    difficulty === 'all' ? 'All Levels' : PROVIDER_DIFFICULTY_LABELS[difficulty];

  const getBillingLabel = (billing: BillingFilter) =>
    billing === 'all' ? 'All Billing' : billing.charAt(0).toUpperCase() + billing.slice(1);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search providers or models..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <FilterButtonGroup
            options={['all', 'aggregator', 'direct'] as FilterType[]}
            value={typeFilter}
            onChange={onTypeChange}
            getLabel={getTypeLabel}
          />
        </div>

        {/* Difficulty Filter */}
        <FilterButtonGroup
          options={['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]}
          value={difficultyFilter}
          onChange={onDifficultyChange}
          getLabel={getDifficultyLabel}
        />

        {/* Billing Filter */}
        <FilterButtonGroup
          options={['all', 'prepaid', 'postpaid'] as BillingFilter[]}
          value={billingFilter}
          onChange={onBillingChange}
          getLabel={getBillingLabel}
        />
      </div>
    </div>
  );
}
