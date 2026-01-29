'use client';

/**
 * AI Prefill Button Component
 *
 * Provides AI-powered form prefill functionality for entity creation.
 * Opens a dialog where users can describe what they want to create,
 * then uses AI to generate appropriate field values.
 */

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { AIPrefillButtonProps, AIPrefillResponse } from './types';
import { getExampleDescriptions } from '@/lib/ai/prompts/form-prefill';
import type { EntityType } from '@/config/entity-registry';

export function AIPrefillButton({
  entityType,
  onPrefill,
  disabled,
  existingData,
}: AIPrefillButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get example descriptions for this entity type
  const examples = getExampleDescriptions(entityType as EntityType);

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      setError('Please describe what you want to create');
      return;
    }

    if (description.trim().length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/form-prefill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          description: description.trim(),
          existingData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate form data');
      }

      const result: AIPrefillResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate form data');
      }

      // Call the onPrefill callback with generated data
      onPrefill(result.data, result.confidence);

      // Close dialog and show success toast
      setIsOpen(false);
      setDescription('');
      toast.success('Form filled with AI suggestions', {
        description: 'Review and adjust the generated values as needed',
      });
    } catch (err) {
      logger.error('AI prefill error', err, 'AI');
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [description, entityType, existingData, onPrefill]);

  const handleExampleClick = (example: string) => {
    setDescription(example);
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          <Sparkles className="h-4 w-4" />
          AI Assist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Form Assistant
          </DialogTitle>
          <DialogDescription>
            Describe what you want to create and AI will help fill out the form.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Description input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Describe what you want to create..."
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                setError(null);
              }}
              rows={4}
              className="resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Include details like title, price, description, and any other relevant information.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Example suggestions */}
          {examples.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4" />
                <span>Try an example:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.slice(0, 3).map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    disabled={isGenerating}
                    className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors disabled:opacity-50"
                  >
                    {example.length > 40 ? `${example.slice(0, 40)}...` : example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AIPrefillButton;
