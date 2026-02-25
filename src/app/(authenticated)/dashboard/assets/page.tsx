'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { assetEntityConfig } from '@/config/entities/assets';
import type { Asset } from '@/types/asset';

/**
 * Assets Dashboard Page
 *
 * Manage your assets and use them as collateral for loans.
 *
 * Created: 2025-01-27
 * Last Modified: 2026-02-24
 * Last Modified Summary: Migrated to EntityDashboardPage for consistent UX
 */
export default function AssetsPage() {
  return (
    <EntityDashboardPage<Asset>
      config={assetEntityConfig}
      title="My Assets"
      description="Manage your assets and use them as collateral for loans"
      createButtonLabel="Add Asset"
    />
  );
}
