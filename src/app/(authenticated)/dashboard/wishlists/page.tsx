/**
 * Wishlists Dashboard Page
 *
 * Page for managing user's wishlists.
 *
 * Created: 2026-01-07
 * Last Modified: 2026-01-07
 * Last Modified Summary: Refactored to use EntityListShell and EntityList
 */

'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import { useEntityList } from '@/hooks/useEntityList';
import { wishlistEntityConfig, type WishlistListItem } from '@/config/entities/wishlists';
import { Plus } from 'lucide-react';

export default function WishlistsPage() {
  const { user, isLoading } = useRequireAuth();

  const {
    items: wishlists,
    loading: wishlistsLoading,
    page,
    total,
    setPage,
  } = useEntityList<WishlistListItem>({
    apiEndpoint: wishlistEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && !isLoading,
  });

  if (isLoading) {
    return <Loading fullScreen message="Loading your wishlists..." />;
  }

  if (!user) {
    return null;
  }

  const headerActions = (
    <Button
      href={wishlistEntityConfig.createPath}
      className="bg-gradient-to-r from-rose-600 to-rose-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Create Wishlist
    </Button>
  );

  return (
    <EntityListShell
      title="My Wishlists"
      description="Manage your gift registries and personal goal lists"
      headerActions={headerActions}
    >
      <div className="space-y-6">
        <EntityList
          items={wishlists}
          isLoading={wishlistsLoading}
          makeHref={wishlistEntityConfig.makeHref}
          makeCardProps={wishlistEntityConfig.makeCardProps}
          emptyState={wishlistEntityConfig.emptyState}
          gridCols={wishlistEntityConfig.gridCols}
        />

        {total > 12 && (
          <CommercePagination page={page} limit={12} total={total} onPageChange={setPage} />
        )}
      </div>
    </EntityListShell>
  );
}
