'use client';

/**
 * CREATE CAUSE PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Automatically shows template selection (from config.templates) then form.
 *
 * Supports prefill from:
 * - URL params: /dashboard/causes/create?title=...&description=...
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to EntityCreationWizard (DRY - single wizard for all entities)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { causeConfig } from '@/config/entity-configs';
import type { UserCauseFormData } from '@/lib/validation';

export default function CreateCausePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<UserCauseFormData> | undefined>(undefined);

  // Prefill support from URL params (e.g., from My Cat AI action buttons)
  useEffect(() => {
    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Partial<UserCauseFormData> = {};
      if (title) {
        prefillData.title = title;
      }
      if (description) {
        prefillData.description = description;
      }
      if (category) {
        prefillData.cause_category = category;
      }
      setInitialData(prefillData);
    }
  }, [searchParams]);

  return (
    <EntityCreationWizard<UserCauseFormData>
      config={causeConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/causes')}
    />
  );
}
