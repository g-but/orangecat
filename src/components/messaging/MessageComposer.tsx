'use client';

import { logger } from '@/utils/logger';

import React, { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, ChevronDown, User, Users } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase/browser';
import type { Message } from '@/features/messaging/types';
import { queueIfOffline, handleNetworkError } from '@/features/messaging/lib/offline-queue';
import { MESSAGE_TYPES, debugLog, API_ROUTES } from '@/features/messaging/lib/constants';
import {
  createOptimisticMessage,
  validateMessageContent,
} from '@/features/messaging/lib/message-utils';
import { useTypingIndicator } from '@/features/messaging/hooks/useTypingIndicator';
import { useMessagingActors } from '@/features/messaging/hooks/useMessagingActors';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface MessageComposerProps {
  conversationId: string;
  onMessageSent: (message: Message) => void;
  onMessageFailed?: (tempId: string, errorMessage?: string) => void;
  onMessageConfirmed?: (tempId: string, realMessage: Message) => void;
}

export default function MessageComposer({
  conversationId,
  onMessageSent,
  onMessageFailed,
  onMessageConfirmed,
}: MessageComposerProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch available actors for "Send As" feature
  const { actors, personalActor, groupActors } = useMessagingActors();
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);

  // Determine which actor to use (default to personal actor)
  const selectedActor = selectedActorId
    ? actors.find(a => a.actor_id === selectedActorId)
    : personalActor;

  // Show "Send As" selector only if user has multiple actors
  const showActorSelector = actors.length > 1;

  // Typing indicator hook
  const { startTyping, stopTyping, typingText } = useTypingIndicator(conversationId, {
    enabled: !!conversationId && !!user?.id,
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!content.trim() || isSending || !user) {
        return;
      }

      // Validate message content
      const validation = validateMessageContent(content);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }

      const messageContent = content.trim();
      setIsSending(true);

      // Stop typing indicator when sending
      stopTyping();

      // Create optimistic message using shared utility
      const optimisticMessage = createOptimisticMessage(conversationId, user.id, messageContent, {
        id: user.id,
        username: profile?.username || 'you',
        name: profile?.name || 'You',
        avatar_url: profile?.avatar_url || null,
      });

      // Optimistically show the message immediately
      onMessageSent(optimisticMessage);
      setContent('');

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      const tempId = optimisticMessage.id;

      // Queue if offline
      if (
        await queueIfOffline(
          { conversationId, content: messageContent, messageType: MESSAGE_TYPES.TEXT, tempId },
          user.id
        )
      ) {
        setIsSending(false);
        return;
      }

      // Try to send immediately if online
      debugLog('[MessageComposer] sending', { conversationId, tempId, userId: user.id });

      try {
        const response = await fetch(API_ROUTES.CONVERSATION(conversationId), {
          method: 'POST',
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: messageContent,
            messageType: MESSAGE_TYPES.TEXT,
            // Include sender actor ID if sending as a different actor (e.g., group)
            ...(selectedActor &&
              !selectedActor.is_personal && { senderActorId: selectedActor.actor_id }),
          }),
        });

        debugLog('[MessageComposer] response status', response.status);

        if (!response.ok) {
          // Attempt to queue on network failure
          if (
            await handleNetworkError(
              new Error(`HTTP ${response.status}`),
              { conversationId, content: messageContent, messageType: MESSAGE_TYPES.TEXT, tempId },
              user.id
            )
          ) {
            setIsSending(false);
            return;
          }

          const errorData = await response.json().catch(() => ({}) as Record<string, unknown>);
          logger.error('[MessageComposer] API error:', errorData);
          const desc = errorData.details || '';
          toast.error(errorData.error || 'Failed to send message', {
            description: typeof desc === 'string' ? desc : undefined,
          });
          onMessageFailed?.(tempId, errorData.error || desc);
        } else {
          // API returns { success: true, id: newId }
          interface MessageResponse {
            success?: boolean;
            id?: string;
          }
          const data = (await response.json().catch(() => null)) as MessageResponse | null;
          debugLog('[MessageComposer] success id', data?.id);

          if (data?.id) {
            // Fetch full message details from message_details view
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: fullMessage } = (await supabase
                .from('message_details' as any)
                .select('*')
                .eq('id', data.id)
                .single()) as { data: Message | null };

              if (fullMessage) {
                debugLog('[MessageComposer] confirmed full message', fullMessage.id);
                onMessageConfirmed?.(tempId, fullMessage);
              } else {
                debugLog('[MessageComposer] no full message returned from query');
              }
            } catch (err) {
              logger.error('[MessageComposer] Failed to fetch message immediately:', err);
            }
          } else {
            debugLog('[MessageComposer] no message ID returned from API');
          }
        }
      } catch (err) {
        logger.error('[MessageComposer] Network error:', err);
        if (
          await handleNetworkError(
            err,
            { conversationId, content: messageContent, messageType: MESSAGE_TYPES.TEXT, tempId },
            user.id
          )
        ) {
          setIsSending(false);
          return;
        }
        toast.error('Network error. Please try again.');
        onMessageFailed?.(tempId, 'Network error');
      } finally {
        setIsSending(false);
      }
    },
    [
      content,
      isSending,
      user,
      profile,
      conversationId,
      stopTyping,
      onMessageSent,
      onMessageFailed,
      onMessageConfirmed,
      selectedActor,
    ]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setContent(e.target.value);

      // Trigger typing indicator
      if (e.target.value.trim()) {
        startTyping();
      }

      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    },
    [startTyping]
  );

  return (
    <div
      className="border-t border-gray-200 bg-white p-3 sm:p-4 pb-safe md:pb-4"
      style={{
        paddingBottom: 'max(0.75rem, calc(0.75rem + env(safe-area-inset-bottom, 0px) + 4rem))',
      }}
    >
      {/* Send As indicator - shown when user has multiple actors */}
      {showActorSelector && selectedActor && (
        <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
          <span>Sending as:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Avatar className="h-4 w-4">
                  <AvatarImage src={selectedActor.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {selectedActor.actor_type === 'group' ? (
                      <Users className="h-2.5 w-2.5" />
                    ) : (
                      <User className="h-2.5 w-2.5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-700">{selectedActor.display_name}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Send message as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {personalActor && (
                <DropdownMenuItem
                  onClick={() => setSelectedActorId(null)}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    (!selectedActorId || selectedActorId === personalActor.actor_id) &&
                      'bg-gray-100'
                  )}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={personalActor.avatar_url || undefined} />
                    <AvatarFallback>
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{personalActor.display_name}</p>
                    <p className="text-xs text-gray-500">Personal account</p>
                  </div>
                </DropdownMenuItem>
              )}
              {groupActors.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-gray-500">
                    Organizations
                  </DropdownMenuLabel>
                  {groupActors.map(actor => (
                    <DropdownMenuItem
                      key={actor.actor_id}
                      onClick={() => setSelectedActorId(actor.actor_id)}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer',
                        selectedActorId === actor.actor_id && 'bg-gray-100'
                      )}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={actor.avatar_url || undefined} />
                        <AvatarFallback>
                          <Users className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{actor.display_name}</p>
                        <p className="text-xs text-gray-500">Organization</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 sm:gap-3">
        {/* Attachment button - hidden on very small screens */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden sm:flex p-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
          disabled={isSending}
          aria-label="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Message input container - responsive flex layout */}
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={cn(
              'w-full pr-10 sm:pr-12 py-2.5 sm:py-3 pl-3 sm:pl-4 border border-gray-200 rounded-lg resize-none',
              'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent',
              'max-h-32 min-h-[44px] text-sm sm:text-base',
              'placeholder:text-gray-400',
              isSending && 'opacity-50 cursor-not-allowed'
            )}
            rows={1}
            disabled={isSending}
          />

          {/* Emoji button - positioned inside but not covering text */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 p-1.5 sm:p-1 text-gray-400 hover:text-gray-600 flex-shrink-0 z-10"
            disabled={isSending}
            aria-label="Add emoji"
            onClick={e => {
              e.preventDefault();
              // TODO: Open emoji picker
            }}
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Send button - responsive sizing */}
        <Button
          type="submit"
          size="sm"
          className={cn(
            'px-3 sm:px-4 py-2.5 sm:py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200 flex-shrink-0',
            'min-w-[44px] sm:min-w-[auto]' // Ensure touch target size on mobile
          )}
          disabled={!content.trim() || isSending}
          aria-label="Send message"
        >
          {isSending ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>
      </form>

      {/* Typing indicator */}
      {typingText && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <span className="inline-flex gap-0.5">
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </span>
          <span>{typingText}</span>
        </div>
      )}
    </div>
  );
}
