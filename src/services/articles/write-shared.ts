/**
 * Shared write-path helpers for articles. Both publish (create) and edit
 * (update) go through these so the limits, error copy, and — critically — the
 * `timeline_events.metadata` shape live in exactly ONE place. If create and edit
 * ever built the metadata differently, an edit could drop the `is_article`
 * discriminator or slug and silently "unpublish" the article; a single builder
 * makes that impossible.
 */

import { ARTICLE_LIMITS, deriveExcerpt, estimateReadingTime } from '@/config/articles';
import type { ArticleMetadataPayload, CreateArticleInput } from './types';

/** Trimmed, length-checked article fields ready to persist. */
export interface NormalizedArticle {
  title: string;
  body: string;
  excerpt: string;
  coverImage?: string;
}

export type ArticleValidation =
  | { success: true; value: NormalizedArticle }
  | { success: false; error: string };

/**
 * Validate + normalize article input. `action` only tweaks the two user-facing
 * verbs ("publishing" vs "saving") so each flow reads naturally.
 */
export function validateArticleInput(
  input: CreateArticleInput,
  action: 'publish' | 'save'
): ArticleValidation {
  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) {
    return { success: false, error: 'Give your article a title.' };
  }
  if (title.length > ARTICLE_LIMITS.title) {
    return { success: false, error: `Title must be ${ARTICLE_LIMITS.title} characters or fewer.` };
  }
  if (body.length < ARTICLE_LIMITS.bodyMin) {
    return {
      success: false,
      error:
        action === 'publish'
          ? 'Write something before publishing.'
          : 'Write something before saving.',
    };
  }
  if (body.length > ARTICLE_LIMITS.body) {
    return {
      success: false,
      error:
        action === 'publish' ? 'This article is too long to publish.' : 'This article is too long.',
    };
  }

  const excerpt = (input.excerpt?.trim() || deriveExcerpt(body)).slice(0, ARTICLE_LIMITS.excerpt);
  const coverImage = input.coverImage?.trim() || undefined;
  return { success: true, value: { title, body, excerpt, coverImage } };
}

/**
 * Assemble the `timeline_events.metadata` for an article row. Used by both
 * create and edit so the discriminator (`is_article`) and slug are always
 * present and identical across the write paths.
 */
export function buildArticleMetadata(
  article: NormalizedArticle & { slug: string }
): Record<string, unknown> {
  const payload: ArticleMetadataPayload = {
    slug: article.slug,
    cover_image: article.coverImage,
    reading_time: estimateReadingTime(article.body),
    body: article.body,
  };
  return { is_user_post: true, is_article: true, article: payload };
}
