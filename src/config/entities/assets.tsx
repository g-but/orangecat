/**
 * Asset Entity Configuration
 *
 * Following Engineering Principles:
 * - DRY: Uses shared EntityConfig pattern
 * - SSOT: Paths reference entity-registry.ts values
 * - Consistency: Same structure as products, services, causes
 *
 * Created: 2025-12-25
 * Last Modified: 2025-12-25
 * Last Modified Summary: Initial creation of asset entity configuration
 */

import { EntityConfig } from '@/types/entity';
import { Asset } from '@/types/asset';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const assetEntityConfig: EntityConfig<Asset> = {
  name: 'Asset',
  namePlural: 'Assets',
  colorTheme: 'green',

  listPath: '/dashboard/assets',
  detailPath: (id) => `/dashboard/assets/${id}`,
  createPath: '/dashboard/assets/create',
  editPath: (id) => `/dashboard/assets/create?edit=${id}`,

  apiEndpoint: '/api/assets',

  makeHref: (asset) => `/dashboard/assets/${asset.id}`,

  makeCardProps: (asset) => {
    // Build value label
    const valueLabel = asset.estimated_value
      ? `${asset.estimated_value.toLocaleString()} ${asset.currency || PLATFORM_DEFAULT_CURRENCY}`
      : undefined;

    // Format asset type for display
    const typeLabel = asset.type?.replace(/_/g, ' ');

    // Build metadata
    const metadataParts: string[] = [];
    if (typeLabel) {
      metadataParts.push(typeLabel);
    }
    if (asset.location) {
      metadataParts.push(asset.location);
    }

    return {
      priceLabel: valueLabel,
      badge:
        asset.verification_status === 'third_party_verified'
          ? 'Verified'
          : asset.verification_status === 'user_provided'
            ? 'Self-Verified'
            : asset.status === 'draft'
              ? 'Draft'
              : undefined,
      badgeVariant:
        asset.verification_status === 'third_party_verified'
          ? 'success'
          : asset.verification_status === 'user_provided'
            ? 'default'
            : 'default',
      metadata:
        metadataParts.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            {metadataParts.map((part, idx) => (
              <span key={idx} className="capitalize">
                {part}
              </span>
            ))}
          </div>
        ) : undefined,
      showEditButton: true,
      editHref: `/dashboard/assets/create?edit=${asset.id}`,
      // Removed duplicate actions button - edit icon overlay is sufficient
    };
  },

  emptyState: {
    title: 'No assets yet',
    description:
      'Add your assets to use as collateral for loans or to track your portfolio.',
    action: (
      <Link href="/dashboard/assets/create">
        <Button className="bg-gradient-to-r from-green-600 to-green-700">
          Add Asset
        </Button>
      </Link>
    ),
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
