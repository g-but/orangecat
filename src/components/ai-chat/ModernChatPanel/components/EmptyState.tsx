/**
 * EMPTY STATE COMPONENT
 * Displays when no messages, with suggestions
 */

import { cn } from '@/lib/utils';
import { Cat, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  suggestions: string[];
  hasContext: boolean;
  isLoadingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

export function EmptyState({
  suggestions,
  hasContext,
  isLoadingSuggestions,
  onSuggestionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg">
        <Cat className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hi, I'm your Cat</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        {hasContext ? (
          <>
            I know about your goals and context. Ask me anything — I'll give you personalized
            advice.
          </>
        ) : (
          <>
            I'm here to help with your projects, products, and ideas. Ask me anything —
            conversations are private and not saved.
          </>
        )}
      </p>
      {hasContext && (
        <p className="text-xs text-tiffany-600 mb-4 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Personalized suggestions based on your context
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {isLoadingSuggestions ? (
          // Loading skeleton for suggestions
          <>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-9 bg-gray-100 rounded-full animate-pulse"
                style={{ width: `${100 + Math.random() * 80}px` }}
              />
            ))}
          </>
        ) : (
          suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                'px-4 py-2 rounded-full text-sm transition-colors text-left',
                hasContext
                  ? 'bg-tiffany-50 hover:bg-tiffany-100 text-tiffany-700 border border-tiffany-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
