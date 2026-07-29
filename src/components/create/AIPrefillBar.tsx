'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, AlertCircle, Lightbulb, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';

import Button from '@/components/ui/Button';
import type { AIPrefillBarProps, AIPrefillResponse } from './types';
import {
  getAdjustmentsForFields,
  getExampleDescriptions,
  type AiAssistIntent,
} from '@/config/ai-form-assist';
import type { EntityType } from '@/config/entity-registry';

const EMPTY_FIELDS: NonNullable<AIPrefillBarProps['fields']> = [];

export function AIPrefillBar({
  entityType,
  onPrefill,
  disabled,
  existingData,
  mode = 'create',
  fields = EMPTY_FIELDS,
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
  const [lastChanged, setLastChanged] = useState<string[] | null>(null);

  const examples = getExampleDescriptions(entityType as EntityType);

  // Adjustments are filtered against THIS form's fields, so a form without a
  // description never offers to lengthen one.
  const adjustments = useMemo(() => getAdjustmentsForFields(fields), [fields]);

  /**
   * On edit the fields are already populated, so the bar starts in refine mode:
   * "change what's here" is the only sensible ask. On create it flips to refine
   * once the AI has filled the form.
   */
  const isRefineMode = isEdit || hasFilled;
  const busy = isGenerating || isRefining;

  const labelFor = useCallback(
    (name: string) => fields.find(f => f.name === name)?.label ?? name,
    [fields]
  );

  const callAI = useCallback(
    async (prompt: string, intent: AiAssistIntent) => {
      const setter = intent === 'refine' ? setIsRefining : setIsGenerating;
      setter(true);
      setError(null);
      setLastChanged(null);

      try {
        const response = await fetch(API_ROUTES.AI.FORM_PREFILL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType,
            description: prompt.trim(),
            existingData,
            intent,
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

        const changedFields = result.changedFields ?? Object.keys(result.data);
        onPrefill(result.data, result.confidence, changedFields);
        setHasFilled(true);
        setLastChanged(changedFields);

        if (intent === 'refine') {
          setRefineInput('');
          if (changedFields.length === 0) {
            toast('Nothing changed', { description: 'Try naming the field you want changed.' });
          } else {
            const count = changedFields.length;
            toast.success(`Updated ${count} field${count > 1 ? 's' : ''}`);
          }
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
    callAI(description, 'fill');
  }, [description, callAI]);

  const handleRefine = useCallback(() => {
    const instruction = refineInput.trim();
    if (instruction.length < 3) {
      return;
    }
    callAI(instruction, 'refine');
  }, [refineInput, callAI]);

  const handleReset = () => {
    setHasFilled(false);
    setDescription('');
    setRefineInput('');
    setError(null);
    setLastChanged(null);
  };

  return (
    <div className="mb-6 space-y-3 rounded-md border border-subtle bg-surface-raised/30 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-fg-primary" />
          <span className="text-sm font-semibold text-fg-primary">
            {isEdit ? 'Edit with AI' : hasFilled ? 'AI filled the form' : 'Fill with AI'}
          </span>
          {hasFilled && !isEdit && <CheckCircle2 className="h-4 w-4 text-status-positive" />}
        </div>
        {hasFilled && !isEdit && (
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

      {/* Describe-and-fill — create only, until the AI has filled the form */}
      {!isRefineMode && (
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
            disabled={busy || disabled}
            rows={3}
            className="block w-full resize-none rounded-md border border-subtle bg-surface-page px-3 py-2 text-sm placeholder:text-fg-tertiary focus:border-interactive focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />

          <div className="flex items-center justify-between gap-2">
            {/* Example chips */}
            {examples.length > 0 && !description && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-fg-tertiary">
                  <Lightbulb className="h-3 w-3" />
                  <span>Try:</span>
                </div>
                {examples.slice(0, 2).map(example => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setDescription(example);
                      setError(null);
                    }}
                    disabled={busy || disabled}
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
              disabled={busy || disabled || !description.trim()}
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

      {/* Refine — the form has content, so the ask is "change it" */}
      {isRefineMode && (
        <>
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
              placeholder='Tell AI what to change — e.g. "make the description longer and add a German version"'
              disabled={busy || disabled}
              className="flex-1 rounded-md border border-subtle bg-surface-page px-3 py-2 text-sm placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
            <Button
              type="button"
              onClick={handleRefine}
              disabled={busy || disabled || refineInput.trim().length < 3}
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

          {/* One-click adjustments, filtered to what this form actually has */}
          {adjustments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {adjustments.map(adjustment => (
                <button
                  key={adjustment.id}
                  type="button"
                  onClick={() => callAI(adjustment.instruction, 'refine')}
                  disabled={busy || disabled}
                  className="rounded-sm bg-surface-page px-2.5 py-1 text-xs text-fg-secondary transition-colors hover:bg-surface-raised hover:text-fg-primary disabled:opacity-50"
                >
                  {adjustment.label}
                </button>
              ))}
            </div>
          )}

          {/* Say what actually changed — the old bar reported success either way */}
          {lastChanged !== null && !busy && (
            <p className="text-xs text-fg-tertiary">
              {lastChanged.length > 0
                ? `Updated: ${lastChanged.map(labelFor).join(', ')}`
                : 'No fields changed — try naming the field you want changed.'}
            </p>
          )}
        </>
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
