'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

import Button from '@/components/ui/Button';
import type { AIPrefillBarProps, AIPrefillResponse } from './types';
import { getExampleDescriptions } from '@/lib/ai/prompts/form-prefill';
import type { EntityType } from '@/config/entity-registry';

export function AIPrefillBar({ entityType, onPrefill, disabled, existingData }: AIPrefillBarProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      onPrefill(result.data, result.confidence);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="space-y-3 pb-6 mb-6 border-b border-gray-200">
      {/* Input + button row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <input
            type="text"
            value={description}
            onChange={e => {
              setDescription(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to create..."
            disabled={isGenerating || disabled}
            className="block w-full rounded-md pl-10 pr-3 py-2 text-sm border border-purple-200 bg-purple-50/50 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 disabled:opacity-50"
          />
        </div>
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || disabled || !description.trim()}
          className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Fill with AI</span>
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Example chips (visible when input is empty) */}
      {examples.length > 0 && !description && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>Try:</span>
          </div>
          {examples.slice(0, 3).map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={isGenerating || disabled}
              className="text-xs px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-full transition-colors disabled:opacity-50"
            >
              {example.length > 40 ? `${example.slice(0, 40)}...` : example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AIPrefillBar;
