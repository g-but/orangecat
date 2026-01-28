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
 * Last Modified: 2026-01-28
 * Last Modified Summary: Refactored to use shared useCreatePrefill hook (DRY)
 */

import { useRouter } from 'next/navigation';
import { useCreatePrefill } from '@/hooks/useCreatePrefill';
import { EntityCreationWizard } from '@/components/create';
import { serviceConfig } from '@/config/entity-configs';
import type { UserServiceFormData } from '@/lib/validation';

export default function CreateServicePage() {
  const router = useRouter();

  // Use shared prefill hook (DRY - replaces duplicated prefill logic)
  const { initialData } = useCreatePrefill<UserServiceFormData>({
    entityType: 'service',
  });

  return (
    <EntityCreationWizard<UserServiceFormData>
      config={serviceConfig}
      initialData={initialData}
      onCancel={() => router.push('/dashboard/services')}
    />
  );
}
