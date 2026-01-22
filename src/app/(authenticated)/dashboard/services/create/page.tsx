'use client';

/**
 * CREATE SERVICE PAGE
 *
 * Uses the generic EntityCreationWizard for consistent entity creation UX.
 * Automatically shows template selection (from config.templates) then form.
 *
 * Supports prefill from:
 * - URL params: /dashboard/services/create?title=...&description=...
 * - localStorage: service_prefill (legacy)
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-22
 * Last Modified Summary: Migrated to EntityCreationWizard (DRY - single wizard for all entities)
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EntityCreationWizard } from '@/components/create';
import { serviceConfig } from '@/config/entity-configs';
import type { UserServiceFormData } from '@/lib/validation';

export default function CreateServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialData, setInitialData] = useState<Partial<UserServiceFormData> | undefined>(
    undefined
  );

  // Prefill support - URL params take priority, then localStorage
  useEffect(() => {
    // Check URL params first (from My Cat action buttons)
    const title = searchParams?.get('title');
    const description = searchParams?.get('description');
    const category = searchParams?.get('category');

    if (title || description) {
      const prefillData: Partial<UserServiceFormData> = {};
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
      return;
    }

    // Fall back to localStorage (legacy support)
    try {
      const raw = localStorage.getItem('service_prefill');
      if (raw) {
        const data = JSON.parse(raw);
        setInitialData(data);
        localStorage.removeItem('service_prefill');
      }
    } catch {
      // Ignore parse errors
    }
  }, [searchParams]);

  return (
    <EntityCreationWizard<UserServiceFormData>
      config={serviceConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/services')}
    />
  );
}
