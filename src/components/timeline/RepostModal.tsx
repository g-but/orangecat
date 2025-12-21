'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react';
import { TimelineDisplayEvent } from '@/types/timeline';
import AvatarLink from '@/components/ui/AvatarLink';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

const QUOTE_MAX_LENGTH = 280;

interface RepostModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineDisplayEvent;
  onSimpleRepost: () => Promise<void>;
  onQuoteRepost: (quoteText: string) => Promise<void>;
  isReposting?: boolean;
  currentUser?: {
    id?: string | null;
    name?: string | null;
    username?: string | null;
    avatar?: string | null;
  };
}

export function RepostModal({
  isOpen,
  onClose,
  event,
  onSimpleRepost,
  onQuoteRepost,
  isReposting = false,
  currentUser,
}: RepostModalProps) {
  const [quoteText, setQuoteText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const cleanText = (text?: string | null) =>
    (text || '')
      .replace(/^Reposted from .*?:\s*/i, '')
      .replace(/^Quote repost from .*?:\s*/i, '')
      .trim();

  // Prefer original author info when available
  const originalAuthor = {
    name: (event.metadata as any)?.original_actor_name || event.actor.name || 'User',
    username:
      (event.metadata as any)?.original_actor_username ||
      event.actor.username ||
      (event.metadata as any)?.original_actor_id ||
      '',
    id: (event.metadata as any)?.original_actor_id || event.actor.id,
    avatar: (event.metadata as any)?.original_actor_avatar || event.actor.avatar || null,
  };

  // Extract original body, stripping legacy separators
  const originalBody = (() => {
    if ((event.metadata as any)?.original_description) {
      return cleanText((event.metadata as any)?.original_description);
    }
    if (event.description?.includes('\n\n---\n\n')) {
      const [maybeQuote, maybeOriginal] = event.description.split('\n\n---\n\n');
      return cleanText(maybeOriginal) || cleanText(maybeQuote);
    }
    return cleanText(event.description);
  })();

  const handleSimpleRepost = async () => {
    if (isReposting) return;
    await onSimpleRepost();
    onClose();
  };

  const handleQuoteRepost = async () => {
    if (isReposting) return;
    if (quoteText.trim()) {
      await onQuoteRepost(quoteText.trim());
      setQuoteText('');
      // keep quote mode open for next use; modal will close
      onClose();
    }
  };

  // Focus textarea when opened - hook must be called unconditionally
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Global keyboard handling: Esc to close, Ctrl/Cmd+Enter to submit
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (quoteText.trim()) {
          handleQuoteRepost();
        } else {
          handleSimpleRepost();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, quoteText]);

  // Early return AFTER all hooks
  if (!isOpen) return null;

  const timeAgo = formatDistanceToNow(new Date(event.eventTimestamp), { addSuffix: true });
  const remainingCharacters = QUOTE_MAX_LENGTH - quoteText.length;
  const currentActor = {
    id: currentUser?.id || 'me',
    name: currentUser?.name || 'You',
    username: currentUser?.username || '',
    avatar: currentUser?.avatar || null,
  };
  const canQuote = quoteText.trim().length > 0 && remainingCharacters >= 0 && !isReposting;

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
          className="w-full max-w-xl bg-white rounded-2xl shadow-2xl pointer-events-auto animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-900">Repost</div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Quote-first layout like X */}
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <AvatarLink
                  username={currentActor.username || null}
                  userId={currentActor.id}
                  avatarUrl={currentActor.avatar}
                  name={currentActor.name}
                  size={40}
                  className="flex-shrink-0"
                />
                <textarea
                  id="quote-text"
                  ref={textareaRef}
                  value={quoteText}
                  onChange={(e) => setQuoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleQuoteRepost();
                    }
                  }}
                  rows={4}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-gray-50 placeholder:text-gray-500"
                  placeholder="Add a comment"
                  maxLength={QUOTE_MAX_LENGTH}
                  aria-label="Add your comment before reposting"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between text-sm px-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <span
                    className={
                      remainingCharacters <= 20
                        ? 'text-orange-600 font-semibold'
                        : 'text-gray-500'
                    }
                  >
                    {remainingCharacters}
                  </span>
                  <span className="text-gray-400">characters left</span>
                  <span className="hidden sm:inline text-gray-400">·</span>
                  <span className="hidden sm:inline text-gray-400">Ctrl/Cmd + Enter to post</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleSimpleRepost}
                    disabled={isReposting}
                    className="h-9 px-3 text-sm"
                  >
                    Repost
                  </Button>
                  <Button
                    onClick={handleQuoteRepost}
                    disabled={!canQuote}
                    isLoading={isReposting}
                    className="h-9 px-4 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-full"
                  >
                    Quote post
                  </Button>
                </div>
              </div>

              {/* Original Post Preview (X-style) */}
              <div className="border border-gray-200 rounded-2xl bg-gray-50 p-3 hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-3">
                  <AvatarLink
                    username={originalAuthor.username || null}
                    userId={originalAuthor.id}
                    avatarUrl={originalAuthor.avatar}
                    name={originalAuthor.name}
                    size={36}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Link
                        href={
                          originalAuthor.username
                            ? `/profiles/${originalAuthor.username}`
                            : `/profiles/${originalAuthor.id}`
                        }
                        className="font-semibold text-sm text-gray-900 hover:underline"
                      >
                        {originalAuthor.name}
                      </Link>
                      {originalAuthor.username && (
                        <>
                          <span className="text-gray-500 text-sm">@{originalAuthor.username}</span>
                          <span className="text-gray-400 text-sm">·</span>
                        </>
                      )}
                      <span className="text-gray-500 text-sm">{timeAgo}</span>
                    </div>
                    {originalBody && (
                      <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
                        {originalBody}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
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

