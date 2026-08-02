/**
 * ERROR DISPLAY COMPONENT
 *
 * The invariant this card serves: Cat being unavailable must never be a dead
 * end. Every failure code maps to the concrete actions that FIX it (free key,
 * credits, retry) — deep-linked, not narrated. Falls back to text-sniffing
 * only for legacy errors that carry no code.
 */

import { useRouter } from 'next/navigation';
import { AlertCircle, Coins, Key, X } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { CatStatusButton } from '@/components/ai-chat/CatStatusNote';

interface ErrorDisplayProps {
  error: string;
  /** Machine-readable failure code from the chat API (drives recovery CTAs). */
  code?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/** Codes where adding a key / topping up credits genuinely fixes the problem. */
const FIXABLE_CODES = new Set([
  'DAILY_LIMIT',
  'AI_RATE_LIMITED',
  'ALL_PROVIDERS_DOWN',
  'NO_API_KEY',
  'STREAM_ERROR',
  'INSUFFICIENT_CREDITS',
]);

export function ErrorDisplay({ error, code, onRetry, onDismiss }: ErrorDisplayProps) {
  const router = useRouter();

  const legacyKeyHint =
    error.includes('API key') || error.includes('openrouter') || error.includes('not configured');
  const showFixActions = (code ? FIXABLE_CODES.has(code) : false) || legacyKeyHint;
  // Retrying a hard daily cap or an empty credit balance just fails again —
  // don't offer a button that lies.
  const showRetry = Boolean(onRetry) && code !== 'DAILY_LIMIT' && code !== 'INSUFFICIENT_CREDITS';

  return (
    <div className="mx-4 mb-2 rounded-md border border-status-negative/20 bg-status-negative/10 p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-negative" />
        <div className="flex-1 min-w-0">
          <p className="text-base text-status-negative">{error}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {showFixActions && (
              <>
                <button
                  onClick={() => router.push(ROUTES.SETTINGS_AI)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent-warm px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-warm/90 transition-colors"
                >
                  <Key className="h-3.5 w-3.5" />
                  Add a free key
                </button>
                <button
                  onClick={() => router.push(ROUTES.SETTINGS_AI)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-default px-3 py-1.5 text-xs font-semibold text-fg-primary hover:bg-surface-raised transition-colors"
                >
                  <Coins className="h-3.5 w-3.5" />
                  Top up Cat Credits
                </button>
              </>
            )}
            {showRetry && (
              <button
                onClick={onRetry}
                className="text-xs font-medium text-fg-secondary hover:text-fg-primary underline-offset-4 hover:underline"
              >
                Try again
              </button>
            )}
            <CatStatusButton />
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="text-fg-tertiary hover:text-fg-primary flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
