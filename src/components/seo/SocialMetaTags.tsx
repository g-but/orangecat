/**
 * SocialMetaTags Component
 *
 * ⚠️ DEPRECATED: This component uses Pages Router API (next/head) and does not work
 * properly with Next.js App Router. Use `generateMetadata` function instead.
 *
 * For App Router pages, use:
 * ```tsx
 * export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
 *   return {
 *     title: 'Page Title',
 *     description: 'Page description',
 *     openGraph: { ... },
 *     twitter: { ... },
 *   };
 * }
 * ```
 *
 * This component is kept for reference only and should not be used in new code.
 *
 * Created: 2025-11-03
 * Deprecated: 2025-01-30 - Replaced with generateMetadata API
 */

'use client';

import Head from 'next/head';

export interface SocialMetaTagsProps {
  /** Page/content title */
  title: string;
  /** Page/content description */
  description: string;
  /** Absolute URL to share image (should be at least 1200x630px) */
  image?: string;
  /** Canonical URL of the page */
  url?: string;
  /** Type of content (defaults to 'website') */
  type?: 'website' | 'article' | 'profile';
  /** Site name (defaults to 'OrangeCat') */
  siteName?: string;
  /** Twitter card type (defaults to 'summary_large_image') */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

export default function SocialMetaTags({
  title,
  description,
  image = '/images/og-default.png',
  url,
  type = 'website',
  siteName = 'OrangeCat',
  twitterCard = 'summary_large_image',
}: SocialMetaTagsProps) {
  // Ensure URL is set (fallback to current location if available)
  const canonicalUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Head>
  );
}
