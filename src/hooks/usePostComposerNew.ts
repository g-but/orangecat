import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { offlineQueueService } from '@/lib/offline-queue';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';
import { TimelineVisibility } from '@/types/timeline';
import { usePostDraft } from '@/hooks/usePostDraft';
import {
  createOptimisticEvent,
  formatPostError,
  truncateToTitle,
  buildTimelineContexts,
  fetchUserProjects,
  ensureProfileExists,
} from '@/hooks/usePostComposerUtils';

export interface PostComposerOptions {
  subjectType?: 'profile' | 'project';
  subjectId?: string;
  allowProjectSelection?: boolean;
  defaultVisibility?: TimelineVisibility;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (event?: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOptimisticUpdate?: (event: any) => void;
  debounceMs?: number;
  enableDrafts?: boolean;
  enableRetry?: boolean;
  maxLength?: number;
  /** Parent event ID for replies/comments */
  parentEventId?: string;
}

export interface PostComposerState {
  // Form state
  content: string;
  setContent: (content: string) => void;
  visibility: TimelineVisibility;
  setVisibility: (visibility: TimelineVisibility) => void;
  selectedProjects: string[];
  setSelectedProjects: (projects: string[]) => void;

  // UI state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userProjects: any[];
  loadingProjects: boolean;
  isPosting: boolean;
  error: string | null;
  postSuccess: boolean;
  retryCount: number;

  // Computed values
  characterCount: number;
  isValid: boolean;
  canPost: boolean;

