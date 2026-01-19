/**
 * Model Selector Component
 *
 * Comprehensive model browser and selector for AI chat.
 * Shows different models based on user's access level (free tier vs BYOK).
 * Supports filtering, searching, and detailed model information.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/Button';
import { ModelCard } from './ModelCard';
import { Search, Crown, Zap, Sparkles } from 'lucide-react';
import { MODEL_REGISTRY } from '@/config/model-registry';

interface ModelSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentModelId?: string;
  onModelSelect: (modelId: string) => void;
  hasByok?: boolean;
}

type FilterTier = 'all' | 'free' | 'freemium' | 'paid';
type FilterAvailability = 'all' | 'cloud' | 'local' | 'both';

export function ModelSelector({
  open,
  onOpenChange,
  currentModelId,
  onModelSelect,
  hasByok = false,
}: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [filterAvailability, setFilterAvailability] = useState<FilterAvailability>('all');
  const [activeTab, setActiveTab] = useState<'recommended' | 'all' | 'free'>('recommended');

  // Get all models as array
  const allModels = useMemo(() => Object.values(MODEL_REGISTRY), []);

  // Filter models based on user access and filters
  const filteredModels = useMemo(() => {
    let models = allModels;

    // Tab filtering
    if (activeTab === 'free') {
      models = models.filter(m => m.tier === 'free' || m.tier === 'freemium');
    } else if (activeTab === 'recommended') {
      // Show recommended models based on access level
      if (hasByok) {
        models = models.filter(m => m.quality >= 4); // High-quality models for BYOK
      } else {
        models = models.filter(m => m.tier === 'free' || m.tier === 'freemium');
      }
    }

    // Tier filter
    if (filterTier !== 'all') {
      models = models.filter(m => m.tier === filterTier);
    }

    // Availability filter
    if (filterAvailability !== 'all') {
      models = models.filter(m => {
        if (filterAvailability === 'both') {
          return m.availability === 'both';
        }
        return m.availability === filterAvailability || m.availability === 'both';
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      models = models.filter(
        m =>
          m.name.toLowerCase().includes(query) ||
          m.provider.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query)
      );
    }

    // Sort by quality (descending), then by speed
    return models.sort((a, b) => {
      if (a.quality !== b.quality) {
        return b.quality - a.quality;
      }
      const speedOrder = { instant: 0, fast: 1, medium: 2, slow: 3 };
      return speedOrder[a.speed] - speedOrder[b.speed];
    });
  }, [allModels, activeTab, filterTier, filterAvailability, searchQuery, hasByok]);

  // Get recommended models count
  const recommendedCount = useMemo(() => {
    if (hasByok) {
      return allModels.filter(m => m.quality >= 4).length;
    }
    return allModels.filter(m => m.tier === 'free' || m.tier === 'freemium').length;
  }, [allModels, hasByok]);

  const freeModelsCount = useMemo(
    () => allModels.filter(m => m.tier === 'free' || m.tier === 'freemium').length,
    [allModels]
  );

  const handleSelectModel = (modelId: string) => {
    // Check if user can use this model
    const model = MODEL_REGISTRY[modelId];
    if (!hasByok && model.tier === 'paid') {
      // Show upgrade prompt
      return;
    }

    onModelSelect(modelId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-tiffany" />
            Choose AI Model
          </DialogTitle>
          <DialogDescription>
            {hasByok ? (
              <span className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-600" />
                You have premium access to all models
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                Showing free models. Add your API key for premium access.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 py-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-tiffany"
            />
          </div>

          {/* Tier Filter */}
          <Select value={filterTier} onValueChange={(value: FilterTier) => setFilterTier(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="freemium">Free*</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          {/* Availability Filter */}
          <Select
            value={filterAvailability}
            onValueChange={(value: FilterAvailability) => setFilterAvailability(value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="cloud">Cloud</SelectItem>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v: any) => setActiveTab(v)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommended">
              Recommended
              <Badge variant="secondary" className="ml-2 text-xs">
                {recommendedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all">
              All Models
              <Badge variant="secondary" className="ml-2 text-xs">
                {allModels.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="free">
              <Zap className="h-3 w-3 mr-1" />
              Free Only
              <Badge variant="secondary" className="ml-2 text-xs">
                {freeModelsCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Model Grid */}
          <TabsContent value={activeTab} className="flex-1 overflow-y-auto mt-4">
            {filteredModels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No models found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredModels.map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={model.id === currentModelId}
                    onSelect={handleSelectModel}
                    disabled={!hasByok && model.tier === 'paid'}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Upgrade CTA for non-BYOK users */}
        {!hasByok && (
          <div className="border-t pt-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">Unlock Premium Models</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Add your OpenRouter or provider API key to access GPT-4, Claude, Gemini Pro, and
                    200+ other models.
                  </p>
                  <Button size="sm" variant="primary">
                    Add API Key
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
