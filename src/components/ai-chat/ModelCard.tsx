/**
 * Model Card Component
 *
 * Displays information about a single AI model with clear visual hierarchy.
 * Shows tier, capabilities, pricing, and requirements.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import type { ModelMetadata } from '@/config/model-registry';
import {
  Zap,
  Eye,
  Wrench,
  Cloud,
  HardDrive,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: ModelMetadata;
  isSelected?: boolean;
  onSelect: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelCard({
  model,
  isSelected,
  onSelect,
  disabled,
}: ModelCardProps) {
  const tierColors = {
    free: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    freemium: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    paid: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  };

  const speedIcons = {
    instant: '⚡',
    fast: '🚀',
    medium: '⏱️',
    slow: '🐢',
  };

  const qualityStars = Array.from({ length: model.quality }, (_, i) => i);

  return (
    <Card
      className={cn(
        'relative transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-tiffany',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-tiffany text-white rounded-full p-1">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      )}

      <CardHeader className="space-y-2">
        {/* Title & Provider */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-base leading-tight">
              {model.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {model.provider}
            </p>
          </div>

          {/* Tier Badge */}
          <Badge
            variant="outline"
            className={cn('text-xs font-semibold', tierColors[model.tier])}
          >
            {model.tier === 'free' && 'FREE'}
            {model.tier === 'freemium' && 'Free*'}
            {model.tier === 'paid' && model.costPerMessage ? `$${model.costPerMessage.toFixed(3)}` : 'Paid'}
          </Badge>
        </div>

        {/* Description */}
        {model.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {model.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Quality & Speed */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Quality:</span>
            <div className="flex">
              {qualityStars.map(i => (
                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Speed:</span>
            <span>{speedIcons[model.speed]}</span>
            <span className="capitalize">{model.speed}</span>
          </div>
        </div>

        {/* Context Window */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wrench className="h-3 w-3" />
          <span>
            {model.contextWindow >= 1000000
              ? `${(model.contextWindow / 1000000).toFixed(1)}M`
              : `${(model.contextWindow / 1000).toFixed(0)}k`}{' '}
            context
          </span>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1">
          {model.supportsVision && (
            <Badge variant="secondary" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Vision
            </Badge>
          )}
          {model.supportsFunctionCalling && (
            <Badge variant="secondary" className="text-xs">
              <Wrench className="h-3 w-3 mr-1" />
              Tools
            </Badge>
          )}
          {model.supportsStreaming && (
            <Badge variant="secondary" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              Stream
            </Badge>
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2 text-xs">
          {model.availability === 'cloud' && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Cloud className="h-3 w-3" />
              <span>Cloud</span>
            </div>
          )}
          {model.availability === 'local' && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              <span>Local only</span>
            </div>
          )}
          {model.availability === 'both' && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Cloud className="h-3 w-3" />
              <HardDrive className="h-3 w-3" />
              <span>Cloud or Local</span>
            </div>
          )}
        </div>

        {/* Local Requirements */}
        {model.localRequirements && (
          <div className="p-2 bg-muted rounded text-xs space-y-1">
            <p className="font-medium">Local Requirements:</p>
            <ul className="space-y-0.5 text-muted-foreground">
              <li>• {model.localRequirements.minRAM}GB RAM</li>
              {model.localRequirements.minVRAM && (
                <li>• {model.localRequirements.minVRAM}GB VRAM</li>
              )}
              <li>• {model.localRequirements.diskSpace}GB disk space</li>
            </ul>
          </div>
        )}

        {/* API Key Required */}
        {model.requiresApiKey && (
          <div className="text-xs text-muted-foreground">
            ⚠️ Requires your API key
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onSelect(model.id)}
          disabled={disabled}
          variant={isSelected ? 'primary' : 'outline'}
          className="w-full"
          size="sm"
        >
          {isSelected ? 'Current Model' : 'Use This Model'}
        </Button>
      </CardFooter>
    </Card>
  );
}
