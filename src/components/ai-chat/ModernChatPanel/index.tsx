'use client';

/**
 * MODERN CHAT PANEL (REFACTORED)
 *
 * Modular chat component for AI conversations.
 * Split into smaller subcomponents and hooks for maintainability.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

import { useChatMessages, useSuggestions, usePendingActionsManager } from './hooks';
import { ChatHeader, ChatInput, EmptyState, ErrorDisplay, MessageBubble } from './components';
import { PendingActionsCard } from '../PendingActionsCard';
import type { SuggestedAction } from './types';

export function ModernChatPanel() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');

  // Chat messages hook
  const { messages, isLoading, error, messagesEndRef, sendMessage, clearChat, addSystemMessage } =
    useChatMessages({ selectedModel });

  // Suggestions hook
  const { suggestions, hasContext, isLoadingSuggestions } = useSuggestions();

  // Pending actions hook
  const { pendingActions, handleConfirmAction, handleRejectAction } = usePendingActionsManager({
    onActionConfirmed: action => {
      addSystemMessage(`✅ Action completed: ${action.description}`);
    },
  });

  // Handle send
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (content) {
      setInput('');
      void sendMessage(content);
    }
  }, [input, sendMessage]);

  // Handle suggestion click - directly send the message
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      void sendMessage(suggestion);
    },
    [sendMessage]
  );

  // Handle action button clicks - navigate to prefilled entity creation
  const handleActionClick = useCallback(
    (action: SuggestedAction) => {
      if (action.type === 'create_entity') {
        const entityMeta = ENTITY_REGISTRY[action.entityType];
        if (entityMeta?.createPath) {
          // Encode prefill data as URL params
          const prefillParams = new URLSearchParams();
          if (action.prefill.title) {
            prefillParams.set('title', action.prefill.title);
          }
          if (action.prefill.description) {
            prefillParams.set('description', action.prefill.description);
          }
          if (action.prefill.category) {
            prefillParams.set('category', action.prefill.category);
          }
          // Add any other prefill fields
          Object.entries(action.prefill).forEach(([key, value]) => {
            if (!['title', 'description', 'category'].includes(key) && value) {
              prefillParams.set(key, String(value));
            }
          });

          const url = `${entityMeta.createPath}?${prefillParams.toString()}`;
          router.push(url);
        }
      }
    },
    [router]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] sm:h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <ChatHeader
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
        onClearChat={clearChat}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <EmptyState
            suggestions={suggestions}
            hasContext={hasContext}
            isLoadingSuggestions={isLoadingSuggestions}
            onSuggestionClick={handleSuggestionClick}
          />
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLast={i === messages.length - 1 && pendingActions.length === 0}
                onActionClick={handleActionClick}
              />
            ))}

            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <div className="max-w-3xl mx-auto px-4 space-y-3">
                {pendingActions.map(action => (
                  <PendingActionsCard
                    key={action.id}
                    action={action}
                    onConfirm={handleConfirmAction}
                    onReject={handleRejectAction}
                  />
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && <ErrorDisplay error={error} />}

      {/* Input */}
      <ChatInput value={input} onChange={setInput} onSend={handleSend} isLoading={isLoading} />
    </div>
  );
}

export default ModernChatPanel;
