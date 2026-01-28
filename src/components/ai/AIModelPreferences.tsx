'use client';

import { useState } from 'react';
import { Cpu, Zap, Eye, Settings2, DollarSign, Info, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  AI_MODEL_REGISTRY,
  MODEL_TIERS,
  TIER_CONFIG,
  getModelsByTier,
  type ModelTier,
  type AIModelMetadata,
} from '@/config/ai-models';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

export interface AIPreferences {
  defaultModelId: string | null;
  defaultTier: ModelTier;
  autoRouterEnabled: boolean;
  maxCostSats: number;
  requireVision: boolean;
  requireFunctionCalling: boolean;
}

interface AIModelPreferencesProps {
  preferences: AIPreferences;
  onChange: (preferences: Partial<AIPreferences>) => void;
  onFieldFocus?: (field: string | null) => void;
  disabled?: boolean;
}

/**
 * AIModelPreferences - Model settings component
 *
 * Allows users to configure:
 * - Default model
 * - Default tier
 * - Auto-router toggle
 * - Cost limits
 * - Capability requirements
 */
export function AIModelPreferences({
  preferences,
  onChange,
  onFieldFocus,
  disabled = false,
}: AIModelPreferencesProps) {
  const { displayCurrency } = useDisplayCurrency();
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);

  const selectedModel = preferences.defaultModelId
    ? AI_MODEL_REGISTRY[preferences.defaultModelId]
    : null;

  const handleTierChange = (tier: ModelTier) => {
    onChange({
      defaultTier: tier,
      // Clear specific model when changing tier
      defaultModelId: null,
    });
  };

  const handleModelSelect = (model: AIModelMetadata) => {
    onChange({
      defaultModelId: model.id,
      defaultTier: model.tier,
    });
    setIsModelSelectorOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Auto Router Toggle */}
      <Card variant="minimal" className="p-4">
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
            aria-checked={preferences.autoRouterEnabled}
            onClick={() => onChange({ autoRouterEnabled: !preferences.autoRouterEnabled })}
            onFocus={() => onFieldFocus?.('autoRouter')}
            onBlur={() => onFieldFocus?.(null)}
            disabled={disabled}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              preferences.autoRouterEnabled ? 'bg-tiffany-600' : 'bg-gray-200',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                preferences.autoRouterEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        {preferences.autoRouterEnabled && (
          <div className="mt-3 p-3 bg-tiffany-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-tiffany-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-tiffany-700">
                Simple messages → Economy models. Complex tasks → Standard/Premium models. Saves
                money without sacrificing quality.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Default Tier */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Tier
          {preferences.autoRouterEnabled && (
            <span className="text-gray-500 font-normal ml-2">
              (fallback when auto-router is uncertain)
            </span>
          )}
        </label>
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-2"
          onFocus={() => onFieldFocus?.('defaultTier')}
          onBlur={() => onFieldFocus?.(null)}
        >
          {MODEL_TIERS.map(tier => {
            const config = TIER_CONFIG[tier];
            const models = getModelsByTier(tier);
            const isSelected = preferences.defaultTier === tier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleTierChange(tier)}
                disabled={disabled}
                className={cn(
                  'p-3 rounded-lg border-2 text-left transition-all',
                  isSelected
                    ? 'border-tiffany-500 bg-tiffany-50'
                    : 'border-gray-200 hover:border-gray-300',
                  disabled && 'opacity-50 cursor-not-allowed'
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
                <p className="text-xs text-gray-500">{models.length} models</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Default Model Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Model
          <span className="text-gray-500 font-normal ml-2">(optional)</span>
        </label>
        <div onFocus={() => onFieldFocus?.('defaultModel')} onBlur={() => onFieldFocus?.(null)}>
          <button
            type="button"
            onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
            disabled={disabled}
            className={cn(
              'w-full p-3 rounded-lg border-2 text-left transition-all flex items-center justify-between',
              isModelSelectorOpen
                ? 'border-tiffany-500 bg-tiffany-50'
                : 'border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-gray-400" />
              {selectedModel ? (
                <div>
                  <span className="font-medium">{selectedModel.name}</span>
                  <span className="text-sm text-gray-500 ml-2">{selectedModel.provider}</span>
                </div>
              ) : (
                <span className="text-gray-500">
                  {preferences.autoRouterEnabled
                    ? 'Auto-selected based on tier'
                    : 'Select a model...'}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                'w-5 h-5 text-gray-400 transition-transform',
                isModelSelectorOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Model Dropdown */}
          {isModelSelectorOpen && (
            <div className="mt-2 p-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
              {getModelsByTier(preferences.defaultTier).map(model => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelSelect(model)}
                  className={cn(
                    'w-full p-2 rounded-lg text-left hover:bg-gray-50 flex items-center justify-between',
                    selectedModel?.id === model.id && 'bg-tiffany-50'
                  )}
                >
                  <div>
                    <div className="font-medium text-sm">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.provider}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {model.isFree && (
                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">FREE</Badge>
                    )}
                    {model.capabilities.includes('vision') && (
                      <span title="Vision capable">
                        <Eye className="w-3 h-3 text-gray-400" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cost Limit */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Cost per Request ({displayCurrency})
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              value={preferences.maxCostSats}
              onChange={e => onChange({ maxCostSats: parseInt(e.target.value) || 0 })}
              onFocus={() => onFieldFocus?.('maxCostSats')}
              onBlur={() => onFieldFocus?.(null)}
              disabled={disabled}
              min={0}
              className="pl-9"
              placeholder="100"
            />
          </div>
          <span className="text-sm text-gray-500">{displayCurrency}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Set to 0 for unlimited. Auto-router will avoid models exceeding this limit.
        </p>
      </div>

      {/* Capability Requirements */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Required Capabilities</label>

        {/* Vision */}
        <Card variant="minimal" className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-gray-500" />
              <div>
                <span className="font-medium text-sm">Vision</span>
                <p className="text-xs text-gray-500">Image understanding capability</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.requireVision}
              onClick={() => onChange({ requireVision: !preferences.requireVision })}
              onFocus={() => onFieldFocus?.('requireVision')}
              onBlur={() => onFieldFocus?.(null)}
              disabled={disabled}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                preferences.requireVision ? 'bg-tiffany-600' : 'bg-gray-200',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                  preferences.requireVision ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </Card>

        {/* Function Calling */}
        <Card variant="minimal" className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-gray-500" />
              <div>
                <span className="font-medium text-sm">Function Calling</span>
                <p className="text-xs text-gray-500">Tool use and structured output</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.requireFunctionCalling}
              onClick={() =>
                onChange({ requireFunctionCalling: !preferences.requireFunctionCalling })
              }
              onFocus={() => onFieldFocus?.('requireFunctionCalling')}
              onBlur={() => onFieldFocus?.(null)}
              disabled={disabled}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                preferences.requireFunctionCalling ? 'bg-tiffany-600' : 'bg-gray-200',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                  preferences.requireFunctionCalling ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AIModelPreferences;
