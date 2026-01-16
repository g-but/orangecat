'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { timelineService } from '@/services/timeline';
import { TimelineDisplayEvent } from '@/types/timeline';
import { PostCard } from '@/components/timeline/PostCard';
import TimelineComposer from '@/components/timeline/TimelineComposer';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Thread View Page - X-style conversation thread
 *
 * Shows a single post with its full context:
 * - Parent posts (if this is a reply)
 * - The main post
 * - All replies/comments
 */
export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params?.id as string;

  const [mainPost, setMainPost] = useState<TimelineDisplayEvent | null>(null);
  const [parentPosts, setParentPosts] = useState<TimelineDisplayEvent[]>([]);
  const [replies, setReplies] = useState<TimelineDisplayEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateReplyTree = useCallback(
    (items: TimelineDisplayEvent[], eventId: string, updates: Partial<TimelineDisplayEvent>): TimelineDisplayEvent[] => {
      return items.map(item => {
        if (item.id === eventId) {
          return { ...item, ...updates };
        }
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: updateReplyTree(item.replies, eventId, updates) };
        }
        return item;
      });
    },
    []
  );

  const appendReplyToTree = useCallback(
    (items: TimelineDisplayEvent[], parentId: string, reply: TimelineDisplayEvent): TimelineDisplayEvent[] => {
      return items.map(item => {
        if (item.id === parentId) {
          const nextReplies = [...(item.replies || []), reply];
          return { ...item, replies: nextReplies, replyCount: nextReplies.length };
        }
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: appendReplyToTree(item.replies, parentId, reply) };
        }
        return item;
      });
    },
    []
  );

  // Fetch the main post and its context
  const fetchPost = useCallback(async () => {
    if (!postId) {return;}

    setIsLoading(true);
    setError(null);

    try {
      // Fetch the main post
      const result = await timelineService.getEventById(postId);

      if (!result.success || !result.event) {
        setError('Post not found');
        return;
      }

      setMainPost(result.event);

      // Fetch parent chain if this is a reply
      if (result.event.parentEventId) {
        const parents: TimelineDisplayEvent[] = [];
        let currentParentId: string | undefined = result.event.parentEventId;

        // Walk up the parent chain (limit to 10 to prevent infinite loops)
        for (let i = 0; i < 10 && currentParentId; i++) {
          const parentResult = await timelineService.getEventById(currentParentId);
          if (parentResult.success && parentResult.event) {
            parents.unshift(parentResult.event); // Add to beginning
            currentParentId = parentResult.event.parentEventId;
          } else {
            break;
          }
        }

        setParentPosts(parents);
      }

      // Fetch replies to this post
      const repliesResult = await timelineService.getReplies(postId);
      if (repliesResult.success && repliesResult.replies) {
        setReplies(repliesResult.replies);
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // Handle post updates (likes, etc.)
  const handlePostUpdate = useCallback((eventId: string, updates: Partial<TimelineDisplayEvent>) => {
    if (eventId === mainPost?.id) {
      setMainPost(prev => prev ? { ...prev, ...updates } : null);
    } else {
      setReplies(prev => updateReplyTree(prev, eventId, updates));
      setParentPosts(prev => prev.map(p => p.id === eventId ? { ...p, ...updates } : p));
    }
  }, [mainPost?.id, updateReplyTree]);

  // Handle new reply created
  const handleReplyCreated = useCallback(() => {
    fetchPost(); // Refresh to get new reply
  }, [fetchPost]);

  const handleNestedReplyCreated = useCallback(
    (parentId: string, reply: TimelineDisplayEvent) => {
      setReplies(prev => appendReplyToTree(prev, parentId, reply));
    },
    [appendReplyToTree]
  );

  const renderReplies = useCallback(
    (items: TimelineDisplayEvent[], depth: number = 0) => {
      return items.map(reply => (
        <div
          key={reply.id}
          className={cn(
            depth === 0 ? 'border-b border-gray-200' : 'border-l border-gray-100',
            depth > 0 ? 'pl-4 ml-4' : ''
          )}
        >
          <PostCard
            event={reply}
            onUpdate={(updates) => handlePostUpdate(reply.id, updates)}
            onReplyCreated={(newReply) => handleNestedReplyCreated(reply.id, newReply)}
          />
          {reply.replies && reply.replies.length > 0 && renderReplies(reply.replies, depth + 1)}
        </div>
      ));
    },
    [handleNestedReplyCreated, handlePostUpdate]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error || !mainPost) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <p className="text-xl font-bold text-gray-900 mb-2">This post doesn't exist</p>
          <p className="text-gray-500 mb-4">It may have been deleted or the link is incorrect.</p>
          <Link href="/timeline">
            <Button>Go to Timeline</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        {/* Parent posts (conversation context) */}
        {parentPosts.length > 0 && (
          <div className="relative">
            {parentPosts.map((parent, _index) => (
              <div key={parent.id} className="relative">
                {/* Thread line connecting posts */}
                <div
                  className="absolute left-[34px] top-[52px] bottom-0 w-0.5 bg-gray-200"
                  style={{ height: 'calc(100% - 52px + 12px)' }}
                />
                <PostCard
                  event={parent}
                  onUpdate={(updates) => handlePostUpdate(parent.id, updates)}
                  compact
                />
              </div>
            ))}
          </div>
        )}

        {/* Main post - expanded view */}
        <div className="border-b border-gray-200">
          <PostCard
            event={mainPost}
            onUpdate={(updates) => handlePostUpdate(mainPost.id, updates)}
            showMetrics={true}
          />

          {/* Engagement stats bar */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6 text-sm">
            {(mainPost.repostsCount || 0) > 0 && (
              <button className="hover:underline">
                <span className="font-bold text-gray-900">{mainPost.repostsCount}</span>
                <span className="text-gray-500 ml-1">Reposts</span>
              </button>
            )}
            {(mainPost.likesCount || 0) > 0 && (
              <button className="hover:underline">
                <span className="font-bold text-gray-900">{mainPost.likesCount}</span>
                <span className="text-gray-500 ml-1">Likes</span>
              </button>
            )}
            {(mainPost.commentsCount || 0) > 0 && (
              <button className="hover:underline">
                <span className="font-bold text-gray-900">{mainPost.commentsCount}</span>
                <span className="text-gray-500 ml-1">{mainPost.commentsCount === 1 ? 'Reply' : 'Replies'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Reply composer */}
        {user && (
          <div className="border-b border-gray-200">
            <TimelineComposer
              placeholder={`Reply to @${mainPost.actor.username || mainPost.actor.name}`}
              buttonText="Reply"
              showBanner={false}
              onPostCreated={handleReplyCreated}
              parentEventId={mainPost.id}
            />
          </div>
        )}

        {/* Replies section */}
        {replies.length > 0 && (
          <div>
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Replies</h2>
            </div>
            {renderReplies(replies)}
          </div>
        )}

        {/* No replies yet */}
        {replies.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No replies yet</p>
            {user && (
              <p className="text-sm text-gray-400 mt-1">Be the first to reply!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
