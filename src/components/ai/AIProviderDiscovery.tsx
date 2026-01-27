/**
 * AIProviderDiscovery Component
 *
 * Displays AI providers with filtering and selection.
 * Logic extracted to useAIProviderDiscovery hook,
 * filters and card to separate components.
 */

'use client';

import { Search, CheckCircle, Layers } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { aiProviders, type AIProvider, PROVIDER_TYPE_LABELS } from '@/data/aiProviders';
import { useAIProviderDiscovery } from './useAIProviderDiscovery';
import { AIProviderFilters } from './AIProviderFilters';
import { ProviderCard } from './ProviderCard';

interface AIProviderDiscoveryProps {
  onSelectProvider?: (provider: AIProvider) => void;
  selectedProviderId?: string;
  className?: string;
}

export function AIProviderDiscovery({
  onSelectProvider,
  selectedProviderId,
  className,
}: AIProviderDiscoveryProps) {
  const {
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    difficultyFilter,
    setDifficultyFilter,
    billingFilter,
    setBillingFilter,
    expandedProviderId,
    toggleExpanded,
    sortedProviders,
    clearFilters,
  } = useAIProviderDiscovery();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filters */}
      <AIProviderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        difficultyFilter={difficultyFilter}
        onDifficultyChange={setDifficultyFilter}
        billingFilter={billingFilter}
        onBillingChange={setBillingFilter}
      />

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        {sortedProviders.length} provider{sortedProviders.length !== 1 ? 's' : ''} found
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sortedProviders.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            isSelected={selectedProviderId === provider.id}
            isExpanded={expandedProviderId === provider.id}
            onSelect={() => onSelectProvider?.(provider)}
            onToggleExpand={() => toggleExpanded(provider.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedProviders.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// Compact version for simpler selection UI
export function AIProviderDiscoveryCompact({
  onSelectProvider,
  selectedProviderId,
}: AIProviderDiscoveryProps) {
  return (
    <div className="space-y-2">
      {aiProviders.map(provider => (
        <button
          key={provider.id}
          onClick={() => onSelectProvider?.(provider)}
          className={cn(
            'w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between',
            selectedProviderId === provider.id
              ? 'border-tiffany-500 bg-tiffany-50'
              : 'border-gray-200 hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                provider.type === 'aggregator' ? 'bg-purple-100' : 'bg-blue-100'
              )}
            >
              <Layers
                className={cn(
                  'w-5 h-5',
                  provider.type === 'aggregator' ? 'text-purple-600' : 'text-blue-600'
                )}
              />
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {provider.name}
                {provider.recommended && (
                  <Badge className="bg-tiffany-100 text-tiffany-700 text-xs">Recommended</Badge>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {PROVIDER_TYPE_LABELS[provider.type]} • {provider.supportedModels.length}+ models
              </div>
            </div>
          </div>
          {selectedProviderId === provider.id && (
            <CheckCircle className="w-5 h-5 text-tiffany-600" />
          )}
        </button>
      ))}
    </div>
  );
}

export default AIProviderDiscovery;
