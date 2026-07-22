/**
 * write-shared — the single source of truth for article write validation and the
 * `timeline_events.metadata` shape. Both publish (create) and edit (update) go
 * through these, so the invariants here (is_article discriminator present, slug
 * preserved, limits enforced) protect the whole article write path.
 */
import { validateArticleInput, buildArticleMetadata } from '@/services/articles/write-shared';
import { ARTICLE_LIMITS } from '@/config/articles';
import type { CreateArticleInput } from '@/services/articles/types';

const base: CreateArticleInput = {
  title: 'A real headline',
  body: 'Some genuine long-form body content.',
  visibility: 'public',
};

describe('validateArticleInput', () => {
  it('accepts and trims valid input', () => {
    const result = validateArticleInput(
      { ...base, title: '  Trim me  ', body: '  Hi there  ' },
      'publish'
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.title).toBe('Trim me');
      expect(result.value.body).toBe('Hi there');
    }
  });

  it('rejects an empty/whitespace title', () => {
    const result = validateArticleInput({ ...base, title: '   ' }, 'publish');
    expect(result).toEqual({ success: false, error: 'Give your article a title.' });
  });

  it('rejects a title over the limit', () => {
    const result = validateArticleInput(
      { ...base, title: 'x'.repeat(ARTICLE_LIMITS.title + 1) },
      'save'
    );
    expect(result.success).toBe(false);
  });

  it('rejects a body under the minimum', () => {
    const result = validateArticleInput({ ...base, body: '   ' }, 'save');
    expect(result).toEqual({ success: false, error: 'Write something before saving.' });
  });

  it('rejects a body over the limit', () => {
    const result = validateArticleInput(
      { ...base, body: 'x'.repeat(ARTICLE_LIMITS.body + 1) },
      'publish'
    );
    expect(result).toEqual({ success: false, error: 'This article is too long to publish.' });
  });

  it('uses action-specific copy for publish vs save', () => {
    const publish = validateArticleInput({ ...base, body: '' }, 'publish');
    const save = validateArticleInput({ ...base, body: '' }, 'save');
    expect(publish.success).toBe(false);
    expect(save.success).toBe(false);
    if (!publish.success && !save.success) {
      expect(publish.error).toContain('publishing');
      expect(save.error).toContain('saving');
    }
  });

  it('derives an excerpt from the body when none is given, capped at the limit', () => {
    const result = validateArticleInput(
      { ...base, excerpt: undefined, body: 'y'.repeat(500) },
      'publish'
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.excerpt.length).toBeLessThanOrEqual(ARTICLE_LIMITS.excerpt);
    }
  });

  it('normalizes a blank cover image to undefined', () => {
    const result = validateArticleInput({ ...base, coverImage: '   ' }, 'publish');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.coverImage).toBeUndefined();
    }
  });
});

describe('buildArticleMetadata', () => {
  const normalized = {
    title: 'Headline',
    body: 'Body text that is long enough.',
    excerpt: 'Body text',
    coverImage: 'https://example.com/cover.jpg',
    slug: 'headline-ab12cd',
  };

  it('always carries the article discriminators', () => {
    const meta = buildArticleMetadata(normalized) as Record<string, unknown>;
    expect(meta.is_user_post).toBe(true);
    expect(meta.is_article).toBe(true);
  });

  it('preserves the provided slug verbatim (edit must never break the URL)', () => {
    const meta = buildArticleMetadata(normalized) as { article: { slug: string } };
    expect(meta.article.slug).toBe('headline-ab12cd');
  });

  it('embeds the body, cover image, and a computed reading time', () => {
    const meta = buildArticleMetadata(normalized) as {
      article: { body: string; cover_image?: string; reading_time: number };
    };
    expect(meta.article.body).toBe(normalized.body);
    expect(meta.article.cover_image).toBe(normalized.coverImage);
    expect(meta.article.reading_time).toBeGreaterThan(0);
  });
});
