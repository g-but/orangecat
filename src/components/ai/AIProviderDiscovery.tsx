'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Star,
  ExternalLink,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight,
  Zap,
  Shield,
  DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  aiProviders,
  type AIProvider,
  PROVIDER_TYPE_LABELS,
  PROVIDER_DIFFICULTY_LABELS,
} from '@/data/aiProviders';

// ==================== TYPES ====================

interface AIProviderDiscoveryProps {
  onSelectProvider?: (provider: AIProvider) => void;
  selectedProviderId?: string;
  className?: string;
}

type FilterType = 'all' | 'aggregator' | 'direct';
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
type BillingFilter = 'all' | 'prepaid' | 'postpaid' | 'both';

// ==================== MAIN COMPONENT ====================

export function AIProviderDiscovery({
  onSelectProvider,
  selectedProviderId,
  className,
}: AIProviderDiscoveryProps) {
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search providers or models..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              {(['all', 'aggregator', 'direct'] as FilterType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    typeFilter === type
                      ? 'bg-tiffany-100 text-tiffany-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {type === 'all' ? 'All Types' : PROVIDER_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="flex gap-1">
            {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]).map(
              difficulty => (
                <button
                  key={difficulty}
                  onClick={() => setDifficultyFilter(difficulty)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    difficultyFilter === difficulty
                      ? 'bg-tiffany-100 text-tiffany-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {difficulty === 'all' ? 'All Levels' : PROVIDER_DIFFICULTY_LABELS[difficulty]}
                </button>
              )
            )}
          </div>

          {/* Billing Filter */}
          <div className="flex gap-1">
            {(['all', 'prepaid', 'postpaid'] as BillingFilter[]).map(billing => (
              <button
                key={billing}
                onClick={() => setBillingFilter(billing)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full transition-colors',
                  billingFilter === billing
                    ? 'bg-tiffany-100 text-tiffany-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {billing === 'all'
                  ? 'All Billing'
                  : billing.charAt(0).toUpperCase() + billing.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

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
            onToggleExpand={() =>
              setExpandedProviderId(expandedProviderId === provider.id ? null : provider.id)
            }
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedProviders.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setDifficultyFilter('all');
              setBillingFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== PROVIDER CARD ====================

interface ProviderCardProps {
  provider: AIProvider;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

function ProviderCard({
  provider,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}: ProviderCardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isSelected && 'ring-2 ring-tiffany-500 border-tiffany-500',
        isExpanded && 'shadow-lg'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{provider.name}</CardTitle>
              {provider.recommended && (
                <Badge className="bg-tiffany-100 text-tiffany-700 text-xs">Recommended</Badge>
              )}
              {provider.verified && (
                <span title="Verified">
                  <CheckCircle className="w-4 h-4 text-tiffany-600" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{PROVIDER_TYPE_LABELS[provider.type]}</span>
              <span>•</span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  provider.difficulty === 'beginner'
                    ? 'border-green-300 text-green-700'
                    : provider.difficulty === 'intermediate'
                      ? 'border-yellow-300 text-yellow-700'
                      : 'border-red-300 text-red-700'
                )}
              >
                {PROVIDER_DIFFICULTY_LABELS[provider.difficulty]}
              </Badge>
            </div>
          </div>

          {/* Rating */}
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{provider.rating.toFixed(1)}</span>
            </div>
            <div className="text-xs text-gray-400">
              {provider.reviewCount.toLocaleString()} reviews
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        <p className="text-sm text-gray-600 mb-4">{provider.description}</p>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{provider.setupTime} min setup</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="capitalize">{provider.billingType}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Layers className="w-4 h-4 text-gray-400" />
            <span>{provider.supportedModels.length}+ models</span>
          </div>
        </div>

        {/* Supported Models Preview */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {provider.supportedModels.slice(0, 4).map(model => (
            <Badge key={model} variant="outline" className="text-xs text-gray-500">
              {model}
            </Badge>
          ))}
          {provider.supportedModels.length > 4 && (
            <Badge variant="outline" className="text-xs text-gray-400">
              +{provider.supportedModels.length - 4} more
            </Badge>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Long Description */}
            <p className="text-sm text-gray-600">{provider.longDescription}</p>

            {/* Pros and Cons */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Pros
                </h4>
                <ul className="space-y-1">
                  {provider.pros.map((pro, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">+</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  Cons
                </h4>
                <ul className="space-y-1">
                  {provider.cons.map((con, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">-</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Features
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {provider.features.map(feature => (
                  <Badge key={feature} className="bg-gray-100 text-gray-600 text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={provider.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-tiffany-600 hover:text-tiffany-700 flex items-center gap-1"
              >
                Website
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-gray-300">|</span>
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-tiffany-600 hover:text-tiffany-700 flex items-center gap-1"
              >
                Documentation
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-gray-300">|</span>
              <a
                href={provider.pricingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-tiffany-600 hover:text-tiffany-700 flex items-center gap-1"
              >
                Pricing
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <button
            onClick={onToggleExpand}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {isExpanded ? 'Show Less' : 'Learn More'}
            <ChevronRight
              className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')}
            />
          </button>

          <Button
            onClick={onSelect}
            variant={isSelected ? 'primary' : 'outline'}
            size="sm"
            className={isSelected ? 'bg-tiffany-600 hover:bg-tiffany-700' : ''}
          >
            {isSelected ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Selected
              </>
            ) : (
              'Select Provider'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== COMPACT VERSION ====================

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
