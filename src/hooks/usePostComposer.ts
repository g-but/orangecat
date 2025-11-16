import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import supabase from '@/lib/supabase/browser';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';

export interface PostComposerOptions {
  subjectType?: 'profile' | 'project';
  subjectId?: string;
  allowProjectSelection?: boolean;
  defaultVisibility?: 'public' | 'private';
  onSuccess?: (event?: any) => void;
  onOptimisticUpdate?: (event: any) => void;
  debounceMs?: number;
  enableDrafts?: boolean; // Auto-save drafts
  enableRetry?: boolean; // Auto-retry failed posts
}

export interface PostComposerState {
  content: string;
  setContent: (content: string) => void;
  visibility: 'public' | 'private';
  setVisibility: (visibility: 'public' | 'private') => void;
  selectedProjects: string[];
  setSelectedProjects: (projects: string[]) => void;
  userProjects: any[];
  loadingProjects: boolean;
  isPosting: boolean;
  error: string | null;
  postSuccess: boolean;
  retryCount: number;
  handlePost: () => Promise<void>;
  toggleProjectSelection: (projectId: string) => void;
  reset: () => void;
  clearError: () => void;
}

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
  } = options;

  // Extract targetOwnerName from options if provided (passed from TimelineComposer)
  const targetOwnerName = (options as any).targetOwnerName;

  // Cache for profile existence check
  const profileCheckCache = useRef<Map<string, { exists: boolean; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Initial state
  const initialState = {
    content: '',
    visibility: defaultVisibility,
    selectedProjects: [],
    userProjects: [],
    loadingProjects: false,
    isPosting: false,
    error: null,
    postSuccess: false,
  };

  // Use reducer for state management
  const [state, dispatch] = useReducer(postComposerReducer, initialState);

  // Memoized debounced content setter
  const debouncedSetContent = useMemo(
    () => {
      return (content: string) => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
          dispatch({ type: 'SET_CONTENT', payload: content });
        }, debounceMs);
      };
    },
    [debounceMs]
  );

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Load user's projects if project selection is enabled - memoized to prevent unnecessary calls
  const loadUserProjects = useCallback(async () => {
    if (!allowProjectSelection || !user?.id) {
      return;
    }

    dispatch({ type: 'SET_LOADING_PROJECTS', payload: true });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('creator_id', user.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }
      dispatch({ type: 'SET_USER_PROJECTS', payload: data || [] });
    } catch (err) {
      logger.error('Failed to load user projects', err, 'usePostComposer');
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load projects' });
    } finally {
      dispatch({ type: 'SET_LOADING_PROJECTS', payload: false });
    }
  }, [allowProjectSelection, user?.id]);

  // Initialize projects only once on mount
  React.useEffect(() => {
    loadUserProjects();
  }, []); // Empty dependency array - only run once

  // Memoized project toggle function
  const toggleProjectSelection = useCallback((projectId: string) => {
    dispatch({ type: 'TOGGLE_PROJECT', payload: projectId });
  }, []);

  // Create optimistic event for immediate UI feedback
  const createOptimisticEvent = useCallback((postContent: string, title: string) => {
    if (!user?.id) return null;

    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();

    return {
      id: optimisticId,
      eventType: 'status_update',
      eventSubtype: null,
      actorId: user.id,
      subjectType: subjectType,
      subjectId: subjectId || user.id,
      targetType: null,
      targetId: null,
      title,
      description: postContent,
      content: {},
      amountSats: null,
      amountBtc: null,
      quantity: null,
      visibility: state.visibility,
      isFeatured: false,
      metadata: {
        is_user_post: true,
        cross_posted: subjectId && subjectId !== user.id,
        cross_posted_projects: state.selectedProjects.length > 0 ? state.selectedProjects : undefined,
        is_optimistic: true, // Mark as optimistic for UI handling
      },
      tags: [],
      parentEventId: null,
      threadId: null,
      eventTimestamp: now,
      createdAt: now,
      updatedAt: now,
      // Pre-joined data for display
      actor_data: {
        id: user.id,
        display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'You',
        username: user.email?.split('@')[0] || user.id,
        avatar_url: user.user_metadata?.avatar_url,
      },
      subject_data: subjectId && subjectId !== user.id ? {
        id: subjectId,
        type: subjectType,
        title: targetOwnerName || 'Timeline',
      } : null,
      target_data: null,
      like_count: 0,
      share_count: 0,
      comment_count: 0,
    };
  }, [user, subjectType, subjectId, state.visibility, state.selectedProjects]);

  // Cached profile existence check
  const ensureProfile = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    // Check cache first
    const cached = profileCheckCache.current.get(user.id);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.exists;
    }

    try {
      // Try to fetch profile - this will bootstrap it if missing
      const response = await fetch('/api/profile');
      const exists = response.ok || response.status === 404; // 404 means profile doesn't exist but API is working

      // Cache the result
      profileCheckCache.current.set(user.id, {
        exists,
        timestamp: Date.now()
      });

      return exists;
    } catch (err) {
      logger.error('Failed to ensure profile exists', err, 'usePostComposer');
      return false;
    }
  }, [user?.id]);

  // Handle post creation with optimistic updates and better error handling
  const handlePost = useCallback(async () => {
    if (!state.content.trim() || state.isPosting || !user?.id) {
      return;
    }

    const postContent = state.content.trim();
    const title = postContent.length > 50 ? postContent.substring(0, 47) + '...' : postContent;

    // Create optimistic event for immediate UI feedback
    const optimisticEvent = createOptimisticEvent(postContent, title);
    if (optimisticEvent) {
      onOptimisticUpdate?.(optimisticEvent);
    }

    dispatch({ type: 'SET_POSTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Ensure profile exists before creating post (with caching)
      const profileExists = await ensureProfile();
      if (!profileExists) {
        throw new Error('Unable to verify profile. Please refresh and try again.');
      }

      // Create main post
      const mainPostResult = await timelineService.createEvent({
        eventType: 'status_update',
        actorId: user.id,
        subjectType: subjectType,
        subjectId: subjectId || user.id,
        title,
        description: postContent,
        visibility: state.visibility,
        metadata: {
          is_user_post: true,
          cross_posted: subjectId && subjectId !== user.id,
          cross_posted_projects: state.selectedProjects.length > 0 ? state.selectedProjects : undefined,
        },
      });

      if (!mainPostResult.success) {
        throw new Error(mainPostResult.error || 'Failed to create post');
      }

      // Cross-post to selected projects with individual error handling
      if (state.selectedProjects.length > 0) {
        const crossPostPromises = state.selectedProjects.map(async (projectId) => {
          try {
            return await timelineService.createEvent({
              eventType: 'status_update',
              actorId: user.id,
              subjectType: 'project',
              subjectId: projectId,
              title,
              description: postContent,
              visibility: state.visibility,
              metadata: {
                is_user_post: true,
                cross_posted_from_main: true,
                original_post_id: mainPostResult.event?.id,
              },
            });
          } catch (error) {
            logger.warn(`Failed to cross-post to project ${projectId}`, error, 'usePostComposer');
            // Return failed result instead of throwing
            return { success: false, error: `Failed to post to project ${projectId}` };
          }
        });

        // Wait for all cross-posts to complete (but don't fail the main post if some cross-posts fail)
        const crossPostResults = await Promise.allSettled(crossPostPromises);
        const failedPosts = crossPostResults.filter(result =>
          result.status === 'rejected' ||
          (result.status === 'fulfilled' && !result.value.success)
        );

        if (failedPosts.length > 0) {
          logger.warn(`${failedPosts.length} cross-posts failed`, failedPosts, 'usePostComposer');
          // Show warning but don't fail the entire operation
          dispatch({
            type: 'SET_ERROR',
            payload: `${failedPosts.length} cross-posts failed, but main post was successful`
          });
        }
      }

      // Success - reset form and show success message
      dispatch({ type: 'RESET' });
      dispatch({ type: 'SET_SUCCESS', payload: true });

      // Auto-hide success message
      const successTimer = setTimeout(() => {
        dispatch({ type: 'SET_SUCCESS', payload: false });
      }, 3000);

      // Notify success with real event data
      onSuccess?.(mainPostResult.event);

      // Cleanup timer on unmount
      return () => clearTimeout(successTimer);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      logger.error('Failed to create post', error, 'usePostComposer');

      // If optimistic update was shown, we might want to remove it or show error state
      // For now, just show the error - UI can handle optimistic event cleanup
    } finally {
      dispatch({ type: 'SET_POSTING', payload: false });
    }
  }, [
    state.content,
    state.isPosting,
    state.selectedProjects,
    state.visibility,
    user?.id,
    subjectType,
    subjectId,
    ensureProfile,
    createOptimisticEvent,
    onOptimisticUpdate,
    onSuccess,
  ]);

  // Memoized setter functions to prevent unnecessary re-renders
  const setContent = useCallback((content: string) => {
    debouncedSetContent(content);
  }, [debouncedSetContent]);

  const setVisibility = useCallback((visibility: 'public' | 'private') => {
    dispatch({ type: 'SET_VISIBILITY', payload: visibility });
  }, []);

  const setSelectedProjects = useCallback((projects: string[]) => {
    dispatch({ type: 'SET_SELECTED_PROJECTS', payload: projects });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    content: state.content,
    setContent,
    visibility: state.visibility,
    setVisibility,
    selectedProjects: state.selectedProjects,
    setSelectedProjects,
    userProjects: state.userProjects,
    loadingProjects: state.loadingProjects,
    isPosting: state.isPosting,
    error: state.error,
    postSuccess: state.postSuccess,
    handlePost,
    toggleProjectSelection,
    reset,
  };
}
