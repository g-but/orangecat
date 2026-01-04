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
import { API_ROUTES, TIMING, MESSAGE_STATUS, debugLog } from '../lib/constants';
import type { MessageStatus } from '../lib/constants';
import { useRealtimeSubscription } from './useRealtimeSubscription';

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

  // Read receipts state (merged from useReadReceipts)
  const [participantReadTimes, setParticipantReadTimes] = useState<Map<string, Date | null>>(
    new Map()
  );
  const participantReadTimesRef = useRef<Map<string, Date | null>>(participantReadTimes);
  const [readReceiptsLoading, setReadReceiptsLoading] = useState(false);
  const [readReceiptsError, setReadReceiptsError] = useState(false);

  // Keep a ref in sync so our callbacks can stay stable
  useEffect(() => {
    participantReadTimesRef.current = participantReadTimes;
  }, [participantReadTimes]);

  /**
   * Fetch participant read times from the database
   */
  const fetchParticipantReadTimes = useCallback(async () => {
    if (!conversationId || !enabled || readReceiptsError) {
      return;
    }

    setReadReceiptsLoading(true);
    try {
      const { data: participants, error } = await supabase
        .from('conversation_participants')
        .select('user_id, last_read_at')
        .eq('conversation_id', conversationId)
        .eq('is_active', true);

      if (error) {
        debugLog('Error fetching participant read times:', error);
        if (
          error.message &&
          (error.message.includes('participant_read_times') ||
            error.message.includes('does not exist') ||
            error.code === '42P17')
        ) {
          debugLog('Database schema error detected, disabling read receipts for this session');
          setReadReceiptsError(true);
          setParticipantReadTimes(new Map());
          return;
        }
        return;
      }

      const newMap = new Map<string, Date | null>();
      (participants || []).forEach((p: any) => {
        newMap.set(p.user_id, p.last_read_at ? new Date(p.last_read_at) : null);
      });

      setParticipantReadTimes(newMap);
    } catch (error) {
      debugLog('Error in fetchParticipantReadTimes:', error);
      setParticipantReadTimes(new Map());
    } finally {
      setReadReceiptsLoading(false);
    }
  }, [conversationId, enabled, readReceiptsError]);

  /**
   * Calculate the status for a single message
   */
  const calculateMessageStatus = useCallback(
    (message: Message): MessageStatus => {
      if (!userId || readReceiptsError) {
        return MESSAGE_STATUS.DELIVERED;
      }

      const currentReadTimes = participantReadTimesRef.current;

      if (message.id.startsWith('temp-')) {
        return MESSAGE_STATUS.PENDING;
      }

      if (message.status === MESSAGE_STATUS.FAILED) {
        return MESSAGE_STATUS.FAILED;
      }

      const messageCreatedAt = new Date(message.created_at);

      if (message.sender_id === userId) {
        for (const [participantId, lastReadAt] of currentReadTimes.entries()) {
          if (participantId !== userId && lastReadAt) {
            if (messageCreatedAt <= lastReadAt) {
              return MESSAGE_STATUS.READ;
            }
          }
        }
        return MESSAGE_STATUS.DELIVERED;
      }

      const userLastReadAt = currentReadTimes.get(userId);
      if (userLastReadAt && messageCreatedAt <= userLastReadAt) {
        return MESSAGE_STATUS.READ;
      }

      return MESSAGE_STATUS.DELIVERED;
    },
    [userId, readReceiptsError]
  );

  /**
   * Apply read status to an array of messages
   */
  const applyReadStatus = useCallback(
    (messages: Message[]): Message[] => {
      return messages.map(msg => {
        const status = calculateMessageStatus(msg);
        return {
          ...msg,
          status,
          is_read: status === MESSAGE_STATUS.READ,
          is_delivered: status === MESSAGE_STATUS.DELIVERED || status === MESSAGE_STATUS.READ,
        };
      });
    },
    [calculateMessageStatus]
  );

  /**
   * Refresh read receipts
   */
  const refreshReadReceipts = useCallback(async () => {
    await fetchParticipantReadTimes();
  }, [fetchParticipantReadTimes]);

  /**
   * Fallback to client-side Supabase for 401 errors
   */
  const fetchFromClient = useCallback(async () => {
    if (!conversationId) {
      return;
    }

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

      // Map conversation_details view to Conversation type
      const mappedConversation: Conversation = {
        id: conv.id,
        title: conv.title,
        is_group: conv.is_group,
        last_message_at: conv.last_message_at,
        last_message_preview: conv.last_message_preview,
        last_message_sender_id: conv.last_message_sender_id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        participants: [], // Will be populated separately if needed
        unread_count: conv.unread_count || 0,
      };
      setConversation(mappedConversation);

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
      // Refresh read receipts after marking as read
      setTimeout(() => refreshReadReceipts(), TIMING.READ_RECEIPT_RECALC_DELAY_MS);
    } catch (err) {
      debugLog('Error marking as read:', err);
    }
  }, [conversationId, userId, refreshReadReceipts]);

  /**
   * Fetch messages from API
   *
   * Note: This callback depends on `markAsRead` and `fetchFromClient`, which
   * must be declared before this hook to avoid temporal dead zone issues with
   * the dependency array in some bundler/transpilation scenarios.
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
            // Try client-side fallback
            await fetchFromClient();
            return;
          } else {
            setError('unknown');
          }
          return;
        }

        const responseData = await response.json();
        // Handle both response formats: apiSuccess format { success: true, data: {...} } and legacy format
        const data = responseData.success === true ? responseData.data : responseData;
        setConversation(data.conversation);
        setPagination(data.pagination);

        // Apply read status and deduplicate
        // Call applyReadStatus directly - it's stable and doesn't need to be in dependencies
        const messagesWithStatus = applyReadStatus(data.messages || []);

        if (cursor) {
          // Prepend older messages
          setMessages(prev => {
            // Deduplicate existing messages first
            const uniquePrev = Array.from(new Map(prev.map(m => [m.id, m])).values());
            const existingIds = new Set(uniquePrev.map(m => m.id));
            const newMessages = messagesWithStatus.filter((m: Message) => !existingIds.has(m.id));
            const combined = [...newMessages, ...uniquePrev];
            // Final deduplication
            return Array.from(new Map(combined.map(m => [m.id, m])).values());
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
    // applyReadStatus is stable (depends on stable calculateMessageStatus) - call it directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, enabled, markAsRead, fetchFromClient]
  );

  /**
   * Load older messages
   */
  const loadMore = useCallback(async () => {
    if (!pagination?.hasMore || isLoadingMore || !pagination.nextCursor) {
      return;
    }
    await fetchMessages(pagination.nextCursor);
  }, [pagination, isLoadingMore, fetchMessages]);

  /**
   * Add an optimistic message
   */
  const addOptimisticMessage = useCallback(
    (message: Message) => {
      setMessages(prev => {
        // Use Map to ensure no duplicates
        const messageMap = new Map<string, Message>();
        prev.forEach(m => {
          messageMap.set(m.id, m);
        });

        // Check if message already exists (shouldn't for optimistic)
        if (messageMap.has(message.id)) {
          debugLog('[useMessages] Optimistic message already exists, skipping:', message.id);
          return Array.from(messageMap.values());
        }

        const messageWithStatus = applyReadStatus([message])[0];
        messageMap.set(message.id, messageWithStatus);

        const result = Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Final deduplication check
        const finalMap = new Map<string, Message>();
        result.forEach(m => {
          if (!finalMap.has(m.id)) {
            finalMap.set(m.id, m);
          }
        });

        return Array.from(finalMap.values());
      });
    },
    [applyReadStatus]
  );

  /**
   * Replace optimistic message with real one
   */
  const confirmMessage = useCallback(
    (tempId: string, realMessage: Message) => {
      setMessages(prev => {
        // Use Map to ensure no duplicates
        const messageMap = new Map<string, Message>();

        // Add all messages except the temp one
        prev.forEach(m => {
          if (m.id !== tempId) {
            // If real message already exists, keep the most recent
            if (m.id === realMessage.id) {
              const existing = messageMap.get(m.id);
              if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
                messageMap.set(m.id, m);
              }
            } else {
              messageMap.set(m.id, m);
            }
          }
        });

        // Add the real message if it doesn't already exist
        if (!messageMap.has(realMessage.id)) {
          const messageWithStatus = applyReadStatus([realMessage])[0];
          messageMap.set(realMessage.id, messageWithStatus);
        }

        const result = Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Final deduplication check
        const finalMap = new Map<string, Message>();
        result.forEach(m => {
          if (!finalMap.has(m.id)) {
            finalMap.set(m.id, m);
          }
        });

        return Array.from(finalMap.values());
      });
    },
    [applyReadStatus]
  );

  /**
   * Remove a message (for failed optimistic messages)
   */
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  /**
   * Handle incoming real-time message
   */
  const handleNewMessage = useCallback(
    (message: Message) => {
      setMessages(prev => {
        // Deduplicate first - use Map to ensure no duplicates by ID
        const messageMap = new Map<string, Message>();
        prev.forEach(m => {
          // Keep the most recent version if duplicate exists
          const existing = messageMap.get(m.id);
          if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
            messageMap.set(m.id, m);
          }
        });

        const uniquePrev = Array.from(messageMap.values());
        const messageWithStatus = applyReadStatus([message])[0];

        // Check if message already exists
        const existingMessage = messageMap.get(message.id);
        if (existingMessage) {
          // Update existing message with latest data
          messageMap.set(message.id, { ...existingMessage, ...messageWithStatus });
        } else {
          // Add new message
          messageMap.set(message.id, messageWithStatus);
        }

        // Convert back to array, sort, and ensure no duplicates
        const result = Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Final safety check - should never have duplicates at this point
        const finalMap = new Map<string, Message>();
        result.forEach(m => {
          if (!finalMap.has(m.id)) {
            finalMap.set(m.id, m);
          }
        });

        return Array.from(finalMap.values());
      });
    },
    [applyReadStatus]
  );

  // Recalculate message status when read receipts change
  const prevReadTimesRef = useRef<string>('');

  useEffect(() => {
    // Create a key from current read times to detect changes
    const readTimesKey = Array.from(participantReadTimes.entries())
      .map(([id, time]) => `${id}:${time?.getTime() || 'null'}`)
      .sort()
      .join(',');

    // Only recalculate if read times actually changed and we have messages
    // Use a ref to check messages length without adding it to dependencies
    const currentMessages = messages;
    if (
      currentMessages.length > 0 &&
      readTimesKey !== prevReadTimesRef.current &&
      participantReadTimes.size > 0
    ) {
      debugLog('[useMessages] Read receipts changed, recalculating status', {
        messageCount: currentMessages.length,
        readTimesSize: participantReadTimes.size,
      });
      prevReadTimesRef.current = readTimesKey;
      setMessages(prev => {
        // Deduplicate by ID first, then apply read status
        // applyReadStatus is stable - call it directly without including in dependencies
        const uniqueMessages = Array.from(new Map(prev.map(m => [m.id, m])).values());
        return applyReadStatus(uniqueMessages);
      });
    } else if (prevReadTimesRef.current === '' && participantReadTimes.size > 0) {
      // Initialize on first load
      prevReadTimesRef.current = readTimesKey;
    }
    // Only depend on participantReadTimes - messages.length is checked inside but not a dependency
    // applyReadStatus is stable and called directly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantReadTimes]); // Only recalculate when read receipts change

  // Initial fetch of read receipts
  useEffect(() => {
    if (conversationId && enabled) {
      fetchParticipantReadTimes();
    }
  }, [conversationId, enabled, fetchParticipantReadTimes]);

  // Subscribe to participant updates for real-time read receipts using unified hook
  useRealtimeSubscription({
    channelName: `read-receipts:${conversationId || 'none'}`,
    table: 'conversation_participants',
    events: ['UPDATE'],
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    onEvent: useCallback(
      ({ new: newRecord }) => {
        if (newRecord && typeof newRecord === 'object') {
          const { user_id, last_read_at } = newRecord as { user_id?: string; last_read_at?: string | null };
          if (user_id) {
            debugLog('[useMessages] Read receipt updated via real-time', {
              userId: user_id,
              lastReadAt: last_read_at,
              conversationId,
            });
            setParticipantReadTimes(prev => {
              const newMap = new Map(prev);
              newMap.set(user_id, last_read_at ? new Date(last_read_at) : null);
              return newMap;
            });
          }
        }
      },
      [conversationId]
    ),
    enabled: !!conversationId && enabled && !!userId,
    debounceMs: TIMING.READ_RECEIPT_RECALC_DELAY_MS,
  });

  // Initial fetch of messages
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
