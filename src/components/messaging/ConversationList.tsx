'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Users, MessageSquare, RefreshCw, Trash2 } from 'lucide-react';
import AvatarLink from '@/components/ui/AvatarLink';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/features/messaging/hooks';
import { toast } from 'sonner';

interface Conversation {
  id: string;
  title: string | null;
  is_group: boolean;
  last_message_at: string;
  last_message_preview: string | null;
  last_message_sender_id: string;
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

interface ConversationListProps {
  searchQuery: string;
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  filterTab?: 'all' | 'requests';
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onRequestSelectionMode?: () => void;
  refreshSignal?: number;
}

export default function ConversationList({
  searchQuery,
  selectedConversationId,
  onSelectConversation,
  filterTab = 'all',
  selectionMode = false,
  selectedIds,
  onToggleSelect,
  onRequestSelectionMode,
  refreshSignal,
}: ConversationListProps) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPointerSelecting, setIsPointerSelecting] = useState(false);
  const [dragAction, setDragAction] = useState<'select' | 'deselect' | null>(null);
  const pressTimerRef = React.useRef<number | null>(null);
  const currentUserId = user?.id;

  const { conversations, loading, refresh, removeLocal } = useConversations(searchQuery, selectedConversationId)

  const handleDeleteOne = async (id: string) => {
    removeLocal([id])
    try {
      const res = await fetch('/api/messages/bulk-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [id] })
      })
      if (!res.ok) {
        await refresh()
      }
    } catch {
      await refresh()
    }
  }

  // External refresh signal from parent
  React.useEffect(() => {
    if (typeof refreshSignal !== 'number') return;
    refresh();
  }, [refreshSignal, refresh])

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const toggleSelect = (id: string, desired?: 'select' | 'deselect') => {
    if (!onToggleSelect) return;
    const alreadySelected = selectedIds?.has(id);
    const shouldSelect = desired ? desired === 'select' : !alreadySelected;
    if (shouldSelect && !alreadySelected) {
      onToggleSelect(id);
    } else if (!shouldSelect && alreadySelected) {
      onToggleSelect(id);
    }
  };

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    conversationId: string,
    isSelected: boolean
  ) => {
    // Long-press (touch) to enter selection mode and start selecting
    if (e.pointerType === 'touch') {
      clearPressTimer();
      pressTimerRef.current = window.setTimeout(() => {
        onRequestSelectionMode?.();
        toggleSelect(conversationId, isSelected ? 'deselect' : 'select');
        setIsPointerSelecting(true);
        setDragAction(isSelected ? 'deselect' : 'select');
      }, 350);
    }

    // Mouse/touch drag selection when selection mode is active
    if (selectionMode) {
      e.preventDefault();
      setIsPointerSelecting(true);
      const action = isSelected ? 'deselect' : 'select';
      setDragAction(action);
      toggleSelect(conversationId, action);
    }
  };

  const handlePointerEnter = (conversationId: string) => {
    if (!isPointerSelecting || !dragAction) return;
    toggleSelect(conversationId, dragAction);
  };

  const handlePointerUp = () => {
    clearPressTimer();
    setIsPointerSelecting(false);
    setDragAction(null);
  };

  const filteredConversations = conversations.filter(conversation => {
    if (filterTab === 'requests') {
      return conversation.unread_count > 0;
    }
    if (!searchQuery) {
      return true;
    }

    const searchLower = searchQuery.toLowerCase();

    // Search in conversation title
    if (conversation.title?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in participant names/usernames
    return conversation.participants.some(participant =>
      participant.name?.toLowerCase().includes(searchLower) ||
      participant.username?.toLowerCase().includes(searchLower)
    );
  });

  const getConversationDisplayName = (conversation: Conversation) => {
    if (conversation.title) {
      return conversation.title;
    }

    // For direct messages, show the other participant's name (exclude current user)
    // Filter out invalid participants (null/undefined)
    const otherParticipants = (conversation.participants || []).filter(
      p => p && p.is_active && p.user_id !== currentUserId
    );

    if (otherParticipants.length === 1) {
      return otherParticipants[0].name || otherParticipants[0].username || 'Unknown User';
    }

    if (otherParticipants.length === 0) {
      return 'Notes to Self';
    }

    // For groups without title, show participant names
    return otherParticipants
      .slice(0, 3)
      .map(p => p.name || p.username || 'Unknown')
      .filter(Boolean)
      .join(', ') + (otherParticipants.length > 3 ? ` +${otherParticipants.length - 3}` : '');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    // Get other participants (exclude current user for DMs)
    // Filter out invalid participants (null/undefined)
    const otherParticipants = (conversation.participants || []).filter(
      p => p && p.is_active && p.user_id !== currentUserId
    );

    if (conversation.is_group) {
      return (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
          <Users className="w-5 h-5" />
        </div>
      );
    }

    // For DMs, show the other person's avatar
    if (otherParticipants.length >= 1) {
      const participant = otherParticipants[0];
      // Ensure all values are valid strings or null
      return (
        <AvatarLink
          username={participant?.username && typeof participant.username === 'string' ? participant.username : null}
          userId={participant?.user_id && typeof participant.user_id === 'string' ? participant.user_id : null}
          avatarUrl={participant?.avatar_url && typeof participant.avatar_url === 'string' ? participant.avatar_url : null}
          name={participant?.name && typeof participant.name === 'string' ? participant.name : null}
          size={40}
          className="flex-shrink-0"
        />
      );
    }

    // Fallback for self-conversations or edge cases
    return (
      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
        <MessageSquare className="w-5 h-5 text-gray-600" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-red-400" />
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={() => {
            setError(null);
            refresh();
          }}
          className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {filteredConversations.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-medium">
            {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
          </p>
          {!searchQuery && (
            <p className="text-xs mt-1 text-gray-400">Start a new conversation to get started.</p>
          )}
        </div>
      ) : (
        filteredConversations.map(conversation => (
          <div
            key={conversation.id}
            onPointerDown={(e) =>
              handlePointerDown(e, conversation.id, selectedIds?.has(conversation.id) || false)
            }
            onPointerEnter={() => handlePointerEnter(conversation.id)}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={() => {
              if (isPointerSelecting && dragAction === 'select') {
                // allow continued drag without deselecting on leave
                return;
              }
            }}
            onClick={(e) => {
              // If we were dragging or in selection mode, don't navigate
              if (isPointerSelecting || selectionMode) {
                e.preventDefault();
                return;
              }
              onSelectConversation(conversation.id);
            }}
            className={cn(
              'p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-all duration-150 flex items-start gap-3 group',
              selectedConversationId === conversation.id && 'bg-white shadow-sm border-l-4 border-orange-500',
              selectionMode && 'pr-3'
            )}
          >
            {selectionMode && (
              <input
                type="checkbox"
                checked={selectedIds?.has(conversation.id) || false}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(conversation.id)
                }}
                className="mt-2"
              />
            )}
            {getConversationAvatar(conversation)}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {getConversationDisplayName(conversation)}
                    </h3>
                    {conversation.unread_count > 0 && (
                      <span className="bg-orange-500 text-white text-[11px] leading-4 rounded-full px-2 py-0.5">
                        {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.last_message_preview || 'No messages yet'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {conversation.last_message_at
                        ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
                        : 'No messages'}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>
                      {conversation.is_group
                        ? `${conversation.participants.length} members`
                        : 'Direct message'}
                    </span>
                  </div>
                </div>
                {!selectionMode && (
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 self-start"
                    onClick={(e) => { e.stopPropagation(); handleDeleteOne(conversation.id) }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
