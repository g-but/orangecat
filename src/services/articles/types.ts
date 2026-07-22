/**
 * Article domain types. An Article is a projection over a `timeline_events` row
 * whose `metadata.is_article` is true — see `src/config/articles.ts`.
 */

export interface ArticleAuthor {
  id: string;
  name: string;
  username?: string;
  avatarUrl?: string;
}

export interface Article {
  /** Underlying timeline_events row id. */
  id: string;
  slug: string;
  title: string;
  /** Short summary shown in the feed and as the SEO description. */
  excerpt: string;
  /** Raw markdown body. */
  body: string;
  coverImage?: string;
  readingTime: number;
  visibility: 'public' | 'followers' | 'private';
  publishedAt: string;
  author: ArticleAuthor;
  /** The owning actor id (timeline_events.actor_id) — for ownership checks.
   *  NOTE: this is an actor id, not an auth user id; resolve the viewer's actor
   *  via getUserActorId before comparing. */
  authorActorId: string;
}

/** The payload persisted at `metadata.article`. */
export interface ArticleMetadataPayload {
  slug: string;
  cover_image?: string;
  reading_time: number;
  body: string;
}

export interface CreateArticleInput {
  title: string;
  body: string;
  excerpt?: string;
  coverImage?: string;
  visibility: 'public' | 'followers' | 'private';
}
