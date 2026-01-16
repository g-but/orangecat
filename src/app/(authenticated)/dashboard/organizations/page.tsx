'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import { useEntityList } from '@/hooks/useEntityList';
import {
  organizationEntityConfig,
  OrganizationEntity,
  toOrganizationEntity,
} from '@/config/entities/organizations';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

/**
 * Organizations Dashboard Page
 *
 * Displays the user's organizations using the modular entity pattern.
 * Includes delete functionality for founders.
 *
 * Created: 2025-12-25
 * Last Modified: 2025-12-27
 * Last Modified Summary: Added delete functionality with confirmation dialog
 */
export default function OrganizationsDashboardPage() {
  const { user, isLoading, hydrated } = useAuth();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<OrganizationEntity | null>(null);

  const {
    items: rawOrganizations,
    loading,
    error,
    page,
    total,
    setPage,
    refresh,
  } = useEntityList<OrganizationEntity>({
    apiEndpoint: `${organizationEntityConfig.apiEndpoint}?filter=my`,
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading,
    // Transform raw API response to entity format
    transformResponse: (data) => {
      const orgs = data.organizations || data.items || [];
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: orgs.map((org: any) => toOrganizationEntity(org)),
        total: data.count || data.total || orgs.length,
      };
    },
  });

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth');
    }
  }, [user, hydrated, isLoading, router]);

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your organizations..." />;
  }

  if (!user) {
    return null;
  }

  // Handle delete click
  const handleDeleteClick = (org: OrganizationEntity) => {
    setOrgToDelete(org);
    setShowDeleteConfirm(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!orgToDelete) {return;}

    setDeletingId(orgToDelete.id);
    try {
      const response = await fetch(`/api/organizations/${orgToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete organization');
      }

      toast.success('Organization deleted successfully');
      setShowDeleteConfirm(false);
      setOrgToDelete(null);
      // Refresh the list
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete organization';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setOrgToDelete(null);
  };

  // Enhanced card props with delete button
  const makeCardPropsWithDelete = (org: OrganizationEntity) => {
    const baseProps = organizationEntityConfig.makeCardProps(org);
    // Check if user is founder (can delete)
    // For now, we'll show delete for all - the API will enforce founder-only
    const isDeleting = deletingId === org.id;
    
    return {
      ...baseProps,
      actions: (
        <div className="flex items-center gap-2">
          {baseProps.actions}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(org);
            }}
            disabled={isDeleting}
            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      ),
    };
  };

  const headerActions = (
    <Link href={organizationEntityConfig.createPath}>
      <Button className="bg-gradient-to-r from-purple-600 to-purple-700">
        Create Organization
      </Button>
    </Link>
  );

  return (
    <>
      <EntityListShell
        title="My Organizations"
        description="Manage your organizations, teams, and collaborative projects"
        headerActions={headerActions}
      >
        {error ? (
          <div className="rounded-xl border bg-white p-6 text-red-600">{error}</div>
        ) : (
          <>
            <EntityList
              items={rawOrganizations}
              isLoading={loading}
              makeHref={organizationEntityConfig.makeHref}
              makeCardProps={makeCardPropsWithDelete}
              emptyState={organizationEntityConfig.emptyState}
              gridCols={organizationEntityConfig.gridCols}
            />
            <CommercePagination page={page} limit={12} total={total} onPageChange={setPage} />
          </>
        )}
      </EntityListShell>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && orgToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Organization</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{orgToDelete.title || orgToDelete.name || 'this organization'}"?
              This action cannot be undone and will permanently delete the organization and all associated data.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deletingId === orgToDelete.id}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={deletingId === orgToDelete.id}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deletingId === orgToDelete.id ? 'Deleting...' : 'Delete Organization'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

