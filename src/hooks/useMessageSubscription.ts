'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase/browser';
import type { Message } from '@/features/messaging/types';
import { CHANNELS, debugLog, TIMING } from '@/features/messaging/lib/constants';
import { DATABASE_TABLES } from '@/config/database-tables';

interface UseMessageSubscriptionOptions {
  onNewMessage?: (message: Message) => void;
  onOwnMessage?: (messageId: string) => void;
  onReadReceiptUpdate?: (conversationId: string) => void;
  enabled?: boolean;
  /** Callback when subscription status changes */
  onSubscriptionStatusChange?: (status: string, error?: Error) => void;
}

/**
 * Unified hook for subscribing to message updates in a conversation.
 * Prevents duplicate subscriptions and manages cleanup automatically.
 *
 * @param conversationId - The conversation ID to subscribe to
 * @param options - Configuration options
 * @returns Cleanup function (automatically called on unmount)
 */
export function useMessageSubscription(
  conversationId: string | null,
  options: UseMessageSubscriptionOptions = {}
) {
  const { user } = useAuth();
  const {
    onNewMessage,
    onOwnMessage,
    onReadReceiptUpdate,
    enabled = true,
    onSubscriptionStatusChange,
  } = options;
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbacksRef = useRef({ onNewMessage, onOwnMessage, onReadReceiptUpdate });
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const attemptReconnectRef = useRef<(() => void) | null>(null);
  const setupInProgressRef = useRef(false);
  const hasSubscribedRef = useRef(false);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onNewMessage, onOwnMessage, onReadReceiptUpdate };
  }, [onNewMessage, onOwnMessage, onReadReceiptUpdate]);

  /**
   * Calculate exponential backoff delay for reconnection
   */
  const getReconnectDelay = useCallback(() => {
    const baseDelay = TIMING.RECONNECT_INITIAL_DELAY_MS;
    const exponentialDelay = baseDelay * Math.pow(2, reconnectAttemptsRef.current);
    return Math.min(exponentialDelay, TIMING.RECONNECT_MAX_DELAY_MS);
  }, []);

  /**
   * Setup the subscription
   */
  const setupSubscription = useCallback(() => {
    if (!conversationId || !user?.id || !enabled || !isMountedRef.current) {
      return;
    }

    // Prevent duplicate setup
    if (setupInProgressRef.current) {
      debugLog('[useMessageSubscription] setup already in progress, skipping');
      return;
    }

    // If already subscribed to this conversation, skip
    if (hasSubscribedRef.current && channelRef.current) {
      debugLog('[useMessageSubscription] already subscribed, skipping');
      return;
    }

    setupInProgressRef.current = true;

    // Clean up existing channel
    if (channelRef.current) {
      debugLog('[useMessageSubscription] cleaning up existing channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    debugLog(`[useMessageSubscription] creating channel for ${conversationId}`);

    /**
     * Attempt to reconnect the subscription
     */
    const attemptReconnect = () => {
      if (!conversationId || !user?.id || !enabled || !isMountedRef.current) {
        return;
      }

      if (reconnectAttemptsRef.current >= TIMING.RECONNECT_MAX_ATTEMPTS) {
        debugLog('[useMessageSubscription] Max reconnection attempts reached');
        if (onSubscriptionStatusChange) {
          onSubscriptionStatusChange('ERROR', new Error('Max reconnection attempts reached'));
        }
        return;
      }

      reconnectAttemptsRef.current += 1;
      const delay = getReconnectDelay();

      debugLog(
        `[useMessageSubscription] Reconnecting (attempt ${reconnectAttemptsRef.current}/${TIMING.RECONNECT_MAX_ATTEMPTS}) in ${delay}ms`
      );

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }
        setupSubscription();
      }, delay);
    };

    // Store in ref for access in subscribe callback
    attemptReconnectRef.current = attemptReconnect;

    const channel = supabase
      .channel(CHANNELS.MESSAGES(conversationId), {
        config: {
          broadcast: { self: false },
          presence: { key: '' },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          debugLog('[useMessageSubscription] insert', {
            conversationId: payload.new.conversation_id,
            senderId: payload.new.sender_id,
            userId: user.id,
            messageId: payload.new.id,
          });
          const { onNewMessage, onOwnMessage } = callbacksRef.current;

          try {
            debugLog('[useMessageSubscription] handling insert', {
              messageId: payload.new.id,
              senderId: payload.new.sender_id,
              currentUserId: user.id,
              conversationId: payload.new.conversation_id,
            });

            // Skip if this is our own message (handled optimistically)
            if (payload.new.sender_id === user.id) {
              debugLog('[useMessageSubscription] own message; onOwnMessage');
              if (onOwnMessage) {
                onOwnMessage(payload.new.id);
              }
              return;
            }

            // Fetch the full message with sender info
            // Try message_details first, fallback to messages + profiles join if view doesn't exist
            let newMessage: Message | null = null;

            const { data: messageDetails, error: viewError } = await supabase
              .from('message_details')
              .select('*')
              .eq('id', payload.new.id)
              .single();

            if (messageDetails && !viewError) {
              newMessage = messageDetails as Message;
              // Ensure status is set
              if (!newMessage.status) {
                newMessage.status = newMessage.is_read ? 'read' : 'delivered';
              }
            } else {
              // Fallback: fetch from messages table and join with profiles
              const { data: messageData, error: messageError } = await supabase
                .from(DATABASE_TABLES.MESSAGES)
                .select(
                  `
                  *,
                  sender:profiles!messages_sender_id_fkey(id, username, name, avatar_url)
                `
                )
                .eq('id', payload.new.id)
                .single();

              // Type for the joined query result
              type MessageWithSender = {
                id: string;
                conversation_id: string;
                sender_id: string;
                content: string;
                message_type: string;
                metadata: Record<string, unknown> | null;
                created_at: string;
                updated_at: string;
                is_deleted: boolean;
                edited_at: string | null;
                sender: {
                  id: string;
                  username: string | null;
                  name: string | null;
                  avatar_url: string | null;
                } | null;
              };

              const typedMessageData = messageData as MessageWithSender | null;

              if (typedMessageData && !messageError) {
                newMessage = {
                  ...typedMessageData,
                  sender: typedMessageData.sender
                    ? {
                        id: typedMessageData.sender.id,
                        username: typedMessageData.sender.username || '',
                        name: typedMessageData.sender.name || '',
                        avatar_url: typedMessageData.sender.avatar_url || null,
                      }
                    : {
                        id: payload.new.sender_id,
                        username: '',
                        name: '',
                        avatar_url: null,
                      },
                  is_read: false,
                  is_delivered: true,
                  status: 'delivered' as const,
                } as Message;
              } else {
                console.error(
                  '[useMessageSubscription] Failed to fetch message:',
                  messageError || viewError
                );
                // Last resort: create message from payload
                if (payload.new) {
                  newMessage = {
                    id: payload.new.id,
                    conversation_id: payload.new.conversation_id,
                    sender_id: payload.new.sender_id,
                    content: payload.new.content,
                    message_type: payload.new.message_type || 'text',
                    metadata: payload.new.metadata,
                    created_at: payload.new.created_at,
                    updated_at: payload.new.updated_at || payload.new.created_at,
                    is_deleted: payload.new.is_deleted || false,
                    edited_at: payload.new.edited_at || null,
                    sender: {
                      id: payload.new.sender_id,
                      username: '',
                      name: '',
                      avatar_url: null,
                    },
                    is_read: false,
                    is_delivered: true,
                    status: 'delivered' as const,
                  } as Message;
                }
              }
            }

            if (newMessage) {
              // Ensure message has all required fields with proper defaults
              const messageWithStatus: Message = {
                ...newMessage,
                // Ensure sender object exists
                sender: newMessage.sender || {
                  id: payload.new.sender_id,
                  username: '',
                  name: '',
                  avatar_url: null,
                },
                // Ensure status fields are set
                is_delivered: newMessage.is_delivered ?? true, // If it's in DB and we received it, it's delivered
                is_read: newMessage.is_read ?? false,
                status: newMessage.status || (newMessage.is_read ? 'read' : 'delivered'),
              };

              debugLog('[useMessageSubscription] ✅ Processed new message:', {
                id: messageWithStatus.id,
                status: messageWithStatus.status,
                senderId: messageWithStatus.sender_id,
              });

              if (onNewMessage) {
                // Call immediately - React will batch updates
                onNewMessage(messageWithStatus);
              } else {
                console.warn('[useMessageSubscription] ⚠️ onNewMessage callback not provided');
              }
            } else {
              console.error(
                '[useMessageSubscription] ❌ Failed to create message object from payload'
              );
            }
          } catch (error) {
            console.error('[useMessageSubscription] Error processing real-time message:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          const { onNewMessage } = callbacksRef.current;
          debugLog('[useMessageSubscription] update', payload.new.id);
          // Handle message updates (e.g., edited, deleted)
          if (onNewMessage && payload.new) {
            try {
              const { data: messageDetails } = await supabase
                .from('message_details')
                .select('*')
                .eq('id', payload.new.id)
                .single();

              if (messageDetails) {
                onNewMessage(messageDetails as Message);
              }
            } catch (error) {
              console.error('[useMessageSubscription] Error processing message update:', error);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_participants',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async payload => {
          debugLog('[useMessageSubscription] read receipt update', {
            conversationId,
            userId: payload.new?.user_id,
          });

          const { onReadReceiptUpdate } = callbacksRef.current;
          // When someone marks conversation as read, update read receipts for sender's messages
          if (onReadReceiptUpdate && payload.new) {
            onReadReceiptUpdate(conversationId);
          }
        }
      )
      .subscribe((status, err) => {
        if (!isMountedRef.current) {
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          const error = err || new Error(`Subscription error: ${status}`);
          console.error(`[useMessageSubscription] channel error for ${conversationId}:`, error);
          setupInProgressRef.current = false;
          if (onSubscriptionStatusChange) {
            onSubscriptionStatusChange(status, error);
          }
          // Attempt to reconnect
          if (attemptReconnectRef.current) {
            attemptReconnectRef.current();
          }
        } else if (status === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0; // Reset on successful subscription
          setupInProgressRef.current = false;
          hasSubscribedRef.current = true;
          debugLog(`[useMessageSubscription] ✅ Successfully subscribed to ${conversationId}`);
          if (onSubscriptionStatusChange) {
            onSubscriptionStatusChange(status);
          }
        } else if (status === 'CLOSED') {
          debugLog(`[useMessageSubscription] ⚠️ Channel closed for ${conversationId}`);
          setupInProgressRef.current = false;
          if (onSubscriptionStatusChange) {
            onSubscriptionStatusChange(status);
          }
          // Only attempt to reconnect if we were previously subscribed and not intentionally closed
          if (
            hasSubscribedRef.current &&
            isMountedRef.current &&
            enabled &&
            attemptReconnectRef.current
          ) {
            attemptReconnectRef.current();
          }
        } else {
          debugLog(`[useMessageSubscription] status ${status} for ${conversationId}`);
          if (onSubscriptionStatusChange) {
            onSubscriptionStatusChange(status);
          }
        }
      });

    channelRef.current = channel;
  }, [conversationId, user?.id, enabled, getReconnectDelay, onSubscriptionStatusChange]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!conversationId || !user?.id || !enabled) {
      // Clean up existing channel if disabled
      if (channelRef.current) {
        debugLog(`[useMessageSubscription] cleaning up disabled subscription: ${conversationId}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
      setupInProgressRef.current = false;
      hasSubscribedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }

    // Only setup if not already subscribed
    if (!hasSubscribedRef.current) {
      setupSubscription();
    }

    return () => {
      isMountedRef.current = false;
      setupInProgressRef.current = false;
      hasSubscribedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user?.id, enabled]); // Removed setupSubscription from deps to prevent re-runs on callback changes
}
