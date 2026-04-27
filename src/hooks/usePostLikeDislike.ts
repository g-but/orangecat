'use client';

import { useState, useCallback } from 'react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';

interface Props {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
}

export interface UsePostLikeDislikeReturn {
  isLiking: boolean;
  handleLike: () => Promise<void>;
  isDisliking: boolean;
  handleDislike: () => Promise<void>;
}

export function usePostLikeDislike({ event, onUpdate }: Props): UsePostLikeDislikeReturn {
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

  const handleLike = useCallback(async () => {
    if (isLiking) {
      return;
    }

    const originalLiked = !!event.userLiked;
    const originalCount = event.likesCount || 0;
    const nextLiked = !originalLiked;
    const nextCount = Math.max(0, originalCount + (nextLiked ? 1 : -1));

    onUpdate({ userLiked: nextLiked, likesCount: nextCount });
    setIsLiking(true);

    try {
      const result = await timelineService.toggleLike(event.id);
      if (result.success) {
        onUpdate({ userLiked: result.liked, likesCount: result.likeCount });
      } else {
        onUpdate({ userLiked: originalLiked, likesCount: originalCount });
      }
    } catch (error) {
      logger.error('Failed to toggle like', error, 'usePostLikeDislike');
      onUpdate({ userLiked: originalLiked, likesCount: originalCount });
    } finally {
      setIsLiking(false);
    }
  }, [event.id, event.userLiked, event.likesCount, isLiking, onUpdate]);

  const handleDislike = useCallback(async () => {
    if (isDisliking) {
      return;
    }

    const originalDisliked = !!event.userDisliked;
    const originalCount = event.dislikesCount || 0;
    const nextDisliked = !originalDisliked;
    const nextCount = Math.max(0, originalCount + (nextDisliked ? 1 : -1));

    onUpdate({ userDisliked: nextDisliked, dislikesCount: nextCount });
    setIsDisliking(true);

    try {
      const result = await timelineService.toggleDislike(event.id);
      if (result.success) {
        onUpdate({ userDisliked: result.disliked, dislikesCount: result.dislikeCount });
      } else {
        onUpdate({ userDisliked: originalDisliked, dislikesCount: originalCount });
      }
    } catch (error) {
      logger.error('Failed to toggle dislike', error, 'usePostLikeDislike');
      onUpdate({ userDisliked: originalDisliked, dislikesCount: originalCount });
    } finally {
      setIsDisliking(false);
    }
  }, [event.id, event.userDisliked, event.dislikesCount, isDisliking, onUpdate]);

  return { isLiking, handleLike, isDisliking, handleDislike };
}
