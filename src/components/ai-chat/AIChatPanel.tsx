'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AIChatMessage, type AIMessage } from './AIChatMessage';
import { AIChatInput } from './AIChatInput';
import { ModelSelector, ModelBadge } from './ModelSelector';
import { Loader2, Bot, ArrowLeft, Key, Gift, AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';
import Button from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';

interface AIAssistant {
  id: string;
  title: string;
  avatar_url?: string | null;
  pricing_model?: string;
  price_per_message?: number;
  price_per_1k_tokens?: number;
  welcome_message?: string | null;
  free_messages_per_day?: number | null;
  model_preference?: string | null;
}

interface UserStatus {
  hasByok: boolean;
  usedFreeMessage?: boolean;
  freeMessagesRemaining: number;
  freeMessagesPerDay: number;
}

interface Conversation {
  id: string;
  title?: string | null;
  total_messages: number;
  total_cost_btc: number;
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
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load conversation, messages, and user status
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setIsLoading(true);

        // Fetch conversation and user API key status in parallel
        const [convResponse, keysResponse] = await Promise.all([
          fetch(`/api/ai-assistants/${assistantId}/conversations/${conversationId}`),
          fetch('/api/user/api-keys'),
        ]);

        if (!convResponse.ok) {
          throw new Error('Failed to load conversation');
        }

        const convData = await convResponse.json();
        if (convData.success) {
          setConversation(convData.data);
          // Filter out system messages for display
          setMessages(convData.data.messages.filter((m: AIMessage) => m.role !== 'system'));

          // Set initial model from assistant preference
          const assistant = convData.data.assistant;
          if (assistant?.model_preference && assistant.model_preference !== 'any') {
            setSelectedModel(assistant.model_preference);
          }
        } else {
          throw new Error(convData.error || 'Failed to load conversation');
        }

        // Get user API key status
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          if (keysData.success) {
            setUserStatus({
              hasByok: keysData.data.hasByok,
              freeMessagesRemaining: keysData.data.platformUsage?.requests_remaining || 0,
              freeMessagesPerDay: keysData.data.platformUsage?.daily_limit || 10,
            });
          }
        }
      } catch (err) {
        logger.error('Error loading conversation', err, 'AI');
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
        setMessages(prev => [...prev, tempUserMessage]);
        scrollToBottom();

        const response = await fetch(
          `/api/ai-assistants/${assistantId}/conversations/${conversationId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              model: selectedModel !== 'auto' ? selectedModel : undefined,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 429) {
            toast.error(
              errorData.details?.message ||
                'Daily limit reached. Add an API key for unlimited usage.'
            );
          }
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();
        if (data.success) {
          // Replace temp message with real one and add assistant response
          setMessages(prev => [
            ...prev.filter(m => m.id !== tempUserMessage.id),
            data.data.userMessage,
            data.data.assistantMessage,
          ]);

          // Update last model used for display
          if (data.data.assistantMessage?.model_used) {
            setLastModelUsed(data.data.assistantMessage.model_used);
          }

          // Update user status from response
          if (data.data.userStatus) {
            setUserStatus(data.data.userStatus);
          }
        } else {
          throw new Error(data.error || 'Failed to send');
        }
      } catch (err) {
        logger.error('Error sending message', err, 'AI');
        if (!(err instanceof Error && err.message.includes('limit'))) {
          toast.error('Failed to send message. Please try again.');
        }
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
        throw err; // Re-throw so input can restore content
      }
    },
    [assistantId, conversationId, scrollToBottom, selectedModel]
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
        <Button onClick={() => window.location.reload()} variant="outline">
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
          <div className="flex items-center gap-2 mt-0.5">
            {lastModelUsed && <ModelBadge modelId={lastModelUsed} />}
            {conversation?.title && (
              <span className="text-sm text-gray-500 truncate">{conversation.title}</span>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {userStatus?.hasByok ? (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <Key className="h-3 w-3 mr-1" />
              BYOK
            </Badge>
          ) : (
            userStatus && (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                <Gift className="h-3 w-3 mr-1" />
                {userStatus.freeMessagesRemaining}/{userStatus.freeMessagesPerDay} free
              </Badge>
            )
          )}
        </div>

        {/* Model selector - only for BYOK users */}
        {userStatus?.hasByok && (
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            size="sm"
            showPricing={true}
          />
        )}
      </div>

      {/* Low messages warning */}
      {userStatus &&
        !userStatus.hasByok &&
        userStatus.freeMessagesRemaining <= 2 &&
        userStatus.freeMessagesRemaining > 0 && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4" />
            <span>
              Only {userStatus.freeMessagesRemaining} free message
              {userStatus.freeMessagesRemaining !== 1 ? 's' : ''} remaining today.
            </span>
            <Link
              href="/dashboard/settings"
              className="text-amber-800 underline hover:no-underline"
            >
              Add API key
            </Link>
          </div>
        )}

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
              {assistant?.welcome_message ? assistant.title : 'Start a conversation'}
            </h3>
            <p className="text-gray-600 max-w-md whitespace-pre-wrap">
              {assistant?.welcome_message ||
                `Send a message to begin chatting with ${assistant?.title || 'this assistant'}.`}
            </p>
            {!userStatus?.hasByok && (
              <p className="text-sm text-gray-400 mt-4">
                Using free tier • {userStatus?.freeMessagesRemaining || 0} messages remaining today
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map(message => (
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
