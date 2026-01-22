'use client';

/**
 * CREATE GROUP PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Automatically shows template selection (from config.templates) then form.
 *
 * Supports prefill from:
 * - URL params: /dashboard/groups/create?name=...&description=...
 *
 * Created: 2025-12-30
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to EntityCreationWizard (DRY - single wizard for all entities)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { groupConfig } from '@/config/entity-configs';
import type { CreateGroupSchemaType } from '@/services/groups/validation';

export default function CreateGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<CreateGroupSchemaType> | undefined>(
    undefined
  );

  // Prefill support from URL params
  useEffect(() => {
    const name = searchParams?.get('name');
    const description = searchParams?.get('description');
    const label = searchParams?.get('label');

    if (name || description) {
      const prefillData: Partial<CreateGroupSchemaType> = {};
      if (name) {
        prefillData.name = name;
      }
      if (description) {
        prefillData.description = description;
      }
      if (label) {
        prefillData.label = label as CreateGroupSchemaType['label'];
      }
      setInitialData(prefillData);
    }
  }, [searchParams]);

  return (
    <EntityCreationWizard<CreateGroupSchemaType>
      config={groupConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/groups')}
    />
  );
}
