/**
 * ERROR DISPLAY COMPONENT
 * Shows error messages with optional API key link
 */

import { useRouter } from 'next/navigation';
import { AlertCircle, Key, X } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { CatStatusButton } from '@/components/ai-chat/CatStatusNote';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  const router = useRouter();

  const showApiKeyLink =
    error.includes('API key') || error.includes('openrouter') || error.includes('not configured');

  return (
    <div className="mx-4 mb-2 rounded-md border border-status-negative/20 bg-status-negative/10 p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-status-negative" />
        <div className="flex-1 min-w-0">
          <p className="text-base text-status-negative">{error}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {showApiKeyLink && (
              <button
                onClick={() => router.push(ROUTES.SETTINGS_AI)}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent-warm px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-warm/90 transition-colors"
              >
                <Key className="h-3.5 w-3.5" />
                Add your API key
              </button>
            )}
            {onRetry && (
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
