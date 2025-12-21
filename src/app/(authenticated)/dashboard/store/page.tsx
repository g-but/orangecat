'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import { useEntityList } from '@/hooks/useEntityList';
import { productEntityConfig } from '@/config/entities/products';
import { UserProduct } from '@/types/database';

/**
 * Store Dashboard Page
 * 
 * Refactored to use modular entity components for better maintainability and reusability.
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Refactored to use new modular EntityList and useEntityList hook
 */
export default function StoreDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  
  const {
    items: products,
    loading,
    error,
    page,
    total,
    setPage,
  } = useEntityList<UserProduct>({
    apiEndpoint: productEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading,
  });

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, hydrated, isLoading, router]);

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your store..." />;
  }
  
  if (!user) {
    return null;
  }

  const headerActions = (
    <Link href={productEntityConfig.createPath}>
      <Button className="bg-gradient-to-r from-orange-600 to-orange-700">Add Product</Button>
    </Link>
  );

  return (
    <EntityListShell
      title="My Store"
      description="Manage your products and build your personal marketplace"
      headerActions={headerActions}
    >
      {error ? (
        <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
      ) : (
        <>
          <EntityList
            items={products}
            isLoading={loading}
            makeHref={productEntityConfig.makeHref}
            makeCardProps={productEntityConfig.makeCardProps}
            emptyState={productEntityConfig.emptyState}
            gridCols={productEntityConfig.gridCols}
          />
          <CommercePagination page={page} limit={12} total={total} onPageChange={setPage} />
        </>
      )}
    </EntityListShell>
  );
}































