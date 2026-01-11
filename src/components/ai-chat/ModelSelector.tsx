'use client';

/**
 * Model Selector Component
 *
 * Dropdown for selecting AI models in chat interface.
 * Supports Auto mode and manual model selection by tier.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 */

import { useState } from 'react';
import { ChevronDown, Zap, Sparkles, Crown, Check, Bot, Gift } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Button from '@/components/ui/Button';
import {
  ModelTier,
  AIModelMetadata,
  TIER_CONFIG,
  getModelsByTier,
  getModelMetadata,
} from '@/config/ai-models';

// ==================== TYPES ====================

interface ModelSelectorProps {
  /** Currently selected model ID or 'auto' */
  selectedModel: string;
  /** Callback when model changes */
  onModelChange: (modelId: string) => void;
  /** List of allowed model IDs (empty = all) */
  allowedModels?: string[];
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show pricing info */
  showPricing?: boolean;
}

// ==================== ICONS ====================

const TIER_ICONS: Record<ModelTier, React.ReactNode> = {
  free: <Gift className="h-4 w-4 text-emerald-500" />,
  economy: <Zap className="h-4 w-4 text-green-500" />,
  standard: <Sparkles className="h-4 w-4 text-blue-500" />,
  premium: <Crown className="h-4 w-4 text-purple-500" />,
};

// ==================== COMPONENT ====================

export function ModelSelector({
  selectedModel,
  onModelChange,
  allowedModels,
  disabled = false,
  size = 'md',
  showPricing = true,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);

  // Filter available models
  const getFilteredModels = (tier: ModelTier): AIModelMetadata[] => {
    let models = getModelsByTier(tier);

    if (allowedModels && allowedModels.length > 0) {
      models = models.filter(m => allowedModels.includes(m.id));
    }

    return models;
  };

  const modelsByTier: Record<ModelTier, AIModelMetadata[]> = {
    free: getFilteredModels('free'),
    economy: getFilteredModels('economy'),
    standard: getFilteredModels('standard'),
    premium: getFilteredModels('premium'),
  };

  const hasModelsInAnyTier =
    modelsByTier.free.length > 0 ||
    modelsByTier.economy.length > 0 ||
    modelsByTier.standard.length > 0 ||
    modelsByTier.premium.length > 0;

  const selectedMeta = selectedModel === 'auto' ? null : getModelMetadata(selectedModel);

  const handleSelect = (modelId: string) => {
    onModelChange(modelId);
    setOpen(false);
  };

  // Format price for display
  const formatPrice = (pricePerMillion: number): string => {
    if (pricePerMillion < 0.1) {
      return `$${pricePerMillion.toFixed(3)}`;
    }
    if (pricePerMillion < 1) {
      return `$${pricePerMillion.toFixed(2)}`;
    }
    return `$${pricePerMillion.toFixed(1)}`;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button variant="outline" size={size} className="gap-2 min-w-[140px] justify-between">
          <div className="flex items-center gap-2">
            {selectedModel === 'auto' ? (
              <>
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Auto</span>
              </>
            ) : selectedMeta ? (
              <>
                {TIER_ICONS[selectedMeta.tier]}
                <span className="max-w-[100px] truncate">{selectedMeta.name}</span>
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 text-gray-400" />
                <span>Select model</span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Select Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Auto mode */}
        <DropdownMenuItem
          onClick={() => handleSelect('auto')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-100">
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="font-medium">Auto</div>
              <div className="text-xs text-muted-foreground">Best model for each request</div>
            </div>
          </div>
          {selectedModel === 'auto' && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        {hasModelsInAnyTier && <DropdownMenuSeparator />}

        {/* Models by tier */}
        {(['free', 'economy', 'standard', 'premium'] as ModelTier[]).map(
          tier =>
            modelsByTier[tier].length > 0 && (
              <div key={tier}>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs py-1">
                  {TIER_ICONS[tier]}
                  <span>{TIER_CONFIG[tier].label}</span>
                  <span className="text-muted-foreground font-normal">
                    - {TIER_CONFIG[tier].description}
                  </span>
                </DropdownMenuLabel>

                {modelsByTier[tier].map(model => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className="flex items-center justify-between cursor-pointer pl-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.provider}</span>
                      </div>
                      {showPricing && (
                        <div className="text-xs text-muted-foreground">
                          {formatPrice(model.inputCostPer1M)}/M in,{' '}
                          {formatPrice(model.outputCostPer1M)}/M out
                        </div>
                      )}
                    </div>
                    {selectedModel === model.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}

                {tier !== 'premium' && modelsByTier[tier].length > 0 && <DropdownMenuSeparator />}
              </div>
            )
        )}

        {!hasModelsInAnyTier && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No models available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ==================== COMPACT VARIANT ====================

interface ModelBadgeProps {
  modelId: string;
  showProvider?: boolean;
}

export function ModelBadge({ modelId, showProvider = false }: ModelBadgeProps) {
  if (modelId === 'auto') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
        <Zap className="h-3 w-3" />
        Auto
      </span>
    );
  }

  const model = getModelMetadata(modelId);
  if (!model) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        {modelId}
      </span>
    );
  }

  const tierColors: Record<ModelTier, string> = {
    free: 'text-emerald-600 bg-emerald-50',
    economy: 'text-green-600 bg-green-50',
    standard: 'text-blue-600 bg-blue-50',
    premium: 'text-purple-600 bg-purple-50',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${tierColors[model.tier]}`}
    >
      {TIER_ICONS[model.tier]}
      {model.name}
      {showProvider && <span className="text-muted-foreground">({model.provider})</span>}
    </span>
  );
}

// ==================== EXPORTS ====================

export default ModelSelector;
