'use client';

import { useState, useCallback } from 'react';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  created_at: string;
  updated_at?: string;
  parent_id?: string;
  replies_count?: number;
  likes_count?: number;
  user_liked?: boolean;
}

export interface UseCommentsProps {
  eventId: string;
}

export interface UseCommentsReturn {
  // State
  comments: Comment[];
  isLoadingComments: boolean;
  showComments: boolean;
  commentText: string;
  isCommenting: boolean;

  // Expanded replies state
  expandedReplies: Record<string, boolean>;

  // Actions
  toggleComments: () => void;
  setCommentText: (text: string) => void;
  handleComment: () => Promise<void>;
  loadComments: () => Promise<void>;
  loadReplies: (parentId: string) => Promise<Comment[]>;
  toggleReplies: (parentId: string) => void;
}

export function useComments({ eventId }: UseCommentsProps): UseCommentsReturn {
  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  // Replies state
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Load comments
  const loadComments = useCallback(async () => {
    if (isLoadingComments) {
      return;
    }

    setIsLoadingComments(true);
    try {
      const eventComments = await timelineService.getEventComments(eventId, 10);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = (eventComments || []).map((c: any) => ({
        id: c.id,
        content: c.content,
        author: {
          id: c.user_id,
          name: c.user_name || c.user_username || 'User',
          username: c.user_username || 'user',
          avatar: c.user_avatar || '/default-avatar.svg',
        },
        created_at: c.created_at,
        updated_at: c.updated_at,
        parent_id: c.parent_comment_id || c.parent_id || undefined,
        replies_count: c.reply_count ?? c.replies_count,
        likes_count: c.likes_count,
        user_liked: c.user_liked,
      }));
      setComments(normalized);
    } catch (error) {
      logger.error('Failed to load comments', error, 'useComments');
    } finally {
      setIsLoadingComments(false);
    }
  }, [eventId, isLoadingComments]);

  // Toggle comments visibility
  const toggleComments = useCallback(() => {
    setShowComments(prev => {
      const newState = !prev;
      if (newState && comments.length === 0) {
        loadComments();
      }
      return newState;
    });
  }, [comments.length, loadComments]);

  // Load replies for a specific comment
  const loadReplies = useCallback(async (parentId: string): Promise<Comment[]> => {
    try {
      const replies = await timelineService.getCommentReplies(parentId, 20);
      return replies;
    } catch (error) {
      logger.error('Failed to load replies', error, 'useComments');
      return [];
    }
  }, []);

  // Toggle replies visibility
  const toggleReplies = useCallback((parentId: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  }, []);

  // Handle comment submission
  const handleComment = useCallback(async () => {
    if (!commentText.trim() || isCommenting) {
      return;
    }

    const originalText = commentText;
    setIsCommenting(true);

    try {
      const result = await timelineService.addComment(eventId, originalText.trim());
      if (result.success) {
        // Reload comments to show the new one
        await loadComments();
        setCommentText('');
        setShowComments(true); // Ensure comments are visible
      } else {
        throw new Error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      logger.error('Failed to add comment', error, 'useComments');
      throw error;
    } finally {
      setIsCommenting(false);
    }
  }, [eventId, commentText, isCommenting, loadComments]);

  return {
    // State
    comments,
    isLoadingComments,
    showComments,
    commentText,
    isCommenting,

    // Expanded replies state
    expandedReplies,

    // Actions
    toggleComments,
    setCommentText,
    handleComment,
    loadComments,
    loadReplies,
    toggleReplies,
  };
}
