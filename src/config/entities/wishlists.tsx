/**
 * WISHLIST ENTITY CONFIGURATION
 *
 * Configuration for displaying wishlists in list views and dashboard.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-02-24
 * Last Modified Summary: Fix meta→metadata bug, add EntityConfig compliance for EntityDashboardPage
 */

import { EntityConfig } from '@/types/entity';

export interface WishlistListItem {
  id: string;
  title: string;
  description: string;
  type: string;
  visibility: string;
  is_active: boolean;
  cover_image_url?: string;
  items_count?: number;
  created_at: string;
  [key: string]: unknown;
}

export const wishlistEntityConfig: EntityConfig<WishlistListItem> = {
  name: 'Wishlist',
  namePlural: 'Wishlists',
  colorTheme: 'orange',

  listPath: '/dashboard/wishlists',
  detailPath: id => `/dashboard/wishlists/${id}`,
  createPath: '/dashboard/wishlists/create',
  editPath: id => `/dashboard/wishlists/create?edit=${id}`,

  apiEndpoint: '/api/wishlists',

  makeHref: item => `/dashboard/wishlists/${item.id}`,

  makeCardProps: item => ({
    imageUrl: item.cover_image_url,
    badge: item.type,
    status: item.is_active ? 'active' : 'inactive',
    showEditButton: true,
    editHref: `/dashboard/wishlists/create?edit=${item.id}`,
    metadata: (
      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
        <span>{item.visibility}</span>
        <span>{item.items_count || 0} items</span>
      </div>
    ),
  }),

  emptyState: {
    title: 'No wishlists yet',
    description: 'Create your first wishlist for a birthday, wedding, or personal goal.',
  },

  gridCols: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
};
