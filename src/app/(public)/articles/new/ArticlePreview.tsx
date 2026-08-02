'use client';

import ArticleMarkdown from '../[slug]/ArticleMarkdown';

/**
 * Read-only preview of the article being composed.
 * Extracted from ArticleComposer.tsx (pure move — markup unchanged).
 */
export default function ArticlePreview({
  title,
  excerpt,
  coverImage,
  body,
}: {
  title: string;
  excerpt: string;
  coverImage: string;
  body: string;
}) {
  return (
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
  );
}