  // Actions
  handlePost: () => Promise<void>;
  toggleProjectSelection: (projectId: string) => void;
  reset: () => void;
  clearError: () => void;
  retry: () => Promise<void>;
}

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Mobile-first, robust posting hook
 * Features: Drafts, retry logic, optimistic updates, offline support
 */
export function usePostComposer(options: PostComposerOptions = {}): PostComposerState {
  const { user } = useAuth();
  const {
    subjectType = 'profile',
    subjectId,
    allowProjectSelection = false,
    defaultVisibility = 'public',
    onSuccess,
    onOptimisticUpdate,
    debounceMs = 300,
    enableDrafts = true,
    enableRetry = true,
    maxLength = 500,
    parentEventId,
  } = options;

  // Core state
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<TimelineVisibility>(defaultVisibility || 'public');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for timers
  const successTimer = useRef<NodeJS.Timeout>();
  const retryTimer = useRef<NodeJS.Timeout>();

  // Draft management (extracted hook)
  const draftSetters = useMemo(() => ({ setContent, setVisibility, setSelectedProjects }), []);
  const { clearDraft } = usePostDraft(
    { subjectType, subjectId, enableDrafts, debounceMs, defaultVisibility },
    { content, visibility, selectedProjects },
    draftSetters
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      [successTimer, retryTimer].forEach(timer => {
        if (timer.current) {
          clearTimeout(timer.current);
        }
      });
    };
  }, []);

  // Computed values
  const characterCount = content.length;
  const isValid = content.trim().length > 0 && characterCount <= maxLength;
  const canPost = isValid && !isPosting && !loadingProjects;

  // Content setter (clears errors)
  const handleSetContent = useCallback(
    (newContent: string) => {
      setContent(newContent);
      if (error) {
        setError(null);
      }
    },
    [error]
  );

  // Load user projects on mount
  useEffect(() => {
    if (!allowProjectSelection || !user?.id) {
      return;
    }
    setLoadingProjects(true);
    fetchUserProjects(user.id).then(projects => {
      setUserProjects(projects);
      setLoadingProjects(false);
    });
  }, [allowProjectSelection, user?.id]);

  // Main posting logic
  const performPost = useCallback(async (): Promise<boolean> => {
    if (!canPost || !user?.id) {
      return false;
    }

    try {
      const profileExists = await ensureProfileExists(user.id);
      if (!profileExists) {
        throw new Error(
          'Unable to verify your profile. Please refresh the page and try again. If the problem persists, you may need to complete your profile setup.'
        );
      }

      const postContent = content.trim();
      const title = truncateToTitle(postContent);

      // Create optimistic event immediately
      const optimisticEvent = createOptimisticEvent({
        user,
        content: postContent,
        subjectType,
        subjectId,
        visibility,
        selectedProjects,
        parentEventId,
      });
      if (onOptimisticUpdate) {
        onOptimisticUpdate(optimisticEvent);
      }

      // Build timeline visibility contexts
      const timelineContexts = buildTimelineContexts(
        subjectType,
        subjectId,
        user.id,
        selectedProjects,
        visibility,
        parentEventId
      );

      let mainPostResult;
      if (parentEventId) {
        mainPostResult = await timelineService.createEvent({
          eventType: 'status_update',
          actorId: user.id,
          subjectType,
          subjectId: subjectId || user.id,
          title,
          description: postContent,
          visibility,
          metadata: {
            is_user_post: true,
            is_reply: true,
          },
          parentEventId,
        });
      } else {
        mainPostResult = await timelineService.createEventWithVisibility({
          eventType: 'status_update',
          actorId: user.id,
          subjectType,
          subjectId: subjectId || user.id,
          title,
          description: postContent,
          visibility,
          metadata: {
            is_user_post: true,
            cross_posted_count: selectedProjects.length,
          },
          timelineContexts,
        });
      }

      if (!mainPostResult.success) {
        const errorMsg = mainPostResult.error || 'Failed to create post';
        logger.error(
          'Post creation failed',
          { error: errorMsg, mainPostResult },
          'usePostComposer'
        );
        throw new Error(errorMsg);
      }

      // Success
      clearDraft();
      setPostSuccess(true);
      onSuccess?.(mainPostResult.event);

      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
      successTimer.current = setTimeout(() => {
        setPostSuccess(false);
      }, 3000);

      return true;
    } catch (err) {
      const errorMessage = formatPostError(err);
      setError(errorMessage);
      logger.error('Failed to create post', err, 'usePostComposer');
      return false;
    }
  }, [
    canPost,
    user,
    content,
    onOptimisticUpdate,
    subjectType,
    subjectId,
    visibility,
    selectedProjects,
    parentEventId,
    onSuccess,
    clearDraft,
  ]);

  // Reset function
  const reset = useCallback(() => {
    setContent('');
    setSelectedProjects([]);
    setError(null);
    setPostSuccess(false);
    setRetryCount(0);
    clearDraft();
  }, [clearDraft]);

  // Public API: handlePost with offline + retry support
  const handlePost = useCallback(async () => {
    if (!canPost || !user?.id) {
      return;
    }

    // Offline handling: queue the post instead of sending
    if (!navigator.onLine) {
      try {
        const postContent = content.trim();
        const postTitle = truncateToTitle(postContent);
        const postPayload = {
          eventType: 'status_update',
          actorId: user.id,
          subjectType,
          subjectId: subjectId || user.id,
          title: postTitle,
          description: postContent,
          visibility,
          metadata: {
            is_user_post: true,
            cross_posted: subjectId && subjectId !== user.id,
            cross_posted_projects: selectedProjects.length > 0 ? selectedProjects : undefined,
          },
        };
        await offlineQueueService.addToQueue(postPayload, user.id);

        setError(null);
        setPostSuccess(true);

        if (onOptimisticUpdate) {
          const offlineEvent = createOptimisticEvent({
            user,
            content: content.trim(),
            subjectType,
            subjectId,
            visibility,
            selectedProjects,
            parentEventId,
          });
          // Override with offline-specific metadata
          offlineEvent.id = `offline-${Date.now()}`;
          offlineEvent.metadata = {
            ...offlineEvent.metadata,
            is_offline_queued: true,
            offline_queued_at: new Date().toISOString(),
          };
          onOptimisticUpdate(offlineEvent);
        }

        reset();
      } catch (err) {
        setError('Failed to save post for offline sending.');
        logger.error('Failed to add to offline queue', err, 'usePostComposer');
      }
      return;
    }

    // Online posting logic
    setIsPosting(true);
    setError(null);

    const success = await performPost();
    setIsPosting(false);

    // Auto-retry logic
    if (!success && enableRetry && retryCount < MAX_RETRY_ATTEMPTS && navigator.onLine) {
      if (error && error.includes('profile')) {
        logger.warn('Profile verification failed, skipping retry', { error }, 'usePostComposer');
        return;
      }

      setRetryCount(prev => prev + 1);
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
      }
      retryTimer.current = setTimeout(
        () => {
          handlePost();
        },
        RETRY_DELAY * (retryCount + 1)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canPost,
    performPost,
    enableRetry,
    retryCount,
    user,
    content,
    visibility,
    selectedProjects,
    subjectType,
    subjectId,
    reset,
  ]);

  const retry = useCallback(async () => {
    if (isPosting) {
      return;
    }
    await handlePost();
  }, [handlePost, isPosting]);

  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Form state
    content,
    setContent: handleSetContent,
    visibility,
    setVisibility,
    selectedProjects,
    setSelectedProjects,

    // UI state
    userProjects,
    loadingProjects,
    isPosting,
    error,
    postSuccess,
    retryCount,

    // Computed values
    characterCount,
    isValid,
    canPost,

    // Actions
    handlePost,
    toggleProjectSelection,
    reset,
    clearError,
    retry,
  };
}
