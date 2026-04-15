'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Loader2, AlertCircle, Lightbulb, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';

import Button from '@/components/ui/Button';
import type { AIPrefillBarProps, AIPrefillResponse } from './types';
import { getExampleDescriptions } from '@/lib/ai/prompts/form-prefill';
import type { EntityType } from '@/config/entity-registry';

export function AIPrefillBar({ entityType, onPrefill, disabled, existingData }: AIPrefillBarProps) {
  const [description, setDescription] = useState('');
  const [refineInput, setRefineInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFilled, setHasFilled] = useState(false);

  const examples = getExampleDescriptions(entityType as EntityType);

  const callAI = useCallback(
    async (prompt: string, isRefinement: boolean) => {
      const setter = isRefinement ? setIsRefining : setIsGenerating;
      setter(true);
      setError(null);

      try {
        const response = await fetch(API_ROUTES.AI.FORM_PREFILL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            description: prompt.trim(),
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
        setHasFilled(true);

        if (isRefinement) {
          setRefineInput('');
          toast.success('Form updated');
        } else {
          toast.success('Form filled — review and adjust below', {
            description: 'You can also tell AI what to change',
          });
        }
      } catch (err) {
        logger.error('AI prefill error', err, 'AI');
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setter(false);
      }
    },
    [entityType, existingData, onPrefill]
  );

  const handleGenerate = useCallback(() => {
    if (!description.trim() || description.trim().length < 10) {
      setError('Please describe what you want to create (at least 10 characters)');
      return;
    }
    callAI(description, false);
  }, [description, callAI]);

  const handleRefine = useCallback(() => {
    if (!refineInput.trim()) {return;}
    callAI(refineInput, true);
  }, [refineInput, callAI]);

  const handleReset = () => {
    setHasFilled(false);
    setDescription('');
    setRefineInput('');
    setError(null);
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 mb-6 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-semibold text-purple-800">
            {hasFilled ? 'AI filled the form' : 'Fill with AI'}
          </span>
          {hasFilled && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </div>
        {hasFilled && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Start over
          </button>
        )}
      </div>

      {/* Initial description — shown until AI fills */}
      {!hasFilled && (
        <>
          <textarea
            value={description}
            onChange={e => {
              setDescription(e.target.value);
              setError(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder={`Describe what you want to create — AI will fill the form for you.\n\nExample: "I'm an artist selling original watercolour prints of Swiss landscapes, priced around 80 CHF each, shipping worldwide."`}
            disabled={isGenerating || disabled}
            rows={3}
            className="block w-full rounded-lg px-3 py-2 text-sm border border-purple-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 disabled:opacity-50 resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            {/* Example chips */}
            {examples.length > 0 && !description && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Lightbulb className="h-3 w-3" />
                  <span>Try:</span>
                </div>
                {examples.slice(0, 2).map((example, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setDescription(example); setError(null); }}
                    disabled={isGenerating || disabled}
                    className="text-xs px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full transition-colors"
                  >
                    {example.length > 45 ? `${example.slice(0, 45)}…` : example}
                  </button>
                ))}
              </div>
            )}
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || disabled || !description.trim()}
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shrink-0 ml-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Filling form…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Fill form</span>
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Refinement mode — shown after AI fills */}
      {hasFilled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={refineInput}
            onChange={e => { setRefineInput(e.target.value); setError(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRefine();
              }
            }}
            placeholder='Tell AI what to change — e.g. "make the title shorter" or "increase the price"'
            disabled={isRefining || disabled}
            className="flex-1 rounded-lg px-3 py-2 text-sm border border-purple-200 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50"
          />
          <Button
            type="button"
            onClick={handleRefine}
            disabled={isRefining || disabled || !refineInput.trim()}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
          >
            {isRefining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>Adjust</span>
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default AIPrefillBar;
