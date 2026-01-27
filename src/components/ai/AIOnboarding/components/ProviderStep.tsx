/**
 * PROVIDER STEP COMPONENT
 * Second step - choose AI provider
 */

import { Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { aiProviders } from '@/data/aiProviders';
import { aiOnboardingContent } from '@/lib/ai-guidance';

interface ProviderStepProps {
  selectedProvider: string | null;
  onSelectProvider: (providerId: string) => void;
}

export function ProviderStep({ selectedProvider, onSelectProvider }: ProviderStepProps) {
  return (
    <div className="space-y-6">
      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {aiProviders.map(p => (
          <Card
            key={p.id}
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg p-6',
              selectedProvider === p.id
                ? 'ring-2 ring-tiffany-500 border-tiffany-500 bg-tiffany-50/50'
                : ''
            )}
            onClick={() => onSelectProvider(p.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {p.name}
                  {p.recommended && (
                    <Badge className="bg-tiffany-100 text-tiffany-700 text-xs">Recommended</Badge>
                  )}
                </h3>
                <p className="text-xs text-gray-500 capitalize">
                  {p.type === 'aggregator' ? 'Aggregator' : 'Direct Provider'}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  p.difficulty === 'beginner'
                    ? 'border-green-300 text-green-700'
                    : p.difficulty === 'intermediate'
                      ? 'border-yellow-300 text-yellow-700'
                      : 'border-red-300 text-red-700'
                )}
              >
                {p.difficulty}
              </Badge>
            </div>

            <p className="text-sm text-gray-600 mb-3">{p.description}</p>

            <div className="flex flex-wrap gap-1.5">
              {p.supportedModels.slice(0, 3).map(model => (
                <Badge key={model} variant="outline" className="text-xs text-gray-500">
                  {model}
                </Badge>
              ))}
              {p.supportedModels.length > 3 && (
                <Badge variant="outline" className="text-xs text-gray-400">
                  +{p.supportedModels.length - 3} more
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <h4 className="font-semibold text-blue-900 mb-1">
              {aiOnboardingContent.provider.whyTitle}
            </h4>
            <p className="text-blue-800 text-sm">{aiOnboardingContent.provider.whyContent}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
