/**
 * WISHLIST ENTITY CONFIGURATION (LIST)
 *
 * Configuration for displaying wishlists in list views.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Initial wishlist list configuration
 */

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
}

export const wishlistEntityConfig = {
  entityType: 'wishlist' as const,
  apiEndpoint: '/api/wishlists',
  createPath: '/dashboard/wishlists/create',
  makeHref: (item: WishlistListItem) => `/dashboard/wishlists/${item.id}`,

  makeCardProps: (item: WishlistListItem) => ({
    title: item.title,
    description: item.description,
    image: item.cover_image_url,
    badge: item.type,
    status: item.is_active ? 'active' : 'inactive',
    meta: [
      { label: 'Visibility', value: item.visibility },
      { label: 'Items', value: item.items_count?.toString() || '0' },
    ],
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
