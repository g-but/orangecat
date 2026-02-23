import { ENTITY_REGISTRY, type EntityType } from '@/config/entity-registry';

const BASE_URL = 'https://orangecat.ch';

// Maps entity types to schema.org types
const SCHEMA_TYPE_MAP: Partial<Record<EntityType, string>> = {
  product: 'Product',
  service: 'Service',
  event: 'Event',
  loan: 'LoanOrCredit',
  group: 'Organization',
  cause: 'NGO',
  project: 'CreativeWork',
  ai_assistant: 'SoftwareApplication',
};

interface EntityJsonLdInput {
  type: EntityType;
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  /** Extra schema.org properties to merge */
  extra?: Record<string, unknown>;
}

/**
 * Generate a JSON-LD structured data object for an entity.
 * Returns a plain object to be serialized with JSON.stringify.
 */
export function generateEntityJsonLd({
  type,
  id,
  title,
  description,
  imageUrl,
  extra,
}: EntityJsonLdInput): Record<string, unknown> {
  const entityMeta = ENTITY_REGISTRY[type];
  const schemaType = SCHEMA_TYPE_MAP[type] || 'Thing';
  const url = `${BASE_URL}${entityMeta.publicBasePath}/${id}`;

  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title,
    description: description || `${title} on OrangeCat`,
    url,
    ...(imageUrl && { image: imageUrl }),
    ...extra,
  };
}

/**
 * Render a JSON-LD script tag. Use in server components:
 *
 * ```tsx
 * <JsonLdScript data={generateEntityJsonLd({ ... })} />
 * ```
 */
export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
