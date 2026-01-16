'use client';

import { useState, useCallback } from 'react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';

interface UsePostInteractionsProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  onAddEvent?: (event: TimelineDisplayEvent) => void;
}

export interface UsePostInteractionsReturn {
  // Like functionality
  isLiking: boolean;
  handleLike: () => Promise<void>;

  // Dislike functionality
  isDisliking: boolean;
  handleDislike: () => Promise<void>;

  // Share functionality
  isSharing: boolean;
  shareOpen: boolean;
  handleShareOpen: () => void;
  handleShareClose: () => void;
  handleShareConfirm: (shareText: string) => Promise<void>;

  // Repost functionality
  isReposting: boolean;
  repostModalOpen: boolean;
  handleRepostClick: () => void;
  handleRepostClose: () => void;
  handleSimpleRepost: () => Promise<void>;
  handleQuoteRepost: (quoteText: string) => Promise<void>;
}

export function usePostInteractions({
  event,
  onUpdate,
  onAddEvent,
}: UsePostInteractionsProps): UsePostInteractionsReturn {
  const { user } = useAuth();

  // Interaction states
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [repostModalOpen, setRepostModalOpen] = useState(false);

  // Like handler with optimistic updates
  const handleLike = useCallback(async () => {
    if (isLiking) {
      return;
    }

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
      logger.error('Failed to toggle like', error, 'usePostInteractions');
      onUpdate({ userLiked: originalLiked, likesCount: originalCount });
    } finally {
      setIsLiking(false);
    }
  }, [event.id, event.userLiked, event.likesCount, isLiking, onUpdate]);

  // Dislike handler with optimistic updates
  const handleDislike = useCallback(async () => {
    if (isDisliking) {
      return;
    }

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
      logger.error('Failed to toggle dislike', error, 'usePostInteractions');
      onUpdate({ userDisliked: originalDisliked, dislikesCount: originalCount });
    } finally {
      setIsDisliking(false);
    }
  }, [event.id, event.userDisliked, event.dislikesCount, isDisliking, onUpdate]);

  // Share handlers
  const handleShareOpen = useCallback(() => {
    setShareOpen(true);
  }, []);

  const handleShareClose = useCallback(() => {
    setShareOpen(false);
  }, []);

  const handleShareConfirm = useCallback(
    async (shareText: string) => {
      if (isSharing) {
        return;
      }

      const originalCount = event.sharesCount || 0;
      // Optimistic update
      onUpdate({ userShared: true, sharesCount: originalCount + 1 });
      setIsSharing(true);

      try {
        const result = await timelineService.shareEvent(
          event.id,
          undefined, // userId - will be fetched from current auth
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
        logger.error('Failed to share event', error, 'usePostInteractions');
        onUpdate({ userShared: false, sharesCount: originalCount });
      } finally {
        setIsSharing(false);
        setShareOpen(false);
      }
    },
    [event.id, event.sharesCount, isSharing, onUpdate]
  );

  // Repost handlers
  const handleRepostClick = useCallback(() => {
    if (!user?.id) {
      return;
    }
    setRepostModalOpen(true);
  }, [user?.id]);

  const handleRepostClose = useCallback(() => {
    setRepostModalOpen(false);
  }, []);

  const handleSimpleRepost = useCallback(async () => {
    if (isReposting || !user?.id) {
      return;
    }

    setIsReposting(true);
    try {
      const result = await timelineService.createEvent({
        eventType: 'status_update',
        actorId: user.id,
        subjectType: 'profile',
        subjectId: user.id,
        title: '',
        description: '',
        visibility: 'public',
        metadata: {
          is_repost: true,
          original_event_id: event.id,
          original_actor_id: event.actor.id,
          original_actor_name: event.actor.name,
          original_actor_username: event.actor.username,
          original_actor_avatar: event.actor.avatar,
          original_description: event.description || '',
        },
        parentEventId: event.id,
      });

      if (result.success) {
        logger.info('Successfully reposted event', null, 'usePostInteractions');
        if (result.event && onAddEvent) {
          // Cast to TimelineDisplayEvent - the timeline will refresh with full data anyway
          onAddEvent(result.event as unknown as TimelineDisplayEvent);
        }
        setRepostModalOpen(false);
      } else {
        logger.error('Failed to repost event', result.error, 'usePostInteractions');
        throw new Error(result.error || 'Failed to repost');
      }
    } catch (error) {
      logger.error('Error reposting event', error, 'usePostInteractions');
      throw error;
    } finally {
      setIsReposting(false);
    }
  }, [
    event.id,
    event.actor.id,
    event.actor.name,
    event.actor.username,
    event.actor.avatar,
    event.description,
    isReposting,
    user?.id,
    onAddEvent,
  ]);

  const handleQuoteRepost = useCallback(
    async (quoteText: string) => {
      if (isReposting || !user?.id || !quoteText.trim()) {
        return;
      }

      setIsReposting(true);
      try {
        const result = await timelineService.createEvent({
          eventType: 'status_update',
          actorId: user.id,
          subjectType: 'profile',
          subjectId: user.id,
          title: '',
          description: quoteText.trim(),
          visibility: 'public',
          metadata: {
            is_quote_repost: true,
            is_repost: true,
            original_event_id: event.id,
            original_actor_id: event.actor.id,
            original_actor_name: event.actor.name,
            original_actor_username: event.actor.username,
            original_actor_avatar: event.actor.avatar,
            original_description:
              event.metadata &&
              typeof event.metadata === 'object' &&
              'original_description' in event.metadata &&
              typeof event.metadata.original_description === 'string'
                ? event.metadata.original_description
                : event.description || '',
            quote_text: quoteText.trim(),
          },
          parentEventId: event.id,
        });

        if (result.success) {
          logger.info('Successfully quote reposted event', null, 'usePostInteractions');
          if (result.event && onAddEvent) {
            // Cast to TimelineDisplayEvent - the timeline will refresh with full data anyway
            onAddEvent(result.event as unknown as TimelineDisplayEvent);
          }
          setRepostModalOpen(false);
        } else {
          logger.error('Failed to quote repost event', result.error, 'usePostInteractions');
          throw new Error(result.error || 'Failed to quote repost');
        }
      } catch (error) {
        logger.error('Error quote reposting event', error, 'usePostInteractions');
        throw error;
      } finally {
        setIsReposting(false);
      }
    },
    [
      event.id,
      event.actor.id,
      event.actor.name,
      event.actor.username,
      event.actor.avatar,
      event.description,
      event.metadata,
      isReposting,
      user?.id,
      onAddEvent,
    ]
  );

  return {
    // Like functionality
    isLiking,
    handleLike,

    // Dislike functionality
    isDisliking,
    handleDislike,

    // Share functionality
    isSharing,
    shareOpen,
    handleShareOpen,
    handleShareClose,
    handleShareConfirm,

    // Repost functionality
    isReposting,
    repostModalOpen,
    handleRepostClick,
    handleRepostClose,
    handleSimpleRepost,
    handleQuoteRepost,
  };
}
