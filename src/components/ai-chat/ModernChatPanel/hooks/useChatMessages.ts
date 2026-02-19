/**
 * USE CHAT MESSAGES HOOK
 * Manages chat messages, sending, and streaming
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { readEventStream } from '@/lib/sse';
import type { Message, CatAction } from '../types';

interface UseChatMessagesOptions {
  selectedModel: string;
}

export function useChatMessages({ selectedModel }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) {
        return;
      }

      setError(null);

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      // Add placeholder assistant message
      const assistantId = `assistant-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ]);

      try {
        const res = await fetch('/api/cat/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            model: selectedModel !== 'auto' ? selectedModel : undefined,
            stream: true,
          }),
        });

        if (!res.ok || !res.body) {
          let msg = 'Failed to get response';
          try {
            const data = await res.json();
            msg = data?.details?.message || data?.error || msg;
          } catch {}
          throw new Error(msg);
        }

        let modelUsed = selectedModel;
        let actions: CatAction[] | undefined;

        await readEventStream(res.body, (json: unknown) => {
          const event = json as {
            content?: string;
            done?: boolean;
            usage?: unknown;
            model?: string;
            actions?: CatAction[];
          };
          if (event?.content) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId ? { ...m, content: (m.content || '') + event.content } : m
              )
            );
          }
          if (event?.model) {
            modelUsed = event.model;
          }
          if (event?.actions) {
            actions = event.actions;
          }
        });

        // Update with final model used and actions
        setMessages(prev =>
          prev.map(m => (m.id === assistantId ? { ...m, modelUsed, actions } : m))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
        // Remove the empty assistant message on error
        setMessages(prev => prev.filter(m => m.id !== assistantId));
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, selectedModel]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `system-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    messagesEndRef,
    sendMessage,
    clearChat,
    addSystemMessage,
  };
}
