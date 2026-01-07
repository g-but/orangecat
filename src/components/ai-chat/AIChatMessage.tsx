'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  cost_sats?: number;
  created_at: string;
}

interface AIChatMessageProps {
  message: AIMessage;
  assistantAvatar?: string | null;
  assistantName?: string;
  userAvatar?: string | null;
  userName?: string;
}

export function AIChatMessage({
  message,
  assistantAvatar,
  assistantName = 'Assistant',
  userAvatar,
  userName = 'You',
}: AIChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Don't render system messages (they're context for the AI)
  if (isSystem) {return null;}

  return (
    <div
      className={cn(
        'flex gap-3 py-4 px-4',
        isUser ? 'bg-gray-50' : 'bg-white'
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        {isUser ? (
          <>
            <AvatarImage src={userAvatar || undefined} alt={userName} />
            <AvatarFallback className="bg-sky-100 text-sky-600">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src={assistantAvatar || undefined} alt={assistantName} />
            <AvatarFallback className="bg-purple-100 text-purple-600">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {isUser ? userName : assistantName}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {!isUser && message.tokens_used && message.tokens_used > 0 && (
            <span className="text-xs text-gray-400">
              ({message.tokens_used} tokens)
            </span>
          )}
        </div>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {message.content}
        </div>
        {!isUser && message.cost_sats && message.cost_sats > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            Cost: {message.cost_sats.toLocaleString()} sats
          </div>
        )}
      </div>
    </div>
  );
}

export type { AIMessage };
