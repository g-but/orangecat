'use client';

/**
 * CREATE EVENT PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Automatically shows template selection (from config.templates) then form.
 *
 * Supports prefill from:
 * - URL params: /dashboard/events/create?title=...&description=...
 *
 * Created: 2025-01-30
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to EntityCreationWizard (DRY - single wizard for all entities)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { eventConfig } from '@/config/entity-configs';
import type { EventFormData } from '@/lib/validation';

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<EventFormData> | undefined>(undefined);

  // Prefill support from URL params (e.g., from My Cat AI action buttons)
  useEffect(() => {
    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Partial<EventFormData> = {};
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
  }, [searchParams]);

  return (
    <EntityCreationWizard<EventFormData>
      config={eventConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/events')}
    />
  );
}
