/**
 * CONFIGURE STEP COMPONENT
 * Fifth step - configure preferences (tier, auto-router)
 */

import { Zap, Lightbulb, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MODEL_TIERS, TIER_CONFIG, type ModelTier } from '@/config/ai-models';
import { aiOnboardingContent, tierDescriptions } from '@/lib/ai-guidance';

interface ConfigureStepProps {
  selectedTier: ModelTier;
  autoRouterEnabled: boolean;
  onTierChange: (tier: ModelTier) => void;
  onAutoRouterChange: (enabled: boolean) => void;
}

export function ConfigureStep({
  selectedTier,
  autoRouterEnabled,
  onTierChange,
  onAutoRouterChange,
}: ConfigureStepProps) {
  return (
    <div className="space-y-6">
      {/* Auto Router Toggle */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-tiffany-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-tiffany-600" />
            </div>
            <div>
              <h3 className="font-medium">Auto Router</h3>
              <p className="text-sm text-gray-600">
                Automatically selects the best model based on message complexity
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoRouterEnabled}
            onClick={() => onAutoRouterChange(!autoRouterEnabled)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              autoRouterEnabled ? 'bg-tiffany-600' : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                autoRouterEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        {autoRouterEnabled && (
          <div className="mt-3 p-3 bg-tiffany-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-tiffany-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-tiffany-700">
                Simple messages use cheaper models. Complex tasks use more powerful ones. Saves
                money without sacrificing quality.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Default Tier Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Tier
          {autoRouterEnabled && (
            <span className="text-gray-500 font-normal ml-2">
              (fallback when auto-router is uncertain)
            </span>
          )}
        </label>
        <div className="grid grid-cols-2 gap-3">
          {MODEL_TIERS.map(tier => {
            const config = TIER_CONFIG[tier];
            const tierInfo = tierDescriptions[tier];
            const isSelected = selectedTier === tier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => onTierChange(tier)}
                className={cn(
                  'p-4 rounded-lg border-2 text-left transition-all',
                  isSelected
                    ? 'border-tiffany-500 bg-tiffany-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{config.label}</span>
                  {config.badge && (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0">
                      {config.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500">{tierInfo?.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier Details */}
      {selectedTier && tierDescriptions[selectedTier] && (
        <Card className="p-4 bg-gray-50">
          <h4 className="font-medium mb-2">{tierDescriptions[selectedTier].title}</h4>
          <p className="text-sm text-gray-600 mb-3">
            Best for: {tierDescriptions[selectedTier].bestFor}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tierDescriptions[selectedTier].models.map(model => (
              <Badge key={model} variant="outline" className="text-xs">
                {model}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" />
          Tips
        </h4>
        <ul className="space-y-1">
          {aiOnboardingContent.configure.tips?.map((tip, index) => (
            <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
