'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIAssistChipProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Show a spinner on THIS chip — feedback belongs where the finger landed */
  isLoading?: boolean;
  /**
   * Full width on phones, intrinsic from `sm` up. For long text (starter
   * examples) that would otherwise truncate to an unreadable stub on mobile.
   */
  block?: boolean;
}

/**
 * One tappable AI suggestion.
 *
 * The single definition of a suggestion chip — starter examples and one-click
 * adjustments render through this, so the touch target and focus ring can
 * never drift apart between the two. `min-h-11` is the 44px minimum from the
 * frontend rules; the previous inline chips were roughly half that.
 */
export function AIAssistChip({ label, onClick, disabled, isLoading, block }: AIAssistChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex min-h-11 items-center gap-1.5 rounded-md border border-subtle bg-surface-page px-3 py-2',
        'text-left text-sm text-fg-secondary transition-colors touch-manipulation',
        'hover:bg-surface-raised hover:text-fg-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        block ? 'w-full sm:w-auto sm:max-w-xs' : 'max-w-full'
      )}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />}
      <span className="truncate">{label}</span>
    </button>
  );
}

export default AIAssistChip;
