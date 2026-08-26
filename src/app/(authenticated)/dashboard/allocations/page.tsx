'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { allocationEntityConfig, type AllocationListItem } from '@/config/entities/allocations';

/**
 * Allocations dashboard — the directives you have stated.
 */
export default function AllocationsPage() {
  return (
    <EntityDashboardPage<AllocationListItem>
      config={allocationEntityConfig}
      title="My Allocations"
      description="What share of your taxes and contributions should reach each tier of government — and what you would rather fund directly"
      createButtonLabel="State a split"
    />
  );
}
