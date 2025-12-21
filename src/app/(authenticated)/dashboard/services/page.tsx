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
import { serviceEntityConfig } from '@/config/entities/services';
import type { UserService } from '@/types/database';

/**
 * Services Dashboard Page
 * 
 * Refactored to use modular entity components for better maintainability and reusability.
 * 
 * Created: 2025-01-27
 * Last Modified: 2025-01-27
 * Last Modified Summary: Refactored to use new modular EntityList and useEntityList hook
 */
export default function ServicesDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  
  const {
    items: services,
    loading,
    error,
    page,
    total,
    setPage,
  } = useEntityList<UserService>({
    apiEndpoint: serviceEntityConfig.apiEndpoint,
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
    return <Loading fullScreen message="Loading your services..." />;
  }
  
  if (!user) {
    return null;
  }

  const headerActions = (
    <Link href={serviceEntityConfig.createPath}>
      <Button className="bg-gradient-to-r from-orange-600 to-orange-700">Add Service</Button>
    </Link>
  );

  return (
    <EntityListShell
      title="My Services"
      description="Offer your expertise and skills to the community"
      headerActions={headerActions}
    >
      {error ? (
        <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
      ) : (
        <>
          <EntityList
            items={services}
            isLoading={loading}
            makeHref={serviceEntityConfig.makeHref}
            makeCardProps={serviceEntityConfig.makeCardProps}
            emptyState={serviceEntityConfig.emptyState}
            gridCols={serviceEntityConfig.gridCols}
          />
          <CommercePagination page={page} limit={12} total={total} onPageChange={setPage} />
        </>
      )}
    </EntityListShell>
  );
}
