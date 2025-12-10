'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TimelineDisplayEvent } from '@/types/timeline';
import { useAuth } from '@/hooks/useAuth';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { useToast } from '@/hooks/useToast';
import { MessageCircle } from 'lucide-react';
import { PostHeader } from './PostHeader';
import { PostContent } from './PostContent';
import { PostActions } from './PostActions';
import { PostMetrics } from './PostMetrics';
import { useComments } from '@/hooks/useComments';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { RepostModal } from './RepostModal';
import AvatarLink from '@/components/ui/AvatarLink';
import { cn } from '@/lib/utils';

interface PostCardProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  onDelete?: () => void;
  compact?: boolean;
  showMetrics?: boolean;
}

export function PostCard({
  event,
  onUpdate,
  onDelete,
  compact = false,
  showMetrics = true,
}: PostCardProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [isReposting, setIsReposting] = useState(false);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const { success, error } = useToast();

  // Use the comments hook
  const {
    comments,
    isLoadingComments,
    showComments,
    commentText,
    isCommenting,
    expandedReplies,
    toggleComments,
    setCommentText,
    handleComment,
    loadComments,
    loadReplies,
    toggleReplies,
  } = useComments({ eventId: event.id });

  // Check permissions
  const canEdit = user?.id === event.actor.id;

  const handleDelete = () => {
    // Post deletion logic - could emit event to parent
    logger.info('Post deleted', { eventId: event.id }, 'PostCard');
    onDelete?.();
  };

  const openRepostModal = useCallback(() => {
    if (!user) {
      error('Please sign in to repost.');
      return;
    }
    setRepostModalOpen(true);
  }, [error, user]);

  const handleSimpleRepost = useCallback(async () => {
    if (isReposting || !user) return;

    const originalRepostsCount = event.repostsCount || 0;
    const originalUserReposted = event.userReposted || false;

    // Optimistic update to match X's instant feedback
    onUpdate({
      repostsCount: originalRepostsCount + 1,
      userReposted: true,
    });

    setIsReposting(true);

    try {
      const result = await timelineService.createEvent({
        eventType: 'status_update',
        actorId: user.id,
        subjectType: 'profile',
        subjectId: user.id,
        title: '',
        description: '',
        visibility: 'public',
        metadata: {
          is_repost: true,
          original_event_id: event.id,
          original_actor_id: event.actor.id,
          original_actor_name: event.actor.name,
          original_actor_username: event.actor.username,
          original_actor_avatar: event.actor.avatar,
          original_description: (event.metadata as any)?.original_description || event.description || '',
        },
        parentEventId: event.id,
      });

      if (result.success) {
        logger.info('Successfully reposted event', null, 'PostCard');
        success('Post reposted successfully!');
      } else {
        logger.error('Failed to repost event', result.error, 'PostCard');
        onUpdate({
          repostsCount: originalRepostsCount,
          userReposted: originalUserReposted,
        });
        error(result.error || 'Failed to repost');
      }
    } catch (err) {
      logger.error('Error reposting event', err, 'PostCard');
      onUpdate({
        repostsCount: originalRepostsCount,
        userReposted: originalUserReposted,
      });
      error('Failed to repost');
    } finally {
      setIsReposting(false);
      setRepostModalOpen(false);
    }
  }, [error, event, isReposting, onUpdate, success, user]);

  const handleQuoteRepost = useCallback(
    async (quoteText: string) => {
      if (isReposting || !user || !quoteText.trim()) return;

      const originalRepostsCount = event.repostsCount || 0;
      const originalUserReposted = event.userReposted || false;

      onUpdate({
        repostsCount: originalRepostsCount + 1,
        userReposted: true,
      });

      setIsReposting(true);

      try {
        const result = await timelineService.createEvent({
          eventType: 'status_update',
          actorId: user.id,
          subjectType: 'profile',
          subjectId: user.id,
          title: '',
          description: quoteText.trim(),
          visibility: 'public',
          metadata: {
            is_quote_repost: true,
            is_repost: true,
            original_event_id: event.id,
            original_actor_id: event.actor.id,
            original_actor_name: event.actor.name,
            original_actor_username: event.actor.username,
            original_actor_avatar: event.actor.avatar,
            original_description: (event.metadata as any)?.original_description || event.description || '',
            quote_text: quoteText.trim(),
          },
          parentEventId: event.id,
        });

        if (result.success) {
          logger.info('Successfully quote reposted event', null, 'PostCard');
          success('Post quoted successfully!');
        } else {
          logger.error('Failed to quote repost event', result.error, 'PostCard');
          onUpdate({
            repostsCount: originalRepostsCount,
            userReposted: originalUserReposted,
          });
          error(result.error || 'Failed to quote repost');
        }
      } catch (err) {
        logger.error('Error quote reposting event', err, 'PostCard');
        onUpdate({
          repostsCount: originalRepostsCount,
          userReposted: originalUserReposted,
        });
        error('Failed to quote repost');
      } finally {
        setIsReposting(false);
        setRepostModalOpen(false);
      }
    },
    [error, event, isReposting, onUpdate, success, user]
  );

  // Check if this is a repost (simple or quote)
  const isRepost = event.metadata?.is_repost;
  const isQuoteRepost = event.metadata?.is_quote_repost;
  const isSimpleRepost = isRepost && !isQuoteRepost;

  // Handle toggling reply input (X-style inline reply)
  const handleToggleReply = useCallback(() => {
    setShowReplyInput(prev => !prev);
    if (!showComments) {
      toggleComments(); // Load comments when opening reply
    }
  }, [showComments, toggleComments]);

  // Handle comment submission and close reply input
  const handleCommentSubmit = useCallback(async () => {
    await handleComment();
    setShowReplyInput(false);
  }, [handleComment]);

  // Navigate to thread view when clicking the post (X-style)
  const handlePostClick = useCallback((e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('a, button, textarea, input, [role="button"]');
    if (isInteractive) return;

    router.push(`/post/${event.id}`);
  }, [router, event.id]);

  return (
    <article
      onClick={handlePostClick}
      className={cn(
        "px-4 py-3 border-b border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer",
        compact && "py-2"
      )}
      data-event-id={event.id}
    >
      {/* X-style repost indicator at top */}
      {isSimpleRepost && (
        <div className="flex items-center gap-2 text-gray-500 text-[13px] ml-12 mb-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
          </svg>
          <span>{event.actor.name} reposted</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar column - continuous thread line could go here */}
        <div className="flex-shrink-0">
          <AvatarLink
            username={isSimpleRepost ? event.metadata?.original_actor_username : event.actor.username}
            userId={isSimpleRepost ? event.metadata?.original_actor_id : event.actor.id}
            avatarUrl={isSimpleRepost ? event.metadata?.original_actor_avatar : event.actor.avatar}
            name={isSimpleRepost ? event.metadata?.original_actor_name : event.actor.name}
            size={40}
          />
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Post Header */}
          <PostHeader
            event={event}
            canEdit={canEdit}
            isSimpleRepost={isSimpleRepost}
          />

          {/* Post Content */}
          <div className="mt-1">
            <PostContent event={event} />
          </div>

          {/* Post Actions */}
          <PostActions
            event={event}
            onUpdate={onUpdate}
            onToggleComments={handleToggleReply}
            onRepostClick={openRepostModal}
            isReposting={isReposting}
          />

          {/* Inline Reply Input (X-style) */}
          {showReplyInput && user && (
            <div className="mt-3 flex gap-3 pt-3 border-t border-gray-100">
              <AvatarLink
                username={profile?.username || null}
                userId={user.id}
                avatarUrl={profile?.avatar_url || user.user_metadata?.avatar_url || null}
                name={profile?.name || user.user_metadata?.name || 'You'}
                size={32}
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post your reply"
                  className="min-h-[44px] text-[15px] border-none bg-transparent p-0 focus:ring-0 resize-none placeholder:text-gray-500"
                  disabled={isCommenting}
                  autoFocus
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || isCommenting}
                    size="sm"
                    className="rounded-full px-4 py-1.5 text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {isCommenting ? 'Replying...' : 'Reply'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Comments/Replies Section */}
          {showComments && comments.length > 0 && (
            <div className="mt-3 space-y-3 pt-3 border-t border-gray-100">
              {/* Loading indicator */}
              {isLoadingComments && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                  Loading replies...
                </div>
              )}

              {/* Replies list - X-style threaded */}
              {!isLoadingComments && comments.map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <img
                      src={comment.author.avatar || '/default-avatar.svg'}
                      alt={comment.author.name}
                      className="w-8 h-8 rounded-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-semibold text-[15px] text-gray-900 hover:underline cursor-pointer">
                        {comment.author.name}
                      </span>
                      <span className="text-gray-500 text-[15px]">
                        @{comment.author.username}
                      </span>
                    </div>
                    <p className="text-[15px] text-gray-900 mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}

              {/* Show more replies link */}
              {comments.length >= 3 && (
                <button
                  className="text-sky-500 hover:underline text-sm font-medium"
                  onClick={toggleComments}
                >
                  Show more replies
                </button>
              )}
            </div>
          )}

          {/* Show replies prompt when collapsed */}
          {!showComments && (event.commentsCount || 0) > 0 && (
            <button
              onClick={toggleComments}
              className="mt-2 text-sky-500 hover:underline text-sm"
            >
              Show {event.commentsCount} {event.commentsCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Repost Modal */}
      <RepostModal
        isOpen={repostModalOpen}
        onClose={() => setRepostModalOpen(false)}
        event={event}
        onSimpleRepost={handleSimpleRepost}
        onQuoteRepost={handleQuoteRepost}
        isReposting={isReposting}
        currentUser={{
          id: user?.id,
          name: (user as any)?.user_metadata?.name || user?.email || 'You',
          username: (user as any)?.user_metadata?.preferred_username || '',
          avatar: (user as any)?.user_metadata?.avatar_url || null,
        }}
      />
    </article>
  );
}
