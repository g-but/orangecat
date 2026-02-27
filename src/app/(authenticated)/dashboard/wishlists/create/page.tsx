'use client';

/**
 * CREATE/EDIT WISHLIST PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Supports both create and edit modes via query parameter.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-02-24
 * Last Modified Summary: Added edit mode support (?edit=id)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { EntityForm } from '@/components/create/EntityForm';
import { wishlistConfig } from '@/config/entity-configs';
import Loading from '@/components/Loading';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import type { WishlistFormData } from '@/lib/validation';

export default function CreateWishlistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('edit');
  const { user, hydrated } = useAuth();
  const [wishlistData, setWishlistData] = useState<Partial<WishlistFormData> | null>(null);
  const [loading, setLoading] = useState(!!editId);
  const [editError, setEditError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<WishlistFormData> | undefined>(undefined);

  // Fetch wishlist data if in edit mode
  useEffect(() => {
    if (editId && user?.id && hydrated) {
      const fetchWishlist = async () => {
        try {
          const response = await fetch(`/api/wishlists/${editId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              setWishlistData(result.data);
            } else {
              setEditError('Failed to load wishlist data');
            }
          } else {
            setEditError(
              response.status === 404 ? 'Wishlist not found' : 'Failed to load wishlist data'
            );
          }
        } catch (error) {
          logger.error('Failed to fetch wishlist:', error);
          setEditError('Failed to load wishlist data');
        } finally {
          setLoading(false);
        }
      };
      fetchWishlist();
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
    const wishlistType = searchParams?.get('type');

    if (title || description) {
      const prefillData: Partial<WishlistFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (wishlistType) {
        prefillData.type = wishlistType as WishlistFormData['type'];
      }
      setInitialData(prefillData);
    }
  }, [searchParams, editId]);

  if (loading) {
    return <Loading fullScreen message="Loading wishlist..." />;
  }

  if (editId && editError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h3 className="text-lg font-semibold mb-2">{editError}</h3>
        <p className="text-gray-500 mb-4">Unable to load wishlist for editing.</p>
        <button
          onClick={() => router.push(ROUTES.DASHBOARD.WISHLISTS)}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Back to wishlists
        </button>
      </div>
    );
  }

  if (editId && wishlistData) {
    return (
      <EntityForm
        config={wishlistConfig}
        initialValues={wishlistData}
        mode="edit"
        entityId={editId}
      />
    );
  }

  return (
    <EntityCreationWizard<WishlistFormData>
      config={wishlistConfig}
      initialData={initialData}
      onCancel={() => router.push(ROUTES.DASHBOARD.WISHLISTS)}
    />
  );
}
