/**
 * USE CHAT MESSAGES HOOK
 * Manages chat messages, sending, and streaming
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { readEventStream } from '@/lib/sse';
import type { Message, CatAction } from '../types';

const STREAM_TIMEOUT_MS = 60_000;

interface UseChatMessagesOptions {
  selectedModel: string;
}

export function useChatMessages({ selectedModel }: UseChatMessagesOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

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

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const timeout = setTimeout(() => abortController.abort(), STREAM_TIMEOUT_MS);

      try {
        const res = await fetch('/api/cat/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            model: selectedModel !== 'auto' ? selectedModel : undefined,
            stream: true,
          }),
          signal: abortController.signal,
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
            error?: string;
          };
          if (event?.error) {
            throw new Error(event.error);
          }
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
        const isAbort = e instanceof DOMException && e.name === 'AbortError';

        // Check if partial content was streamed
        let hasPartialContent = false;
        setMessages(prev => {
          const assistant = prev.find(m => m.id === assistantId);
          hasPartialContent = !!assistant?.content?.trim();
          return prev;
        });

        if (isAbort && hasPartialContent) {
          // Keep partial content, no error shown
        } else if (isAbort) {
          setError('Response timed out. Try again or rephrase your question.');
          setMessages(prev => prev.filter(m => m.id !== assistantId));
        } else {
          setError(e instanceof Error ? e.message : 'Something went wrong');
          setMessages(prev => prev.filter(m => m.id !== assistantId));
        }
      } finally {
        clearTimeout(timeout);
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    },
    [isLoading, selectedModel]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const setErrorState = useCallback((err: string | null) => {
    setError(err);
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
    stopGeneration,
    clearChat,
    setError: setErrorState,
    addSystemMessage,
  };
}
