import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { TimelineVisibility } from '@/types/timeline';
import { getTableName } from '@/config/entity-registry';

const PROFILE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const profileCheckCache = new Map<string, { exists: boolean; timestamp: number }>();

/**
 * Checks whether the current user has a profile, with caching.
 * Returns true if profile exists, false otherwise.
 */
export async function ensureProfileExists(userId: string): Promise<boolean> {
  const cached = profileCheckCache.get(userId);
  if (cached && Date.now() - cached.timestamp < PROFILE_CACHE_DURATION) {
    return cached.exists;
  }

  try {
    const response = await fetch('/api/profile');
    const exists = response.ok;
    profileCheckCache.set(userId, { exists, timestamp: Date.now() });

    if (!exists) {
      logger.warn(
        'Profile not found, user may need to complete setup',
        { userId },
        'usePostComposer'
      );
    }

    return exists;
  } catch (err) {
    logger.error('Failed to ensure profile exists', err, 'usePostComposer');
    return false;
  }
}

interface OptimisticEventUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

interface CreateOptimisticEventParams {
  user: OptimisticEventUser;
  content: string;
  subjectType: string;
  subjectId?: string;
  visibility: TimelineVisibility;
  selectedProjects: string[];
  parentEventId?: string;
}

/**
 * Creates an optimistic event object for immediate UI display
 * before the server confirms the post creation.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createOptimisticEvent(params: CreateOptimisticEventParams): Record<string, any> {
  const { user, content, subjectType, subjectId, visibility, selectedProjects, parentEventId } =
    params;

  const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
  const now = new Date().toISOString();

  return {
    id: optimisticId,
    eventType: 'status_update',
    actorId: user.id,
    subjectType,
    subjectId: subjectId || user.id,
    title: '',
    description: content,
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
      display_name:
        user.user_metadata?.name ||
        (typeof user.email === 'string' && user.email.includes('@')
          ? user.email.split('@')[0]
          : null) ||
        'You',
      username:
        (typeof user.email === 'string' && user.email.includes('@')
          ? user.email.split('@')[0]
          : null) || user.id,
      avatar_url: user.user_metadata?.avatar_url,
    },
    like_count: 0,
    share_count: 0,
    comment_count: 0,
  };
}

/**
 * Formats a caught error from post creation into a user-friendly message.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatPostError(err: any): string {
  // Check for a response object, common in HTTP client errors
  if (err.response && err.response.status) {
    switch (err.response.status) {
      case 400:
        return 'Invalid post content. Please review your post.';
      case 401:
        return 'You must be logged in to post. Please refresh and try again.';
      case 403:
        return "You don't have permission to perform this action.";
      case 500:
      case 502:
      case 503:
      case 504:
        return 'A server error occurred. Our team has been notified. Please try again later.';
      default:
        return `An error occurred (code: ${err.response.status}). Please try again.`;
    }
  }

  if (err instanceof Error) {
    if (err.message.includes('Unable to verify your profile')) {
      return err.message;
    }
    if (err.message.includes('Authentication required')) {
      return 'You must be logged in to post. Please refresh and try again.';
    }
    if (err.message.includes('Failed to create post')) {
      return err.message;
    }
    if (err.message.includes('network') || err.message.includes('fetch')) {
      return 'A network error occurred. Please check your connection and try again.';
    }
    return err.message || 'An unexpected error occurred. Please try again.';
  }

  if (typeof err === 'string') {
    return err;
  }

  return 'An unexpected error occurred.';
}

/**
 * Truncates post content into a title that satisfies a DB NOT NULL constraint.
 */
export function truncateToTitle(postContent: string): string {
  return postContent.length <= 120 ? postContent : `${postContent.slice(0, 117).trimEnd()}...`;
}

/**
 * Builds timeline visibility context entries for a post.
 */
export function buildTimelineContexts(
  subjectType: string,
  subjectId: string | undefined,
  userId: string,
  selectedProjects: string[],
  visibility: TimelineVisibility,
  parentEventId?: string
): Array<{
  timeline_type: 'profile' | 'project' | 'community';
  timeline_owner_id: string | null;
}> {
  const contexts: Array<{
    timeline_type: 'profile' | 'project' | 'community';
    timeline_owner_id: string | null;
  }> = [];

  contexts.push({
    timeline_type: subjectType as 'profile' | 'project',
    timeline_owner_id: subjectId || userId,
  });

  selectedProjects.forEach(projectId => {
    contexts.push({
      timeline_type: 'project',
      timeline_owner_id: projectId,
    });
  });

  if (visibility === 'public' && !parentEventId) {
    contexts.push({
      timeline_type: 'community',
      timeline_owner_id: null,
    });
  }

  return contexts;
}

/**
 * Fetches user projects with thumbnails for the project selector.
 * Returns processed project list or empty array on failure.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchUserProjects(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(getTableName('project'))
      .select(
        `
        id,
        title,
        description,
        status,
        contributor_count,
        project_media(id, storage_path, position)
      `
      )
      .eq('user_id', userId)
      .neq('status', 'draft')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      throw error;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((project: any) => {
      let thumbnail_url = null;
      if (project.project_media && project.project_media.length > 0) {
        const firstMedia = project.project_media.sort(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        project_media: undefined,
      };
    });
  } catch (err) {
    logger.warn('Failed to load user projects (non-blocking)', err, 'usePostComposer');
    return [];
  }
}
