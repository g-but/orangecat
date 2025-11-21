'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TimelineDisplayEvent, TimelineFeedResponse } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import { useAuth } from '@/hooks/useAuth';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Star,
  Clock,
  Edit,
  Trash2,
  X,
  Globe,
  Lock,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { ShareModal } from '@/components/timeline/ShareModal';
import { RepostModal } from '@/components/timeline/RepostModal';
import { formatDistanceToNow } from 'date-fns';
import AvatarLink from '@/components/ui/AvatarLink';
import Link from 'next/link';

interface TimelineComponentProps {
  feed: TimelineFeedResponse;
  onEventUpdate?: (eventId: string, updates: Partial<TimelineDisplayEvent>) => void;
  onLoadMore?: () => void;
  showFilters?: boolean;
  compact?: boolean;
  enableMultiSelect?: boolean; // Enable multi-select mode for bulk operations
}

interface TimelineEventProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  compact?: boolean;
  isSelected?: boolean; // For multi-select mode
  onToggleSelect?: (eventId: string) => void; // For multi-select mode
  selectionMode?: boolean; // Whether multi-select mode is active
}

/**
 * Simple markdown renderer for timeline posts
 * Supports **bold** and *italic* formatting
 * Returns React elements for safe rendering
 */
function renderMarkdownText(text: string): React.ReactNode[] {
  if (!text) return [];

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Match **bold** first (to avoid conflicts with *italic*)
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;

  // First pass: find all bold matches
  const boldMatches: Array<{ start: number; end: number; text: string }> = [];
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    boldMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      text: match[1],
    });
  }

  // Second pass: find all italic matches (excluding those inside bold)
  const italicMatches: Array<{ start: number; end: number; text: string }> = [];
  while ((match = italicRegex.exec(text)) !== null) {
    const isInsideBold = boldMatches.some(
      b => match.index >= b.start && match.index < b.end
    );
    if (!isInsideBold) {
      italicMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
      });
    }
  }

  // Combine and sort all matches
  const allMatches = [
    ...boldMatches.map(m => ({ ...m, type: 'bold' as const })),
    ...italicMatches.map(m => ({ ...m, type: 'italic' as const })),
  ].sort((a, b) => a.start - b.start);

  // Build React elements
  for (const match of allMatches) {
    // Add text before match
    if (match.start > lastIndex) {
      const beforeText = text.substring(lastIndex, match.start);
      if (beforeText) {
        parts.push(<React.Fragment key={`text-${key++}`}>{beforeText}</React.Fragment>);
      }
    }

    // Add formatted text
    if (match.type === 'bold') {
      parts.push(<strong key={`bold-${key++}`}>{match.text}</strong>);
    } else {
      parts.push(<em key={`italic-${key++}`}>{match.text}</em>);
    }

    lastIndex = match.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining) {
      parts.push(<React.Fragment key={`text-${key++}`}>{remaining}</React.Fragment>);
    }
  }

  return parts.length > 0 ? parts : [text];
}

