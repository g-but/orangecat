'use client';

/**
 * CREATE ASSET PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Automatically shows template selection (from config.templates) then form.
 *
 * Supports prefill from:
 * - URL params: /dashboard/assets/create?title=...&description=...
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to EntityCreationWizard (DRY - single wizard for all entities)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { assetConfig } from '@/config/entity-configs';
import type { AssetFormData } from '@/lib/validation';

export default function CreateAssetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<AssetFormData> | undefined>(undefined);

  // Prefill support from URL params
  useEffect(() => {
    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const assetType = searchParams?.get('type');

    if (title || description) {
      const prefillData: Partial<AssetFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (assetType) {
        prefillData.type = assetType as AssetFormData['type'];
      }
      setInitialData(prefillData);
    }
  }, [searchParams]);

  return (
    <EntityCreationWizard<AssetFormData>
      config={assetConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/assets')}
    />
  );
}
