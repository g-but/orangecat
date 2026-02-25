'use client';

import EntityDashboardPage from '@/components/entity/EntityDashboardPage';
import { wishlistEntityConfig, type WishlistListItem } from '@/config/entities/wishlists';

/**
 * Wishlists Dashboard Page
 *
 * Manage your gift registries and personal goal lists.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-02-24
 * Last Modified Summary: Migrated to EntityDashboardPage for consistent UX (adds delete, error handling, bulk selection)
 */
export default function WishlistsPage() {
  return (
    <EntityDashboardPage<WishlistListItem>
      config={wishlistEntityConfig}
      title="My Wishlists"
      description="Manage your gift registries and personal goal lists"
      createButtonLabel="Create Wishlist"
    />
  );
}
