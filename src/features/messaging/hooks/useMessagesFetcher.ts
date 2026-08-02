'use client';

import { fromTable } from '@/lib/supabase/untyped';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import supabase from '@/lib/supabase/browser';
import { DATABASE_TABLES } from '@/config/database-tables';
import type { Message, Conversation, Pagination } from '../types';
import { TIMING, debugLog } from '../lib/constants';
import { API_ROUTES } from '@/config/api-routes';
import { mergeMessages } from '../lib/message-utils';

interface UseMessagesFetcherOptions {
  conversationId: string | null;
  enabled: boolean;
  applyReadStatus: (messages: Message[]) => Message[];
  markAsRead: () => Promise<void>;
}

interface UseMessagesFetcherReturn {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  conversation: Conversation | null;
  setConversation: React.Dispatch<React.SetStateAction<Conversation | null>>;
  pagination: Pagination | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: 'forbidden' | 'not_found' | 'network' | 'unknown' | null;
  loadMore: () => Promise<void>;
  /** Re-run the initial fetch — for inline retry after a failed load. */
  retry: () => Promise<void>;
}

export function useMessagesFetcher({
  conversationId,
  enabled,
  applyReadStatus,
  markAsRead,
}: UseMessagesFetcherOptions): UseMessagesFetcherReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<'forbidden' | 'not_found' | 'network' | 'unknown' | null>(
    null
  );

  const fetchFromClient = useCallback(async () => {
    if (!conversationId) {
      return;
    }
    try {
      const { data: conv } = await fromTable(supabase, DATABASE_TABLES.CONVERSATION_DETAILS)
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

      const { data: msgs } = await fromTable(supabase, DATABASE_TABLES.MESSAGE_DETAILS)
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
          ? `${API_ROUTES.MESSAGES.CONVERSATION(conversationId)}?cursor=${cursor}`
          : API_ROUTES.MESSAGES.CONVERSATION(conversationId);

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

  const retry = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (conversationId && enabled) {
      fetchMessages();
    }
  }, [conversationId, enabled, fetchMessages]);

  return {
    messages,
    setMessages,
    conversation,
    setConversation,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    retry,
  };
}
