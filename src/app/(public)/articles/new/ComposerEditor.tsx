'use client';

import type { RefObject } from 'react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { ARTICLE_COPY, ARTICLE_LIMITS } from '@/config/articles';
import MarkdownToolbar from '@/components/articles/MarkdownToolbar';
import type { useMarkdownTextarea } from '@/components/articles/useMarkdownTextarea';
import ArticleAiControls from '@/components/articles/ArticleAiControls';
import CoverImageUpload from '@/components/articles/CoverImageUpload';
import ImageSuggestPicker from '@/components/images/ImageSuggestPicker';
import type { StockImage } from '@/services/images/types';

/**
 * The "Write" tab: title/excerpt/cover inputs, AI controls, markdown toolbar
 * and the auto-growing body textarea.
 * Extracted from ArticleComposer.tsx (pure move — markup unchanged).
 */
export default function ComposerEditor({
  title,
  setTitle,
  excerpt,
  setExcerpt,
  coverImage,
  setCoverImage,
  body,
  setBody,
  publishing,
  userId,
  md,
  bodyRef,
  imagePicker,
  setImagePicker,
  onPickImage,
  onBodyKeyDown,
}: {
  title: string;
  setTitle: (v: string) => void;
  excerpt: string;
  setExcerpt: (v: string) => void;
  coverImage: string;
  setCoverImage: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  publishing: boolean;
  userId: string;
  md: ReturnType<typeof useMarkdownTextarea>;
  bodyRef: RefObject<HTMLTextAreaElement | null>;
  imagePicker: null | 'cover' | 'inline';
  setImagePicker: (v: null | 'cover' | 'inline') => void;
  onPickImage: (img: StockImage) => void;
  onBodyKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
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
        userId={userId}
        disabled={publishing}
        onSuggest={() => setImagePicker(imagePicker === 'cover' ? null : 'cover')}
      />
      {imagePicker === 'cover' && (
        <ImageSuggestPicker
          title={title}
          body={body}
          heading="Choose a cover image"
          onPick={onPickImage}
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
              onPick={onPickImage}
              onClose={() => setImagePicker(null)}
            />
          </div>
        )}
        <MarkdownToolbar actions={md} disabled={publishing} />
        <Textarea
          ref={bodyRef}
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={onBodyKeyDown}
          placeholder={ARTICLE_COPY.new.bodyPlaceholder}
          rows={18}
          maxLength={ARTICLE_LIMITS.body}
          aria-label="Article body"
          className="resize-none overflow-hidden rounded-t-none font-mono text-sm leading-6"
        />
      </div>
    </div>
  );
}
