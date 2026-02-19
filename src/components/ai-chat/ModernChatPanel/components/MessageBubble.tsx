/**
 * MESSAGE BUBBLE COMPONENT
 * Displays a single chat message with avatar and actions
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Cat, User, Copy, Check } from 'lucide-react';
import { AI_MODEL_REGISTRY } from '@/config/ai-models';
import { renderChatMarkdown } from '@/utils/markdown';
import { ActionButton } from './ActionButton';
import type { Message, CatAction } from '../types';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  onActionClick?: (action: CatAction) => void;
}

export function MessageBubble({ message, isLast, onActionClick }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  // Clean the message content by removing action blocks for display
  const displayContent = message.content.replace(/```action[\s\S]*?```/g, '').trim();

  const handleCopy = () => {
    void navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <div
            className={cn('break-words text-sm leading-relaxed', isUser && 'whitespace-pre-wrap')}
          >
            {isUser ? displayContent : renderChatMarkdown(displayContent)}
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

        {/* Model used indicator + copy button */}
        {!isUser && message.modelUsed && displayContent && (
          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
            <span>{AI_MODEL_REGISTRY[message.modelUsed]?.name || message.modelUsed}</span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
              title="Copy response"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
