'use client';

import { useState, useCallback } from 'react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';

interface Props {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
}

export interface UsePostShareReturn {
  isSharing: boolean;
  shareOpen: boolean;
  handleShareOpen: () => void;
  handleShareClose: () => void;
  handleShareConfirm: (shareText: string) => Promise<void>;
}

export function usePostShare({ event, onUpdate }: Props): UsePostShareReturn {
  const [isSharing, setIsSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const handleShareOpen = useCallback(() => setShareOpen(true), []);
  const handleShareClose = useCallback(() => setShareOpen(false), []);

  const handleShareConfirm = useCallback(
    async (shareText: string) => {
      if (isSharing) {
        return;
      }

      const originalCount = event.sharesCount || 0;
      onUpdate({ userShared: true, sharesCount: originalCount + 1 });
      setIsSharing(true);

      try {
        const result = await timelineService.shareEvent(
          event.id,
          undefined,
          shareText?.trim() || 'Shared from timeline',
          'public'
        );
        if (result.success) {
          onUpdate({ userShared: true, sharesCount: result.shareCount });
        } else {
          onUpdate({ userShared: false, sharesCount: originalCount });
        }
      } catch (error) {
        logger.error('Failed to share event', error, 'usePostShare');
        onUpdate({ userShared: false, sharesCount: originalCount });
      } finally {
        setIsSharing(false);
        setShareOpen(false);
      }
    },
    [event.id, event.sharesCount, isSharing, onUpdate]
  );

  return { isSharing, shareOpen, handleShareOpen, handleShareClose, handleShareConfirm };
}
