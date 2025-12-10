'use client';

import React from 'react';
import Link from 'next/link';
import { MoreHorizontal, Lock } from 'lucide-react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { formatDistanceToNow } from 'date-fns';

interface PostHeaderProps {
  event: TimelineDisplayEvent;
  showMenu?: boolean;
  onMenuToggle?: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  isSimpleRepost?: boolean;
}

export function PostHeader({ event, showMenu, onMenuToggle, onEdit, canEdit, isSimpleRepost }: PostHeaderProps) {
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return timestamp;
    }
  };

  // For simple reposts, show the original author instead of the reposter
  const displayAuthor = isSimpleRepost ? {
    id: event.metadata?.original_actor_id || event.actor.id,
    name: event.metadata?.original_actor_name || event.actor.name,
    username: event.metadata?.original_actor_username || event.actor.username,
    avatar: event.metadata?.original_actor_avatar || event.actor.avatar,
  } : event.actor;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* User Info - X-style inline */}
      <Link
        href={`/profiles/${displayAuthor.username}`}
        className="font-bold text-[15px] text-gray-900 hover:underline"
      >
        {displayAuthor.name}
      </Link>

      <Link
        href={`/profiles/${displayAuthor.username}`}
        className="text-gray-500 text-[15px]"
      >
        @{displayAuthor.username}
      </Link>

      <span className="text-gray-500">·</span>

      {/* Timestamp */}
      <time
        dateTime={event.created_at}
        className="text-gray-500 text-[15px] hover:underline"
        title={new Date(event.created_at).toLocaleString()}
      >
        {formatTimestamp(event.created_at)}
      </time>

      {/* Visibility Indicator - only show if private */}
      {event.visibility === 'private' && (
        <Lock className="w-3.5 h-3.5 text-gray-400 ml-1" title="Private post" />
      )}

      {/* Edited indicator */}
      {event.updated_at && event.updated_at !== event.created_at && (
        <span className="text-gray-400 text-[13px]" title={`Edited ${formatTimestamp(event.updated_at)}`}>
          · edited
        </span>
      )}

      {/* Menu Button - moved to end of line */}
      {canEdit && onMenuToggle && (
        <div className="relative ml-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 -mr-1.5 transition-colors"
            aria-label="Post options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                    onMenuToggle();
                  }}
                  className="w-full text-left px-4 py-2.5 text-[15px] text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  Edit post
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMenuToggle();
                  }}
                  className="w-full text-left px-4 py-2.5 text-[15px] text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
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










