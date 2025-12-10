'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, MoreVertical, Loader2, ChevronUp, Check, CheckCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import AvatarLink from '@/components/ui/AvatarLink';
import MessageComposer from './MessageComposer';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase/browser';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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

interface Conversation {
  id: string;
  title: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message_preview: string | null;
  participants: Array<{
    user_id: string;
    username: string;
    name: string;
    avatar_url: string;
    role: string;
    joined_at: string;
    last_read_at: string;
    is_active: boolean;
  }>;
  unread_count: number;
}

interface Pagination {
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

interface MessageViewProps {
  conversationId: string;
  onBack: (reason?: 'forbidden' | 'not_found' | 'unknown' | 'network') => void;
  // Unified selection (controlled by parent). If undefined, falls back to internal state.
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelectMessage?: (id: string) => void;
}

export default function MessageView({ conversationId, onBack, selectionMode: selectionModeProp, selectedIds: selectedIdsProp, onToggleSelectMessage }: MessageViewProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentUserId = user?.id;
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [selfDmAttempted, setSelfDmAttempted] = useState(false);
  // When parent controls selection mode, use it; otherwise manage locally
  const [selectionModeLocal, setSelectionModeLocal] = useState(false);
  const [selectedIdsLocal, setSelectedIdsLocal] = useState<Set<string>>(new Set());
  const selectionMode = typeof selectionModeProp === 'boolean' ? selectionModeProp : selectionModeLocal;
  const selectedIds = selectedIdsProp ?? selectedIdsLocal;

  const toggleSelectionMode = () => {
    // Only applicable in uncontrolled mode
    if (typeof selectionModeProp === 'boolean') return;
    setSelectionModeLocal(prev => !prev);
    setSelectedIdsLocal(new Set());
  };

  const toggleSelect = (id: string) => {
    if (onToggleSelectMessage) return onToggleSelectMessage(id);
    setSelectedIdsLocal(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    if (selectedIdsProp) return; // parent controls
    setSelectedIdsLocal(new Set());
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (count > 1) {
      const ok = window.confirm(`Delete ${count} messages? This removes them for everyone.`);
      if (!ok) return;
    }
    try {
      const ids = Array.from(selectedIds);
      const res = await fetch('/api/messages/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ conversationId, ids }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        toast.error('Failed to delete messages', { description: t });
        return;
      }
      // Remove deleted messages locally
      setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
      clearSelection();
      if (typeof selectionModeProp !== 'boolean') setSelectionModeLocal(false);
      toast.success(`Deleted ${count} message${count > 1 ? 's' : ''}`);
    } catch {
      toast.error('Network error deleting messages');
    }
  };

  const fetchConversation = useCallback(async (cursor?: string) => {
    try {
      if (!cursor) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const url = cursor
        ? `/api/messages/${conversationId}?cursor=${cursor}`
        : `/api/messages/${conversationId}`;

      const response = await fetch(url, { credentials: 'same-origin' });
      if (response.ok) {
        setError(null);
        const data = await response.json();
        setConversation(data.conversation);
        setPagination(data.pagination);

        if (cursor) {
          // Prepend older messages
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages || []);
        }

        // Mark as read (only on initial load)
        if (!cursor) {
          await fetch(`/api/messages/${conversationId}/read`, { method: 'POST', credentials: 'same-origin' });
        }
      } else {
        // Fallback to client-side Supabase for 401/403/404 to keep UI responsive
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          try {
            const { data: conv } = await supabase
              .from('conversation_details')
              .select('*')
              .eq('id', conversationId)
              .maybeSingle();
            if (!conv) {
              setError(response.status === 403 ? 'forbidden' : 'not_found');
              return;
            }
            setConversation(conv as any);

            const { data: msgs } = await supabase
              .from('message_details')
              .select('*')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: true });
            setMessages((msgs as any) || []);
            setPagination({ hasMore: false, nextCursor: null, count: (msgs as any)?.length || 0 });
            setError(null);
            return;
          } catch {
            setError(response.status === 403 ? 'forbidden' : 'not_found');
          }
        } else {
          setError('unknown');
        }
        const errText = await response.text().catch(() => '');
        toast.error('Failed to load conversation', {
          description: errText || `Status ${response.status}`,
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError('network');
      toast.error('Network error loading conversation');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  // If user is not allowed to view this conversation, automatically go back to list
  useEffect(() => {
    if (error === 'forbidden') {
      onBack('forbidden');
    }
  }, [error, onBack]);

  // Removed auto-create self conversation to avoid confusing "Notes to Self" threads

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Skip if this is our own message (handled optimistically)
          if (payload.new.sender_id === currentUserId) {
            // Replace optimistic message with real one
            setMessages(prev => {
              const withoutOptimistic = prev.filter(m => !m.id.startsWith('temp-'));
              // Check if real message already exists
              if (withoutOptimistic.find(m => m.id === payload.new.id)) {
                return withoutOptimistic;
              }
              // Fetch full message details
              fetchNewMessage(payload.new.id);
              return withoutOptimistic;
            });
            return;
          }

          // Fetch the full message with sender info
          fetchNewMessage(payload.new.id);

          // Mark as read since we're viewing
          await fetch(`/api/messages/${conversationId}/read`, { method: 'POST' });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  const fetchNewMessage = async (messageId: string) => {
    const { data: newMessage } = await supabase
      .from('message_details')
      .select('*')
      .eq('id', messageId)
      .single();

    if (newMessage) {
      setMessages(prev => {
        // Check for duplicates
        if (prev.find(m => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage as Message];
      });
      setShouldAutoScroll(true);
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
      setShouldAutoScroll(false);
    }
  }, [messages, shouldAutoScroll]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom('auto');
    }
  }, [isLoading]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleLoadMore = () => {
    if (pagination?.hasMore && pagination.nextCursor && !isLoadingMore) {
      // Save scroll position
      const container = messagesContainerRef.current;
      const scrollHeightBefore = container?.scrollHeight || 0;

      fetchConversation(pagination.nextCursor).then(() => {
        // Restore scroll position after loading
        if (container) {
          const scrollHeightAfter = container.scrollHeight;
          container.scrollTop = scrollHeightAfter - scrollHeightBefore;
        }
      });
    }
  };

  const handleNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
    setShouldAutoScroll(true);
  };

  const handleMessageFailed = (tempId: string) => {
    setMessages(prev => prev.map(m => (m.id === tempId ? { ...m, status: 'failed' } : m)));
  };

  const handleMessageConfirmed = (tempId: string, realMessage: Message) => {
    setMessages(prev => {
      const replaced = prev.map(m => (m.id === tempId ? realMessage : m));
      // If temp wasn't found (e.g., list refreshed), append real message
      if (!replaced.find(m => m.id === realMessage.id)) {
        return [...replaced, realMessage];
      }
      return replaced;
    });
    setShouldAutoScroll(true);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch('/api/messages/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ conversationId, ids: [messageId] }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        toast.error('Failed to delete message', { description: t })
        return
      }
      setMessages(prev => prev.filter(m => m.id !== messageId))
    } catch {
      toast.error('Network error deleting message')
    }
  }

  const handleRetrySend = async (message: Message) => {
    if (message.status !== 'failed') return;
    setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, status: 'pending' } : m)));
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message.content,
          messageType: message.message_type || 'text',
        }),
      });
      if (!response.ok) {
        setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, status: 'failed' } : m)));
      }
    } catch {
      setMessages(prev => prev.map(m => (m.id === message.id ? { ...m, status: 'failed' } : m)));
    }
  };

  const getConversationDisplayName = () => {
    if (!conversation) return '';

    if (conversation.title) {
      return conversation.title;
    }

    const otherParticipants = conversation.participants.filter(
      p => p.is_active && p.user_id !== currentUserId
    );

    if (otherParticipants.length === 1) {
      return otherParticipants[0].name || otherParticipants[0].username || 'Unknown User';
    }

    if (otherParticipants.length === 0) {
      return 'Notes to Self';
    }

    return otherParticipants
      .slice(0, 3)
      .map(p => p.name || p.username)
      .join(', ') + (otherParticipants.length > 3 ? ` +${otherParticipants.length - 3}` : '');
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  const shouldShowDateDivider = (currentMsg: Message, prevMsg: Message | null) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
  };

  const getDateDividerText = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  const getOutgoingStatus = (message: Message) => {
    if (!conversation || message.sender?.id !== currentUserId) return null;

    // Pending/failed states already shown inline
    if (message.status === 'pending' || message.status === 'failed') {
      return message.status;
    }

    const recipients = (conversation.participants || []).filter(
      (p) => p.is_active && p.user_id !== currentUserId
    );
    if (recipients.length === 0) return 'sent'; // notes-to-self or single user

    const created = new Date(message.created_at).getTime();
    const readCount = recipients.filter((p) => {
      if (!p.last_read_at) return false;
      return new Date(p.last_read_at).getTime() >= created;
    }).length;

    if (readCount === recipients.length) return 'read';
    if (readCount > 0) return 'delivered';
    return 'sent';
  };

  const renderStatusIcon = (status: 'sent' | 'delivered' | 'read') => {
    if (status === 'sent') {
      return <Check className="w-3.5 h-3.5 text-white/80" aria-label="Sent" />;
    }
    if (status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-white/80" aria-label="Delivered" />;
    }
    return <CheckCheck className="w-3.5 h-3.5 text-emerald-300" aria-label="Read" />;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Show clear error states after loading completes
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          {error === 'forbidden' && (
            <>
              <p className="text-lg font-medium mb-2">You don’t have access to this conversation.</p>
              <p className="text-sm mb-4">You’re not a participant in this chat.</p>
            </>
          )}
          {error === 'not_found' && (
            <>
              <p className="text-lg font-medium mb-2">Conversation not found</p>
              <p className="text-sm mb-4">It may have been deleted or you lost access.</p>
            </>
          )}
          {error !== 'forbidden' && error !== 'not_found' && (
            <>
              <p className="text-lg font-medium mb-2">Unable to load conversation</p>
              <p className="text-sm mb-4">Please check your connection and try again.</p>
            </>
          )}
          <Button variant="ghost" onClick={() => onBack(error as 'forbidden' | 'not_found' | 'unknown' | 'network')} className="mt-2">
            Go back
          </Button>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Conversation not found</p>
          <Button variant="ghost" onClick={onBack} className="mt-2">
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center gap-4 bg-white shadow-sm">
        <Button variant="ghost" size="sm" onClick={() => onBack()} className="md:hidden -ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex-1 min-w-0">
          {/* Dev-only debug banner */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mb-1 text-[11px] text-gray-400">conv: {conversationId}{error ? ` · error: ${error}` : ''}</div>
          )}
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 truncate">
              {getConversationDisplayName()}
            </h2>
            {conversation.is_group && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {conversation.participants.filter(p => p.is_active).length} members
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">
            {conversation.is_group ? 'Group conversation' : 'Direct message'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* When parent controls selection, hide local selection controls */}
          {typeof selectionModeProp !== 'boolean' && (
            !selectionMode ? (
              <Button variant="ghost" size="sm" onClick={toggleSelectionMode}>
                Select
              </Button>
            ) : (
              <>
                <span className="text-sm text-gray-600">
                  {selectedIds.size} selected
                </span>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={bulkDelete} disabled={selectedIds.size === 0}>
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleSelectionMode}>Cancel</Button>
              </>
            )
          )}
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50"
      >
        {/* Load more button */}
        {pagination?.hasMore && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="text-gray-500 hover:text-gray-700"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ChevronUp className="w-4 h-4 mr-2" />
              )}
              Load earlier messages
            </Button>
          </div>
        )}

        {!error && ((messages.filter(m => !m.is_deleted)).length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start the conversation by sending a message below.</p>
          </div>
        ) : (
          messages.filter(m => !m.is_deleted).map((message, index, arr) => {
            const isCurrentUser = message.sender?.id === currentUserId;
            const prevMessage = index > 0 ? arr[index - 1] : null;
            const showAvatar = !prevMessage || prevMessage.sender?.id !== message.sender?.id;
            const showDateDivider = shouldShowDateDivider(message, prevMessage);
            const isOptimistic = message.id.startsWith('temp-');

            return (
              <React.Fragment key={message.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center py-6">
                    <div className="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-4 py-2 rounded-full shadow-sm">
                      {getDateDividerText(message.created_at)}
                    </div>
                  </div>
                )}

                <div
                  className={cn(
                    'flex gap-2',
                    isCurrentUser ? 'justify-end' : 'justify-start',
                    !showAvatar && !isCurrentUser && 'pl-10'
                  )}
                >
                  {selectionMode && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(message.id)}
                      onChange={() => toggleSelect(message.id)}
                      className="mt-2"
                    />
                  )}
                  {!isCurrentUser && showAvatar && message.sender && (
                    <AvatarLink
                      username={message.sender.username}
                      userId={message.sender.id}
                      avatarUrl={message.sender.avatar_url}
                      name={message.sender.name}
                      size={40}
                      className="flex-shrink-0 mt-1"
                    />
                  )}

                  <div className={cn('max-w-[75%]', isCurrentUser && 'order-first')}>
                    {!isCurrentUser && showAvatar && message.sender && (
                      <div className="text-xs text-gray-500 mb-1 ml-1">
                        {message.sender.name || message.sender.username}
                      </div>
                    )}

                    <div
                      className={cn(
                        'px-3 py-2 rounded-2xl break-words',
                        isCurrentUser
                          ? 'bg-orange-500 text-white rounded-br-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100 hover:shadow-md transition-shadow',
                        isOptimistic && 'opacity-70'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.status === 'pending' && (
                        <p className={cn('text-[11px] mt-1', isCurrentUser ? 'text-orange-50/80' : 'text-gray-400')}>
                          Sending…
                        </p>
                      )}
                      {message.status === 'failed' && (
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-red-500">
                          <span>Failed to send</span>
                          <button className="underline" onClick={() => handleRetrySend(message)}>
                            Retry
                          </button>
                        </div>
                      )}
                      {isCurrentUser && (
                        <div className="mt-1 text-[11px]">
                          <button
                            className={cn('underline', isCurrentUser ? 'text-orange-50/80 hover:text-white' : 'text-gray-400 hover:text-red-600')}
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        'text-[10px] text-gray-400 mt-0.5 px-1',
                        isCurrentUser ? 'text-right' : 'text-left'
                      )}
                    >
                      {isOptimistic ? (
                        'Sending...'
                      ) : (
                    <div className="inline-flex items-center gap-1">
                      <span>
                        {formatMessageDate(message.created_at)}
                        {message.edited_at && ' · edited'}
                      </span>
                      {isCurrentUser && (() => {
                        const status = getOutgoingStatus(message);
                        if (!status || status === 'pending' || status === 'failed') return null;
                        return renderStatusIcon(status as 'sent' | 'delivered' | 'read');
                      })()}
                    </div>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      {!error && (
        <MessageComposer
          conversationId={conversationId}
          onMessageSent={handleNewMessage}
          onMessageFailed={handleMessageFailed}
          onMessageConfirmed={handleMessageConfirmed}
        />
      )}
    </div>
  );
}
