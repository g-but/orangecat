/**
 * Generic Public Entity Detail Page
 *
 * Renders any entity's public detail page using ENTITY_REGISTRY metadata.
 * Eliminates 95%+ duplication across products/[id], services/[id], causes/[id], events/[id].
 *
 * Each entity page becomes a thin wrapper that passes entityType + optional custom sections.
 */

import { notFound } from 'next/navigation';
import { Tag } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { getTableName, getEntityMetadata, type EntityType } from '@/config/entity-registry';
import { STATUS } from '@/config/database-constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { generateEntityJsonLd, JsonLdScript } from '@/lib/seo/structured-data';
import EntityShare from '@/components/sharing/EntityShare';
import PublicEntityOwnerCard from '@/components/public/PublicEntityOwnerCard';
import PublicEntityTimestamps from '@/components/public/PublicEntityTimestamps';
import { PublicEntityPaymentSection } from '@/components/payment';
import { fetchEntityOwner } from '@/lib/entities/fetchEntityOwner';
import { ROUTES } from '@/config/routes';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import type { ReactNode } from 'react';

// Color theme → Tailwind class mapping
const THEME_CLASSES: Record<string, { bg: string; icon: string; text: string }> = {
  blue: { bg: 'bg-blue-100', icon: 'text-blue-600', text: 'text-blue-600' },
  tiffany: { bg: 'bg-tiffany-100', icon: 'text-tiffany-600', text: 'text-tiffany-600' },
  rose: { bg: 'bg-rose-100', icon: 'text-rose-600', text: 'text-rose-600' },
  orange: { bg: 'bg-orange-100', icon: 'text-orange-600', text: 'text-orange-600' },
  green: { bg: 'bg-green-100', icon: 'text-green-600', text: 'text-green-600' },
  purple: { bg: 'bg-purple-100', icon: 'text-purple-600', text: 'text-purple-600' },
  indigo: { bg: 'bg-indigo-100', icon: 'text-indigo-600', text: 'text-indigo-600' },
};

const GRADIENT_CLASSES: Record<string, string> = {
  blue: 'from-blue-50/50 via-white to-tiffany-50/30',
  tiffany: 'from-tiffany-50/50 via-white to-blue-50/30',
  rose: 'from-rose-50/50 via-white to-tiffany-50/30',
  orange: 'from-orange-50/50 via-white to-tiffany-50/30',
  green: 'from-green-50/50 via-white to-tiffany-50/30',
  purple: 'from-purple-50/50 via-white to-tiffany-50/30',
  indigo: 'from-indigo-50/50 via-white to-tiffany-50/30',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EntityData = Record<string, any>;

export interface EntityDetailConfig {
  entityType: EntityType;
  /** Label for the owner card (e.g., "Seller", "Provider", "Organizer") */
  ownerLabel?: string;
  /** Label for the timestamps card (e.g., "Listed") */
  createdLabel?: string;
  /** Description card title (e.g., "About this Service") */
  descriptionTitle?: string;
  /** Back link text override */
  backText?: string;
  /** Back link href override */
  backHref?: string;
  /** Extra JSON-LD properties derived from entity data */
  getJsonLdExtra?: (entity: EntityData) => Record<string, unknown>;
  /** Header badges/extra info (e.g., date for events, category for products) */
  renderHeaderExtra?: (entity: EntityData) => ReactNode;
  /** Entity-specific detail cards below description */
  renderDetails?: (entity: EntityData) => ReactNode;
  /** Select columns for metadata query (defaults to 'title, description, price_btc') */
  metadataSelect?: string;
  /** View route for sign-in redirect */
  getViewRoute?: (id: string) => string;
}

/**
 * Fetch entity data for metadata generation
 */
export async function fetchEntityForMetadata(entityType: EntityType, id: string, select?: string) {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from(getTableName(entityType))
    .select(select || 'title, description, price_btc')
    .eq('id', id)
    .eq('status', STATUS.PRODUCTS.ACTIVE)
    .single();
  return data as EntityData | null;
}

/**
 * Main generic entity detail page component
 */
export default async function PublicEntityDetailPage({
  id,
  config,
}: {
  id: string;
  config: EntityDetailConfig;
}) {
  const meta = getEntityMetadata(config.entityType);
  const theme = THEME_CLASSES[meta.colorTheme] || THEME_CLASSES.blue;
  const gradient = GRADIENT_CLASSES[meta.colorTheme] || GRADIENT_CLASSES.blue;
  const Icon = meta.icon;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from(getTableName(config.entityType))
    .select('*')
    .eq('id', id)
    .eq('status', STATUS.PRODUCTS.ACTIVE)
    .single();

  const entity = data as EntityData | null;
  if (error || !entity) {
    notFound();
  }

  const owner = await fetchEntityOwner(supabase, entity);

  const jsonLd = generateEntityJsonLd({
    type: config.entityType,
    id,
    title: entity.title,
    description: entity.description,
    extra: config.getJsonLdExtra?.(entity) || {},
  });

  const viewRoute = config.getViewRoute ? config.getViewRoute(id) : `${meta.publicBasePath}/${id}`;

  return (
    <>
      <JsonLdScript data={jsonLd} />
      <div className={`min-h-screen bg-gradient-to-br ${gradient}`}>
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Breadcrumb
              items={[
                { label: meta.namePlural, href: meta.publicBasePath || ROUTES.DISCOVER },
                { label: entity.title },
              ]}
              className="mb-4"
            />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 ${theme.bg} rounded-xl flex items-center justify-center`}
                >
                  <Icon className={`w-8 h-8 ${theme.icon}`} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{entity.title}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="default" className="capitalize">
                      {entity.status}
                    </Badge>
                    {entity.category && (
                      <Badge variant="secondary">
                        <Tag className="w-3 h-3 mr-1" />
                        {entity.category}
                      </Badge>
                    )}
                    {config.renderHeaderExtra?.(entity)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {entity.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {config.descriptionTitle || 'Description'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{entity.description}</p>
                  </CardContent>
                </Card>
              )}

              {config.renderDetails?.(entity)}
            </div>

            <div className="space-y-6">
              {owner && (
                <PublicEntityOwnerCard owner={owner} label={config.ownerLabel || 'Owner'} />
              )}

              <EntityShare
                entityType={config.entityType}
                entityId={id}
                title={entity.title}
                description={entity.description}
              />

              <PublicEntityPaymentSection
                entityType={config.entityType}
                entityId={id}
                entityTitle={entity.title}
                priceBtc={entity.price_btc ? Number(entity.price_btc) : undefined}
                sellerProfileId={owner?.id ?? null}
                sellerUserId={owner?.user_id ?? null}
                signInRedirect={viewRoute}
              />

              <PublicEntityTimestamps
                createdAt={entity.created_at}
                updatedAt={entity.updated_at}
                createdLabel={config.createdLabel}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
