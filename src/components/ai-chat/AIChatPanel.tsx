'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AIChatMessage, type AIMessage } from './AIChatMessage';
import { AIChatInput } from './AIChatInput';
import { Loader2, Bot, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import Link from 'next/link';

interface AIAssistant {
  id: string;
  title: string;
  avatar_url?: string | null;
  pricing_model?: string;
  price_per_message?: number;
  price_per_1k_tokens?: number;
}

interface Conversation {
  id: string;
  title?: string | null;
  total_messages: number;
  total_cost_sats: number;
  messages: AIMessage[];
  assistant?: AIAssistant;
}

interface AIChatPanelProps {
  assistantId: string;
  conversationId: string;
  userAvatar?: string | null;
  userName?: string;
}

export function AIChatPanel({
  assistantId,
  conversationId,
  userAvatar,
  userName = 'You',
}: AIChatPanelProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversation and messages
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/ai-assistants/${assistantId}/conversations/${conversationId}`
        );

        if (!response.ok) {
          throw new Error('Failed to load conversation');
        }

        const data = await response.json();
        if (data.success) {
          setConversation(data.data);
          // Filter out system messages for display
          setMessages(
            data.data.messages.filter((m: AIMessage) => m.role !== 'system')
          );
        } else {
          throw new Error(data.error || 'Failed to load conversation');
        }
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [assistantId, conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        // Optimistically add user message
        const tempUserMessage: AIMessage = {
          id: `temp-${Date.now()}`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMessage]);
        scrollToBottom();

        const response = await fetch(
          `/api/ai-assistants/${assistantId}/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();
        if (data.success) {
          // Replace temp message with real one and add assistant response
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempUserMessage.id),
            data.data.userMessage,
            data.data.assistantMessage,
          ]);
        } else {
          throw new Error(data.error || 'Failed to send');
        }
      } catch (err) {
        console.error('Error sending message:', err);
        toast.error('Failed to send message. Please try again.');
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((m) => !m.id.startsWith('temp-'))
        );
        throw err; // Re-throw so input can restore content
      }
    },
    [assistantId, conversationId, scrollToBottom]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  const assistant = conversation?.assistant;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <Link
          href={`/dashboard/ai-assistants`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>

        <Avatar className="h-10 w-10">
          <AvatarImage src={assistant?.avatar_url || undefined} />
          <AvatarFallback className="bg-purple-100 text-purple-600">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">
            {assistant?.title || 'AI Assistant'}
          </h2>
          {conversation?.title && (
            <p className="text-sm text-gray-500 truncate">
              {conversation.title}
            </p>
          )}
        </div>

        {conversation && conversation.total_cost_sats > 0 && (
          <div className="text-sm text-gray-500">
            Total: {conversation.total_cost_sats.toLocaleString()} sats
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Avatar className="h-16 w-16 mb-4">
              <AvatarImage src={assistant?.avatar_url || undefined} />
              <AvatarFallback className="bg-purple-100 text-purple-600">
                <Bot className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 max-w-md">
              Send a message to begin chatting with {assistant?.title || 'this assistant'}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((message) => (
              <AIChatMessage
                key={message.id}
                message={message}
                assistantAvatar={assistant?.avatar_url}
                assistantName={assistant?.title}
                userAvatar={userAvatar}
                userName={userName}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <AIChatInput
        onSend={handleSendMessage}
        placeholder={`Message ${assistant?.title || 'assistant'}...`}
      />
    </div>
  );
}
