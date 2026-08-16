'use client';

import { useState } from 'react';
import { Sparkles, Loader2, PenLine, Lightbulb, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchArticleDraft, fetchWritingTopics } from '@/services/articles/ai-client';
import type { ArticleDraft, ProposedTopic } from '@/services/cat/writing-types';

/**
 * One-click AI writing for the article composer. Give it a topic (or leave it
 * blank and it grounds in what you care about): "Write a full draft" fills the
 * whole editor; "Suggest topics" proposes ideas from your own interests and
 * drafts the one you pick. Fails soft — errors and empty results surface inline,
 * never block.
 */
export default function AiWriterPanel({
  title,
  onApplyDraft,
  disabled,
}: {
  title: string;
  onApplyDraft: (draft: ArticleDraft) => void;
  disabled?: boolean;
}) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState<null | 'draft' | 'topics' | string>(null);
  const [topics, setTopics] = useState<ProposedTopic[]>([]);
  const [noTopics, setNoTopics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  const anyBusy = busy !== null || disabled;
  // The prompt box is the primary steer; fall back to the title field.
  const steer = prompt.trim() || title.trim();

  async function writeDraft(topic?: string) {
    setBusy(topic ?? 'draft');
    setError(null);
    setNoTopics(false);
    setJustApplied(false);
    try {
      const draft = await fetchArticleDraft({ topic: topic || steer || undefined });
      onApplyDraft(draft);
      setTopics([]);
      setJustApplied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not draft that. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function loadTopics() {
    setBusy('topics');
    setError(null);
    setNoTopics(false);
    setJustApplied(false);
    try {
      const found = await fetchWritingTopics({
        kind: 'article',
        count: 5,
        focus: prompt.trim() || undefined,
      });
      setTopics(found);
      setNoTopics(found.length === 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not suggest topics. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface-raised/25 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-accent-warm/10 text-accent-warm">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg-primary">Write with AI</p>
          <p className="text-xs text-fg-secondary">
            Grounded in what you care about and what you&apos;ve written before.
          </p>

          <div className="relative mt-3">
            <input
              type="text"
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                setJustApplied(false);
              }}
              disabled={anyBusy}
              placeholder="What do you want to write about? (optional)"
              aria-label="What do you want to write about?"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void writeDraft();
                }
              }}
              className="w-full rounded-md border border-default bg-surface-page py-2 pl-3 pr-10 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-accent-warm focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              disabled={anyBusy}
              onClick={() => writeDraft()}
              title="Write a draft from this prompt"
              aria-label="Write a draft from this prompt"
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-secondary transition-colors hover:bg-surface-raised hover:text-accent-warm disabled:opacity-50"
            >
              {busy === 'draft' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>

          {justApplied && (
            <p className="mt-2 text-xs font-medium text-status-positive">
              Draft added — check the editor below.
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={anyBusy}
              onClick={() => writeDraft()}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent-warm px-3 py-1.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-warm-hover disabled:opacity-50"
            >
              {busy === 'draft' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PenLine className="h-4 w-4" />
              )}
              {steer ? 'Write a full draft' : 'Write me a draft'}
            </button>
            <button
              type="button"
              disabled={anyBusy}
              onClick={loadTopics}
              className="inline-flex items-center gap-1.5 rounded-md border border-default px-3 py-1.5 text-sm font-medium text-fg-primary transition-colors hover:bg-surface-raised disabled:opacity-50"
            >
              {busy === 'topics' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              Suggest topics
            </button>
          </div>

          {topics.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {topics.map((t, i) => (
                <li key={i}>
                  <button
                    type="button"
                    disabled={anyBusy}
                    onClick={() => writeDraft(t.title)}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-md border border-subtle bg-surface-page px-3 py-2 text-left transition-colors hover:border-default disabled:opacity-50'
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg-primary">
                        {t.title}
                      </span>
                      {t.angle && (
                        <span className="block truncate text-xs text-fg-secondary">{t.angle}</span>
                      )}
                    </span>
                    {busy === t.title ? (
                      <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-accent-warm" />
                    ) : (
                      <ArrowRight className="h-4 w-4 flex-shrink-0 text-fg-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-accent-warm" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {noTopics && (
            <p className="mt-2 text-xs text-fg-secondary">
              Couldn&apos;t suggest topics from your context yet. Add a hint above (a theme or
              keyword) and try again — or just write a draft.
            </p>
          )}

          {error && <p className="mt-2 text-xs text-status-negative">{error}</p>}
        </div>
      </div>
    </div>
  );
}
