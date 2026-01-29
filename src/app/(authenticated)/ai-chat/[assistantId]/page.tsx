'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Bot, MessageSquare } from 'lucide-react';
import { logger } from '@/utils/logger';
import Button from '@/components/ui/Button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import Link from 'next/link';

interface Conversation {
  id: string;
  title?: string | null;
  status: string;
  total_messages: number;
  created_at: string;
  last_message_at?: string | null;
}

interface Assistant {
  id: string;
  title: string;
  description?: string | null;
  avatar_url?: string | null;
  status: string;
}

export default function AIAssistantChatPage() {
  const params = useParams();
  const router = useRouter();
  const assistantId = params?.assistantId as string | undefined;

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!assistantId) {
      return;
    }

    const loadData = async () => {
      try {
        // Load assistant details
        const assistantRes = await fetch(`/api/ai-assistants/${assistantId}`);
        if (assistantRes.ok) {
          const data = await assistantRes.json();
          setAssistant(data.data || data);
        }

        // Load existing conversations
        const convsRes = await fetch(`/api/ai-assistants/${assistantId}/conversations`);
        if (convsRes.ok) {
          const data = await convsRes.json();
          setConversations(data.data || []);
        }
      } catch (err) {
        logger.error('Error loading data', err, 'AI');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [assistantId]);

  const handleNewConversation = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/ai-assistants/${assistantId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      if (data.success && data.data) {
        router.push(`/ai-chat/${assistantId}/${data.data.id}`);
      } else {
        throw new Error(data.error || 'Failed to create');
      }
    } catch (err) {
      logger.error('Error creating conversation', err, 'AI');
      toast.error('Failed to start conversation');
    } finally {
      setIsCreating(false);
    }
  };

  if (!assistantId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Invalid assistant</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Assistant Info */}
      <div className="flex items-start gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={assistant?.avatar_url || undefined} />
          <AvatarFallback className="bg-purple-100 text-purple-600">
            <Bot className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{assistant?.title || 'AI Assistant'}</h1>
          {assistant?.description && <p className="text-gray-600 mt-1">{assistant.description}</p>}
        </div>
      </div>

      {/* New Conversation Button */}
      <Button
        onClick={handleNewConversation}
        disabled={isCreating || assistant?.status !== 'active'}
        className="w-full mb-8"
        size="lg"
      >
        {isCreating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Starting...
          </>
        ) : (
          <>
            <MessageSquare className="h-5 w-5 mr-2" />
            Start New Conversation
          </>
        )}
      </Button>

      {assistant?.status !== 'active' && (
        <p className="text-amber-600 text-sm mb-4 text-center">
          This assistant is not currently active.
        </p>
      )}

      {/* Previous Conversations */}
      {conversations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Conversations</h2>
          <div className="space-y-2">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/ai-chat/${assistantId}/${conv.id}`}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-sky-300 hover:shadow-sm transition-all"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {conv.title || 'Untitled conversation'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {conv.total_messages} messages
                    {conv.last_message_at && (
                      <> &middot; {new Date(conv.last_message_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <MessageSquare className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {conversations.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-8">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No conversations yet. Start your first one!</p>
        </div>
      )}
    </div>
  );
}
