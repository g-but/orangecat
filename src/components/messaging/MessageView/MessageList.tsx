'use client';

/**
 * Message List Component
 *
 * Scrollable list of messages with date dividers and load more functionality.
 *
 * @module messaging/MessageView/MessageList
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { ChevronUp, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import MessageItem, { shouldShowDateDivider, getDateDividerText } from './MessageItem';
import type { Message } from '@/features/messaging/types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string | undefined;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onMessageLongPress?: (message: Message, position?: { x: number; y: number }) => void;
  /** Ref to scroll to bottom */
  messagesEndRef?: React.RefObject<HTMLDivElement>;
}

export default function MessageList({
  messages,
  currentUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onMessageLongPress,
  messagesEndRef,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="text-gray-500 hover:text-gray-700"
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ChevronUp className="h-4 w-4 mr-2" />
            )}
            {isLoadingMore ? 'Loading...' : 'Load older messages'}
          </Button>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDivider = shouldShowDateDivider(message, prevMessage);
        const isCurrentUser = message.sender_id === currentUserId;

        // Use a combination of id and index to ensure uniqueness even if duplicates exist
        // This prevents React key warnings while we fix the root cause
        const uniqueKey = `${message.id}-${index}`;

        return (
          <MessageItem
            key={uniqueKey}
            message={message}
            isCurrentUser={isCurrentUser}
            showDateDivider={showDivider}
            dateDividerText={showDivider ? getDateDividerText(message.created_at) : undefined}
            onLongPress={onMessageLongPress}
          />
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
