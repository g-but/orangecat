'use client';

import React from 'react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { PostCard } from './PostCard';
import { ThreadLine, ThreadConnector } from './ThreadLine';
import { cn } from '@/lib/utils';

interface ThreadPostProps {
  event: TimelineDisplayEvent;
  onUpdate: (updates: Partial<TimelineDisplayEvent>) => void;
  onDelete?: () => void;
  onReplyCreated?: (reply: TimelineDisplayEvent) => void;
  showThreadLine?: boolean;
  isInThread?: boolean;
  className?: string;
}

/**
 * Post component optimized for thread display
 * Includes thread visualization and proper indentation
 */
export function ThreadPost({
  event,
  onUpdate,
  onDelete,
  onReplyCreated,
  showThreadLine = true,
  isInThread = false,
  className,
}: ThreadPostProps) {
  const threadDepth = event.threadDepth || 0;
  const isQuoteReply = event.isQuoteReply || false;

  return (
    <div className={cn('relative', className)}>
      {/* Thread visualization */}
      {showThreadLine && threadDepth > 0 && (
        <div className="absolute left-4 top-0 bottom-0 pointer-events-none">
          <ThreadConnector
            depth={threadDepth}
            hasChildren={false} // TODO: Calculate based on thread structure
            isLastInThread={false} // TODO: Calculate based on thread structure
          />
        </div>
      )}

      {/* Post content with indentation */}
      <div
        className={cn(
          threadDepth > 0 && 'ml-8', // Base indentation for thread posts
          threadDepth > 1 && `ml-${8 + (threadDepth - 1) * 4}` // Additional indentation for deeper threads
        )}
        style={threadDepth > 1 ? { marginLeft: `${8 + (threadDepth - 1) * 16}px` } : undefined}
      >
        {/* Quote reply indicator */}
        {isQuoteReply && event.quotedContent && (
          <div className="mb-2 p-3 bg-gray-50 border-l-4 border-blue-400 rounded-r-md">
            <div className="text-sm text-gray-600 italic">"{event.quotedContent}"</div>
          </div>
        )}

        <PostCard
          event={event}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onReplyCreated={onReplyCreated}
          compact={isInThread} // More compact in thread view
        />
      </div>
    </div>
  );
}

interface ThreadViewProps {
  events: TimelineDisplayEvent[];
  onUpdate: (eventId: string, updates: Partial<TimelineDisplayEvent>) => void;
  onDelete?: (eventId: string) => void;
  onReplyCreated?: (reply: TimelineDisplayEvent) => void;
  className?: string;
}

/**
 * Complete thread view component
 * Displays all posts in a thread with proper visualization
 */
export function ThreadView({
  events,
  onUpdate,
  onDelete,
  onReplyCreated,
  className,
}: ThreadViewProps) {
  if (!events || events.length === 0) {
    return <div className="text-center py-8 text-gray-500">No posts in this thread.</div>;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {events.map((event, index) => (
        <ThreadPost
          key={event.id}
          event={event}
          onUpdate={updates => onUpdate(event.id, updates)}
          onDelete={onDelete ? () => onDelete(event.id) : undefined}
          onReplyCreated={onReplyCreated}
          showThreadLine={index > 0} // Don't show thread line for root post
          isInThread={true}
        />
      ))}
    </div>
  );
}
