'use client';

/**
 * CREATE/EDIT ASSET PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Created: 2025-12-03
 * Last Modified: 2026-02-24
 * Last Modified Summary: Added edit mode support (?edit=id)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { assetConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import type { AssetFormData } from '@/lib/validation';

export default function CreateAssetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [assetData, setAssetData] = useState<Partial<AssetFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<AssetFormData> | undefined>(undefined);

  // Fetch asset data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchAsset = async () => {
        try {
          const response = await fetch(`/api/assets/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setAssetData(result.data);
            } else {
              setEditError('Failed to load asset data');
            }
          } else {
            setEditError(response.status === 404 ? 'Asset not found' : 'Failed to load asset data');
          }
        } catch (error) {
          logger.error('Failed to fetch asset:', error);
          setEditError('Failed to load asset data');
        } finally {
          setLoading(false);
        }
      };
      fetchAsset();
    } else if (!editId) {
      setLoading(false);
    }
  }, [editId, user?.id, hydrated]);

  // Prefill support from URL params (create mode only)
  useEffect(() => {
    if (editId) {
      return;
    }

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
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading asset..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load asset for editing.</p>
        <button
          onClick={() => router.push(ROUTES.DASHBOARD.ASSETS)}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Back to assets
        </button>
      </div>
    );
  }

  if (editId && assetData) {
    return (
      <EntityForm config={assetConfig} initialValues={assetData} mode="edit" entityId={editId} />
    );
  }

  return (
    <EntityCreationWizard<AssetFormData>
      config={assetConfig}
      initialData={initialData}
      onCancel={() => router.push(ROUTES.DASHBOARD.ASSETS)}
    />
  );
}
