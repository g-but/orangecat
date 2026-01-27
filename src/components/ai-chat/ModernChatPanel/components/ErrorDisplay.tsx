/**
 * ERROR DISPLAY COMPONENT
 * Shows error messages with optional API key link
 */

import { useRouter } from 'next/navigation';
import { AlertCircle, Key } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  const router = useRouter();

  const showApiKeyLink =
    error.includes('API key') || error.includes('openrouter') || error.includes('not configured');

  return (
    <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-red-700">{error}</p>
          {showApiKeyLink && (
            <button
              onClick={() => router.push('/settings/ai')}
              className="text-xs text-red-600 hover:text-red-800 mt-1 flex items-center gap-1"
            >
              <Key className="h-3 w-3" />
              Configure API Key
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
