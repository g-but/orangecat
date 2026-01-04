'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { causeEntityConfig } from '@/config/entities/causes';
import type { UserCause } from '@/types/database';

/**
 * Causes Dashboard Page
 *
 * Create and manage charitable fundraising campaigns.
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-03
 * Last Modified Summary: Refactored to use reusable EntityDashboardPage component
 */
export default function CausesPage() {
  return (
    <EntityDashboardPage<UserCause>
      config={causeEntityConfig}
      title="My Causes"
      description="Create and manage charitable fundraising campaigns"
      createButtonLabel="Create Cause"
    />
  );
}
