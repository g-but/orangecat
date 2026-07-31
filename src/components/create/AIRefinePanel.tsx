'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { AIAssistChip } from './AIAssistChip';
import { AI_ASSIST_MIN_INPUT_LENGTH, type AiAdjustment } from '@/config/ai-form-assist';

interface AIRefinePanelProps {
  /** Already filtered to what this form's fields support */
  adjustments: AiAdjustment[];
  onAdjust: (adjustment: AiAdjustment) => void;
  instruction: string;
  onInstructionChange: (value: string) => void;
  onSubmit: () => void;
  /** Which request is in flight — an adjustment id, or the typed-request marker */
  pending: string | null;
  typedRequestId: string;
  disabled: boolean;
}

/**
 * The populated-form surface: change what is already there.
 *
 * One-tap adjustments come FIRST and typing is the fallback. On a phone the
 * point of opening this page is to get a listing published, not to compose
 * instructions — so the fastest path to "better" should cost a single tap.
 */
export function AIRefinePanel({
  adjustments,
  onAdjust,
  instruction,
  onInstructionChange,
  onSubmit,
  pending,
  typedRequestId,
  disabled,
}: AIRefinePanelProps) {
  const isTyping = pending === typedRequestId;
  const isBlocked = pending !== null || disabled;

  return (
    <div className="space-y-3">
      {adjustments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {adjustments.map(adjustment => (
            <AIAssistChip
              key={adjustment.id}
              label={adjustment.label}
              disabled={isBlocked}
              isLoading={pending === adjustment.id}
              onClick={() => onAdjust(adjustment)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={instruction}
          onChange={e => onInstructionChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Or tell AI what else to change…"
          disabled={isBlocked}
          // text-base on mobile: anything smaller makes iOS zoom in on focus
          className="min-h-11 flex-1 rounded-md border border-subtle bg-surface-page px-3 py-2 text-base placeholder:text-fg-tertiary focus:border-interactive focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 sm:text-sm"
        />
        <Button
          type="button"
          size="lg"
          onClick={onSubmit}
          disabled={isBlocked || instruction.trim().length < AI_ASSIST_MIN_INPUT_LENGTH.refine}
          className="w-full gap-2 sm:w-auto"
        >
          {isTyping ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>{isTyping ? 'Adjusting…' : 'Adjust'}</span>
        </Button>
      </div>
    </div>
  );
}

export default AIRefinePanel;
