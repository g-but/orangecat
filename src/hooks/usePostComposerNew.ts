import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';
import { TimelineVisibility } from '@/types/timeline';
import { usePostDraft } from '@/hooks/usePostDraft';
import {
  formatPostError,
  fetchUserProjects,
  submitPost,
  queueOfflinePost,
} from '@/services/timeline/utils/post-composer';

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
    fetchUserProjects(user.id)
      .then(projects => {
        setUserProjects(projects);
        setLoadingProjects(false);
      })
      .catch(err => {
        setLoadingProjects(false);
        logger.error('Failed to load user projects', err, 'usePostComposer');
      });
  }, [allowProjectSelection, user?.id]);

  const performPost = useCallback(async (): Promise<boolean> => {
    if (!canPost || !user) {
      return false;
    }
    try {
      const result = await submitPost({
        user,
        content,
        subjectType,
        subjectId,
        visibility,
        selectedProjects,
        parentEventId,
        onOptimisticUpdate,
      });
      if (!result.success) {
        setError(result.error);
        return false;
      }
      clearDraft();
      setPostSuccess(true);
      onSuccess?.(result.event);
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
      successTimer.current = setTimeout(() => setPostSuccess(false), 3000);
      return true;
    } catch (err) {
      setError(formatPostError(err));
      logger.error('Failed to create post', err, 'usePostComposer');
      return false;
    }
  }, [
    canPost,
    user,
    content,
    subjectType,
    subjectId,
    visibility,
    selectedProjects,
    parentEventId,
    onOptimisticUpdate,
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

    if (!navigator.onLine) {
      try {
        await queueOfflinePost({
          user,
          content,
          subjectType,
          subjectId,
          visibility,
          selectedProjects,
          parentEventId,
          onOptimisticUpdate,
        });
        setError(null);
        setPostSuccess(true);
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
