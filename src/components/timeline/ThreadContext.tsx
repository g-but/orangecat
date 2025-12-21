'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { ThreadView } from './ThreadPost';
import { Button } from '@/components/ui/Button';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { MessageCircle, ChevronUp, ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThreadContextProps {
  threadId: string;
  currentPostId?: string;
  onNavigate?: (postId: string) => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Thread Context View - Shows all posts in a thread with navigation
 * Enables users to see the full conversation flow
 */
export function ThreadContext({
  threadId,
  currentPostId,
  onNavigate,
  onClose,
  className,
}: ThreadContextProps) {
  const [threadPosts, setThreadPosts] = useState<TimelineDisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load thread posts
  const loadThread = useCallback(async () => {
    if (!threadId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await timelineService.getThreadPosts(threadId);

      if (result.success && result.posts) {
        setThreadPosts(result.posts);

        // Find current post index
        if (currentPostId) {
          const index = result.posts.findIndex(post => post.id === currentPostId);
          if (index >= 0) {
            setCurrentIndex(index);
          }
        }
      } else {
        setError(result.error || 'Failed to load thread');
      }
    } catch (err) {
      logger.error('Error loading thread', err, 'ThreadContext');
      setError('Failed to load thread');
    } finally {
      setLoading(false);
    }
  }, [threadId, currentPostId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  // Handle navigation
  const navigateToPost = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev'
      ? Math.max(0, currentIndex - 1)
      : Math.min(threadPosts.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      const post = threadPosts[newIndex];
      if (post) {
        onNavigate?.(post.id);
      }
    }
  }, [currentIndex, threadPosts, onNavigate]);

  // Handle post updates
  const handlePostUpdate = useCallback((postId: string, updates: Partial<TimelineDisplayEvent>) => {
    setThreadPosts(prev =>
      prev.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      )
    );
  }, []);

  // Handle new replies
  const handleReplyCreated = useCallback((reply: TimelineDisplayEvent) => {
    if (reply.threadId === threadId) {
      setThreadPosts(prev => [...prev, reply]);
    }
  }, [threadId]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-center py-8 text-red-600", className)}>
        <p>{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={loadThread}
          className="mt-2"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!threadPosts.length) {
    return (
      <div className={cn("text-center py-8 text-gray-500", className)}>
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No posts in this thread.</p>
      </div>
    );
  }

  const currentPost = threadPosts[currentIndex];
  const threadParticipants = Array.from(
    new Set(threadPosts.map(post => post.actor.id))
  ).length;

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg", className)}>
      {/* Thread Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Thread</h3>
            <p className="text-sm text-gray-500">
              {threadPosts.length} posts
              {threadParticipants > 1 && (
                <>
                  {' • '}
                  <Users className="w-3 h-3 inline mr-1" />
                  {threadParticipants} participants
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToPost('prev')}
            disabled={currentIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>

          <span className="text-sm text-gray-500 min-w-[3rem] text-center">
            {currentIndex + 1} / {threadPosts.length}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateToPost('next')}
            disabled={currentIndex === threadPosts.length - 1}
            className="h-8 w-8 p-0"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-2"
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Thread Content */}
      <div className="max-h-96 overflow-y-auto">
        <ThreadView
          events={threadPosts}
          onUpdate={handlePostUpdate}
          onReplyCreated={handleReplyCreated}
          className="p-4"
        />
      </div>

      {/* Current Post Highlight */}
      {currentPost && (
        <div className="p-4 bg-blue-50 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Currently viewing: {currentPost.actor.name}'s post
          </div>
        </div>
      )}
    </div>
  );
}

interface ThreadIndicatorProps {
  threadId?: string;
  replyCount?: number;
  onShowThread?: () => void;
  className?: string;
}

/**
 * Thread indicator shown on posts that are part of threads
 */
export function ThreadIndicator({
  threadId,
  replyCount = 0,
  onShowThread,
  className,
}: ThreadIndicatorProps) {
  if (!threadId || replyCount === 0) return null;

  return (
    <div className={cn("flex items-center gap-1 text-xs text-gray-500", className)}>
      <MessageCircle className="w-3 h-3" />
      <span>Part of thread ({replyCount} replies)</span>
      {onShowThread && (
        <Button
          variant="link"
          size="sm"
          onClick={onShowThread}
          className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
        >
          Show thread
        </Button>
      )}
    </div>
  );
}

















