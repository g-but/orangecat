'use client';

import React from 'react';
import { Heart, MessageCircle, Share2, ThumbsDown, Repeat2 } from 'lucide-react';
import { ShareModal } from '@/components/timeline/ShareModal';
import { TimelineDisplayEvent } from '@/types/timeline';
import { usePostInteractions } from '@/hooks/usePostInteractions';

/**
 * PostActions Component
 *
 * Renders interaction buttons (like, dislike, comment, repost, share) for a post.
 * All business logic is delegated to the usePostInteractions hook for DRY compliance.
 */

interface PostActionsProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  onAddEvent?: (event: TimelineDisplayEvent) => void;
  onToggleComments?: () => void;
  onRepostClick?: () => void;
  isReposting?: boolean;
}

export function PostActions({
  event,
  onUpdate,
  onAddEvent,
  onToggleComments,
  onRepostClick,
  isReposting = false
}: PostActionsProps) {
  // Delegate all interaction logic to the hook
  const {
    isLiking,
    handleLike,
    isDisliking,
    handleDislike,
    isSharing,
    shareOpen,
    handleShareOpen,
    handleShareClose,
    handleShareConfirm,
  } = usePostInteractions({ event, onUpdate, onAddEvent });

  return (
    <>
      {/* Interaction Icons Row - X/Twitter style */}
      <div className="flex items-center justify-between max-w-[425px] mt-3">
        {/* Reply */}
        <button
          onClick={onToggleComments}
          className="group flex items-center gap-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 rounded-full p-2 -ml-2 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">
            {(() => {
              const replyTotal =
                event.replyCount ??
                (Array.isArray(event.replies) ? event.replies.length : undefined) ??
                event.commentsCount ??
                0;
              return replyTotal > 0 ? replyTotal : '';
            })()}
          </span>
        </button>

        {/* Repost */}
        <button
          onClick={onRepostClick}
          disabled={isReposting}
          className={`group flex items-center gap-1 rounded-full p-2 transition-colors ${
            event.userReposted
              ? 'text-green-500 hover:bg-green-50/50'
              : 'text-gray-500 hover:text-green-500 hover:bg-green-50/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Repeat2 className={`w-5 h-5 ${event.userReposted ? 'fill-current' : ''}`} />
          <span className="text-sm">
            {(event.repostsCount || 0) > 0 ? event.repostsCount : ''}
          </span>
        </button>

        {/* Like */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`group flex items-center gap-1 rounded-full p-2 transition-colors ${
            event.userLiked
              ? 'text-red-500 hover:bg-red-50/50'
              : 'text-gray-500 hover:text-red-500 hover:bg-red-50/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Heart className={`w-5 h-5 ${event.userLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">
            {(event.likesCount || 0) > 0 ? event.likesCount : ''}
          </span>
        </button>

        {/* Dislike */}
        <button
          onClick={handleDislike}
          disabled={isDisliking}
          className={`group flex items-center gap-1 rounded-full p-2 transition-colors ${
            event.userDisliked
              ? 'text-orange-500 hover:bg-orange-50/50'
              : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="Dislike this post (wisdom of crowds - helps detect scams)"
        >
          <ThumbsDown className={`w-5 h-5 ${event.userDisliked ? 'fill-current' : ''}`} />
          <span className="text-sm">
            {(event.dislikesCount || 0) > 0 ? event.dislikesCount : ''}
          </span>
        </button>

        {/* Share */}
        <button
          onClick={handleShareOpen}
          disabled={isSharing}
          className={`group flex items-center gap-1 rounded-full p-2 transition-colors ${
            event.userShared
              ? 'text-blue-500 hover:bg-blue-50/50'
              : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50/50'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        onClose={handleShareClose}
        onShare={handleShareConfirm}
        defaultText=""
        isSubmitting={isSharing}
      />
    </>
  );
}




























