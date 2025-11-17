'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { MessageSquare, Send, Image, Smile, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';

interface QuickPostWidgetProps {
  onPostSuccess?: () => void;
  className?: string;
}

/**
 * QuickPostWidget - Inline timeline posting from dashboard
 *
 * Provides a quick way to share updates without navigating to Journey page.
 * Compact by default, expands when focused.
 */
export function QuickPostWidget({ onPostSuccess, className = '' }: QuickPostWidgetProps) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePost = async () => {
    if (!content.trim() || !user) return;

    setIsPosting(true);
    setError(null);

    try {
      const result = await timelineService.createPost({
        content: content.trim(),
        visibility: 'public',
        eventType: 'post.created',
      });

      if (result.success) {
        setContent('');
        setIsExpanded(false);
        onPostSuccess?.();

        // Optional: Show success toast
        logger.info('Post created successfully', { postId: result.eventId }, 'QuickPost');
      } else {
        setError('Failed to create post. Please try again.');
      }
    } catch (err) {
      logger.error('Failed to create post', err, 'QuickPost');
      setError('Something went wrong. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handlePost();
    }
  };

  const avatar = profile?.avatar_url;
  const displayName = profile?.name || profile?.username || 'You';

  return (
    <Card className={`transition-all duration-300 ${isExpanded ? 'shadow-lg ring-2 ring-orange-200' : 'hover:shadow-md'} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-10 h-10 rounded-full border-2 border-orange-100"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center border-2 border-orange-100">
                <span className="text-white font-semibold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-1">
            {!isExpanded ? (
              // Compact View
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                Share an update on your journey...
              </button>
            ) : (
              // Expanded View
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="What's on your mind?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    autoFocus
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {content.length}/500
                  </div>
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Future: Add media upload, emoji picker */}
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Add image (coming soon)"
                      disabled
                    >
                      <Image className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Add emoji (coming soon)"
                      disabled
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsExpanded(false);
                        setContent('');
                        setError(null);
                      }}
                      disabled={isPosting}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePost}
                      disabled={!content.trim() || isPosting}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      {isPosting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">Cmd/Ctrl + Enter</kbd> to post
                </div>
              </div>
            )}
          </div>

          {/* Expand/Collapse Icon (when collapsed) */}
          {!isExpanded && (
            <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-2" />
          )}
        </div>

        {/* Quick Link to Full Journey */}
        {!isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => router.push('/journey')}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              View your full journey →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default QuickPostWidget;
