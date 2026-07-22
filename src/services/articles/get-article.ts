/**
 * Server-side article reads. Articles are `timeline_events` rows flagged with
 * `metadata.is_article`; we read them through the `enriched_timeline_events`
 * view (joins actor data for the byline).
 */

import { createServerClient } from '@/lib/supabase/server';
import { getUserActorId } from '@/domain/actors';
import { logger } from '@/utils/logger';
import { ARTICLE_METADATA_FLAG } from '@/config/articles';
import type { Article, ArticleMetadataPayload } from './types';

interface ActorData {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

interface EnrichedArticleRow {
  id: string;
  title: string | null;
  description: string | null;
  visibility: string | null;
  event_timestamp: string;
  is_deleted: boolean | null;
  actor_id: string;
  actor_data: ActorData | null;
  metadata: { is_article?: boolean; article?: ArticleMetadataPayload } | null;
}

const ENRICHED_VIEW = 'enriched_timeline_events';

/** Columns needed to render an article — never `select('*')`. */
const ARTICLE_COLUMNS =
  'id, title, description, visibility, event_timestamp, is_deleted, actor_id, actor_data, metadata';

function rowToArticle(row: EnrichedArticleRow): Article | null {
  const payload = row.metadata?.article;
  if (!payload?.slug || typeof payload.body !== 'string') {
    return null;
  }

  const actor = row.actor_data;
  return {
    id: row.id,
    slug: payload.slug,
    title: row.title ?? 'Untitled',
    excerpt: row.description ?? '',
    body: payload.body,
    coverImage: payload.cover_image || undefined,
    readingTime: payload.reading_time ?? 1,
    visibility: (row.visibility as Article['visibility']) ?? 'public',
    publishedAt: row.event_timestamp,
    author: {
      id: actor?.id ?? row.actor_id,
      name: actor?.display_name || actor?.username || 'Unknown',
      username: actor?.username,
      avatarUrl: actor?.avatar_url,
    },
    authorActorId: row.actor_id,
  };
}

/**
 * Fetch a single article by slug. Non-public articles are returned only to their
 * author (the server client carries the viewer's session cookies), otherwise null.
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from(ENRICHED_VIEW)
      .select(ARTICLE_COLUMNS)
      .eq('metadata->article->>slug', slug)
      .eq('is_deleted', false)
      .limit(1)
      .maybeSingle<EnrichedArticleRow>();

    if (error || !data) {
      return null;
    }

    const article = rowToArticle(data);
    if (!article) {
      return null;
    }

    if (article.visibility !== 'public') {
      // Non-public articles are visible only to their author. Compare via actor
      // id (author.id / user.id are different id spaces).
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }
      const viewerActorId = await getUserActorId(supabase, user.id);
      if (!viewerActorId || viewerActorId !== article.authorActorId) {
        return null;
      }
    }

    return article;
  } catch (err) {
    logger.error('Failed to fetch article by slug', { err, slug }, 'Articles');
    return null;
  }
}

/**
 * Whether the current (session) viewer is the article's author. Compares actor
 * ids (author.id / user.id are different id spaces). Used to gate owner-only
 * edit/delete affordances — the mutations are independently RLS-protected.
 */
export async function isCurrentUserArticleAuthor(authorActorId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }
    const viewerActorId = await getUserActorId(supabase, user.id);
    return !!viewerActorId && viewerActorId === authorActorId;
  } catch {
    return false;
  }
}

/** List public, published articles, newest first. */
export async function listPublishedArticles(limit = 30): Promise<Article[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from(ENRICHED_VIEW)
      .select(ARTICLE_COLUMNS)
      .eq(`metadata->>${ARTICLE_METADATA_FLAG}`, 'true')
      .eq('visibility', 'public')
      .eq('is_deleted', false)
      .order('event_timestamp', { ascending: false })
      .limit(limit)
      .returns<EnrichedArticleRow[]>();

    if (error || !data) {
      return [];
    }
    return data.map(rowToArticle).filter((a): a is Article => a !== null);
  } catch (err) {
    logger.error('Failed to list published articles', { err }, 'Articles');
    return [];
  }
}
