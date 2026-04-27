'use client';

import { TimelineDisplayEvent } from '@/types/timeline';
import { useAuth } from '@/hooks/useAuth';
import { usePostLikeDislike } from '@/hooks/usePostLikeDislike';
import { usePostShare } from '@/hooks/usePostShare';
import { usePostRepost } from '@/hooks/usePostRepost';

interface UsePostInteractionsProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  onAddEvent?: (event: TimelineDisplayEvent) => void;
}

export interface UsePostInteractionsReturn {
  isLiking: boolean;
  handleLike: () => Promise<void>;
  isDisliking: boolean;
  handleDislike: () => Promise<void>;
  isSharing: boolean;
  shareOpen: boolean;
  handleShareOpen: () => void;
  handleShareClose: () => void;
  handleShareConfirm: (shareText: string) => Promise<void>;
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

  const likeDislike = usePostLikeDislike({ event, onUpdate });
  const share = usePostShare({ event, onUpdate });
  const repost = usePostRepost({ event, onAddEvent, userId: user?.id });

  return { ...likeDislike, ...share, ...repost };
}
