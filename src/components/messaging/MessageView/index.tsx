'use client';

import { logger } from '@/utils/logger';

/**
 * Message View Component
 *
 * Displays a conversation with messages, header, and composer.
 * Refactored to use smaller, focused components.
 *
 * @module messaging/MessageView
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/features/messaging/hooks/useMessages';
import { useMessageSubscription } from '@/hooks/useMessageSubscription';
import { TIMING } from '@/features/messaging/lib/constants';
import { DATABASE_TABLES } from '@/config/database-tables';
import supabase from '@/lib/supabase/browser';
import MessageHeader from './MessageHeader';
import MessageList from './MessageList';
import MessageComposer from '../MessageComposer';
import { MessageContextMenu } from '@/components/messaging';
import { ConnectionStatusIndicator } from '../ConnectionStatusIndicator';
import type { Message } from '@/features/messaging/types';

interface MessageViewProps {
  conversationId: string;
  onBack: (reason?: 'forbidden' | 'not_found' | 'unknown' | 'network') => void;
}

export default function MessageView({ conversationId, onBack }: MessageViewProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [menuState, setMenuState] = useState<{
    open: boolean;
    position: { x: number; y: number };
    message: Message | null;
  }>({ open: false, position: { x: 0, y: 0 }, message: null });

  // Use the messages hook for all data fetching
  const {
    messages,
    conversation,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    addOptimisticMessage,
    confirmMessage,
    removeMessage,
    handleNewMessage,
    markAsRead,
    refreshReadReceipts,
  } = useMessages(conversationId, {
    enabled: !!conversationId && !!currentUserId,
    userId: currentUserId,
  });

  // Real-time subscription
  useMessageSubscription(conversationId, {
    enabled: !!conversationId && !!currentUserId,
    onReadReceiptUpdate: refreshReadReceipts,
    onOwnMessage: async messageId => {
      // Fetch the confirmed message
      try {
        const { data: newMessage } = await supabase
          .from(DATABASE_TABLES.MESSAGE_DETAILS)
          .select('*')
          .eq('id', messageId)
          .single();

        if (newMessage) {
          // Find and replace optimistic message
          const tempMessages = messages.filter((m: Message) => m.id.startsWith('temp-'));
          if (tempMessages.length > 0) {
            confirmMessage(tempMessages[tempMessages.length - 1].id, newMessage as Message);
          }
          setShouldAutoScroll(true);
          setTimeout(() => refreshReadReceipts(), TIMING.READ_RECEIPT_RECALC_DELAY_MS);
        }
      } catch {
        // Realtime will handle it
      }
    },
    onNewMessage: async message => {
      logger.info('[MessageView] Received new message via real-time:', {
        id: message.id,
        senderId: message.sender_id,
        currentUserId,
        content: message.content?.substring(0, 50),
      });
      handleNewMessage(message);
      setShouldAutoScroll(true);

      // Mark as read if from someone else
      if (message.sender_id !== currentUserId) {
        setTimeout(() => markAsRead(), TIMING.MARK_READ_DEBOUNCE_MS);
      }
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldAutoScroll(false);
    }
  }, [messages, shouldAutoScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!isLoading && messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [isLoading, messages.length]);

  // Handle message sent from composer
  const handleMessageSent = useCallback(
    (message: Message) => {
      addOptimisticMessage(message);
      setShouldAutoScroll(true);
    },
    [addOptimisticMessage]
  );

  // Handle message confirmed from composer
  const handleMessageConfirmed = useCallback(
    (tempId: string, realMessage: Message) => {
      confirmMessage(tempId, realMessage);
      setShouldAutoScroll(true);
      setTimeout(() => refreshReadReceipts(), TIMING.READ_RECEIPT_RECALC_DELAY_MS);
    },
    [confirmMessage, refreshReadReceipts]
  );

  // Handle message failed
  const handleMessageFailed = useCallback(
    (tempId: string, errorMessage?: string) => {
      removeMessage(tempId);
      if (errorMessage) {
        toast.error('Failed to send message', { description: errorMessage });
      }
    },
    [removeMessage]
  );

  // Context menu handlers
  const handleMessageLongPress = useCallback(
    (message: Message, position?: { x: number; y: number }) => {
      setMenuState({
        open: true,
        position: position || { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        message,
      });
    },
    []
  );

  const closeMenu = useCallback(() => setMenuState(s => ({ ...s, open: false })), []);

  const handleEdit = useCallback(async () => {
    const msg = menuState.message;
    if (!msg) {
      return;
    }
    const existing = msg.content || '';
    // Simple prompt-based edit for now
    const updated = window.prompt('Edit message:', existing);
    if (!updated || updated.trim() === existing) {
      return closeMenu();
    }
    try {
      const res = await fetch(`/api/messages/edit/${encodeURIComponent(msg.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ content: updated.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as Record<string, unknown>);
        toast.error(data.error || 'Failed to edit message');
      } else {
        // Fetch updated message and apply
        const { data: full } = await supabase
          .from(DATABASE_TABLES.MESSAGE_DETAILS)
          .select('*')
          .eq('id', msg.id)
          .single();
        if (full) {
          handleNewMessage(full as Message);
        }
      }
    } catch {
      toast.error('Network error while editing');
    } finally {
      closeMenu();
    }
  }, [menuState.message, handleNewMessage, closeMenu]);

  const handleDelete = useCallback(async () => {
    const msg = menuState.message;
    if (!msg) {
      return;
    }
    try {
      const res = await fetch('/api/messages/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ conversationId, ids: [msg.id] }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as Record<string, unknown>);
        toast.error(data.error || 'Failed to delete message');
      } else {
        removeMessage(msg.id);
      }
    } catch {
      toast.error('Network error while deleting');
    } finally {
      closeMenu();
    }
  }, [menuState.message, conversationId, removeMessage, closeMenu]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {error === 'forbidden'
              ? 'Access Denied'
              : error === 'not_found'
                ? 'Conversation Not Found'
                : 'Error Loading Messages'}
          </h3>
          <p className="text-gray-600 mb-4">
            {error === 'forbidden'
              ? "You don't have access to this conversation"
              : error === 'not_found'
                ? 'This conversation may have been deleted'
                : 'Please try again'}
          </p>
          <Button onClick={() => onBack(error)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // No conversation state
  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversation selected</h3>
          <p className="text-gray-600">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <MessageHeader
        conversation={conversation}
        currentUserId={currentUserId}
        onBack={() => onBack()}
      />

      {/* Connection Status Indicator */}
      <div className="px-4 pt-2">
        <ConnectionStatusIndicator />
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        hasMore={pagination?.hasMore || false}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onMessageLongPress={handleMessageLongPress}
        messagesEndRef={messagesEndRef}
      />

      {/* Composer */}
      <MessageComposer
        conversationId={conversationId}
        onMessageSent={handleMessageSent}
        onMessageConfirmed={handleMessageConfirmed}
        onMessageFailed={handleMessageFailed}
      />

      {/* Context menu for message actions */}
      <MessageContextMenu
        isOpen={menuState.open}
        position={menuState.position}
        onClose={closeMenu}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={
          !!menuState.message &&
          menuState.message.sender_id === currentUserId &&
          !menuState.message.is_deleted
        }
        canDelete={
          !!menuState.message &&
          menuState.message.sender_id === currentUserId &&
          !menuState.message.is_deleted
        }
      />
    </div>
  );
}
