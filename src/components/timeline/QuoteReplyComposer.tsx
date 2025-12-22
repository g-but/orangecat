'use client';

import React, { useState, useCallback } from 'react';
import { TimelineDisplayEvent } from '@/types/timeline';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import AvatarLink from '@/components/ui/AvatarLink';
import { cn } from '@/lib/utils';
import { timelineService } from '@/services/timeline';
import { logger } from '@/utils/logger';
import { MessageCircle, X, Quote } from 'lucide-react';

interface QuoteReplyComposerProps {
  parentPost: TimelineDisplayEvent;
  onReply?: (reply: TimelineDisplayEvent) => void;
  onCancel?: () => void;
  isOpen?: boolean;
  className?: string;
}

/**
 * Quote Reply Composer - X-style quote reply creation
 * Shows parent post preview and allows threaded replies
 */
export function QuoteReplyComposer({
  parentPost,
  onReply,
  onCancel,
  isOpen = true,
  className,
}: QuoteReplyComposerProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotedText, setQuotedText] = useState('');
  const [isSelectingQuote, setIsSelectingQuote] = useState(false);

  // Handle quote text selection
  const handleQuoteSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setQuotedText(selection.toString().trim());
      setIsSelectingQuote(false);
    }
  }, []);

  // Handle reply submission
  const handleSubmit = useCallback(async () => {
    const text = content.trim();
    if (!text || isSubmitting || !user) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await timelineService.createQuoteReply(
        parentPost.id,
        user.id,
        text,
        quotedText,
        parentPost.visibility
      );

      if (result.success && result.event) {
        onReply?.(result.event);
        setContent('');
        setQuotedText('');
        onCancel?.();
      } else {
        logger.error('Failed to create quote reply', result.error, 'QuoteReplyComposer');
      }
    } catch (error) {
      logger.error('Error creating quote reply', error, 'QuoteReplyComposer');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, quotedText, isSubmitting, user, parentPost, onReply, onCancel]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        onCancel?.();
      }
    },
    [handleSubmit, onCancel]
  );

  if (!isOpen || !user) {
    return null;
  }

  return (
    <div className={cn('border border-gray-200 rounded-lg bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Quote Reply</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-6 w-6 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Parent Post Preview */}
      <div className="p-3 bg-gray-50 border-b border-gray-100">
        <div className="flex gap-3">
          <AvatarLink
            username={parentPost.actor.username}
            userId={parentPost.actor.id}
            avatarUrl={parentPost.actor.avatar}
            name={parentPost.actor.name}
            size={32}
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{parentPost.actor.name}</span>
              <span className="text-gray-500 text-sm">@{parentPost.actor.username}</span>
              <span className="text-gray-500 text-sm">·</span>
              <span className="text-gray-500 text-sm">{parentPost.timeAgo}</span>
            </div>
            <div className="text-sm text-gray-900">{parentPost.description}</div>
          </div>
        </div>

        {/* Quote Selection */}
        {isSelectingQuote ? (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-700 mb-2">
              Select text from the post above to quote, then click "Quote Selected Text"
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleQuoteSelection} className="text-xs">
                Quote Selected Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSelectingQuote(false)}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          quotedText && (
            <div className="mt-3 p-2 bg-gray-100 border-l-4 border-gray-400 rounded-r">
              <div className="text-xs text-gray-600 italic">"{quotedText}"</div>
            </div>
          )
        )}
      </div>

      {/* Reply Input */}
      <div className="p-3">
        <div className="flex gap-3">
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
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={`Reply to ${parentPost.actor.name}...`}
              className="min-h-[80px] text-[15px] border-none bg-transparent p-0 focus:ring-0 resize-none placeholder:text-gray-500"
              disabled={isSubmitting}
              onKeyDown={handleKeyDown}
              autoFocus
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {!quotedText && !isSelectingQuote && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSelectingQuote(true)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    <Quote className="w-3 h-3 mr-1" />
                    Quote
                  </Button>
                )}
                {quotedText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuotedText('')}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove Quote
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Ctrl+Enter to send</span>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isSubmitting}
                  size="sm"
                  className="rounded-full px-4 py-1.5 text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white"
                >
                  {isSubmitting ? 'Replying...' : 'Reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuoteReplyButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Button to trigger quote reply composer
 */
export function QuoteReplyButton({ onClick, disabled, className }: QuoteReplyButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn('text-gray-500 hover:text-blue-600 hover:bg-blue-50', className)}
    >
      <MessageCircle className="w-4 h-4 mr-1" />
      Quote Reply
    </Button>
  );
}
