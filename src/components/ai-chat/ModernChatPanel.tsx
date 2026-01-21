'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { readEventStream } from '@/lib/sse';
import { getFreeModels, getModelMetadata, AI_MODEL_REGISTRY } from '@/config/ai-models';
import {
  Send,
  Loader2,
  Cat,
  User,
  Sparkles,
  ChevronDown,
  Check,
  Settings2,
  Trash2,
  AlertCircle,
  Key,
} from 'lucide-react';

// ==================== TYPES ====================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modelUsed?: string;
}

interface UserStatus {
  hasByok: boolean;
  freeMessagesPerDay: number;
  freeMessagesRemaining: number;
}

// ==================== MODEL SELECTOR ====================

function ModelSelector({
  selectedModel,
  onSelect,
  disabled,
}: {
  selectedModel: string;
  onSelect: (model: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get free models for the selector
  const freeModels = getFreeModels();
  const selectedMeta = getModelMetadata(selectedModel);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName =
    selectedModel === 'auto' ? 'Auto (Best Free)' : selectedMeta?.name || selectedModel;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm',
          'bg-gray-100 hover:bg-gray-200 transition-colors',
          'border border-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Sparkles className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-gray-700 max-w-[120px] truncate">{displayName}</span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
          {/* Auto option */}
          <button
            onClick={() => {
              onSelect('auto');
              setIsOpen(false);
            }}
            className={cn(
              'w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3',
              selectedModel === 'auto' && 'bg-orange-50'
            )}
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900 flex items-center gap-2">
                Auto (Best Free)
                {selectedModel === 'auto' && <Check className="h-4 w-4 text-orange-500" />}
              </div>
              <div className="text-xs text-gray-500">Automatically selects the best model</div>
            </div>
          </button>

          <div className="h-px bg-gray-100 my-1" />

          {/* Free models */}
          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase">Free Models</div>
          {freeModels.map(model => (
            <button
              key={model.id}
              onClick={() => {
                onSelect(model.id);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3',
                selectedModel === model.id && 'bg-orange-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 flex items-center gap-2 truncate">
                  {model.name}
                  {selectedModel === model.id && (
                    <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {model.provider} • {model.rateLimit}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== MESSAGE BUBBLE ====================

function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn('flex gap-3 max-w-3xl mx-auto px-4', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-gray-200' : 'bg-gradient-to-br from-orange-400 to-orange-500'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-gray-600" />
        ) : (
          <Cat className="h-4 w-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2.5 max-w-full',
            isUser
              ? 'bg-orange-500 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          )}
        >
          <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {message.content}
            {isLast && !isUser && !message.content && (
              <span className="inline-flex items-center gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </span>
            )}
          </div>
        </div>
        {/* Model used indicator */}
        {!isUser && message.modelUsed && message.content && (
          <div className="text-xs text-gray-400 mt-1">
            {AI_MODEL_REGISTRY[message.modelUsed]?.name || message.modelUsed}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== EMPTY STATE ====================

interface EmptyStateProps {
  suggestions: string[];
  hasContext: boolean;
  isLoadingSuggestions: boolean;
  onSuggestionClick: (suggestion: string) => void;
}

function EmptyState({
  suggestions,
  hasContext,
  isLoadingSuggestions,
  onSuggestionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-6 shadow-lg">
        <Cat className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hi, I'm your Cat</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        {hasContext ? (
          <>
            I know about your goals and context. Ask me anything — I'll give you personalized
            advice.
          </>
        ) : (
          <>
            I'm here to help with your projects, products, and ideas. Ask me anything —
            conversations are private and not saved.
          </>
        )}
      </p>
      {hasContext && (
        <p className="text-xs text-tiffany-600 mb-4 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Personalized suggestions based on your context
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {isLoadingSuggestions ? (
          // Loading skeleton for suggestions
          <>
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-9 bg-gray-100 rounded-full animate-pulse"
                style={{ width: `${100 + Math.random() * 80}px` }}
              />
            ))}
          </>
        ) : (
          suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(suggestion)}
              className={cn(
                'px-4 py-2 rounded-full text-sm transition-colors text-left',
                hasContext
                  ? 'bg-tiffany-50 hover:bg-tiffany-100 text-tiffany-700 border border-tiffany-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              )}
            >
              {suggestion}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

// Default suggestions as fallback
const DEFAULT_SUGGESTIONS = [
  'Help me write a product description',
  'Explain Bitcoin Lightning Network',
  'Give me ideas for my crowdfunding project',
  'How can I improve my service offering?',
];

export function ModernChatPanel() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  // Context-aware suggestions state
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [hasContext, setHasContext] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch context-aware suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('/api/cat/suggestions');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data.suggestions) {
            setSuggestions(data.data.suggestions);
            setHasContext(data.data.hasContext || false);
          }
        }
      } catch (e) {
        // Keep default suggestions on error
        console.error('Failed to fetch suggestions:', e);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    void fetchSuggestions();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = 'auto';
    // Set height to scrollHeight, max 200px
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || isLoading) {
      return;
    }

    setError(null);
    setInput('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

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

      await readEventStream(res.body, (json: unknown) => {
        const event = json as { content?: string; done?: boolean; usage?: unknown; model?: string };
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
      });

      // Update with final model used
      setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, modelUsed } : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedModel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Handle suggestion click - directly send the message
  const sendSuggestion = useCallback(
    async (suggestion: string) => {
      if (isLoading) {
        return;
      }

      setError(null);
      setInput('');

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: suggestion,
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
            message: suggestion,
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

        await readEventStream(res.body, (json: unknown) => {
          const event = json as {
            content?: string;
            done?: boolean;
            usage?: unknown;
            model?: string;
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
        });

        // Update with final model used
        setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, modelUsed } : m)));
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

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] sm:h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
            <Cat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">My Cat</h1>
            <p className="text-xs text-gray-500">Private • Not saved</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
            disabled={isLoading}
          />

          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => router.push('/settings/ai')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="AI Settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <EmptyState
            suggestions={suggestions}
            hasContext={hasContext}
            isLoadingSuggestions={isLoadingSuggestions}
            onSuggestionClick={sendSuggestion}
          />
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id} message={msg} isLast={i === messages.length - 1} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700">{error}</p>
              {(error.includes('API key') ||
                error.includes('openrouter') ||
                error.includes('not configured')) && (
                <button
                  onClick={() => router.push('/settings/ai')}
                  className="text-xs text-red-600 hover:text-red-800 mt-1 flex items-center gap-1"
                >
                  <Key className="h-3 w-3" />
                  Configure API Key
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Message your Cat..."
              disabled={isLoading}
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 pr-12',
                'focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300',
                'text-[15px] leading-relaxed placeholder:text-gray-400',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'max-h-[200px]'
              )}
            />
          </div>
          <button
            onClick={() => void sendMessage()}
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all',
              input.trim() && !isLoading
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Using free AI models • No API key required
        </p>
      </div>
    </div>
  );
}

export default ModernChatPanel;
