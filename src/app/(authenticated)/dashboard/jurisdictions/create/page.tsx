'use client';

import { EntityCreateEditPage } from '@/components/create/EntityCreateEditPage';
import { jurisdictionConfig } from '@/config/entity-configs';
import type { JurisdictionFormData } from '@/lib/validation';

export default function CreateJurisdictionPage() {
  return (
    <EntityCreateEditPage<JurisdictionFormData>
      entityType="jurisdiction"
      config={jurisdictionConfig}
    />
  );
}
