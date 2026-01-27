/**
 * MESSAGE BUBBLE COMPONENT
 * Displays a single chat message with avatar and actions
 */

import { cn } from '@/lib/utils';
import { Cat, User } from 'lucide-react';
import { AI_MODEL_REGISTRY } from '@/config/ai-models';
import { ActionButton } from './ActionButton';
import type { Message, SuggestedAction } from '../types';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onActionClick?: (action: SuggestedAction) => void;
}

export function MessageBubble({ message, isLast, onActionClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  // Clean the message content by removing action blocks for display
  const displayContent = message.content.replace(/```action[\s\S]*?```/g, '').trim();

  return (
    <div
      className={cn('flex gap-3 max-w-3xl mx-auto px-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-gray-200' : 'bg-gradient-to-br from-orange-400 to-orange-500'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-gray-600" />
        ) : (
          <Cat className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2.5 max-w-full',
            isUser
              ? 'bg-orange-500 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          )}
        >
          <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {displayContent}
            {isLast && !isUser && !displayContent && (
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action, idx) => (
              <ActionButton key={idx} action={action} onClick={() => onActionClick?.(action)} />
            ))}
          </div>
        )}

        {/* Model used indicator */}
        {!isUser && message.modelUsed && displayContent && (
          <div className="text-xs text-gray-400 mt-1">
            {AI_MODEL_REGISTRY[message.modelUsed]?.name || message.modelUsed}
          </div>
        )}
      </div>
    </div>
  );
}
