'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { X, Repeat2, MessageSquare } from 'lucide-react';
import { TimelineDisplayEvent } from '@/types/timeline';
import AvatarLink from '@/components/ui/AvatarLink';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineDisplayEvent;
  onSimpleRepost: () => Promise<void>;
  onQuoteRepost: (quoteText: string) => Promise<void>;
  isReposting?: boolean;
}

/**
 * RepostModal Component
 * 
 * X/Twitter-style repost modal with two options:
 * 1. Simple Repost - Just repost without adding commentary
 * 2. Quote Repost - Add your own commentary to the repost
 */
export function RepostModal({
  isOpen,
  onClose,
  event,
  onSimpleRepost,
  onQuoteRepost,
  isReposting = false,
}: RepostModalProps) {
  const [showQuoteComposer, setShowQuoteComposer] = useState(false);
  const [quoteText, setQuoteText] = useState('');

  if (!isOpen) return null;

  const handleSimpleRepost = async () => {
    await onSimpleRepost();
    onClose();
  };

  const handleQuoteRepost = async () => {
    if (quoteText.trim()) {
      await onQuoteRepost(quoteText.trim());
      setQuoteText('');
      setShowQuoteComposer(false);
      onClose();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(event.eventTimestamp), { addSuffix: true });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <Card
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Repost</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Original Post Preview */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-start gap-3">
                <AvatarLink
                  username={event.actor.username}
                  userId={event.actor.id}
                  avatarUrl={event.actor.avatar}
                  name={event.actor.name}
                  size={40}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-1 flex-wrap">
                    <Link
                      href={event.actor.username ? `/profiles/${event.actor.username}` : `/profiles/${event.actor.id}`}
                      className="font-semibold text-sm text-gray-900 hover:text-orange-600"
                    >
                      {event.actor.name}
                    </Link>
                    {event.actor.username && (
                      <>
                        <Link
                          href={`/profiles/${event.actor.username}`}
                          className="text-gray-500 text-sm hover:text-orange-600"
                        >
                          @{event.actor.username}
                        </Link>
                        <span className="text-gray-400">·</span>
                      </>
                    )}
                    <span className="text-gray-500 text-sm">{timeAgo}</span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Repost Options */}
            {!showQuoteComposer ? (
              <div className="p-2">
                {/* Simple Repost Option */}
                <button
                  onClick={handleSimpleRepost}
                  disabled={isReposting}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Repeat2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">Repost</div>
                    <div className="text-sm text-gray-500">Share this post to your timeline</div>
                  </div>
                </button>

                {/* Quote Repost Option */}
                <button
                  onClick={() => setShowQuoteComposer(true)}
                  disabled={isReposting}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900">Quote</div>
                    <div className="text-sm text-gray-500">Add a comment to your repost</div>
                  </div>
                </button>
              </div>
            ) : (
              /* Quote Composer */
              <div className="p-4 space-y-4">
                <div>
                  <label htmlFor="quote-text" className="block text-sm font-medium text-gray-700 mb-2">
                    Add a comment
                  </label>
                  <textarea
                    id="quote-text"
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Add your thoughts..."
                    maxLength={500}
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {quoteText.length}/500 characters
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowQuoteComposer(false);
                      setQuoteText('');
                    }}
                    disabled={isReposting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleQuoteRepost}
                    disabled={!quoteText.trim() || isReposting}
                    isLoading={isReposting}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {isReposting ? 'Posting...' : 'Quote Repost'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}} />
    </>
  );
}

