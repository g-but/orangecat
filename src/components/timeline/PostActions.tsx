'use client';

import React, { useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, ThumbsDown, Repeat2 } from 'lucide-react';
import { ShareModal } from '@/components/timeline/ShareModal';
import { TimelineDisplayEvent } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

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
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Like handler with optimistic updates
  const handleLike = useCallback(async () => {
    if (isLiking) return;

    const originalLiked = !!event.userLiked;
    const originalCount = event.likesCount || 0;
    const nextLiked = !originalLiked;
    const nextCount = Math.max(0, originalCount + (nextLiked ? 1 : -1));

    // Optimistic update
    onUpdate({ userLiked: nextLiked, likesCount: nextCount });
    setIsLiking(true);

    try {
      const result = await timelineService.toggleLike(event.id);
      if (result.success) {
        onUpdate({ userLiked: result.liked, likesCount: result.likeCount });
      } else {
        // Revert on failure
        onUpdate({ userLiked: originalLiked, likesCount: originalCount });
      }
    } catch (error) {
      logger.error('Failed to toggle like', error, 'PostActions');
      onUpdate({ userLiked: originalLiked, likesCount: originalCount });
    } finally {
      setIsLiking(false);
    }
  }, [event.id, event.userLiked, event.likesCount, isLiking, onUpdate]);

  // Dislike handler with optimistic updates
  const handleDislike = useCallback(async () => {
    if (isDisliking) return;

    const originalDisliked = !!event.userDisliked;
    const originalCount = event.dislikesCount || 0;
    const nextDisliked = !originalDisliked;
    const nextCount = Math.max(0, originalCount + (nextDisliked ? 1 : -1));

    // Optimistic update
    onUpdate({ userDisliked: nextDisliked, dislikesCount: nextCount });
    setIsDisliking(true);

    try {
      const result = await timelineService.toggleDislike(event.id);
      if (result.success) {
        onUpdate({ userDisliked: result.disliked, dislikesCount: result.dislikeCount });
      } else {
        // Revert on failure
        onUpdate({ userDisliked: originalDisliked, dislikesCount: originalCount });
      }
    } catch (error) {
      logger.error('Failed to toggle dislike', error, 'PostActions');
      onUpdate({ userDisliked: originalDisliked, dislikesCount: originalCount });
    } finally {
      setIsDisliking(false);
    }
  }, [event.id, event.userDisliked, event.dislikesCount, isDisliking, onUpdate]);

  // Share handlers
  const handleShareOpen = useCallback(() => {
    setShareOpen(true);
  }, []);

  const handleShareConfirm = useCallback(async (shareText: string) => {
    if (isSharing) return;

    const originalCount = event.sharesCount || 0;
    // Optimistic update
    onUpdate({ userShared: true, sharesCount: originalCount + 1 });
    setIsSharing(true);

    try {
      const result = await timelineService.shareEvent(
        event.id,
        shareText?.trim() || 'Shared from timeline',
        'public'
      );
      if (result.success) {
        onUpdate({ userShared: true, sharesCount: result.shareCount });
      } else {
        // Revert on failure
        onUpdate({ userShared: false, sharesCount: originalCount });
      }
    } catch (error) {
      logger.error('Failed to share event', error, 'PostActions');
      onUpdate({ userShared: false, sharesCount: originalCount });
    } finally {
      setIsSharing(false);
      setShareOpen(false);
    }
  }, [event.id, isSharing, onUpdate]);


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
            {(event.commentsCount || 0) > 0 ? event.commentsCount : ''}
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
        onClose={() => setShareOpen(false)}
        onShare={handleShareConfirm}
        defaultText=""
        isSubmitting={isSharing}
      />
    </>
  );
}










