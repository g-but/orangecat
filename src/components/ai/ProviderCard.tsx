/**
 * ProviderCard Component
 *
 * Displays a single AI provider card with details.
 * Extracted from AIProviderDiscovery component.
 */

'use client';

import {
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  type AIProvider,
  PROVIDER_TYPE_LABELS,
  PROVIDER_DIFFICULTY_LABELS,
} from '@/data/aiProviders';

interface ProviderCardProps {
  provider: AIProvider;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

export function ProviderCard({
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
