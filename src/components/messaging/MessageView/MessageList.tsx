'use client';

/**
 * Message List Component
 *
 * Scrollable list of messages with date dividers and load more functionality.
 * Preserves scroll position when loading older messages.
 *
 * @module messaging/MessageView/MessageList
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { ChevronUp, Loader2, MessageSquare } from 'lucide-react';
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
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
  editingMessageId?: string | null;
  onEditSave?: (messageId: string, newContent: string) => void;
  onEditCancel?: () => void;
}

export default function MessageList({
  messages,
  currentUserId,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onMessageLongPress,
  messagesEndRef,
  editingMessageId,
  onEditSave,
  onEditCancel,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [previousScrollHeight, setPreviousScrollHeight] = useState<number | null>(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  /**
   * Handle load more with scroll position preservation
   */
  const handleLoadMore = useCallback(() => {
    if (containerRef.current) {
      // Save current scroll height before loading more
      setPreviousScrollHeight(containerRef.current.scrollHeight);
      setPreviousMessageCount(messages.length);
    }
    onLoadMore();
  }, [onLoadMore, messages.length]);

  /**
   * Restore scroll position after older messages are prepended
   */
  useEffect(() => {
    if (
      previousScrollHeight !== null &&
      containerRef.current &&
      messages.length > previousMessageCount &&
      !isLoadingMore
    ) {
      // Calculate the difference in scroll height
      const newScrollHeight = containerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - previousScrollHeight;

      // Adjust scroll position to maintain visual position
      if (scrollDiff > 0) {
        containerRef.current.scrollTop += scrollDiff;
      }

      // Reset saved values
      setPreviousScrollHeight(null);
      setPreviousMessageCount(messages.length);
    }
  }, [messages.length, previousScrollHeight, previousMessageCount, isLoadingMore]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="text-fg-secondary hover:text-fg-primary"
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

      {/* Empty state — new/empty conversation (no blank screen) */}
      {messages.length === 0 && !hasMore && (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-fg-tertiary" />
          <p className="text-sm font-medium text-fg-primary">No messages yet</p>
          <p className="text-sm text-fg-secondary">Say hello to start the conversation.</p>
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showDivider = shouldShowDateDivider(message, prevMessage);
        const isCurrentUser = message.sender_id === currentUserId;

        return (
          <MessageItem
            key={message.id}
            message={message}
            isCurrentUser={isCurrentUser}
            showDateDivider={showDivider}
            dateDividerText={showDivider ? getDateDividerText(message.created_at) : undefined}
            onLongPress={onMessageLongPress}
            isEditing={editingMessageId === message.id}
            onEditSave={onEditSave ? content => onEditSave(message.id, content) : undefined}
            onEditCancel={onEditCancel}
          />
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
