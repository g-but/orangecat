'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, Lightbulb, ArrowRight } from 'lucide-react';
import { fetchPostDraft, fetchWritingTopics } from '@/services/articles/ai-client';
import type { ProposedTopic } from '@/services/cat/writing-types';
import { TIMELINE_SURFACE } from '@/config/timeline';
import { cn } from '@/lib/utils';

const TOPIC_COUNT = 4;

/**
 * AI writing help for the short-post composer, grounded in the user's own
 * interests. Two affordances:
 *   • "Write with AI" — drafts a full post straight into the composer.
 *   • "Ideas" — suggests specific topics; picking one drafts a post about it.
 * Fails soft: a transient inline note, never a blocking error.
 */
export default function PostAiButton({
  onDraft,
  disabled,
}: {
  onDraft: (text: string) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topics, setTopics] = useState<ProposedTopic[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the topic popover on outside click / Escape.
  useEffect(() => {
    if (!topicsOpen) {
      return;
    }
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setTopicsOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setTopicsOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [topicsOpen]);

  async function writePost(topic?: string) {
    if (busy || disabled) {
      return;
    }
    setBusy(true);
    setError(null);
    setTopicsOpen(false);
    try {
      const draft = await fetchPostDraft(topic ? { topic } : {});
      onDraft(draft.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not draft a post. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleTopics() {
    if (busy || disabled) {
      return;
    }
    if (topicsOpen) {
      setTopicsOpen(false);
      return;
    }
    setTopicsOpen(true);
    if (topics.length === 0) {
      setTopicsLoading(true);
      setError(null);
      try {
        const ideas = await fetchWritingTopics({ kind: 'post', count: TOPIC_COUNT });
        setTopics(ideas);
        if (ideas.length === 0) {
          setError('No ideas right now — add a bit more to your profile and try again.');
          setTopicsOpen(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not suggest topics. Try again.');
        setTopicsOpen(false);
      } finally {
        setTopicsLoading(false);
      }
    }
  }

  return (
    <div ref={wrapRef} className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => writePost()}
        disabled={busy || disabled}
        className={cn(TIMELINE_SURFACE.chip, 'gap-1.5')}
        title="Write a post with AI, grounded in your interests"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? 'Writing…' : 'Write with AI'}
      </button>

      <button
        type="button"
        onClick={toggleTopics}
        disabled={busy || disabled}
        className={cn(TIMELINE_SURFACE.chip, topicsOpen && TIMELINE_SURFACE.chipActive, 'gap-1.5')}
        title="Suggest things you'd want to write about"
        aria-expanded={topicsOpen}
      >
        <Lightbulb className="h-4 w-4" />
        Ideas
      </button>

      {error && <span className="text-xs text-status-negative">{error}</span>}

      {topicsOpen && (
        <div
          className={cn(
            TIMELINE_SURFACE.menu,
            'absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] p-1'
          )}
          role="menu"
          aria-label="Suggested topics"
        >
          {topicsLoading ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-fg-secondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking about what you'd write…
            </div>
          ) : (
            topics.map((t, i) => (
              <button
                key={`${t.title}-${i}`}
                type="button"
                onClick={() => writePost(t.title)}
                className="group flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-raised/60"
                role="menuitem"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg-primary">{t.title}</p>
                  {t.angle && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-fg-secondary">{t.angle}</p>
                  )}
                </div>
                <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-fg-tertiary transition-colors group-hover:text-fg-primary" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