const TimelineEventComponent: React.FC<TimelineEventProps> = ({
  event,
  onUpdate,
  compact = false,
  isSelected = false,
  onToggleSelect,
  selectionMode = false,
}) => {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replies, setReplies] = useState<Record<string, any[]>>({});

  // Edit/Delete state
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTitle, setEditTitle] = useState(event.title);
  const [editDescription, setEditDescription] = useState(event.description || '');
  const [editVisibility, setEditVisibility] = useState<'public' | 'private'>(
    event.visibility || 'public'
  );
  // Local counts fallback (for reload cases)
  useEffect(() => {
    if ((event.likesCount ?? 0) === 0 || (event.commentsCount ?? 0) === 0) {
      (async () => {
        const counts = await timelineService.getEventCounts(event.id);
        if (counts.likeCount !== (event.likesCount || 0) || counts.commentCount !== (event.commentsCount || 0)) {
          onUpdate({ likesCount: counts.likeCount, commentsCount: counts.commentCount });
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if current user is the owner
  const isOwner = user?.id === event.actor.id;

  const metadataDisplayEntries = useMemo(() => {
    // Temporarily suppress verbose metadata until mapped to human-friendly context
    return [] as { label: string; value: string }[];
  }, []);

  // Update edit form when event changes
  useEffect(() => {
    if (!showEditModal) {
      setEditTitle(event.title);
      setEditDescription(event.description || '');
      setEditVisibility(event.visibility || 'public');
    }
  }, [event.title, event.description, event.visibility, showEditModal]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleLike = useCallback(async () => {
    if (isLiking) {
      return;
    }
    // Optimistic UI toggle
    const originalLiked = !!event.userLiked;
    const originalCount = event.likesCount || 0;
    const nextLiked = !originalLiked;
    const nextCount = Math.max(0, originalCount + (nextLiked ? 1 : -1));
    onUpdate({ userLiked: nextLiked, likesCount: nextCount });

    setIsLiking(true);
    try {
      const result = await timelineService.toggleLike(event.id);
      if (result.success) {
        onUpdate({ userLiked: result.liked, likesCount: result.likeCount });
      } else {
        // Revert on failure
        onUpdate({ userLiked: originalLiked, likesCount: originalCount });
      }
    } catch (error) {
      logger.error('Failed to toggle like', error, 'Timeline');
      onUpdate({ userLiked: originalLiked, likesCount: originalCount });
    } finally {
      setIsLiking(false);
    }
  }, [event.id, isLiking, onUpdate]);

  const handleShareOpen = useCallback(() => {
    setShareOpen(true);
  }, []);

  const handleShareConfirm = useCallback(
    async (shareText: string) => {
      if (isSharing) return;
      // Optimistic share count update
      const originalCount = event.sharesCount || 0;
      onUpdate({ userShared: true, sharesCount: originalCount + 1 });

      setIsSharing(true);
      try {
        const result = await timelineService.shareEvent(
          event.id,
          shareText?.trim() || 'Shared from timeline',
          'public'
        );
        if (result.success) {
          onUpdate({ userShared: true, sharesCount: result.shareCount });
        } else {
          onUpdate({ userShared: false, sharesCount: originalCount });
        }
      } catch (error) {
        logger.error('Failed to share event', error, 'Timeline');
        onUpdate({ userShared: false, sharesCount: originalCount });
      } finally {
        setIsSharing(false);
        setShareOpen(false);
      }
    },
    [event.id, isSharing, onUpdate]
  );

  // Open repost modal
  const handleRepostClick = useCallback(() => {
    if (!user?.id) return;
    setRepostModalOpen(true);
  }, [user?.id]);

  // Simple repost (no quote)
  const handleSimpleRepost = useCallback(async () => {
    if (isReposting || !user?.id) {
      return;
    }

    setIsReposting(true);
    try {
      const result = await timelineService.createEvent({
        eventType: 'status_update',
        actorId: user.id,
        subjectType: 'profile',
        subjectId: user.id,
        title: `Repost from ${event.actor.name}`,
        description: event.description
          ? `"${String(event.description).slice(0, 120)}"`
          : 'Shared a post',
        visibility: 'public',
        metadata: {
          is_repost: true,
          original_event_id: event.id,
          original_actor_id: event.actor.id,
          original_actor_name: event.actor.name,
        },
        parentEventId: event.id,
      });

      if (result.success) {
        logger.info('Successfully reposted event', null, 'Timeline');
      } else {
        logger.error('Failed to repost event', result.error, 'Timeline');
        alert(result.error || 'Failed to repost');
      }
    } catch (error) {
      logger.error('Error reposting event', error, 'Timeline');
      alert('Failed to repost');
    } finally {
      setIsReposting(false);
    }
  }, [event.id, event.actor.id, event.actor.name, event.description, isReposting, user?.id]);

  // Quote repost (with user's commentary)
  const handleQuoteRepost = useCallback(
    async (quoteText: string) => {
      if (isReposting || !user?.id || !quoteText.trim()) {
        return;
      }

      setIsReposting(true);
      try {
        const result = await timelineService.createEvent({
          eventType: 'status_update',
          actorId: user.id,
          subjectType: 'profile',
          subjectId: user.id,
          title: `Quote repost from ${event.actor.name}`,
          description: `${quoteText}\n\n---\n\nReposted from ${event.actor.name}:\n${event.description || 'Shared a post'}`,
          visibility: 'public',
          metadata: {
            is_quote_repost: true,
            is_repost: true,
            original_event_id: event.id,
            original_actor_id: event.actor.id,
            original_actor_name: event.actor.name,
            quote_text: quoteText,
          },
          parentEventId: event.id,
        });

        if (result.success) {
          logger.info('Successfully quote reposted event', null, 'Timeline');
        } else {
          logger.error('Failed to quote repost event', result.error, 'Timeline');
          alert(result.error || 'Failed to quote repost');
        }
      } catch (error) {
        logger.error('Error quote reposting event', error, 'Timeline');
        alert('Failed to quote repost');
      } finally {
        setIsReposting(false);
      }
    },
    [event.id, event.actor.id, event.actor.name, event.description, isReposting, user?.id]
  );

  const loadComments = useCallback(async () => {
    try {
      const eventComments = await timelineService.getEventComments(event.id, 10);
      setComments(eventComments);
    } catch (error) {
      logger.error('Failed to load comments', error, 'Timeline');
    }
  }, [event.id]);

  const loadReplies = useCallback(
    async (parentId: string) => {
      try {
        const list = await timelineService.getCommentReplies(parentId, 20);
        setReplies(prev => ({ ...prev, [parentId]: list }));
      } catch (error) {
        logger.error('Failed to load replies', error, 'Timeline');
      }
    },
    []
  );

  const handleComment = useCallback(async () => {
    if (!commentText.trim() || isCommenting) {
      return;
    }

    setIsCommenting(true);
    try {
      const result = await timelineService.addComment(event.id, commentText.trim());
      if (result.success) {
        setCommentText('');
        onUpdate({
          userCommented: true,
          commentsCount: result.commentCount,
        });
        // Refresh comments and ensure comments section is visible
        await loadComments();
        if (!showComments) {
          setShowComments(true);
        }
      }
    } catch (error) {
      logger.error('Failed to add comment', error, 'Timeline');
    } finally {
      setIsCommenting(false);
    }
  }, [event.id, commentText, isCommenting, onUpdate, showComments, loadComments]);

  const toggleComments = useCallback(() => {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments(!showComments);
  }, [showComments, comments.length, loadComments]);

  // Handle edit
  const handleEdit = useCallback(async () => {
    if (!editTitle.trim() || isEditing) {
      return;
    }

    setIsEditing(true);
    try {
      const result = await timelineService.updateEvent(event.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        visibility: editVisibility,
      });

      if (result.success) {
        onUpdate({
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          visibility: editVisibility,
        });
        setShowEditModal(false);
      } else {
        logger.error('Failed to update post', result.error, 'Timeline');
        alert(result.error || 'Failed to update post');
      }
    } catch (error) {
      logger.error('Error updating post', error, 'Timeline');
      alert('Failed to update post');
    } finally {
      setIsEditing(false);
    }
  }, [event.id, editTitle, editDescription, editVisibility, isEditing, onUpdate]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await timelineService.deleteEvent(event.id, 'User deleted post');
      if (success) {
        onUpdate({ isDeleted: true });
        setShowDeleteConfirm(false);
      } else {
        alert('Failed to delete post');
      }
    } catch (error) {
      logger.error('Error deleting post', error, 'Timeline');
      alert('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  }, [event.id, isDeleting, onUpdate]);

  // Open edit modal
  const openEditModal = useCallback(() => {
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setShowEditModal(true);
    setShowMenu(false);
  }, [event.title, event.description]);

  const timeAgo = formatDistanceToNow(new Date(event.eventTimestamp), { addSuffix: true });

  return (
    <div
      className={`relative mb-0 sm:mb-3 transition-all border-b border-gray-200 sm:border-0 sm:rounded-lg sm:bg-white sm:shadow-sm hover:bg-gray-50/50 ${
        event.isFeatured ? 'sm:ring-2 sm:ring-orange-300 sm:bg-gradient-to-r sm:from-orange-50/20 sm:to-transparent' : ''
      } ${selectionMode && isSelected ? 'bg-orange-50/30 border-orange-200' : ''}`}
    >
      {/* Selection Checkbox - Show when in selection mode */}
      {selectionMode && (
        <div className="absolute left-4 top-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(event.id)}
            className="h-5 w-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
            aria-label={`Select post: ${event.title || event.description?.substring(0, 30) || 'Untitled'}`}
          />
        </div>
      )}

      <div className={`px-4 py-3 sm:p-4 sm:pb-4 ${selectionMode ? 'pl-12 sm:pl-16' : ''}`}>

        {/* Event Header - X-style compact layout */}
        <div className="flex items-start gap-3 sm:gap-3 mb-2.5 sm:mb-3">
          {/* Actor Avatar - X-style: Compact on mobile */}
          <AvatarLink
            username={event.actor.username}
            userId={event.actor.id}
            avatarUrl={event.actor.avatar}
            name={event.actor.name}
            size={compact ? 40 : 44}
            className="flex-shrink-0"
          />

          {/* Event Content */}
          <div className="flex-1 min-w-0">
            {/* Actor and Event Info - X-style: Single line, compact */}
            <div className="flex items-center gap-1.5 sm:gap-1.5 mb-2 sm:mb-1.5 flex-wrap">
              <Link
                href={event.actor.username ? `/profiles/${event.actor.username}` : `/profiles/${event.actor.id}`}
                className="font-semibold text-sm sm:text-[15px] text-gray-900 hover:underline transition-colors cursor-pointer"
              >
                {event.actor.name}
              </Link>
              {event.actor.username && (
                <>
                  <Link
                    href={`/profiles/${event.actor.username}`}
                    className="text-gray-500 text-sm sm:text-[15px] hover:underline transition-colors"
                  >
                    @{event.actor.username}
                  </Link>
                  <span className="text-gray-400 select-none text-sm sm:text-[15px]">·</span>
                </>
              )}
              <span className="text-gray-500 text-sm sm:text-[15px]">
                {timeAgo.replace('about ', '').replace(' ago', '')}
              </span>
              {event.isRecent && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 text-xs rounded-full font-medium">
                  New
                </span>
              )}
              {event.isFeatured && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-orange-200 to-yellow-200 text-orange-800 text-xs rounded-full font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Featured
                </span>
              )}
            </div>

            {/* Event Title and Description - X-style: Clean, readable */}
            <div className="mb-3 sm:mb-3">
              {event.title &&
                event.eventType !== 'status_update' &&
                !event.metadata?.is_user_post && (
                  <h3 className="font-semibold text-gray-900 mb-1.5 text-sm sm:text-base leading-relaxed">
                    {event.title}
                  </h3>
                )}
              {event.description && (
                <p className="text-gray-900 text-sm sm:text-base leading-[1.5] sm:leading-[1.5] whitespace-pre-wrap break-words">
                  {renderMarkdownText(event.description)}
                </p>
              )}
            </div>

            {/* Formatted Amount for Financial Events */}
            {event.formattedAmount && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-sm rounded-full mb-2">
                <span className="font-medium">{event.formattedAmount}</span>
              </div>
            )}

            {/* Subject/Target Links */}
            {(event.subject || event.target) && (
              <div className="flex gap-2 mb-2">
                {event.subject && (
                  <a href={event.subject.url} className="text-blue-600 hover:text-blue-800 text-sm">
                    {event.subject.name}
                  </a>
                )}
                {event.target && <span className="text-gray-400">→</span>}
                {event.target && (
                  <a href={event.target.url} className="text-blue-600 hover:text-blue-800 text-sm">
                    {event.target.name}
                  </a>
                )}
              </div>
            )}

            {/* Event Metadata (filtered to meaningful keys) */}
            {metadataDisplayEntries.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 text-xs text-gray-500 overflow-hidden">
                {metadataDisplayEntries.map(({ label, value }) => (
                  <span key={label} className="capitalize bg-gray-100 px-2 py-0.5 rounded-full">
                    {label}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* More Options Menu - Only show for owner */}
          {isOwner && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-10 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={openEditModal}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit post
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete post
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Social Interaction Buttons - X-style: Touch-optimized for mobile */}
        <div className="flex items-center justify-between pt-3 sm:pt-3 border-t-0 sm:border-t border-gray-100">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 sm:flex-initial">
            {/* Comment Button - X-style: 44x44px touch target on mobile */}
            <button
              onClick={toggleComments}
              className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 active:bg-blue-100/50 transition-colors touch-manipulation justify-center sm:justify-start"
            >
              <MessageCircle className="w-5 h-5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
              <span className="text-sm sm:text-sm min-w-[1.5rem] text-left">
                {(event.commentsCount || 0) > 0 ? event.commentsCount : ''}
              </span>
            </button>

            {/* Repost Button - X-style: 44x44px touch target on mobile */}
            <button
              onClick={handleRepostClick}
              disabled={isReposting}
              className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50/50 active:bg-green-100/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation justify-center sm:justify-start"
            >
              <svg
                className="w-5 h-5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm sm:text-sm min-w-[1.5rem] text-left">
                {/* Repost count would go here if we track it */}
              </span>
            </button>

            {/* Like Button - X-style: 44x44px touch target on mobile */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full transition-colors touch-manipulation justify-center sm:justify-start ${
                event.userLiked
                  ? 'text-red-500 hover:bg-red-50/50 active:bg-red-100/50'
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50/50 active:bg-red-100/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart
                className={`w-5 h-5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 ${
                  event.userLiked ? 'fill-current' : ''
                }`}
              />
              <span className="text-sm sm:text-sm min-w-[1.5rem] text-left">
                {(event.likesCount || 0) > 0 ? event.likesCount : ''}
              </span>
            </button>

            {/* Share Button - X-style: 44x44px touch target on mobile */}
            <button
              onClick={handleShareOpen}
              disabled={isSharing}
              className={`group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2 py-2 sm:py-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-full transition-colors touch-manipulation justify-center sm:justify-start ${
                event.userShared
                  ? 'text-blue-500 hover:bg-blue-50/50 active:bg-blue-100/50'
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 active:bg-blue-100/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Share2 className="w-5 h-5 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" />
              <span className="text-sm sm:text-sm min-w-[1.5rem] text-left">
                {(event.sharesCount || 0) > 0 ? event.sharesCount : ''}
              </span>
            </button>
          </div>

          {/* Visibility Indicator - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
            {event.visibility === 'public' ? (
              <Eye className="w-3 h-3" />
            ) : event.visibility === 'followers' ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <span className="w-3 h-3 bg-gray-400 rounded-full" />
            )}
            <span className="capitalize">{event.visibility}</span>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 ml-2"
                onClick={async () => {
                  const next = (event.visibility || 'public') === 'public' ? 'private' : 'public';
                  // Optimistic toggle
                  onUpdate({ visibility: next });
                  const res = await timelineService.updateEventVisibility(event.id, next);
                  if (!res.success) {
                    logger.error('Failed to update visibility', res.error, 'Timeline');
                    // Revert on failure
                    onUpdate({ visibility: event.visibility });
                  }
                }}
                aria-label="Toggle visibility"
              >
                {event.visibility === 'public' ? 'Make Private' : 'Make Public'}
              </Button>
            )}
          </div>
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          onShare={handleShareConfirm}
          defaultText={''}
          isSubmitting={isSharing}
        />

        {/* Repost Modal */}
        <RepostModal
          isOpen={repostModalOpen}
          onClose={() => setRepostModalOpen(false)}
          event={event}
          onSimpleRepost={handleSimpleRepost}
          onQuoteRepost={handleQuoteRepost}
          isReposting={isReposting}
        />

      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 sm:pt-4 border-t border-gray-100">
            {/* Reply Context - X-style "Replying to @username" */}
            <div className="mb-3 text-sm text-gray-500">
              Replying to{' '}
              <Link
                href={event.actor.username ? `/profiles/${event.actor.username}` : `/profiles/${event.actor.id}`}
                className="text-orange-600 hover:text-orange-700 hover:underline"
              >
                @{event.actor.username || event.actor.name}
              </Link>
            </div>

            {/* Add Comment */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Post your reply"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                onKeyPress={e => e.key === 'Enter' && handleComment()}
              />
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim() || isCommenting}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isCommenting ? '...' : 'Reply'}
              </Button>
            </div>

            {/* Comments List */}
            {comments.length > 0 && (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <AvatarLink
                      username={(comment as any).user_username || null}
                      userId={(comment as any).user_id || null}
                      avatarUrl={comment.user_avatar || null}
                      name={comment.user_name || null}
                      size={24}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={(comment as any).user_username ? `/profiles/${(comment as any).user_username}` : `/profiles/${(comment as any).user_id || '#'}`}
                            className="font-medium text-sm hover:text-orange-600 transition-colors"
                          >
                            {comment.user_name}
                          </Link>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      {comment.reply_count > 0 && (
                        <div className="mt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500"
                            onClick={async () => {
                              const next = !expandedReplies[comment.id];
                              setExpandedReplies(prev => ({ ...prev, [comment.id]: next }));
                              if (next && !replies[comment.id]) {
                                await loadReplies(comment.id);
                              }
                            }}
                          >
                            {expandedReplies[comment.id] ? 'Hide' : 'View'} {comment.reply_count}{' '}
                            repl{comment.reply_count === 1 ? 'y' : 'ies'}
                          </Button>
                          {expandedReplies[comment.id] && replies[comment.id] && (
                            <div className="mt-2 space-y-2 ml-8">
                              {replies[comment.id].map(reply => (
                                <div key={reply.id} className="flex gap-2">
                                  <AvatarLink
                                    username={(reply as any).user_username || null}
                                    userId={(reply as any).user_id || null}
                                    avatarUrl={reply.user_avatar || null}
                                    name={reply.user_name || null}
                                    size={20}
                                    className="flex-shrink-0"
                                  />
                                  <div className="flex-1">
                                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Link
                                          href={(reply as any).user_username ? `/profiles/${(reply as any).user_username}` : `/profiles/${(reply as any).user_id || '#'}`}
                                          className="font-medium text-xs hover:text-orange-600 transition-colors"
                                        >
                                          {reply.user_name}
                                        </Link>
                                        <span className="text-[10px] text-gray-500">
                                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700">{reply.content}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit Post</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <Input
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    placeholder="Post title"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <Textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="What's happening?"
                    rows={6}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditVisibility(editVisibility === 'public' ? 'private' : 'public')
                    }
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor:
                        editVisibility === 'public' ? 'rgb(254 249 195)' : 'rgb(243 244 246)',
                      borderColor:
                        editVisibility === 'public' ? 'rgb(251 191 36)' : 'rgb(209 213 219)',
                      color: editVisibility === 'public' ? 'rgb(146 64 14)' : 'rgb(75 85 99)',
                    }}
                  >
                    {editVisibility === 'public' ? (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Private</span>
                      </>
                    )}
                  </button>
                  <p className="mt-1 text-xs text-gray-500">
                    {editVisibility === 'public'
                      ? 'Everyone can see this post'
                      : 'Only you can see this post'}
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    disabled={isEditing}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEdit} disabled={!editTitle.trim() || isEditing}>
                    {isEditing ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Delete Post</h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this post? This will permanently remove it from your
                timeline.
              </p>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete Post'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export const TimelineComponent: React.FC<TimelineComponentProps> = ({
  feed,
  onEventUpdate,
  onLoadMore,
  showFilters = true,
  compact = false,
  enableMultiSelect = false,
}) => {
  const [events, setEvents] = useState(feed.events);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleEventUpdate = useCallback(
    (eventId: string, updates: Partial<TimelineDisplayEvent>) => {
      setEvents(prevEvents => {
        // If post is deleted, remove it from the list
        if (updates.isDeleted) {
          setSelectedEventIds(prev => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
          });
          return prevEvents.filter(event => event.id !== eventId);
        }
        // Otherwise, update it
        return prevEvents.map(event => (event.id === eventId ? { ...event, ...updates } : event));
      });
      onEventUpdate?.(eventId, updates);
    },
    [onEventUpdate]
  );

  // Multi-select handlers
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev);
    setSelectedEventIds(new Set());
  }, []);

  const toggleEventSelection = useCallback((eventId: string) => {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  // Filter out deleted events
  const visibleEvents = events.filter(event => !event.isDeleted);

  const selectAll = useCallback(() => {
    const visible = events.filter(event => !event.isDeleted);
    if (selectedEventIds.size === visible.length) {
      setSelectedEventIds(new Set());
    } else {
      setSelectedEventIds(new Set(visible.map(e => e.id)));
    }
  }, [events, selectedEventIds.size]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedEventIds.size === 0) return;

    try {
      setIsBulkDeleting(true);
      const deletePromises = Array.from(selectedEventIds).map(eventId =>
        timelineService.deleteEvent(eventId, 'Bulk deleted by user')
      );
      await Promise.all(deletePromises);

      // Remove deleted events from UI
      setEvents(prev => prev.filter(e => !selectedEventIds.has(e.id)));
      setSelectedEventIds(new Set());
      setShowBulkDeleteConfirm(false);
      setSelectionMode(false);
    } catch (error) {
      logger.error('Error bulk deleting events', error, 'Timeline');
      alert('Failed to delete some posts');
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedEventIds]);

  // Don't render anything if empty - let parent handle empty state
  if (visibleEvents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0 sm:space-y-4">
      {/* Multi-Select Controls - Only show if enabled */}
      {enableMultiSelect && (
        <div className="sticky top-16 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 mb-4 sm:mb-0">
          <div className="flex items-center justify-between">
            {!selectionMode ? (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
                className="flex items-center gap-2"
              >
                <span>Select Posts</span>
              </Button>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-sm"
                >
                  {selectedEventIds.size === visibleEvents.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedEventIds.size} {selectedEventIds.size === 1 ? 'post' : 'posts'} selected
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                    disabled={selectedEventIds.size === 0}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete ({selectedEventIds.size})
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectionMode}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events List - Clean, no extra headers - X-style on mobile: no spacing between posts */}
      <div className="space-y-0 sm:space-y-4">
        {visibleEvents.map(event => (
          <TimelineEventComponent
            key={event.id}
            event={event}
            onUpdate={updates => handleEventUpdate(event.id, updates)}
            compact={compact}
            isSelected={selectedEventIds.has(event.id)}
            onToggleSelect={toggleEventSelection}
            selectionMode={selectionMode}
          />
        ))}
      </div>

      {/* Load More */}
      {feed.pagination.hasNext && onLoadMore && (
        <div className="text-center pt-4">
          <Button onClick={onLoadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Delete {selectedEventIds.size} {selectedEventIds.size === 1 ? 'post' : 'posts'}?
                  </h2>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete {selectedEventIds.size === 1 ? 'this post' : 'these posts'}? 
                {selectedEventIds.size > 1 && ' They will be'} permanently removed from your timeline.
              </p>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  disabled={isBulkDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TimelineComponent;
export { TimelineEventComponent };
