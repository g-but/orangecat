/**
 * EMPTY STATE — shown before the first message
 */

import Link from 'next/link';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAT_HUB_COPY } from '@/config/cat-hub';
import { ROUTES } from '@/config/routes';
import { useCatMemoryCount } from '@/hooks/useCatMemoryCount';

interface EmptyStateProps {
  suggestions: string[];
  hasContext: boolean;
  isLoadingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
  isNewUser?: boolean;
  variant?: 'default' | 'focus';
}

export function EmptyState({
  suggestions,
  hasContext: _hasContext,
  isLoadingSuggestions,
  onSuggestionClick,
  isNewUser,
  variant = 'focus',
}: EmptyStateProps) {
  const isFocus = variant === 'focus';
  const title = isNewUser ? CAT_HUB_COPY.greetingNewUser : CAT_HUB_COPY.greeting;
  const memoryCount = useCatMemoryCount();

  return (
    <div className={cn('oc-chat-empty', !isFocus && 'py-12')}>
      <h2
        className={
          isFocus
            ? 'max-w-lg text-2xl font-semibold tracking-tight text-fg-primary sm:text-3xl'
            : 'mb-2 text-2xl font-semibold text-fg-primary'
        }
      >
        {title}
      </h2>
      {/* Hint is verbose on mobile and competes with the suggestion
          buttons, which already act as the hint. Show on >=sm only. */}
      <p className="mt-2 hidden max-w-md text-sm text-fg-secondary sm:block">
        {CAT_HUB_COPY.greetingHint}
      </p>

      {(isLoadingSuggestions || suggestions.length > 0) && (
        <div className="mt-8 flex w-full max-w-2xl flex-col gap-2 sm:grid sm:grid-cols-2">
          {isLoadingSuggestions
            ? [1, 2, 3, 4].map(i => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-surface-raised" />
              ))
            : suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSuggestionClick(suggestion)}
                  className="oc-chat-suggestion"
                >
                  {suggestion}
                </button>
              ))}
        </div>
      )}

      {memoryCount > 0 && (
        <Link
          href={ROUTES.SETTINGS_AI}
          className="mt-6 inline-flex items-center gap-1.5 text-xs text-fg-tertiary transition-colors hover:text-fg-secondary"
        >
          <Brain className="h-3.5 w-3.5" />
          Cat remembers {memoryCount} thing{memoryCount === 1 ? '' : 's'} about you
        </Link>
      )}
    </div>
  );
}
