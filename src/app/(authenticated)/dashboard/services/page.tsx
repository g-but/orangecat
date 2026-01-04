'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { serviceEntityConfig } from '@/config/entities/services';
import type { UserService } from '@/types/database';

/**
 * Services Dashboard Page
 *
 * Manage your services - offer your expertise and skills to the community.
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-03
 * Last Modified Summary: Refactored to use reusable EntityDashboardPage component
 */
export default function ServicesDashboardPage() {
  return (
    <EntityDashboardPage<UserService>
      config={serviceEntityConfig}
      title="My Services"
      description="Offer your expertise and skills to the community"
      createButtonLabel="Add Service"
    />
  );
}
