'use client';

import { useCallback, useEffect, useRef } from 'react';
import supabase from '@/lib/supabase/browser';
import { DATABASE_TABLES } from '@/config/database-tables';
import { useAuth } from '@/hooks/useAuth';
import { debugLog } from '../lib/constants';
import { useTypingSubscription } from './useTypingSubscription';

const DEFAULT_STOP_DELAY = 2000;
const DEFAULT_REFRESH_INTERVAL = 5000;
/**
 * How long a typing row stays valid. Readers filter on `expires_at > now()`, so
 * this is the self-healing window: a tab that closes mid-sentence stops showing
 * as typing within it. It must exceed DEFAULT_REFRESH_INTERVAL, or the bubble
 * blinks out between heartbeats.
 */
const TYPING_TTL = 10_000;

export interface TypingUser {
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  startedAt: Date;
}

interface UseTypingIndicatorOptions {
  enabled?: boolean;
  stopDelay?: number;
  refreshInterval?: number;
}

interface UseTypingIndicatorReturn {
  typingUsers: TypingUser[];
  startTyping: () => void;
  stopTyping: () => void;
  isAnyoneTyping: boolean;
  typingText: string | null;
}

export function useTypingIndicator(
  conversationId: string | null,
  options: UseTypingIndicatorOptions = {}
): UseTypingIndicatorReturn {
  const { user } = useAuth();
  const {
    enabled = true,
    stopDelay = DEFAULT_STOP_DELAY,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  } = options;

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const sendTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!conversationId || !user?.id || !enabled) {
        return;
      }
      // Was an RPC to `set_typing_indicator`, a function that has never existed:
      // production answered PGRST202 into the catch, so no typing row was ever
      // written and the indicator could never appear. No database function is
      // needed — the table is UNIQUE (conversation_id, user_id) and its RLS
      // policies already permit exactly these three operations for the owner,
      // scoped to conversations they actually belong to.
      const { error } = isTyping
        ? await supabase.from(DATABASE_TABLES.TYPING_INDICATORS).upsert(
            {
              conversation_id: conversationId,
              user_id: user.id,
              started_at: new Date().toISOString(),
              // Readers select `expires_at > now()`, so this is what makes the
              // indicator self-clearing if the tab closes mid-sentence. It must
              // outlive the refresh interval or the bubble flickers between
              // heartbeats.
              expires_at: new Date(Date.now() + TYPING_TTL).toISOString(),
            },
            { onConflict: 'conversation_id,user_id' }
          )
        : await supabase
            .from(DATABASE_TABLES.TYPING_INDICATORS)
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', user.id);

      if (error) {
        debugLog('[useTypingIndicator] error sending typing status:', error);
        return;
      }
      debugLog('[useTypingIndicator] sent typing status:', isTyping);
    },
    [conversationId, user?.id, enabled]
  );

  const startTyping = useCallback(() => {
    if (!enabled || !conversationId || !user?.id) {
      return;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStatus(true);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingStatus(false);
    }, stopDelay);
  }, [enabled, conversationId, user?.id, sendTypingStatus, stopDelay]);

  const stopTyping = useCallback(() => {
    if (!enabled || !conversationId || !user?.id) {
      return;
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingStatus(false);
    }
  }, [enabled, conversationId, user?.id, sendTypingStatus]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const typingUsers = useTypingSubscription({
    conversationId,
    userId: user?.id,
    enabled,
    sendTypingStatus,
    refreshInterval,
    isTypingRef,
  });

  const typingText =
    typingUsers.length === 0
      ? null
      : typingUsers.length === 1
        ? `${typingUsers[0].name || typingUsers[0].username} is typing...`
        : typingUsers.length === 2
          ? `${typingUsers[0].name || typingUsers[0].username} and ${typingUsers[1].name || typingUsers[1].username} are typing...`
          : `${typingUsers.length} people are typing...`;

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isAnyoneTyping: typingUsers.length > 0,
    typingText,
  };
}
