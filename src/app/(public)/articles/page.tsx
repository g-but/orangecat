import type { Metadata } from 'next';
import Link from 'next/link';
import { PenLine } from 'lucide-react';
import { listPublishedArticles } from '@/services/articles/get-article';
import ArticleList from '@/components/articles/ArticleList';
import { ARTICLE_COPY } from '@/config/articles';
import { ROUTES } from '@/config/routes';

// Reads the viewer's session cookies (via the server Supabase client), so this
// route is inherently dynamic — declare it to skip the static-prerender attempt.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Long-form thinking from the OrangeCat community — Bitcoin-native, free to read.',
};

export default async function ArticlesIndexPage() {
  const articles = await listPublishedArticles();

  return (
    <div className="min-h-screen bg-surface-page pt-20 pb-24 text-fg-primary">
      <div className="mx-auto w-full max-w-2xl px-5">
        <header className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-display text-fg-primary">
              {ARTICLE_COPY.index.heading}
            </h1>
            <p className="mt-2 text-fg-secondary">{ARTICLE_COPY.index.subheading}</p>
          </div>
          <Link
            href={ROUTES.ARTICLES_NEW}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md bg-accent-warm px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-warm-hover"
          >
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">{ARTICLE_COPY.index.write}</span>
          </Link>
        </header>

        {articles.length === 0 ? (
          <div className="rounded-lg border border-subtle bg-surface-raised/30 px-6 py-16 text-center">
            <p className="text-fg-secondary">{ARTICLE_COPY.index.empty}</p>
            <Link
              href={ROUTES.ARTICLES_NEW}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-warm hover:underline"
            >
              <PenLine className="h-4 w-4" />
              {ARTICLE_COPY.index.write}
            </Link>
          </div>
        ) : (
          <ArticleList articles={articles} />
        )}
      </div>
    </div>
  );
}
