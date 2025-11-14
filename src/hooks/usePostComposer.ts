import React, { useState, useCallback } from 'react';
import supabase from '@/lib/supabase/browser';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { useAuth } from '@/hooks/useAuth';

export interface PostComposerOptions {
  subjectType?: 'profile' | 'project';
  subjectId?: string;
  allowProjectSelection?: boolean;
  defaultVisibility?: 'public' | 'private';
  onSuccess?: () => void;
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
  handlePost: () => Promise<void>;
  toggleProjectSelection: (projectId: string) => void;
}

export function usePostComposer(options: PostComposerOptions = {}): PostComposerState {
  const { user } = useAuth();
  const {
    subjectType = 'profile',
    subjectId,
    allowProjectSelection = false,
    defaultVisibility = 'public',
    onSuccess,
  } = options;

  // State
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>(defaultVisibility);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [userProjects, setUserProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);

  // Load user's projects if project selection is enabled
  const loadUserProjects = useCallback(async () => {
    if (!allowProjectSelection || !user?.id) {
      return;
    }

    setLoadingProjects(true);
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
      setUserProjects(data || []);
    } catch (err) {
      // Handle error silently for now
      console.error('Failed to load user projects', err);
    } finally {
      setLoadingProjects(false);
    }
  }, [allowProjectSelection, user?.id]);

  // Initialize projects on mount
  React.useEffect(() => {
    loadUserProjects();
  }, [loadUserProjects]);

  // Toggle project selection
  const toggleProjectSelection = useCallback((projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  }, []);

  // Ensure profile exists before posting
  const ensureProfile = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    try {
      // Try to fetch profile - this will bootstrap it if missing
      const response = await fetch('/api/profile');
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to ensure profile exists');
      }
      return true;
    } catch (err) {
      logger.error('Failed to ensure profile exists', err, 'usePostComposer');
      return false;
    }
  }, [user?.id]);

  // Handle post creation
  const handlePost = useCallback(async () => {
    if (!content.trim() || isPosting || !user?.id) {
      return;
    }

    setIsPosting(true);
    setError(null);
    setPostSuccess(false);

    try {
      // Ensure profile exists before creating post
      const profileExists = await ensureProfile();
      if (!profileExists) {
        throw new Error('Failed to ensure profile exists. Please try again.');
      }

      // Create main post
      const result = await timelineService.createEvent({
        eventType: 'status_update',
        actorId: user.id,
        subjectType: subjectType,
        subjectId: subjectId || user.id,
        title: '', // No title for user posts
        description: content.trim(),
        visibility: visibility,
        metadata: {
          is_user_post: true,
          cross_posted: subjectId && subjectId !== user.id,
          cross_posted_projects: selectedProjects.length > 0 ? selectedProjects : undefined,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create post');
      }

      // Cross-post to selected projects
      if (selectedProjects.length > 0) {
        await Promise.all(
          selectedProjects.map(projectId =>
            timelineService.createEvent({
              eventType: 'status_update',
              actorId: user.id,
              subjectType: 'project',
              subjectId: projectId,
              title: '', // No title for user posts
              description: content.trim(),
              visibility: visibility,
              metadata: {
                is_user_post: true,
                cross_posted_from_main: true,
              },
            })
          )
        );
      }

      // Reset form
      setContent('');
      setSelectedProjects([]);
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);

      // Notify success
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create post';
      setError(errorMessage);
      logger.error('Failed to create post', error, 'usePostComposer');
    } finally {
      setIsPosting(false);
    }
  }, [
    content,
    isPosting,
    user?.id,
    subjectType,
    subjectId,
    visibility,
    selectedProjects,
    onSuccess,
    ensureProfile,
  ]);

  return {
    content,
    setContent,
    visibility,
    setVisibility,
    selectedProjects,
    setSelectedProjects,
    userProjects,
    loadingProjects,
    isPosting,
    error,
    postSuccess,
    handlePost,
    toggleProjectSelection,
  };
}
