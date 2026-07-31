'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';

import { AIFillPanel } from './AIFillPanel';
import { AIRefinePanel } from './AIRefinePanel';
import type { AIPrefillBarProps, AIPrefillResponse } from './types';
import {
  AI_ASSIST_MIN_INPUT_LENGTH,
  getAdjustmentsForFields,
  getExampleDescriptions,
  type AiAdjustment,
  type AiAssistIntent,
} from '@/config/ai-form-assist';

const EMPTY_FIELDS: NonNullable<AIPrefillBarProps['fields']> = [];

/** Marks the free-text box as the in-flight request, so chips show their own spinner. */
const TYPED_REQUEST = '__typed__';

/**
 * AI assistance for any entity form — fill an empty one, or change a filled one.
 *
 * Owns the request lifecycle only; the two surfaces render in AIFillPanel /
 * AIRefinePanel.
 */
export function AIPrefillBar({
  formType,
  onPrefill,
  disabled = false,
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
  const [instruction, setInstruction] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasFilled, setHasFilled] = useState(false);
  const [lastChanged, setLastChanged] = useState<string[] | null>(null);

  const examples = getExampleDescriptions(formType);

  // Filtered against THIS form's fields, so a form without a description never
  // offers to lengthen one.
  const adjustments = useMemo(() => getAdjustmentsForFields(fields), [fields]);

  /**
   * On edit the fields are already populated, so the bar starts in refine mode:
   * "change what's here" is the only sensible ask. On create it flips to refine
   * once the AI has filled the form.
   */
  const isRefineMode = isEdit || hasFilled;
  const busy = pending !== null;

  const labelFor = useCallback(
    (name: string) => fields.find(f => f.name === name)?.label ?? name,
    [fields]
  );

  const callAI = useCallback(
    async (prompt: string, intent: AiAssistIntent, requestId: string) => {
      setPending(requestId);
      setError(null);
      setLastChanged(null);

      try {
        const response = await fetch(API_ROUTES.AI.FORM_PREFILL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType,
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
          setInstruction('');
          if (changedFields.length === 0) {
            toast('Nothing changed', { description: 'Try naming the field you want changed.' });
          } else {
            toast.success(
              `Updated ${changedFields.length} field${changedFields.length > 1 ? 's' : ''}`
            );
          }
        } else {
          toast.success('Form filled — review and adjust below');
        }
      } catch (err) {
        logger.error('AI prefill error', err, 'AI');
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setPending(null);
      }
    },
    [formType, existingData, onPrefill]
  );

  const handleGenerate = useCallback(() => {
    const min = AI_ASSIST_MIN_INPUT_LENGTH.fill;
    if (description.trim().length < min) {
      setError(`Please describe what you want to create (at least ${min} characters)`);
      return;
    }
    callAI(description, 'fill', TYPED_REQUEST);
  }, [description, callAI]);

  const handleRefine = useCallback(() => {
    if (instruction.trim().length < AI_ASSIST_MIN_INPUT_LENGTH.refine) {
      return;
    }
    callAI(instruction, 'refine', TYPED_REQUEST);
  }, [instruction, callAI]);

  const handleAdjust = useCallback(
    (adjustment: AiAdjustment) => callAI(adjustment.instruction, 'refine', adjustment.id),
    [callAI]
  );

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    setError(null);
  }, []);

  const handleInstructionChange = useCallback((value: string) => {
    setInstruction(value);
    setError(null);
  }, []);

  const handleReset = () => {
    setHasFilled(false);
    setDescription('');
    setInstruction('');
    setError(null);
    setLastChanged(null);
  };

  const statusMessage =
    busy || lastChanged === null
      ? ''
      : lastChanged.length > 0
        ? `Updated: ${lastChanged.map(labelFor).join(', ')}`
        : 'No fields changed — try naming the field you want changed.';

  return (
    <div className="mb-6 space-y-3 rounded-md border border-subtle bg-surface-raised/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-fg-primary" />
          <span className="text-sm font-semibold text-fg-primary">
            {isEdit ? 'Edit with AI' : hasFilled ? 'AI filled the form' : 'Fill with AI'}
          </span>
          {hasFilled && !isEdit && (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-status-positive" />
          )}
        </div>
        {hasFilled && !isEdit && (
          <button
            type="button"
            onClick={handleReset}
            className="flex min-h-11 shrink-0 items-center gap-1 px-1 text-xs text-fg-secondary hover:text-fg-primary"
          >
            <RefreshCw className="h-3 w-3" />
            Start over
          </button>
        )}
      </div>

      {isRefineMode ? (
        <AIRefinePanel
          adjustments={adjustments}
          onAdjust={handleAdjust}
          instruction={instruction}
          onInstructionChange={handleInstructionChange}
          onSubmit={handleRefine}
          pending={pending}
          typedRequestId={TYPED_REQUEST}
          disabled={disabled}
        />
      ) : (
        <AIFillPanel
          description={description}
          onDescriptionChange={handleDescriptionChange}
          examples={examples}
          onSubmit={handleGenerate}
          busy={busy}
          disabled={disabled}
        />
      )}

      {/* What actually changed — the old bar reported success either way.
          A live region so it is announced, not merely visible. */}
      <p role="status" aria-live="polite" className="text-xs text-fg-secondary empty:hidden">
        {statusMessage}
      </p>

      {error && (
        <div className="flex items-start gap-2 text-sm text-status-negative">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default AIPrefillBar;
