'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Lock, Pencil, Trash2 } from 'lucide-react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { formatDistanceToNow } from 'date-fns';

interface PostHeaderProps {
  event: TimelineDisplayEvent;
  showMenu?: boolean;
  onMenuToggle?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  isSimpleRepost?: boolean;
}

export function PostHeader({
  event,
  showMenu,
  onMenuToggle,
  onEdit,
  onDelete,
  canEdit,
  isSimpleRepost,
}: PostHeaderProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) {
      return;
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onMenuToggle?.();
      }
    };

    // Use setTimeout to avoid immediate trigger from the toggle click
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenu, onMenuToggle]);

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  // For simple reposts, show the original author instead of the reposter
  const displayAuthor = isSimpleRepost
    ? {
        id: event.metadata?.original_actor_id || event.actor.id,
        name: event.metadata?.original_actor_name || event.actor.name,
        username: event.metadata?.original_actor_username || event.actor.username,
        avatar: event.metadata?.original_actor_avatar || event.actor.avatar,
      }
    : event.actor;

  // TimelineDisplayEvent extends TimelineEvent which has eventTimestamp, createdAt, updatedAt
  // Use eventTimestamp as primary, fallback to createdAt for backward compatibility
  const timestamp = event.eventTimestamp || event.createdAt;
  const updatedTimestamp = event.updatedAt;
  const isEdited = updatedTimestamp && updatedTimestamp !== timestamp;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* User Info - X-style inline */}
      <Link
        href={`/profiles/${displayAuthor.username}`}
        className="font-bold text-sm text-gray-900 hover:underline"
        onClick={e => e.stopPropagation()}
      >
        {displayAuthor.name}
      </Link>

      <Link
        href={`/profiles/${displayAuthor.username}`}
        className="text-gray-500 text-sm"
        onClick={e => e.stopPropagation()}
      >
        @{displayAuthor.username}
      </Link>

      <span className="text-gray-500">·</span>

      {/* Timestamp */}
      <time
        dateTime={timestamp}
        className="text-gray-500 text-sm hover:underline"
        title={timestamp ? new Date(timestamp).toLocaleString() : undefined}
      >
        {timestamp ? formatTimestamp(timestamp) : ''}
      </time>

      {/* Visibility Indicator - only show if private */}
      {event.visibility === 'private' && (
        <span title="Private post">
          <Lock className="w-4 h-4 text-gray-400 ml-1" />
        </span>
      )}

      {/* Edited indicator */}
      {isEdited && (
        <span
          className="text-gray-400 text-xs"
          title={updatedTimestamp ? `Edited ${formatTimestamp(updatedTimestamp)}` : 'Edited'}
        >
          · edited
        </span>
      )}

      {/* Menu Button - moved to end of line */}
      {canEdit && onMenuToggle && (
        <div className="relative ml-auto" ref={menuRef}>
          <button
            onClick={e => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 -mr-1.5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Post options"
            aria-expanded={showMenu}
            aria-haspopup="menu"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
              role="menu"
            >
              <div className="py-1">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  role="menuitem"
                >
                  <Pencil className="w-4 h-4" />
                  Edit post
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete post
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PostHeader;
