'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle, Lightbulb, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';

import Button from '@/components/ui/Button';
import type { AIPrefillBarProps, AIPrefillResponse } from './types';
import { getExampleDescriptions } from '@/lib/ai/prompts/form-prefill';
import type { EntityType } from '@/config/entity-registry';
import { PREFILL_MIN_INPUT_LENGTH, type PrefillMode } from '@/config/ai-prefill';

/**
 * Fields whose returned value actually differs from what is in the form.
 *
 * A refinement that changes nothing is a failure, not a success — reporting
 * "Form updated" over an unchanged form is how the original bug stayed
 * invisible. Values include arrays (tags), so compare structurally.
 */
function changedFieldCount(
  returned: Record<string, unknown>,
  current: Record<string, unknown> | undefined
): number {
  return Object.entries(returned).filter(
    ([key, value]) => JSON.stringify(current?.[key] ?? null) !== JSON.stringify(value ?? null)
  ).length;
}

export function AIPrefillBar({
  entityType,
  onPrefill,
  disabled,
  existingData,
  mode = 'create',
}: AIPrefillBarProps) {
  const isEdit = mode === 'edit';
  // Seed the AI-fill box from a ?description= param on create — this is how the
  // onboarding "paste who you are → offers → Create this" flow lands a proposed
  // offering here ready to generate, closing the loop without retyping.
  const searchParams = useSearchParams();
  const [description, setDescription] = useState(() =>
    mode === 'create' ? (searchParams.get('description') ?? '') : ''
  );
  const [refineInput, setRefineInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFilled, setHasFilled] = useState(false);

  const examples = getExampleDescriptions(entityType as EntityType);

  const callAI = useCallback(
    async (prompt: string, isRefinement: boolean) => {
      const setter = isRefinement ? setIsRefining : setIsGenerating;
      // Editing an existing entity is a refinement even on the first call — the
      // box asks for "the change you want", not a fresh description.
      const prefillMode: PrefillMode = isRefinement || isEdit ? 'refine' : 'generate';
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
            mode: prefillMode,
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

        const changed = changedFieldCount(result.data, existingData);

        // Never report success over an unchanged form. Keep the instruction in
        // the box so the user can rephrase instead of retyping it.
        if (prefillMode === 'refine' && changed === 0) {
          setError(
            "AI couldn't apply that change — try naming the field, e.g. \"rewrite the description in English and German\"."
          );
          return;
        }

        onPrefill(result.data, result.confidence);
        setHasFilled(true);

        if (isRefinement) {
          setRefineInput('');
          toast.success(changed === 1 ? '1 field updated' : `${changed} fields updated`);
        } else {
          toast.success(
            isEdit ? 'Changes applied — review below' : 'Form filled — review and adjust below',
            { description: 'You can also tell AI what to change' }
          );
        }
      } catch (err) {
        logger.error('AI prefill error', err, 'AI');
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setter(false);
      }
    },
    [entityType, existingData, onPrefill, isEdit]
  );

  const handleGenerate = useCallback(() => {
    const min = PREFILL_MIN_INPUT_LENGTH[isEdit ? 'refine' : 'generate'];
    if (description.trim().length < min) {
      setError(
        isEdit
          ? `Please describe the change you want (at least ${min} characters)`
          : `Please describe what you want to create (at least ${min} characters)`
      );
      return;
    }
    callAI(description, false);
  }, [description, callAI, isEdit]);

  const handleRefine = useCallback(() => {
    if (refineInput.trim().length < PREFILL_MIN_INPUT_LENGTH.refine) {
      return;
    }
    callAI(refineInput, true);
  }, [refineInput, callAI]);

  const handleReset = () => {
    setHasFilled(false);
    setDescription('');
    setRefineInput('');
    setError(null);
  };

  return (
    <div className="mb-6 space-y-3 rounded-md border border-subtle bg-surface-raised/30 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-fg-primary" />
          <span className="text-sm font-semibold text-fg-primary">
            {hasFilled
              ? isEdit
                ? 'AI updated the form'
                : 'AI filled the form'
              : isEdit
                ? 'Edit with AI'
                : 'Fill with AI'}
          </span>
          {hasFilled && <CheckCircle2 className="h-4 w-4 text-status-positive" />}
        </div>
        {hasFilled && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-fg-secondary hover:text-fg-primary"
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
            placeholder={
              isEdit
                ? `Describe the change you want — AI will update the fields for you.\n\nExample: "Lower the price to 60 CHF and make the description more concise."`
                : `Describe what you want to create — AI will fill the form for you.\n\nExample: "I'm an artist selling original watercolour prints of Swiss landscapes, priced around 80 CHF each, shipping worldwide."`
            }
            disabled={isGenerating || disabled}
            rows={3}
            className="block w-full resize-none rounded-md border border-subtle bg-surface-page px-3 py-2 text-sm placeholder:text-fg-tertiary focus:border-interactive focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />

          <div className="flex items-center justify-between gap-2">
            {/* Example chips */}
            {!isEdit && examples.length > 0 && !description && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-fg-tertiary">
                  <Lightbulb className="h-3 w-3" />
                  <span>Try:</span>
                </div>
                {examples.slice(0, 2).map((example, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setDescription(example);
                      setError(null);
                    }}
                    disabled={isGenerating || disabled}
                    className="rounded-sm bg-surface-page px-2.5 py-1 text-xs text-fg-secondary transition-colors hover:bg-surface-raised hover:text-fg-primary"
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
              className="ml-auto shrink-0 gap-2 bg-fg-primary text-fg-inverted hover:bg-fg-primary/90"
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
            onChange={e => {
              setRefineInput(e.target.value);
              setError(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleRefine();
              }
            }}
            placeholder='Tell AI what to change — e.g. "make the title shorter" or "increase the price"'
            disabled={isRefining || disabled}
            className="flex-1 rounded-md border border-subtle bg-surface-page px-3 py-2 text-sm placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button
            type="button"
            onClick={handleRefine}
            disabled={isRefining || disabled || !refineInput.trim()}
            className="shrink-0 gap-2 bg-fg-primary text-fg-inverted hover:bg-fg-primary/90"
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
        <div className="flex items-start gap-2 text-sm text-status-negative">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default AIPrefillBar;
