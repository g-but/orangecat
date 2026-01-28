'use client';

/**
 * CREATE PRODUCT PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Automatically shows template selection (from config.templates) then form.
 *
 * Supports prefill from:
 * - URL params: /dashboard/store/create?title=...&description=...
 * - localStorage: product_prefill (legacy)
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use shared useCreatePrefill hook (DRY)
 */

import { useRouter } from 'next/navigation';
import { useCreatePrefill } from '@/hooks/useCreatePrefill';
import { EntityCreationWizard } from '@/components/create';
import { productConfig } from '@/config/entity-configs';
import type { UserProductFormData } from '@/lib/validation';

export default function CreateProductPage() {
  const router = useRouter();

  // Use shared prefill hook (DRY - replaces duplicated prefill logic)
  const { initialData } = useCreatePrefill<UserProductFormData>({
    entityType: 'product',
  });

  return (
    <EntityCreationWizard<UserProductFormData>
      config={productConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/store')}
    />
  );
}
