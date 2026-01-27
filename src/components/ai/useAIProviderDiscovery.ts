/**
 * useAIProviderDiscovery Hook
 *
 * Manages AI provider filtering and sorting logic.
 * Extracted from AIProviderDiscovery component.
 */

'use client';

import { useState, useMemo } from 'react';
import { aiProviders } from '@/data/aiProviders';

export type FilterType = 'all' | 'aggregator' | 'direct';
export type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
export type BillingFilter = 'all' | 'prepaid' | 'postpaid' | 'both';

export interface AIProviderFilters {
  searchQuery: string;
  typeFilter: FilterType;
  difficultyFilter: DifficultyFilter;
  billingFilter: BillingFilter;
}

export function useAIProviderDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [billingFilter, setBillingFilter] = useState<BillingFilter>('all');
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);

  // Filter providers
  const filteredProviders = useMemo(() => {
    return aiProviders.filter(provider => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          provider.name.toLowerCase().includes(query) ||
          provider.description.toLowerCase().includes(query) ||
          provider.supportedModels.some(m => m.toLowerCase().includes(query));
        if (!matchesSearch) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && provider.type !== typeFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== 'all' && provider.difficulty !== difficultyFilter) {
        return false;
      }

      // Billing filter
      if (billingFilter !== 'all' && provider.billingType !== billingFilter) {
        return false;
      }

      return true;
    });
  }, [searchQuery, typeFilter, difficultyFilter, billingFilter]);

  // Sort providers: recommended first, then by rating
  const sortedProviders = useMemo(() => {
    return [...filteredProviders].sort((a, b) => {
      if (a.recommended && !b.recommended) {
        return -1;
      }
      if (!a.recommended && b.recommended) {
        return 1;
      }
      return b.rating - a.rating;
    });
  }, [filteredProviders]);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setDifficultyFilter('all');
    setBillingFilter('all');
  };

  const toggleExpanded = (providerId: string) => {
    setExpandedProviderId(expandedProviderId === providerId ? null : providerId);
  };

  return {
    // Filter state
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    difficultyFilter,
    setDifficultyFilter,
    billingFilter,
    setBillingFilter,

    // Expansion state
    expandedProviderId,
    toggleExpanded,

    // Computed
    sortedProviders,

    // Actions
    clearFilters,
  };
}
