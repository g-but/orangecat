import { Metadata } from 'next';
import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';

const BASE_URL = 'https://orangecat.ch';

interface EntityMetadataInput {
  type: EntityType;
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
}

/**
 * Generate Next.js Metadata for an entity page.
 * Derives canonical URL from ENTITY_REGISTRY publicBasePath (SSOT).
 */
export function generateEntityMetadata({
  type,
  id,
  title,
  description,
  imageUrl,
}: EntityMetadataInput): Metadata {
  const entityMeta = ENTITY_REGISTRY[type];
  const url = `${BASE_URL}${entityMeta.publicBasePath}/${id}`;
  const image = imageUrl || '/images/og-default.png';
  const desc = description || `${title} on OrangeCat - Bitcoin-native marketplace.`;
  const fullTitle = `${title} | OrangeCat`;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      images: [image],
      url,
      type: 'website',
      siteName: 'OrangeCat',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [image],
    },
  };
}
