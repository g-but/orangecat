/**
 * Shared share-card layout for long-form content (blog posts + articles).
 *
 * One layout, two thin routes — a reader scrolling a feed should see blog
 * posts and community articles as cards from the same product. Satori/next-og
 * only understands inline styles, so tokens come from OG_COLOR (the OG-side
 * SSOT that mirrors globals.css).
 */

import { ImageResponse } from 'next/og';
import { APP_NAME, APP_KICKER } from '@/config/brand';
import { OG_SIZE, OG_COLOR, BrandFooter } from '@/lib/og/branding';

export interface ContentCardProps {
  /** Small uppercase label above the title, e.g. "Blog" or "Article". */
  kicker: string;
  title: string;
  /** Meta line under the title: date, read time, author. */
  meta: string[];
  tags?: string[];
}

/** Render the 1200×630 share card as an ImageResponse (PNG). */
export function contentCardResponse({ kicker, title, meta, tags = [] }: ContentCardProps) {
  // Long headlines must shrink, not overflow the fixed canvas.
  const titleSize = title.length > 70 ? 48 : title.length > 45 ? 56 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: 64,
          background: OG_COLOR.surface,
          fontFamily: 'system-ui, sans-serif',
          color: OG_COLOR.text,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 24 }}>
          <span
            style={{
              display: 'flex',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: OG_COLOR.accent,
            }}
          >
            {kicker}
          </span>
          <span
            style={{
              display: 'flex',
              fontSize: titleSize,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {title}
          </span>
          <span style={{ display: 'flex', fontSize: 26, color: OG_COLOR.textMuted }}>
            {meta.filter(Boolean).join('  ·  ')}
          </span>
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {tags.slice(0, 4).map(tag => (
                <span
                  key={tag}
                  style={{
                    display: 'flex',
                    fontSize: 20,
                    color: OG_COLOR.textMuted,
                    background: OG_COLOR.glass,
                    border: `1px solid ${OG_COLOR.border}`,
                    borderRadius: 999,
                    padding: '8px 20px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <BrandFooter wordmark={APP_NAME} tagline={APP_KICKER} />
      </div>
    ),
    { ...OG_SIZE, headers: { 'cache-control': 'public, max-age=3600, s-maxage=3600' } }
  );
}
