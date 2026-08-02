'use client';

import React from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import MessageHeader from './MessageHeader';
import MessageList from './MessageList';
import MessageComposer from '../MessageComposer';
import { MessageContextMenu } from '@/components/messaging';
import { ConnectionStatusIndicator } from '../ConnectionStatusIndicator';
import { useMessageView } from './useMessageView';

interface MessageViewProps {
  conversationId: string;
  onBack: (reason?: 'forbidden' | 'not_found' | 'unknown' | 'network') => void;
}

export default function MessageView({ conversationId, onBack }: MessageViewProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;

  const {
    messages,
    conversation,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    retry,
    menuState,
    editingMessageId,
    messagesEndRef,
    handleMessageSent,
    handleMessageConfirmed,
    handleMessageFailed,
    handleMessageLongPress,
    closeMenu,
    handleEdit,
    handleEditSave,
    handleEditCancel,
    handleDelete,
  } = useMessageView(conversationId, currentUserId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-fg-tertiary" />
      </div>
    );
  }

  if (error) {
    // forbidden/not_found are terminal — retrying can't help; network/unknown can.
    const isRetryable = error === 'network' || error === 'unknown';
    return (
      <div className="flex items-center justify-center h-full p-4">
        {isRetryable ? (
          <div className="oc-error-surface max-w-md text-center">
            <h3 className="text-base font-semibold mb-1">Couldn&apos;t load messages</h3>
            <p className="text-sm mb-4">Check your connection and try again.</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => retry()}>
                Retry
              </Button>
              <Button variant="ghost" onClick={() => onBack(error)}>
                Go Back
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-fg-primary mb-2">
              {error === 'forbidden' ? 'Access Denied' : 'Conversation Not Found'}
            </h3>
            <p className="text-fg-secondary mb-4">
              {error === 'forbidden'
                ? "You don't have access to this conversation"
                : 'This conversation may have been deleted'}
            </p>
            <Button onClick={() => onBack(error)}>Go Back</Button>
          </div>
        )}
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-fg-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-fg-primary mb-2">No conversation selected</h3>
          <p className="text-fg-secondary">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-base">
      <MessageHeader
        conversation={conversation}
        currentUserId={currentUserId}
        onBack={() => onBack()}
      />

      <div className="px-4 pt-2">
        <ConnectionStatusIndicator />
      </div>

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        hasMore={pagination?.hasMore || false}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onMessageLongPress={handleMessageLongPress}
        messagesEndRef={messagesEndRef}
        editingMessageId={editingMessageId}
        onEditSave={handleEditSave}
        onEditCancel={handleEditCancel}
      />

      <MessageComposer
        conversationId={conversationId}
        onMessageSent={handleMessageSent}
        onMessageConfirmed={handleMessageConfirmed}
        onMessageFailed={handleMessageFailed}
      />

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
