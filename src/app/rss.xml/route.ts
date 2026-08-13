/**
 * GET /rss.xml — site-wide RSS 2.0 feed.
 *
 * One feed for all long-form content: MDX blog posts (filesystem) and public
 * community articles (timeline_events with metadata.is_article). RSS is the
 * zero-gatekeeper distribution channel — readers subscribe once and every
 * future post reaches them without any platform in between, which is the
 * OrangeCat posture applied to content.
 *
 * The two sources fail independently: the blog half is filesystem-only and
 * cannot fail at runtime; the articles half hits the DB and degrades to an
 * empty list (handled inside listPublishedArticles) — a DB blip must never
 * take down the whole feed.
 */

import { getPublishedPosts } from '@/lib/blog';
import { listPublishedArticles } from '@/services/articles/get-article';
import { APP_NAME, APP_DESCRIPTION, SITE_URL } from '@/config/brand';
import { ROUTES } from '@/config/routes';

interface FeedItem {
  title: string;
  url: string;
  description: string;
  /** Parsed date for sorting + RFC-822 <pubDate>. */
  date: Date;
  author?: string;
  categories: string[];
}

/** Escape the five XML-significant characters for element content. */
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderItem(item: FeedItem): string {
  const categories = item.categories
    .map(tag => `      <category>${xmlEscape(tag)}</category>`)
    .join('\n');
  return [
    '    <item>',
    `      <title>${xmlEscape(item.title)}</title>`,
    `      <link>${xmlEscape(item.url)}</link>`,
    `      <guid isPermaLink="true">${xmlEscape(item.url)}</guid>`,
    `      <description>${xmlEscape(item.description)}</description>`,
    `      <pubDate>${item.date.toUTCString()}</pubDate>`,
    ...(item.author ? [`      <dc:creator>${xmlEscape(item.author)}</dc:creator>`] : []),
    ...(categories ? [categories] : []),
    '    </item>',
  ].join('\n');
}

export async function GET(): Promise<Response> {
  const posts = getPublishedPosts().map<FeedItem>(post => ({
    title: post.title,
    url: `${SITE_URL}${ROUTES.BLOG}/${post.slug}`,
    description: post.excerpt,
    date: new Date(post.date),
    author: post.author,
    categories: post.tags,
  }));

  // listPublishedArticles returns [] on any DB failure — the feed still ships.
  const articles = (await listPublishedArticles()).map<FeedItem>(article => ({
    title: article.title,
    url: `${SITE_URL}${ROUTES.ARTICLE(article.slug)}`,
    description: article.excerpt,
    date: new Date(article.publishedAt),
    author: article.author.name,
    categories: [],
  }));

  const items = [...posts, ...articles]
    .filter(item => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const lastBuildDate = (items[0]?.date ?? new Date()).toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEscape(APP_NAME)}</title>
    <link>${xmlEscape(SITE_URL)}</link>
    <description>${xmlEscape(APP_DESCRIPTION)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${xmlEscape(`${SITE_URL}${ROUTES.RSS}`)}" rel="self" type="application/rss+xml"/>
${items.map(renderItem).join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // 1h edge cache mirrors the blog pages' revalidate window; feed readers
      // poll aggressively and must not each hit the DB.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
