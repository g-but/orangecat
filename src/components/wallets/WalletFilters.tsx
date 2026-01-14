'use client';

import { useState } from 'react';
import { Filter, Search, X, Smartphone, Monitor, Globe, Shield, Lock, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { WalletProvider } from '@/data/walletProviders';

export interface WalletFilters {
  type: string[];
  difficulty: string[];
  privacy: string[];
  custody: string[];
  countries: string[];
  features: string[];
  search: string;
}

interface WalletFiltersProps {
  filters: WalletFilters;
  onFiltersChange: (filters: WalletFilters) => void;
  className?: string;
}

const filterOptions = {
  type: [
    { value: 'hardware', label: 'Hardware', icon: Shield },
    { value: 'mobile', label: 'Mobile', icon: Smartphone },
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'browser', label: 'Browser', icon: Globe },
  ],
  difficulty: [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ],
  privacy: [
    { value: 'low', label: 'Low Privacy' },
    { value: 'medium', label: 'Medium Privacy' },
    { value: 'high', label: 'High Privacy' },
  ],
  custody: [
    { value: 'self-custody', label: 'Self-Custody' },
    { value: 'custodial', label: 'Custodial' },
    { value: 'hybrid', label: 'Hybrid' },
  ],
  countries: [
    { value: 'All countries', label: 'All Countries' },
    { value: 'US', label: 'United States' },
    { value: 'EU', label: 'European Union' },
    { value: 'UK', label: 'United Kingdom' },
  ],
};

export function WalletFilters({ filters, onFiltersChange, className }: WalletFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (key: keyof WalletFilters, value: string | string[]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilter = (key: keyof WalletFilters) => {
    onFiltersChange({
      ...filters,
      [key]: key === 'search' ? '' : [],
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      type: [],
      difficulty: [],
      privacy: [],
      custody: [],
      countries: [],
      features: [],
      search: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search wallets..."
          value={filters.search}
          onChange={e => updateFilters('search', e.target.value)}
          className="pl-10"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter('search')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.type.map(option => {
          const Icon = option.icon;
          const isSelected = filters.type.includes(option.value);

          return (
            <Button
              key={option.value}
              variant={isSelected ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                const newTypes = isSelected
                  ? filters.type.filter(t => t !== option.value)
                  : [...filters.type, option.value];
                updateFilters('type', newTypes);
              }}
              className="flex items-center gap-2"
            >
              <Icon className="w-3 h-3" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
        </Button>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-sm">
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.difficulty.map(option => (
                <Button
                  key={option.value}
                  variant={filters.difficulty.includes(option.value) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newDifficulties = filters.difficulty.includes(option.value)
                      ? filters.difficulty.filter(d => d !== option.value)
                      : [...filters.difficulty, option.value];
                    updateFilters('difficulty', newDifficulties);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Privacy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.privacy.map(option => (
                <Button
                  key={option.value}
                  variant={filters.privacy.includes(option.value) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newPrivacy = filters.privacy.includes(option.value)
                      ? filters.privacy.filter(p => p !== option.value)
                      : [...filters.privacy, option.value];
                    updateFilters('privacy', newPrivacy);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custody Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custody Type</label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.custody.map(option => (
                <Button
                  key={option.value}
                  variant={filters.custody.includes(option.value) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newCustody = filters.custody.includes(option.value)
                      ? filters.custody.filter(c => c !== option.value)
                      : [...filters.custody, option.value];
                    updateFilters('custody', newCustody);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Countries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supported Countries
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.countries.map(option => (
                <Button
                  key={option.value}
                  variant={filters.countries.includes(option.value) ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newCountries = filters.countries.includes(option.value)
                      ? filters.countries.filter(c => c !== option.value)
                      : [...filters.countries, option.value];
                    updateFilters('countries', newCountries);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.type.map(type => (
            <span
              key={`type-${type}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {filterOptions.type.find(t => t.value === type)?.label}
              <X
                className="w-3 h-3 cursor-pointer hover:text-blue-600"
                onClick={() =>
                  updateFilters(
                    'type',
                    filters.type.filter(t => t !== type)
                  )
                }
              />
            </span>
          ))}
          {filters.difficulty.map(diff => (
            <span
              key={`diff-${diff}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
            >
              {filterOptions.difficulty.find(d => d.value === diff)?.label}
              <X
                className="w-3 h-3 cursor-pointer hover:text-green-600"
                onClick={() =>
                  updateFilters(
                    'difficulty',
                    filters.difficulty.filter(d => d !== diff)
                  )
                }
              />
            </span>
          ))}
          {filters.privacy.map(priv => (
            <span
              key={`priv-${priv}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
            >
              {filterOptions.privacy.find(p => p.value === priv)?.label}
              <X
                className="w-3 h-3 cursor-pointer hover:text-purple-600"
                onClick={() =>
                  updateFilters(
                    'privacy',
                    filters.privacy.filter(p => p !== priv)
                  )
                }
              />
            </span>
          ))}
          {filters.custody.map(cust => (
            <span
              key={`cust-${cust}`}
              className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
            >
              {filterOptions.custody.find(c => c.value === cust)?.label}
              <X
                className="w-3 h-3 cursor-pointer hover:text-orange-600"
                onClick={() =>
                  updateFilters(
                    'custody',
                    filters.custody.filter(c => c !== cust)
                  )
                }
              />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
