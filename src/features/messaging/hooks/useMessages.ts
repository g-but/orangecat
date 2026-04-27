'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import supabase from '@/lib/supabase/browser';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { Message, Conversation, Pagination } from '../types';
import { API_ROUTES, TIMING, debugLog } from '../lib/constants';
import { mergeMessages, confirmOptimisticMessage } from '../lib/message-utils';
import { useReadReceipts } from './useReadReceipts';

interface UseMessagesOptions {
  /** Whether to enable the hook */
  enabled?: boolean;
  /** Current user ID */
  userId: string | undefined;
}

interface UseMessagesReturn {
  /** Array of messages */
  messages: Message[];
  /** Conversation metadata */
  conversation: Conversation | null;
  /** Pagination info */
  pagination: Pagination | null;
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Whether loading more messages */
  isLoadingMore: boolean;
  /** Error state */
  error: 'forbidden' | 'not_found' | 'network' | 'unknown' | null;
  /** Load older messages */
  loadMore: () => Promise<void>;
  /** Add optimistic message */
  addOptimisticMessage: (message: Message) => void;
  /** Replace optimistic with real message */
  confirmMessage: (tempId: string, realMessage: Message) => void;
  /** Remove failed message */
  removeMessage: (messageId: string) => void;
  /** Handle incoming real-time message */
  handleNewMessage: (message: Message) => void;
  /** Mark conversation as read */
  markAsRead: () => Promise<void>;
  /** Refresh read receipts */
  refreshReadReceipts: () => Promise<void>;
}

export function useMessages(
  conversationId: string | null,
  options: UseMessagesOptions
): UseMessagesReturn {
  const { enabled = true, userId } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<'forbidden' | 'not_found' | 'network' | 'unknown' | null>(
    null
  );

  const { participantReadTimes, refreshReadReceipts, applyReadStatus } = useReadReceipts(
    conversationId,
    enabled,
    userId
  );

  // Recalculate message status when read receipts change
  const prevReadTimesKeyRef = useRef('');
  useEffect(() => {
    const readTimesKey = Array.from(participantReadTimes.entries())
      .map(([id, time]) => `${id}:${time?.getTime() || 'null'}`)
      .sort()
      .join(',');

    if (
      messages.length > 0 &&
      readTimesKey !== prevReadTimesKeyRef.current &&
      participantReadTimes.size > 0
    ) {
      prevReadTimesKeyRef.current = readTimesKey;
      setMessages(prev => applyReadStatus(prev));
    } else if (prevReadTimesKeyRef.current === '' && participantReadTimes.size > 0) {
      prevReadTimesKeyRef.current = readTimesKey;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantReadTimes]);

  /**
   * Fallback to client-side Supabase for 401 errors
   */
  const fetchFromClient = useCallback(async () => {
    if (!conversationId) {
      return;
    }

    try {
      const { data: conv } = await (supabase.from(DATABASE_TABLES.CONVERSATION_DETAILS) as any)
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (!conv) {
        setError('not_found');
        return;
      }

      const mappedConversation: Conversation = {
        id: conv.id,
        title: conv.title,
        is_group: conv.is_group,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        last_message_sender_id: conv.last_message_sender_id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        participants: [],
        unread_count: conv.unread_count || 0,
      };
      setConversation(mappedConversation);

      const { data: msgs } = await (supabase.from(DATABASE_TABLES.MESSAGE_DETAILS) as any)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      setMessages(applyReadStatus((msgs as Message[]) || []));
      setPagination({ hasMore: false, nextCursor: null, count: msgs?.length || 0 });
      setError(null);
    } catch (err) {
      debugLog('Client fallback failed:', err);
      setError('unknown');
    }
  }, [conversationId, applyReadStatus]);

  /**
   * Mark conversation as read
   */
  const markAsRead = useCallback(async () => {
    if (!conversationId || !userId) {
      return;
    }

    try {
      await fetch(API_ROUTES.CONVERSATION_READ(conversationId), {
        method: 'POST',
        credentials: 'same-origin',
      });
      setTimeout(() => refreshReadReceipts(), TIMING.READ_RECEIPT_RECALC_DELAY_MS);
    } catch (err) {
      debugLog('Error marking as read:', err);
    }
  }, [conversationId, userId, refreshReadReceipts]);

  /**
   * Fetch messages from API
   */
  const fetchMessages = useCallback(
    async (cursor?: string) => {
      if (!conversationId || !enabled) {
        return;
      }

      try {
        if (!cursor) {
          setIsLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const url = cursor
          ? `${API_ROUTES.CONVERSATION(conversationId)}?cursor=${cursor}`
          : API_ROUTES.CONVERSATION(conversationId);

        const response = await fetch(url, { credentials: 'same-origin' });

        if (!response.ok) {
          if (response.status === 403) {
            setError('forbidden');
          } else if (response.status === 404) {
            setError('not_found');
          } else if (response.status === 401) {
            await fetchFromClient();
            return;
          } else {
            setError('unknown');
          }
          return;
        }

        const responseData = await response.json();
        const data = responseData.success === true ? responseData.data : responseData;
        setConversation(data.conversation);
        setPagination(data.pagination);

        const messagesWithStatus = applyReadStatus(data.messages || []);

        if (cursor) {
          setMessages(prev => mergeMessages(messagesWithStatus, prev));
        } else {
          setMessages(messagesWithStatus);
          setTimeout(() => markAsRead(), TIMING.MARK_READ_DEBOUNCE_MS);
        }
      } catch (err) {
        debugLog('Error fetching messages:', err);
        setError('network');
        toast.error('Network error loading messages');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, enabled, markAsRead, fetchFromClient]
  );

  const loadMore = useCallback(async () => {
    if (!pagination?.hasMore || isLoadingMore || !pagination.nextCursor) {
      return;
    }
    await fetchMessages(pagination.nextCursor);
  }, [pagination, isLoadingMore, fetchMessages]);

  const addOptimisticMessage = useCallback(
    (message: Message) => {
      setMessages(prev => mergeMessages(prev, applyReadStatus([message])));
    },
    [applyReadStatus]
  );

  const confirmMessage = useCallback(
    (tempId: string, realMessage: Message) => {
      setMessages(prev =>
        confirmOptimisticMessage(applyReadStatus(prev), tempId, applyReadStatus([realMessage])[0])
      );
    },
    [applyReadStatus]
  );

  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  const handleNewMessage = useCallback(
    (message: Message) => {
      const messageWithStatus = applyReadStatus([message])[0];
      setMessages(prev => {
        const exists = prev.find(m => m.id === message.id);
        if (exists) {
          return prev.map(m => (m.id === message.id ? { ...m, ...messageWithStatus } : m));
        }
        return mergeMessages(prev, [messageWithStatus]);
      });
    },
    [applyReadStatus]
  );

  // Initial fetch
  useEffect(() => {
    if (conversationId && enabled) {
      fetchMessages();
    }
  }, [conversationId, enabled, fetchMessages]);

  return {
    messages,
    conversation,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    addOptimisticMessage,
    confirmMessage,
    removeMessage,
    handleNewMessage,
    markAsRead,
    refreshReadReceipts,
  };
}
