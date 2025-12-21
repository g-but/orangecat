import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import supabase from '@/lib/supabase/browser';
import { offlineQueueService } from '@/lib/offline-queue';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';
import { TimelineVisibility } from '@/types/timeline';

export interface PostComposerOptions {
  subjectType?: 'profile' | 'project';
  subjectId?: string;
  allowProjectSelection?: boolean;
  defaultVisibility?: TimelineVisibility;
  onSuccess?: (event?: any) => void;
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

  // Core state - simple and clear
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<TimelineVisibility>(defaultVisibility || 'public');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for timers and caching
  const debounceTimer = useRef<NodeJS.Timeout>();
  const successTimer = useRef<NodeJS.Timeout>();
  const retryTimer = useRef<NodeJS.Timeout>();
  const profileCheckCache = useRef<Map<string, { exists: boolean; timestamp: number }>>(new Map());

  // Constants
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Draft management
  const draftKey = `post-draft-${subjectType}-${subjectId || 'general'}`;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      [debounceTimer, successTimer, retryTimer].forEach(timer => {
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

  // Draft management functions
  const saveDraft = useCallback(
    (draftContent: string) => {
      if (!enableDrafts || !draftContent.trim()) {
        return;
      }

      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            content: draftContent,
            visibility,
            selectedProjects,
            timestamp: Date.now(),
            subjectType,
            subjectId,
          })
        );
      } catch (err) {
        logger.warn('Failed to save draft', err, 'usePostComposer');
      }
    },
    [enableDrafts, draftKey, visibility, selectedProjects, subjectType, subjectId]
  );

  const loadDraft = useCallback(() => {
    if (!enableDrafts) {
      return;
    }

    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        // Only load if draft is recent (last 24 hours)
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setContent(parsed.content || '');
          setVisibility(parsed.visibility || defaultVisibility);
          setSelectedProjects(parsed.selectedProjects || []);
        } else {
          // Clear old draft
          localStorage.removeItem(draftKey);
        }
      }
    } catch (err) {
      logger.warn('Failed to load draft', err, 'usePostComposer');
    }
  }, [enableDrafts, draftKey, defaultVisibility]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch (err) {
      logger.warn('Failed to clear draft', err, 'usePostComposer');
    }
  }, [draftKey]);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  // Auto-save drafts (debounced)
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      saveDraft(content);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content, visibility, selectedProjects, saveDraft, debounceMs]);

  // Content setter (clears errors)
  const handleSetContent = useCallback(
    (newContent: string) => {
      setContent(newContent);
      if (error) {
        setError(null);
      } // Clear errors when user types
    },
    [error]
  );

  // Load user projects
  const loadUserProjects = useCallback(async () => {
    if (!allowProjectSelection || !user?.id) {
      return;
    }

    setLoadingProjects(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          title, 
          description, 
          status, 
          contributor_count,
          project_media(id, storage_path, position)
        `)
        .eq('user_id', user.id)
        .neq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      // Process projects to add thumbnail URLs
      const projectsWithThumbnails = (data || []).map((project: any) => {
        let thumbnail_url = null;
        if (project.project_media && project.project_media.length > 0) {
          const firstMedia = project.project_media.sort(
            (a: any, b: any) => a.position - b.position
          )[0];
          if (firstMedia?.storage_path) {
            const { data: urlData } = supabase.storage
              .from('project-media')
              .getPublicUrl(firstMedia.storage_path);
            thumbnail_url = urlData.publicUrl;
          }
        }
        return {
          ...project,
          thumbnail_url,
          project_media: undefined, // Remove nested data
        };
      });

      setUserProjects(projectsWithThumbnails);
    } catch (err) {
      logger.warn('Failed to load user projects (non-blocking)', err, 'usePostComposer');
      setUserProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [allowProjectSelection, user?.id]);

  // Load projects on mount
  useEffect(() => {
    loadUserProjects();
  }, [loadUserProjects]);

  // Cached profile check
  const ensureProfile = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    const cached = profileCheckCache.current.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.exists;
    }

    try {
      const response = await fetch('/api/profile');
      const exists = response.ok; // Only true if status 200
      profileCheckCache.current.set(user.id, { exists, timestamp: Date.now() });

      if (!exists) {
        logger.warn(
          'Profile not found, user may need to complete setup',
          { userId: user.id },
          'usePostComposer'
        );
      }

      return exists;
    } catch (err) {
      logger.error('Failed to ensure profile exists', err, 'usePostComposer');
      return false;
    }
  }, [user?.id]);

  // Create optimistic event
  const createOptimisticEvent = useCallback(
    (postContent: string) => {
      if (!user?.id) {
        return null;
      }

      const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
      const now = new Date().toISOString();

      return {
        id: optimisticId,
        eventType: 'status_update',
        actorId: user.id,
        subjectType,
        subjectId: subjectId || user.id,
        title: '',
        description: postContent,
        visibility,
        metadata: {
          is_user_post: true,
          cross_posted: subjectId && subjectId !== user.id,
          cross_posted_projects: selectedProjects.length > 0 ? selectedProjects : undefined,
          is_optimistic: true,
          is_reply: !!parentEventId,
        },
        parentEventId,
        eventTimestamp: now,
        actor_data: {
          id: user.id,
          display_name: user.user_metadata?.name || (typeof user.email === 'string' && user.email.includes('@') ? user.email.split('@')[0] : null) || 'You',
          username: (typeof user.email === 'string' && user.email.includes('@') ? user.email.split('@')[0] : null) || user.id,
          avatar_url: user.user_metadata?.avatar_url,
        },
        like_count: 0,
        share_count: 0,
        comment_count: 0,
      };
    },
    [user, subjectType, subjectId, visibility, selectedProjects, parentEventId]
  );

  // Main posting logic
  const performPost = useCallback(async (): Promise<boolean> => {
    if (!canPost || !user?.id) {
      return false;
    }

    try {
      // Ensure profile exists
      const profileExists = await ensureProfile();
      if (!profileExists) {
        throw new Error(
          'Unable to verify your profile. Please refresh the page and try again. If the problem persists, you may need to complete your profile setup.'
        );
      }

      const postContent = content.trim();
      // Use content as the title fallback so we always satisfy DB NOT NULL
      const title =
        postContent.length <= 120 ? postContent : `${postContent.slice(0, 117).trimEnd()}...`;

      // Create optimistic event immediately
      const optimisticEvent = createOptimisticEvent(postContent);
      if (optimisticEvent && onOptimisticUpdate) {
        onOptimisticUpdate(optimisticEvent);
      }

      // Build timeline visibility contexts
      const timelineContexts = [];

      // Add main subject timeline (profile or project)
      timelineContexts.push({
        timeline_type: subjectType,
        timeline_owner_id: subjectId || user.id,
      });

      // Add selected project timelines (cross-posting)
      selectedProjects.forEach(projectId => {
        timelineContexts.push({
          timeline_type: 'project',
          timeline_owner_id: projectId,
        });
      });

      // Add community timeline for public posts (only for non-replies)
      if (visibility === 'public' && !parentEventId) {
        timelineContexts.push({
          timeline_type: 'community',
          timeline_owner_id: null,
        });
      }

      // For replies, use createEvent which properly supports parentEventId
      // For regular posts, use createEventWithVisibility for cross-posting support
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

      // Auto-hide success message
      if (successTimer.current) {
        clearTimeout(successTimer.current);
      }
      successTimer.current = setTimeout(() => {
        setPostSuccess(false);
      }, 3000);

      return true;
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred.';

      // Check for a response object, common in HTTP client errors
      if (err.response && err.response.status) {
        switch (err.response.status) {
          case 400:
            errorMessage = 'Invalid post content. Please review your post.';
            break;
          case 401:
            errorMessage = 'You must be logged in to post. Please refresh and try again.';
            break;
          case 403:
            errorMessage = "You don't have permission to perform this action.";
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage =
              'A server error occurred. Our team has been notified. Please try again later.';
            break;
          default:
            errorMessage = `An error occurred (code: ${err.response.status}). Please try again.`;
            break;
        }
      } else if (err instanceof Error) {
        // Handle specific known error messages
        if (err.message.includes('Unable to verify your profile')) {
          errorMessage = err.message;
        } else if (err.message.includes('Authentication required')) {
          errorMessage = 'You must be logged in to post. Please refresh and try again.';
        } else if (err.message.includes('Failed to create post')) {
          errorMessage = err.message;
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'A network error occurred. Please check your connection and try again.';
        } else {
          // Show the actual error message if it's helpful
          errorMessage = err.message || 'An unexpected error occurred. Please try again.';
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      setError(errorMessage);
      logger.error('Failed to create post', err, 'usePostComposer');
      return false;
    }
  }, [
    canPost,
    user?.id,
    ensureProfile,
    content,
    createOptimisticEvent,
    onOptimisticUpdate,
    subjectType,
    subjectId,
    visibility,
    selectedProjects,
    onSuccess,
    clearDraft,
  ]);

  // Reset function (placed before handlers that depend on it to avoid TDZ)
  const reset = useCallback(() => {
    setContent('');
    setSelectedProjects([]);
    setError(null);
    setPostSuccess(false);
    setRetryCount(0);
    clearDraft();
  }, [clearDraft]);

  // Public API methods
  const handlePost = useCallback(async () => {
    if (!canPost || !user?.id) {
      return;
    }

    // Offline handling: queue the post instead of sending
    if (!navigator.onLine) {
      try {
        const postPayload = {
          eventType: 'status_update',
          actorId: user.id,
          subjectType,
          subjectId: subjectId || user.id,
          title,
          description: content.trim(),
          visibility,
          metadata: {
            is_user_post: true,
            cross_posted: subjectId && subjectId !== user.id,
            cross_posted_projects: selectedProjects.length > 0 ? selectedProjects : undefined,
          },
        };
        await offlineQueueService.addToQueue(postPayload, user.id);

        // Provide feedback and reset form
        setError(null);
        setPostSuccess(true); // Use success state to show a confirmation message

        // Show informative message about offline queuing
        if (onOptimisticUpdate) {
          // Create a temporary optimistic event to show in UI
          const offlineEvent = {
            id: `offline-${Date.now()}`,
            eventType: 'status_update',
            actorId: user.id,
            subjectType,
            subjectId: subjectId || user.id,
            title: '',
            description: content.trim(),
            visibility,
            eventTimestamp: new Date().toISOString(),
            actor_data: {
              id: user.id,
              display_name: user.user_metadata?.name || (typeof user.email === 'string' && user.email.includes('@') ? user.email.split('@')[0] : null) || 'You',
              username: (typeof user.email === 'string' && user.email.includes('@') ? user.email.split('@')[0] : null) || user.id,
              avatar_url: user.user_metadata?.avatar_url,
            },
            like_count: 0,
            share_count: 0,
            comment_count: 0,
            metadata: {
              ...postPayload.metadata,
              is_offline_queued: true,
              offline_queued_at: new Date().toISOString(),
            },
          };
          onOptimisticUpdate(offlineEvent);
        }

        reset();
      } catch (err) {
        setError('Failed to save post for offline sending.');
        logger.error('Failed to add to offline queue', err, 'usePostComposer');
      }
      return; // Stop execution
    }

    // Online posting logic
    setIsPosting(true);
    setError(null);

    const success = await performPost();
    setIsPosting(false);

    // Auto-retry logic (only if not a permanent error like missing profile)
    if (!success && enableRetry && retryCount < MAX_RETRY_ATTEMPTS && navigator.onLine) {
      // Don't retry if error is about profile verification
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
      ); // Exponential backoff
    }
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
