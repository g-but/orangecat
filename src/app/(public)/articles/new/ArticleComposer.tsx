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
import { updateArticle } from '@/services/articles/update';
import type { TimelineVisibility } from '@/types/timeline';
import type { ArticleDraft } from '@/services/cat/writing-types';
import ArticleMarkdown from '../[slug]/ArticleMarkdown';
import MarkdownToolbar from '@/components/articles/MarkdownToolbar';
import { useMarkdownTextarea } from '@/components/articles/useMarkdownTextarea';
import AiWriterPanel from '@/components/articles/AiWriterPanel';
import ArticleAiControls from '@/components/articles/ArticleAiControls';
import CoverImageUpload from '@/components/articles/CoverImageUpload';
import ImageSuggestPicker from '@/components/images/ImageSuggestPicker';
import type { StockImage } from '@/services/images/types';

const DRAFT_KEY = 'oc:draft:article';

interface DraftShape {
  title: string;
  excerpt: string;
  coverImage: string;
  body: string;
  visibility: TimelineVisibility;
}

/** Existing article passed when the composer is opened in edit mode. */
export interface ArticleInitial {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  body: string;
  visibility: TimelineVisibility;
}

export default function ArticleComposer({
  user,
  initial,
}: {
  user: { id: string };
  initial?: ArticleInitial;
}) {
  const router = useRouter();
  const isEditing = !!initial;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [visibility, setVisibility] = useState<TimelineVisibility>(initial?.visibility ?? 'public');
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  // Which target the AI image picker is open for (null = closed).
  const [imagePicker, setImagePicker] = useState<null | 'cover' | 'inline'>(null);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const md = useMarkdownTextarea(bodyRef, body, setBody);

  // Restore an in-progress draft once on mount (new articles only — never clobber
  // an article being edited with a stale local draft).
  useEffect(() => {
    if (isEditing) {
      return;
    }
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
  }, [isEditing]);

  // Autosave (debounced) whenever content changes (new articles only).
  useEffect(() => {
    if (isEditing) {
      return;
    }
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
  }, [isEditing, title, excerpt, coverImage, body, visibility]);

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

  function handlePickImage(img: StockImage) {
    if (imagePicker === 'cover') {
      setCoverImage(img.fullUrl);
    } else if (imagePicker === 'inline') {
      md.insertAtCursor(`\n\n![${img.title}](${img.fullUrl})\n\n`);
      setTab('write');
    }
    setImagePicker(null);
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
    const payload = {
      title,
      body,
      excerpt: excerpt || undefined,
      coverImage: coverImage || undefined,
      visibility,
    };

    if (initial) {
      const result = await updateArticle({ id: initial.id, slug: initial.slug }, payload);
      if (!result.success) {
        setError(result.error);
        setPublishing(false);
        return;
      }
      router.push(ROUTES.ARTICLE(initial.slug));
      router.refresh();
      return;
    }

    const result = await publishArticle(user, payload);
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
          href={isEditing ? ROUTES.ARTICLE(initial!.slug) : ROUTES.ARTICLES}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-fg-secondary transition-colors hover:text-fg-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEditing ? 'Back to article' : ARTICLE_COPY.reader.back}
        </Link>

        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-display text-fg-primary">
            {isEditing ? ARTICLE_COPY.edit.heading : ARTICLE_COPY.new.heading}
          </h1>
          <p className="mt-1.5 text-sm text-fg-secondary">
            {isEditing ? ARTICLE_COPY.edit.subheading : ARTICLE_COPY.new.subheading}
          </p>
        </header>

        {!isEditing && (
          <div className="mb-5">
            <AiWriterPanel title={title} onApplyDraft={applyDraft} disabled={publishing} />
          </div>
        )}

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
              onSuggest={() => setImagePicker(imagePicker === 'cover' ? null : 'cover')}
            />
            {imagePicker === 'cover' && (
              <ImageSuggestPicker
                title={title}
                body={body}
                heading="Choose a cover image"
                onPick={handlePickImage}
                onClose={() => setImagePicker(null)}
              />
            )}
            <div>
              <ArticleAiControls
                md={md}
                title={title}
                body={body}
                setTitle={setTitle}
                setExcerpt={setExcerpt}
                setBody={setBody}
                disabled={publishing}
                onInsertImage={() => setImagePicker(imagePicker === 'inline' ? null : 'inline')}
              />
              {imagePicker === 'inline' && (
                <div className="mb-2">
                  <ImageSuggestPicker
                    title={title}
                    body={body}
                    heading="Insert an image"
                    onPick={handlePickImage}
                    onClose={() => setImagePicker(null)}
                  />
                </div>
              )}
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
            {isEditing
              ? publishing
                ? ARTICLE_COPY.edit.saving
                : ARTICLE_COPY.edit.save
              : publishing
                ? ARTICLE_COPY.new.publishing
                : ARTICLE_COPY.new.publish}
          </Button>
        </div>
      </div>
    </div>
  );
}
