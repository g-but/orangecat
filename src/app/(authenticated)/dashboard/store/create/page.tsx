'use client';

/**
 * CREATE/EDIT PRODUCT PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Supports:
 * - Create mode: /dashboard/store/create (shows template selection then form)
 * - Edit mode: /dashboard/store/create?edit=<id> (shows form directly with existing data)
 * - Prefill from URL params: /dashboard/store/create?title=...&description=...
 *
 * Created: 2025-12-03
 * Last Modified: 2026-02-24
 * Last Modified Summary: Added edit mode support (mirrors causes/create pattern)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { productConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import type { UserProductFormData } from '@/lib/validation';

export default function CreateProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [productData, setProductData] = useState<Partial<UserProductFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<UserProductFormData> | undefined>(
    undefined
  );

  // Fetch product data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`/api/products/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setProductData(result.data);
            } else {
              setEditError('Failed to load product data');
            }
          } else {
            setEditError(
              response.status === 404 ? 'Product not found' : 'Failed to load product data'
            );
          }
        } catch (error) {
          logger.error('Failed to fetch product:', error);
          setEditError('Failed to load product data');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
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
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Partial<UserProductFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (category) {
        prefillData.category = category;
      }
      setInitialData(prefillData);
    }
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading product..." />;
  }

  // Edit mode: show error if fetch failed
  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load product for editing.</p>
        <button
          onClick={() => router.push(ROUTES.DASHBOARD.STORE)}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Back to store
        </button>
      </div>
    );
  }

  // Edit mode: use EntityForm directly (skip template selection)
  if (editId && productData) {
    return (
      <EntityForm
        config={productConfig}
        initialValues={productData}
        mode="edit"
        entityId={editId}
      />
    );
  }

  // Create mode: use EntityCreationWizard
  return (
    <EntityCreationWizard<UserProductFormData>
      config={productConfig}
      initialData={initialData}
      onCancel={() => router.push(ROUTES.DASHBOARD.STORE)}
    />
  );
}
