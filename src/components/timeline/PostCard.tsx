'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TimelineDisplayEvent, TimelineVisibility } from '@/types/timeline';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { PostHeader } from './PostHeader';
import { PostContent } from './PostContent';
import { PostActions } from './PostActions';
import { usePostInteractions } from '@/hooks/usePostInteractions';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { RepostModal } from './RepostModal';
import { QuoteReplyComposer, QuoteReplyButton } from './QuoteReplyComposer';
import { ThreadIndicator } from './ThreadContext';
import { EditPostModal } from './EditPostModal';
import { DeletePostDialog } from './DeletePostDialog';
import AvatarLink from '@/components/ui/AvatarLink';
import { cn } from '@/lib/utils';
import { timelineService } from '@/services/timeline';
import { Check } from 'lucide-react';

interface PostCardProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  onDelete?: () => void;
  compact?: boolean;
  showMetrics?: boolean;
  onReplyCreated?: (reply: TimelineDisplayEvent) => void;
  showThreading?: boolean;
  onShowThread?: () => void;
  // Multi-select support
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (eventId: string) => void;
}

export function PostCard({
  event,
  onUpdate,
  onDelete,
  compact = false,
  showMetrics = true,
  onReplyCreated,
  showThreading = true,
  onShowThread,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: PostCardProps) {
  const router = useRouter();
  const { user, profile } = useAuth();

  // Reply state
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showQuoteReply, setShowQuoteReply] = useState(false);

  // Edit/Delete state
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Delegate repost logic to the hook (DRY compliance)
  const {
    isReposting,
    repostModalOpen,
    handleRepostClick,
    handleRepostClose,
    handleSimpleRepost,
    handleQuoteRepost,
  } = usePostInteractions({ event, onUpdate });

  // Check permissions
  const canEdit = user?.id === event.actor.id;

  // Check if this is a repost (simple or quote)
  const isRepost = event.metadata?.is_repost;
  const isQuoteRepost = event.metadata?.is_quote_repost;
  const isSimpleRepost = isRepost && !isQuoteRepost;

  // Handle menu toggle
  const handleMenuToggle = useCallback(() => {
    setShowMenu((prev) => !prev);
  }, []);

  // Handle edit
  const handleEditClick = useCallback(() => {
    setShowMenu(false);
    setShowEditModal(true);
  }, []);

  // Handle edit save
  const handleEditSave = useCallback(
    async (updates: { title: string; description: string; visibility: TimelineVisibility }) => {
      setIsEditing(true);
      try {
        const result = await timelineService.updateEvent(event.id, {
          title: updates.title,
          description: updates.description,
          visibility: updates.visibility,
        });

        if (result.success) {
          onUpdate({
            title: updates.title,
            description: updates.description,
            visibility: updates.visibility,
            updatedAt: new Date().toISOString(),
          });
          logger.info('Post updated successfully', { eventId: event.id }, 'PostCard');
        } else {
          throw new Error(result.error || 'Failed to update post');
        }
      } catch (error) {
        logger.error('Failed to update post', error, 'PostCard');
        throw error;
      } finally {
        setIsEditing(false);
      }
    },
    [event.id, onUpdate]
  );

  // Handle delete click
  const handleDeleteClick = useCallback(() => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  }, []);

  // Handle delete confirm
  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      const success = await timelineService.deleteEvent(event.id);

      if (success) {
        logger.info('Post deleted successfully', { eventId: event.id }, 'PostCard');
        setShowDeleteDialog(false);
        onDelete?.();
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      logger.error('Failed to delete post', error, 'PostCard');
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [event.id, onDelete]);

  // Handle toggling reply input (X-style inline reply)
  const handleToggleReply = useCallback(() => {
    setShowReplyInput((prev) => !prev);
  }, []);

  // Handle reply submission (creates a new timeline event with parent_event_id)
  const handleReplySubmit = useCallback(async () => {
    const text = replyText.trim();
    if (!text || isReplying || !user) {
      return;
    }

    setIsReplying(true);
    try {
      const title = text.length <= 120 ? text : `${text.slice(0, 117).trimEnd()}...`;
      const result = await timelineService.createEvent({
        eventType: 'status_update',
        actorId: user.id,
        subjectType: event.subject?.type || 'profile',
        subjectId: event.subject?.id || event.actor.id,
        title,
        description: text,
        visibility: event.visibility,
        metadata: { is_user_post: true, is_reply: true },
        parentEventId: event.id,
      });

      if (!result.success || !result.event) {
        throw new Error(result.error || 'Failed to reply');
      }

      // Fetch enriched event for display (ensures avatar/name are present)
      const hydrated = await timelineService.getEventById(result.event.id);

      setReplyText('');
      setShowReplyInput(false);
      if (hydrated.success && hydrated.event) {
        onReplyCreated?.(hydrated.event);
      }

      // Best-effort local count bump
      onUpdate({
        commentsCount: (event.commentsCount || event.replyCount || 0) + 1,
        replyCount: (event.replyCount || 0) + 1,
      });
    } catch (error) {
      logger.error('Failed to post reply', error, 'PostCard');
    } finally {
      setIsReplying(false);
    }
  }, [replyText, isReplying, user, event, onReplyCreated, onUpdate]);

  // Handle quote reply creation
  const handleQuoteReply = useCallback(
    (reply: TimelineDisplayEvent) => {
      setShowQuoteReply(false);
      onReplyCreated?.(reply);

      // Update reply count
      onUpdate({
        threadRepliesCount: (event.threadRepliesCount || 0) + 1,
        replyCount: (event.replyCount || 0) + 1,
      });
    },
    [onReplyCreated, onUpdate, event]
  );

  // Handle selection checkbox click
  const handleSelectionClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSelect?.(event.id);
    },
    [event.id, onToggleSelect]
  );

  // Navigate to thread view when clicking the post (X-style)
  const handlePostClick = useCallback(
    (e: React.MouseEvent) => {
      // In selection mode, toggle selection instead of navigating
      if (isSelectionMode) {
        onToggleSelect?.(event.id);
        return;
      }

      // Don't navigate if clicking on interactive elements
      const target = e.target as HTMLElement;
      const isInteractive = target.closest('a, button, textarea, input, [role="button"]');
      if (isInteractive) {
        return;
      }

      router.push(`/post/${event.id}`);
    },
    [router, event.id, isSelectionMode, onToggleSelect]
  );

  return (
    <>
      <article
        onClick={handlePostClick}
        className={cn(
          'px-4 py-3 border-b border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer',
          compact && 'py-2',
          isSelectionMode && 'pl-2',
          isSelected && 'bg-sky-50/70 hover:bg-sky-50'
        )}
        data-event-id={event.id}
      >
        {/* X-style repost indicator at top */}
        {isSimpleRepost && (
          <div className={cn(
            "flex items-center gap-2 text-gray-500 text-[13px] mb-1",
            isSelectionMode ? "ml-14" : "ml-12"
          )}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" />
            </svg>
            <span>{event.actor.name} reposted</span>
          </div>
        )}

        <div className="flex gap-3">
          {/* Selection checkbox - shown in selection mode */}
          {isSelectionMode && (
            <div className="flex-shrink-0 flex items-start pt-2">
              <button
                onClick={handleSelectionClick}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-sky-500 border-sky-500 text-white"
                    : "border-gray-300 hover:border-sky-400 bg-white"
                )}
                aria-label={isSelected ? "Deselect post" : "Select post"}
                aria-checked={isSelected}
                role="checkbox"
              >
                {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              </button>
            </div>
          )}

          {/* Avatar column - continuous thread line could go here */}
          <div className="flex-shrink-0">
            <AvatarLink
              username={
                isSimpleRepost ? event.metadata?.original_actor_username : event.actor.username
              }
              userId={isSimpleRepost ? event.metadata?.original_actor_id : event.actor.id}
              avatarUrl={isSimpleRepost ? event.metadata?.original_actor_avatar : event.actor.avatar}
              name={isSimpleRepost ? event.metadata?.original_actor_name : event.actor.name}
              size={40}
            />
          </div>

          {/* Content column */}
          <div className="flex-1 min-w-0">
            {/* Post Header with edit/delete menu */}
            <PostHeader
              event={event}
              canEdit={canEdit}
              isSimpleRepost={isSimpleRepost}
              showMenu={showMenu}
              onMenuToggle={handleMenuToggle}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
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
              onRepostClick={handleRepostClick}
              isReposting={isReposting}
            />

            {/* Thread Indicator and Quote Reply */}
            {showThreading && (
              <div className="flex items-center justify-between mt-2">
                <ThreadIndicator
                  threadId={event.threadId}
                  replyCount={event.threadRepliesCount || event.replyCount || 0}
                  onShowThread={onShowThread}
                />

                <div className="flex items-center gap-2">
                  {!showQuoteReply && (
                    <QuoteReplyButton onClick={() => setShowQuoteReply(true)} disabled={!user} />
                  )}
                </div>
              </div>
            )}

            {/* Quote Reply Composer */}
            {showQuoteReply && (
              <div className="mt-3">
                <QuoteReplyComposer
                  parentPost={event}
                  onReply={handleQuoteReply}
                  onCancel={() => setShowQuoteReply(false)}
                />
              </div>
            )}

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
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Post your reply"
                    className="min-h-[44px] text-[15px] border-none bg-transparent p-0 focus:ring-0 resize-none placeholder:text-gray-500"
                    disabled={isReplying}
                    autoFocus
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleReplySubmit}
                      disabled={!replyText.trim() || isReplying}
                      size="sm"
                      className="rounded-full px-4 py-1.5 text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white"
                    >
                      {isReplying ? 'Replying...' : 'Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Repost Modal */}
        <RepostModal
          isOpen={repostModalOpen}
          onClose={handleRepostClose}
          event={event}
          onSimpleRepost={handleSimpleRepost}
          onQuoteRepost={handleQuoteRepost}
          isReposting={isReposting}
          currentUser={{
            id: user?.id,
            name: (user?.user_metadata as { name?: string } | undefined)?.name || user?.email || 'You',
            username: (user?.user_metadata as { preferred_username?: string } | undefined)?.preferred_username || '',
            avatar: (user?.user_metadata as { avatar_url?: string | null } | undefined)?.avatar_url || null,
          }}
        />
      </article>

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        event={event}
        onSave={handleEditSave}
        isSaving={isEditing}
      />

      {/* Delete Post Dialog */}
      <DeletePostDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        postPreview={event.description || event.title}
      />
    </>
  );
}

export default PostCard;
