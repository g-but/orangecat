'use client';

/**
 * Renders user-authored markdown safely. react-markdown never executes JSX (so a
 * stray `<` in a post can't break the page), rehype-sanitize strips dangerous
 * HTML, and remark-gfm adds tables/strikethrough/task-lists. Every element maps
 * to design tokens — no raw hex, no prose plugin — for x.ai/Substack-grade
 * long-form typography that respects light and dark themes.
 */

import Link from 'next/link';
import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

const components = {
  h1: (props: ComponentProps<'h1'>) => (
    <h1
      className="mt-12 mb-5 text-3xl font-semibold leading-tight tracking-display text-fg-primary"
      {...props}
    />
  ),
  h2: (props: ComponentProps<'h2'>) => (
    <h2
      className="mt-11 mb-4 text-2xl font-semibold leading-snug tracking-display text-fg-primary"
      {...props}
    />
  ),
  h3: (props: ComponentProps<'h3'>) => (
    <h3 className="mt-9 mb-3 text-xl font-semibold leading-snug text-fg-primary" {...props} />
  ),
  p: (props: ComponentProps<'p'>) => (
    <p className="my-5 text-lg leading-8 text-fg-primary" {...props} />
  ),
  a: ({ href, ...props }: ComponentProps<'a'>) => (
    <Link
      href={href || '#'}
      className="font-medium text-accent-warm underline decoration-1 underline-offset-2 transition-opacity hover:opacity-80"
      {...props}
    />
  ),
  ul: (props: ComponentProps<'ul'>) => (
    <ul className="my-5 list-disc space-y-2 pl-6 text-lg leading-8 text-fg-primary" {...props} />
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <ol className="my-5 list-decimal space-y-2 pl-6 text-lg leading-8 text-fg-primary" {...props} />
  ),
  li: (props: ComponentProps<'li'>) => <li className="pl-1.5" {...props} />,
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <blockquote
      className="my-7 border-l-2 border-accent-warm pl-5 text-lg italic leading-8 text-fg-secondary"
      {...props}
    />
  ),
  hr: () => <hr className="my-10 border-t border-subtle" />,
  img: ({ alt, ...props }: ComponentProps<'img'>) => (
    // eslint-disable-next-line @next/next/no-img-element -- markdown-authored src: any host, unknown dimensions; next/image would throw for hosts outside images.remotePatterns
    <img
      alt={alt || ''}
      className="my-8 w-full rounded-lg border border-subtle"
      loading="lazy"
      {...props}
    />
  ),
  code: (props: ComponentProps<'code'>) => (
    <code
      className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-[0.9em] text-fg-primary [pre_&]:bg-transparent [pre_&]:p-0"
      {...props}
    />
  ),
  pre: (props: ComponentProps<'pre'>) => (
    <pre
      className="my-6 overflow-x-auto rounded-lg border border-subtle bg-surface-raised/50 p-4 font-mono text-sm leading-6 text-fg-primary"
      {...props}
    />
  ),
  table: (props: ComponentProps<'table'>) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse text-left text-base text-fg-primary" {...props} />
    </div>
  ),
  th: (props: ComponentProps<'th'>) => (
    <th className="border-b border-default px-3 py-2 font-semibold" {...props} />
  ),
  td: (props: ComponentProps<'td'>) => (
    <td className="border-b border-subtle px-3 py-2" {...props} />
  ),
};

export default function ArticleMarkdown({ body }: { body: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={components}
    >
      {body}
    </ReactMarkdown>
  );
}
