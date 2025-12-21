'use client';

/**
 * Messages Hook
 *
 * Handles fetching messages for a conversation with pagination.
 *
 * @module messaging/hooks/useMessages
 */

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import supabase from '@/lib/supabase/browser';
import type { Message, Conversation, Pagination } from '../types';
import { API_ROUTES, TIMING, debugLog } from '../lib/constants';
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

  // Read receipts hook
  const { applyReadStatus, refresh: refreshReadReceipts, participantReadTimes } = useReadReceipts(conversationId, {
    enabled: enabled && !!conversationId,
    userId,
  });

  /**
   * Fetch messages from API
   */
  const fetchMessages = useCallback(
    async (cursor?: string) => {
      if (!conversationId || !enabled) return;

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
            // Try client-side fallback
            await fetchFromClient();
            return;
          } else {
            setError('unknown');
          }
          return;
        }

        const data = await response.json();
        setConversation(data.conversation);
        setPagination(data.pagination);

        // Apply read status and deduplicate
        const messagesWithStatus = applyReadStatus(data.messages || []);

        if (cursor) {
          // Prepend older messages
          setMessages((prev) => {
            // Deduplicate existing messages first
            const uniquePrev = Array.from(
              new Map(prev.map((m) => [m.id, m])).values()
            );
            const existingIds = new Set(uniquePrev.map((m) => m.id));
            const newMessages = messagesWithStatus.filter((m: Message) => !existingIds.has(m.id));
            const combined = [...newMessages, ...uniquePrev];
            // Final deduplication
            return Array.from(
              new Map(combined.map((m) => [m.id, m])).values()
            );
          });
        } else {
          // Deduplicate and set
          const uniqueMessages = Array.from(
            new Map(messagesWithStatus.map((m: Message) => [m.id, m])).values()
          );
          setMessages(uniqueMessages);

          // Mark as read after initial load
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
    [conversationId, enabled, applyReadStatus]
  );

  /**
   * Fallback to client-side Supabase for 401 errors
   */
  const fetchFromClient = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data: conv } = await supabase
        .from('conversation_details')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();

      if (!conv) {
        setError('not_found');
        return;
      }

      setConversation(conv as any);

      const { data: msgs } = await supabase
        .from('message_details')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      const messagesWithStatus = applyReadStatus((msgs as Message[]) || []);
      setMessages(messagesWithStatus);
      setPagination({ hasMore: false, nextCursor: null, count: msgs?.length || 0 });
      setError(null);
    } catch (err) {
      debugLog('Client fallback failed:', err);
      setError('unknown');
    }
  }, [conversationId, applyReadStatus]);

  /**
   * Load older messages
   */
  const loadMore = useCallback(async () => {
    if (!pagination?.hasMore || isLoadingMore || !pagination.nextCursor) return;
    await fetchMessages(pagination.nextCursor);
  }, [pagination, isLoadingMore, fetchMessages]);

  /**
   * Add an optimistic message
   */
  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Deduplicate first
      const uniquePrev = Array.from(
        new Map(prev.map((m) => [m.id, m])).values()
      );
      
      if (uniquePrev.find((m) => m.id === message.id)) {
        return uniquePrev;
      }
      
      const withNew = [...uniquePrev, message];
      const unique = Array.from(
        new Map(withNew.map((m) => [m.id, m])).values()
      );
      return unique.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, []);

  /**
   * Replace optimistic message with real one
   */
  const confirmMessage = useCallback(
    (tempId: string, realMessage: Message) => {
      setMessages((prev) => {
        // Deduplicate first
        const uniquePrev = Array.from(
          new Map(prev.map((m) => [m.id, m])).values()
        );
        
        const withoutOptimistic = uniquePrev.filter((m) => m.id !== tempId);
        if (withoutOptimistic.find((m) => m.id === realMessage.id)) {
          return withoutOptimistic;
        }
        const messageWithStatus = applyReadStatus([realMessage])[0];
        const withNew = [...withoutOptimistic, messageWithStatus];
        const unique = Array.from(
          new Map(withNew.map((m) => [m.id, m])).values()
        );
        return unique.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    },
    [applyReadStatus]
  );

  /**
   * Remove a message (for failed optimistic messages)
   */
  const removeMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  /**
   * Handle incoming real-time message
   */
  const handleNewMessage = useCallback(
    (message: Message) => {
      setMessages((prev) => {
        // Deduplicate first
        const uniquePrev = Array.from(
          new Map(prev.map((m) => [m.id, m])).values()
        );
        
        const existingIndex = uniquePrev.findIndex((m) => m.id === message.id);
        const messageWithStatus = applyReadStatus([message])[0];

        if (existingIndex >= 0) {
          // Update existing
          const updated = [...uniquePrev];
          updated[existingIndex] = { ...updated[existingIndex], ...messageWithStatus };
          return updated.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }

        // Add new and deduplicate
        const withNew = [...uniquePrev, messageWithStatus];
        const unique = Array.from(
          new Map(withNew.map((m) => [m.id, m])).values()
        );
        return unique.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    },
    [applyReadStatus]
  );

  /**
   * Mark conversation as read
   */
  const markAsRead = useCallback(async () => {
    if (!conversationId || !userId) return;

    try {
      await fetch(API_ROUTES.CONVERSATION_READ(conversationId), {
        method: 'POST',
        credentials: 'same-origin',
      });
      // Refresh read receipts after marking as read
      setTimeout(() => refreshReadReceipts(), TIMING.READ_RECEIPT_RECALC_DELAY_MS);
    } catch (err) {
      debugLog('Error marking as read:', err);
    }
  }, [conversationId, userId, refreshReadReceipts]);

  // Recalculate message status when read receipts change
  const prevReadTimesRef = useRef<string>('');
  
  useEffect(() => {
    // Create a key from current read times to detect changes
    const readTimesKey = Array.from(participantReadTimes.entries())
      .map(([id, time]) => `${id}:${time?.getTime() || 'null'}`)
      .sort()
      .join(',');
    
    // Only recalculate if read times actually changed and we have messages
    if (messages.length > 0 && readTimesKey !== prevReadTimesRef.current && participantReadTimes.size > 0) {
      debugLog('[useMessages] Read receipts changed, recalculating status', {
        messageCount: messages.length,
        readTimesSize: participantReadTimes.size,
      });
      prevReadTimesRef.current = readTimesKey;
      setMessages((prev) => {
        // Deduplicate by ID first, then apply read status
        const uniqueMessages = Array.from(
          new Map(prev.map((m) => [m.id, m])).values()
        );
        return applyReadStatus(uniqueMessages);
      });
    } else if (prevReadTimesRef.current === '' && participantReadTimes.size > 0) {
      // Initialize on first load
      prevReadTimesRef.current = readTimesKey;
    }
  }, [participantReadTimes, applyReadStatus]); // Recalculate when read times change

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
