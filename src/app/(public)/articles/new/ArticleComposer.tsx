'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, PenLine } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { TIMELINE_SURFACE, TIMELINE_VISIBILITY_OPTIONS } from '@/config/timeline';
import { ARTICLE_COPY, ARTICLE_LIMITS, estimateReadingTime } from '@/config/articles';
import { ROUTES } from '@/config/routes';
import { publishArticle } from '@/services/articles/create';
import type { TimelineVisibility } from '@/types/timeline';
import type { ArticleDraft } from '@/services/cat/writing-types';
import ArticleMarkdown from '../[slug]/ArticleMarkdown';
import MarkdownToolbar from '@/components/articles/MarkdownToolbar';
import { useMarkdownTextarea } from '@/components/articles/useMarkdownTextarea';
import AiWriterPanel from '@/components/articles/AiWriterPanel';
import CoverImageUpload from '@/components/articles/CoverImageUpload';

const DRAFT_KEY = 'oc:draft:article';

interface DraftShape {
  title: string;
  excerpt: string;
  coverImage: string;
  body: string;
  visibility: TimelineVisibility;
}

export default function ArticleComposer({ user }: { user: { id: string } }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<TimelineVisibility>('public');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const md = useMarkdownTextarea(bodyRef, body, setBody);

  // Restore an in-progress draft once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        return;
      }
      const d = JSON.parse(raw) as Partial<DraftShape>;
      if (d.title || d.body) {
        setTitle(d.title ?? '');
        setExcerpt(d.excerpt ?? '');
        setCoverImage(d.coverImage ?? '');
        setBody(d.body ?? '');
        if (d.visibility) {
          setVisibility(d.visibility);
        }
        setRestored(true);
      }
    } catch {
      /* ignore corrupt draft */
    }
  }, []);

  // Autosave (debounced) whenever content changes.
  useEffect(() => {
    if (!title && !body && !excerpt && !coverImage) {
      return;
    }
    const id = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ title, excerpt, coverImage, body, visibility } satisfies DraftShape)
        );
      } catch {
        /* storage full / disabled — non-fatal */
      }
    }, 600);
    return () => clearTimeout(id);
  }, [title, excerpt, coverImage, body, visibility]);

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const readingTime = wordCount ? estimateReadingTime(body) : 0;
  const canPublish = title.trim().length > 0 && body.trim().length > 0 && !publishing;

  function applyDraft(draft: ArticleDraft) {
    setTitle(draft.title);
    if (draft.excerpt) {
      setExcerpt(draft.excerpt);
    }
    setBody(draft.body);
    setTab('write');
    setRestored(false);
  }

  function handleBodyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey)) {
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'b') {
      e.preventDefault();
      md.wrap('**', '**', 'bold');
    } else if (k === 'i') {
      e.preventDefault();
      md.wrap('*', '*', 'italic');
    } else if (k === 'k') {
      e.preventDefault();
      md.insertLink();
    }
  }

  async function handlePublish() {
    if (!canPublish) {
      return;
    }
    setPublishing(true);
    setError(null);
    const result = await publishArticle(user, {
      title,
      body,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      visibility,
    });
    if (!result.success) {
      setError(result.error);
      setPublishing(false);
      return;
    }
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    router.push(ROUTES.ARTICLE(result.slug));
  }

  return (
    <div className="min-h-screen bg-surface-page pt-20 pb-24 text-fg-primary">
      <div className="mx-auto w-full max-w-[720px] px-5">
        <Link
          href={ROUTES.ARTICLES}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-fg-secondary transition-colors hover:text-fg-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {ARTICLE_COPY.reader.back}
        </Link>

        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-display text-fg-primary">
            {ARTICLE_COPY.new.heading}
          </h1>
          <p className="mt-1.5 text-sm text-fg-secondary">{ARTICLE_COPY.new.subheading}</p>
        </header>

        <div className="mb-5">
          <AiWriterPanel title={title} onApplyDraft={applyDraft} disabled={publishing} />
        </div>

        {restored && (
          <p className="mb-4 rounded-md border border-subtle bg-surface-raised/30 px-3 py-2 text-xs text-fg-secondary">
            Restored your saved draft.
          </p>
        )}

        {/* Write / Preview tabs */}
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={cn(TIMELINE_SURFACE.chip, tab === 'write' && TIMELINE_SURFACE.chipActive)}
          >
            <PenLine className="h-4 w-4" /> Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(TIMELINE_SURFACE.chip, tab === 'preview' && TIMELINE_SURFACE.chipActive)}
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
          {wordCount > 0 && (
            <span className="ml-auto text-xs text-fg-tertiary">
              {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'} · {readingTime} min
              read
            </span>
          )}
        </div>

        {tab === 'write' ? (
          <div className="space-y-4">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={ARTICLE_COPY.new.titlePlaceholder}
              maxLength={ARTICLE_LIMITS.title}
              aria-label="Article title"
              className="!text-xl !font-semibold"
            />
            <Textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder={ARTICLE_COPY.new.excerptPlaceholder}
              maxLength={ARTICLE_LIMITS.excerpt}
              rows={2}
              aria-label="Excerpt"
            />
            <CoverImageUpload
              value={coverImage}
              onChange={setCoverImage}
              userId={user.id}
              disabled={publishing}
            />
            <div>
              <MarkdownToolbar actions={md} disabled={publishing} />
              <Textarea
                ref={bodyRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                onKeyDown={handleBodyKeyDown}
                placeholder={ARTICLE_COPY.new.bodyPlaceholder}
                rows={18}
                maxLength={ARTICLE_LIMITS.body}
                aria-label="Article body"
                className="rounded-t-none font-mono text-sm leading-6"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-subtle bg-surface-page p-6">
            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt=""
                className="mb-8 aspect-[2/1] w-full rounded-xl border border-subtle object-cover"
              />
            )}
            <h1 className="text-3xl font-semibold leading-tight tracking-display text-fg-primary">
              {title || 'Untitled'}
            </h1>
            {excerpt && <p className="mt-3 text-lg text-fg-secondary">{excerpt}</p>}
            <div className="mt-6 [&>*:first-child]:mt-0">
              {body.trim() ? (
                <ArticleMarkdown body={body} />
              ) : (
                <p className="text-fg-tertiary">Nothing to preview yet.</p>
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-md border border-status-negative/25 bg-status-negative/10 px-3 py-2 text-sm text-status-negative">
            {error}
          </p>
        )}

        {/* Publish bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-4">
          <div className="flex items-center gap-2">
            {TIMELINE_VISIBILITY_OPTIONS.map(option => {
              const Icon = option.Icon;
              const active = visibility === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setVisibility(option.key)}
                  disabled={publishing}
                  className={cn(TIMELINE_SURFACE.chip, active && TIMELINE_SURFACE.chipActive)}
                  title={option.description}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
          <Button
            variant="accent"
            onClick={handlePublish}
            disabled={!canPublish}
            isLoading={publishing}
          >
            {publishing ? ARTICLE_COPY.new.publishing : ARTICLE_COPY.new.publish}
          </Button>
        </div>
      </div>
    </div>
  );
}
