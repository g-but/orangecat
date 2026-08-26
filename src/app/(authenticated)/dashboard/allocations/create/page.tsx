'use client';

import { EntityCreateEditPage } from '@/components/create/EntityCreateEditPage';
import { allocationConfig } from '@/config/entity-configs';
import type { AllocationFormData } from '@/lib/validation';

export default function CreateAllocationPage() {
  return (
    <EntityCreateEditPage<AllocationFormData> entityType="allocation" config={allocationConfig} />
  );
}
