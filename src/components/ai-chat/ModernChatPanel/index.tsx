'use client';

/**
 * MODERN CHAT PANEL (REFACTORED)
 *
 * Modular chat component for AI conversations.
 * Split into smaller subcomponents and hooks for maintainability.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

import { useChatMessages, useSuggestions, usePendingActionsManager } from './hooks';
import { ChatHeader, ChatInput, EmptyState, ErrorDisplay, MessageBubble } from './components';
import { PendingActionsCard } from '../PendingActionsCard';
import type { CatAction } from './types';

interface ModernChatPanelProps {
  /**
   * If provided, this message is automatically sent as the user's first message
   * once chat history finishes loading and the conversation is empty.
   * Used by onboarding to pre-seed the Cat with the user's description.
   */
  initialMessage?: string;
}

export function ModernChatPanel({ initialMessage }: ModernChatPanelProps = {}) {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const lastUserMessageRef = useRef<string>('');
  // Ensures the initial message is only auto-sent once per mount
  const initialMessageSentRef = useRef(false);

  // Callback ref for refreshing pending actions — avoids circular hook dependency
  const refreshPendingActionsRef = useRef<(() => Promise<void>) | undefined>(undefined);

  // Chat messages hook
  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    messagesEndRef,
    sendMessage,
    stopGeneration,
    clearChat,
    setError,
    addSystemMessage,
  } = useChatMessages({
    selectedModel,
    onPendingResult: () => refreshPendingActionsRef.current?.(),
  });

  // Suggestions hook
  const { suggestions, hasContext, isLoadingSuggestions } = useSuggestions();

  // Pending actions hook
  const { pendingActions, handleConfirmAction, handleRejectAction, refreshPendingActions } = usePendingActionsManager({
    onActionConfirmed: action => {
      addSystemMessage(`✅ Action completed: ${action.description}`);
    },
  });

  // Keep ref in sync so sendMessage always calls the latest refresh function
  refreshPendingActionsRef.current = refreshPendingActions;

  // Auto-send initialMessage once history has loaded and the conversation is empty
  useEffect(() => {
    if (
      initialMessage &&
      !isLoadingHistory &&
      messages.length === 0 &&
      !isLoading &&
      !initialMessageSentRef.current
    ) {
      initialMessageSentRef.current = true;
      void sendMessage(initialMessage);
    }
  }, [initialMessage, isLoadingHistory, messages.length, isLoading, sendMessage]);

  // Handle send
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (content) {
      lastUserMessageRef.current = content;
      setInput('');
      void sendMessage(content);
    }
  }, [input, sendMessage]);

  // Handle retry last message
  const handleRetry = useCallback(() => {
    if (lastUserMessageRef.current) {
      setError(null);
      void sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage, setError]);

  // Handle dismiss error
  const handleDismissError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Handle suggestion click - directly send the message
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      void sendMessage(suggestion);
    },
    [sendMessage]
  );

  // Handle action button clicks - navigate to prefilled entity or wallet creation
  const handleActionClick = useCallback(
    (action: CatAction) => {
      if (action.type === 'create_entity') {
        const entityMeta = ENTITY_REGISTRY[action.entityType];
        if (entityMeta?.createPath) {
          const prefillParams = new URLSearchParams();
          // Forward all prefill fields as URL params
          Object.entries(action.prefill).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
              prefillParams.set(key, String(value));
            }
          });

          const url = `${entityMeta.createPath}?${prefillParams.toString()}`;
          router.push(url);
        }
      } else if (action.type === 'update_entity' || action.type === 'publish_entity') {
        const entityMeta = ENTITY_REGISTRY[action.entityType];
        if (entityMeta?.basePath) {
          router.push(`${entityMeta.basePath}/${action.entityId}/edit`);
        }
      } else if (action.type === 'suggest_wallet') {
        const walletMeta = ENTITY_REGISTRY.wallet;
        const prefillParams = new URLSearchParams();
        Object.entries(action.prefill).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            prefillParams.set(key, String(value));
          }
        });

        const url = `${walletMeta.basePath}?${prefillParams.toString()}`;
        router.push(url);
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
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-400">Loading conversation...</div>
          </div>
        ) : messages.length === 0 ? (
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
      {error && <ErrorDisplay error={error} onRetry={handleRetry} onDismiss={handleDismissError} />}

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        isLoading={isLoading}
        onStop={stopGeneration}
      />
    </div>
  );
}

export default ModernChatPanel;
