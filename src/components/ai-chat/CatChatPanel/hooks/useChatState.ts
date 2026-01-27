/**
 * USE CHAT STATE HOOK
 * Manages chat messages and sending logic
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { readEventStream } from '@/lib/sse';
import { OPENROUTER_KEY_HEADER } from '@/config/http-headers';
import type { ChatMessage } from '../types';

interface UseChatStateOptions {
  selectedModel: string;
  localEnabled: boolean;
  localProvider: 'ollama' | 'openai_compatible';
  localBaseUrl: string;
  localModel: string;
  useClientKey: boolean;
  clientKey: string;
}

export function useChatState({
  selectedModel,
  localEnabled,
  localProvider,
  localBaseUrl,
  localModel,
  useClientKey,
  clientKey,
}: UseChatStateOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    setLastModelUsed(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) {
        return;
      }

      setError(null);

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const tempAssistantId = `a-${Date.now()}`;
        setMessages(prev => [
          ...prev,
          {
            id: tempAssistantId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          },
        ]);

        if (localEnabled) {
          // Local provider path
          if (localProvider === 'ollama') {
            const res = await fetch(`${localBaseUrl.replace(/\/$/, '')}/api/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: localModel,
                stream: true,
                messages: [
                  ...messages.map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content },
                ],
              }),
            });
            if (!res.ok || !res.body) {
              let msg = 'Local model error';
              try {
                const data = await res.json();
                msg = data?.error || msg;
              } catch {}
              throw new Error(msg);
            }
            await readEventStream(res.body, (evt: any) => {
              const chunk = evt?.message?.content || '';
              if (chunk) {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === tempAssistantId ? { ...m, content: (m.content || '') + chunk } : m
                  )
                );
              }
            });
            setLastModelUsed(localModel);
          } else {
            // OpenAI-compatible (LM Studio)
            const res = await fetch(`${localBaseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: 'Bearer lm-studio' },
              body: JSON.stringify({
                model: localModel,
                messages: [
                  ...messages.map(m => ({ role: m.role, content: m.content })),
                  { role: 'user', content },
                ],
                stream: true,
                temperature: 0.7,
              }),
            });
            if (!res.ok || !res.body) {
              let msg = 'Local model error';
              try {
                const data = await res.json();
                msg = data?.error?.message || msg;
              } catch {}
              throw new Error(msg);
            }
            await readEventStream(res.body, (evt: any) => {
              const delta = evt?.choices?.[0]?.delta?.content || '';
              if (delta) {
                setMessages(prev =>
                  prev.map(m =>
                    m.id === tempAssistantId ? { ...m, content: (m.content || '') + delta } : m
                  )
                );
              }
            });
            setLastModelUsed(localModel);
          }
        } else {
          // Server-side OpenRouter path
          const res = await fetch('/api/cat/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(useClientKey && clientKey ? { [OPENROUTER_KEY_HEADER]: clientKey } : {}),
            },
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

          await readEventStream(res.body, (json: any) => {
            if (json?.content) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantId ? { ...m, content: (m.content || '') + json.content } : m
                )
              );
            }
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
        setMessages(prev => prev.filter(m => !m.id.startsWith('u-')));
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      messages,
      localEnabled,
      localProvider,
      localBaseUrl,
      localModel,
      selectedModel,
      useClientKey,
      clientKey,
    ]
  );

  return {
    messages,
    isLoading,
    error,
    setError,
    lastModelUsed,
    endRef,
    clearChat,
    sendMessage,
  };
}
