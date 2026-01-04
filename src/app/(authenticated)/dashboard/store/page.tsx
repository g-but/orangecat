'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { productEntityConfig } from '@/config/entities/products';
import { UserProduct } from '@/types/database';

/**
 * Store Dashboard Page
 *
 * Manage your products and build your personal marketplace.
 *
 * Created: 2025-01-27
 * Last Modified: 2025-01-03
 * Last Modified Summary: Refactored to use reusable EntityDashboardPage component
 */
export default function StoreDashboardPage() {
  return (
    <EntityDashboardPage<UserProduct>
      config={productEntityConfig}
      title="My Store"
      description="Manage your products and build your personal marketplace"
      createButtonLabel="Add Product"
    />
  );
}































