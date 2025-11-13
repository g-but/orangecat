'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { TimelineDisplayEvent, TimelineFeedResponse } from '@/types/timeline';
import { timelineService } from '@/services/timeline';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Star,
  Clock,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { formatDistanceToNow } from 'date-fns';

interface TimelineComponentProps {
  feed: TimelineFeedResponse;
  onEventUpdate?: (eventId: string, updates: Partial<TimelineDisplayEvent>) => void;
  onLoadMore?: () => void;
  showFilters?: boolean;
  compact?: boolean;
}

interface TimelineEventProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  compact?: boolean;
}

const TimelineEventComponent: React.FC<TimelineEventProps> = ({
  event,
  onUpdate,
  compact = false,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  const handleLike = useCallback(async () => {
    if (isLiking) {
      return;
    }

    setIsLiking(true);
    try {
      const result = await timelineService.toggleLike(event.id);
      if (result.success) {
        onUpdate({
          userLiked: result.liked,
          likesCount: result.likeCount,
        });
      }
    } catch (error) {
      logger.error('Failed to toggle like', error, 'Timeline');
    } finally {
      setIsLiking(false);
    }
  }, [event.id, isLiking, onUpdate]);

  const handleShare = useCallback(async () => {
    if (isSharing) {
      return;
    }

    setIsSharing(true);
    try {
      const result = await timelineService.shareEvent(event.id, 'Shared from timeline');
      if (result.success) {
        onUpdate({
          userShared: true,
          sharesCount: result.shareCount,
        });
      }
    } catch (error) {
      logger.error('Failed to share event', error, 'Timeline');
    } finally {
      setIsSharing(false);
    }
  }, [event.id, isSharing, onUpdate]);

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
        // Refresh comments
        loadComments();
      }
    } catch (error) {
      logger.error('Failed to add comment', error, 'Timeline');
    } finally {
      setIsCommenting(false);
    }
  }, [event.id, commentText, isCommenting, onUpdate]);

  const loadComments = useCallback(async () => {
    try {
      const eventComments = await timelineService.getEventComments(event.id, 10);
      setComments(eventComments);
    } catch (error) {
      logger.error('Failed to load comments', error, 'Timeline');
    }
  }, [event.id]);

  const toggleComments = useCallback(() => {
    if (!showComments && comments.length === 0) {
      loadComments();
    }
    setShowComments(!showComments);
  }, [showComments, comments.length, loadComments]);

  const timeAgo = formatDistanceToNow(new Date(event.eventTimestamp), { addSuffix: true });

  return (
    <Card
      className={`mb-4 transition-all hover:shadow-md ${event.isFeatured ? 'ring-2 ring-orange-300 bg-gradient-to-r from-orange-50/20 to-transparent' : 'hover:bg-gray-50/50'}`}
    >
      <CardContent className="p-4">
        {/* Event Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Actor Avatar - Larger, more prominent */}
          <div className="flex-shrink-0">
            {event.actor.avatar ? (
              <img
                src={event.actor.avatar}
                alt={event.actor.name}
                className="w-12 h-12 rounded-full border-2 border-white shadow-sm hover:border-orange-200 transition-colors"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-white font-semibold text-base">
                  {event.actor.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Event Content */}
          <div className="flex-1 min-w-0">
            {/* Actor and Event Info */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-semibold text-gray-900 hover:text-orange-600 transition-colors cursor-pointer">
                {event.actor.name}
              </span>
              {event.actor.username && (
                <span className="text-gray-500 text-sm">@{event.actor.username}</span>
              )}
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeAgo}
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

            {/* Event Title and Description - Enhanced for productive activities */}
            <div className="mb-2">
              <h3 className="font-semibold text-gray-900 mb-1.5 text-base leading-relaxed">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-gray-700 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                  {event.description}
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

            {/* Event Metadata */}
            {event.metadata && Object.keys(event.metadata).length > 0 && (
              <div className="text-xs text-gray-500 mb-2">
                {Object.entries(event.metadata)
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <span key={key} className="mr-2">
                      {key}: {String(value)}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* More Options */}
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Social Interaction Buttons - Twitter-like design */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Like Button - Enhanced */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`group flex items-center gap-2 px-2 py-1 rounded-full transition-all ${
                event.userLiked
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  event.userLiked ? 'fill-current' : ''
                }`}
              />
              <span className="text-sm font-medium min-w-[1.5rem] text-left">
                {(event.likesCount || 0) > 0 ? event.likesCount : ''}
              </span>
            </button>

            {/* Comment Button - Enhanced */}
            <button
              onClick={toggleComments}
              className="group flex items-center gap-2 px-2 py-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
            >
              <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium min-w-[1.5rem] text-left">
                {(event.commentsCount || 0) > 0 ? event.commentsCount : ''}
              </span>
            </button>

            {/* Share Button - Enhanced */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={`group flex items-center gap-2 px-2 py-1 rounded-full transition-all ${
                event.userShared
                  ? 'text-blue-600 hover:bg-blue-50'
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Share2 className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium min-w-[1.5rem] text-left">
                {(event.sharesCount || 0) > 0 ? event.sharesCount : ''}
              </span>
            </button>
          </div>

          {/* Visibility Indicator */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {event.visibility === 'public' ? (
              <Eye className="w-3 h-3" />
            ) : event.visibility === 'followers' ? (
              <EyeOff className="w-3 h-3" />
            ) : (
              <span className="w-3 h-3 bg-gray-400 rounded-full" />
            )}
            <span className="capitalize">{event.visibility}</span>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Add Comment */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={e => e.key === 'Enter' && handleComment()}
              />
              <Button
                size="sm"
                onClick={handleComment}
                disabled={!commentText.trim() || isCommenting}
              >
                {isCommenting ? '...' : 'Comment'}
              </Button>
            </div>

            {/* Comments List */}
            {comments.length > 0 && (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <img
                      src={comment.user_avatar}
                      alt={comment.user_name}
                      className="w-6 h-6 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.user_name}</span>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      {comment.reply_count > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs text-gray-500 mt-1">
                          {comment.reply_count} repl{comment.reply_count === 1 ? 'y' : 'ies'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const TimelineComponent: React.FC<TimelineComponentProps> = ({
  feed,
  onEventUpdate,
  onLoadMore,
  showFilters = true,
  compact = false,
}) => {
  const [events, setEvents] = useState(feed.events);

  const handleEventUpdate = useCallback(
    (eventId: string, updates: Partial<TimelineDisplayEvent>) => {
      setEvents(prevEvents =>
        prevEvents.map(event => (event.id === eventId ? { ...event, ...updates } : event))
      );
      onEventUpdate?.(eventId, updates);
    },
    [onEventUpdate]
  );

  // Don't render anything if empty - let parent handle empty state
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Events List - Clean, no extra headers */}
      <div className="space-y-4">
        {events.map(event => (
          <TimelineEventComponent
            key={event.id}
            event={event}
            onUpdate={updates => handleEventUpdate(event.id, updates)}
            compact={compact}
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
    </div>
  );
};

export default TimelineComponent;
