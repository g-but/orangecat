'use client';

import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  edited_at: string | null;
  sender: {
    id: string;
    username: string;
    name: string;
    avatar_url: string;
  };
  is_read: boolean;
  status?: 'pending' | 'failed';
}

interface MessageComposerProps {
  conversationId: string;
  onMessageSent: (message: Message) => void;
  onMessageFailed?: (tempId: string, errorMessage?: string) => void;
  onMessageConfirmed?: (tempId: string, realMessage: Message) => void;
}

export default function MessageComposer({ conversationId, onMessageSent, onMessageFailed, onMessageConfirmed }: MessageComposerProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSending || !user) {
      return;
    }

    const messageContent = content.trim();
    setIsSending(true);

    // Create optimistic message for immediate UI feedback
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: messageContent,
      message_type: 'text',
      metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      edited_at: null,
      sender: {
        id: user.id,
        username: profile?.username || 'you',
        name: profile?.name || 'You',
        avatar_url: profile?.avatar_url || '',
      },
      is_read: true,
      status: 'pending',
    };

    // Optimistically show the message immediately
    onMessageSent(optimisticMessage);
    setContent('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          messageType: 'text',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        const desc = errorData.details || '';
        toast.error(errorData.error || 'Failed to send message', {
          description: typeof desc === 'string' ? desc : undefined,
        });
        onMessageFailed?.(tempId, errorData.error || desc);
      } else {
        // Try to replace optimistic message immediately in case realtime isn't available
        const data = await response.json().catch(() => null as any);
        if (data?.message) {
          onMessageConfirmed?.(tempId, data.message as Message);
        }
      }
      // Note: Real message will arrive via real-time subscription,
      // but the optimistic one provides instant feedback
    } catch {
      toast.error('Network error. Please try again.');
      onMessageFailed?.(tempId, 'Network error');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-6">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Attachment button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="p-2 text-gray-400 hover:text-gray-600"
          disabled={isSending}
        >
          <Paperclip className="w-5 h-5" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className={cn(
              'w-full px-4 py-3 border border-gray-200 rounded-lg resize-none',
              'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
              'max-h-32 min-h-[44px]',
              isSending && 'opacity-50 cursor-not-allowed'
            )}
            rows={1}
            disabled={isSending}
          />

          {/* Emoji button (positioned absolutely) */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-gray-600"
            disabled={isSending}
          >
            <Smile className="w-4 h-4" />
          </Button>
        </div>

        {/* Send button */}
        <Button
          type="submit"
          size="sm"
          className={cn(
            'px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-colors duration-200'
          )}
          disabled={!content.trim() || isSending}
        >
          {isSending ? (
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </form>

      {/* Typing indicator (placeholder for future feature) */}
      <div className="mt-2 text-xs text-gray-500 opacity-0">
        Someone is typing...
      </div>
    </div>
  );
}
