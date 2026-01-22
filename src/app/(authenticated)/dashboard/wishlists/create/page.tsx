'use client';

/**
 * CREATE WISHLIST PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Automatically shows template selection (from config.templates) then form.
 *
 * Supports prefill from:
 * - URL params: /dashboard/wishlists/create?title=...&description=...
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to EntityCreationWizard (DRY - single wizard for all entities)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { wishlistConfig } from '@/config/entity-configs';
import type { WishlistFormData } from '@/lib/validation';

export default function CreateWishlistPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<WishlistFormData> | undefined>(undefined);

  // Prefill support from URL params
  useEffect(() => {
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
  }, [searchParams]);

  return (
    <EntityCreationWizard<WishlistFormData>
      config={wishlistConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/wishlists')}
    />
  );
}
