/**
 * Documents Dashboard Page
 *
 * Page for managing user's documents that provide context for My Cat.
 *
 * Created: 2026-01-20
 * Last Modified: 2026-01-20
 * Last Modified Summary: Initial documents dashboard page
 */

'use client';

import { useRequireAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import { useEntityList } from '@/hooks/useEntityList';
import { documentEntityConfig, type DocumentListItem } from '@/config/entities/documents';
import { Plus, Cat } from 'lucide-react';

export default function DocumentsPage() {
  const { user, isLoading } = useRequireAuth();

  const {
    items: documents,
    loading: documentsLoading,
    page,
    total,
    setPage,
  } = useEntityList<DocumentListItem>({
    apiEndpoint: documentEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && !isLoading,
  });

  if (isLoading) {
    return <Loading fullScreen message="Loading your documents..." />;
  }

  if (!user) {
    return null;
  }

  const headerActions = (
    <Button
      href={documentEntityConfig.createPath}
      className="bg-gradient-to-r from-indigo-600 to-indigo-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Context
    </Button>
  );

  return (
    <EntityListShell
      title="My Cat Context"
      description="Add documents to help My Cat understand your goals, skills, and situation"
      headerActions={headerActions}
    >
      <div className="space-y-6">
        {/* Info banner */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-full">
              <Cat className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-medium text-indigo-900">Help My Cat help you</h3>
              <p className="text-sm text-indigo-700 mt-1">
                The more context you provide, the better advice My Cat can give. Add documents about
                your goals, skills, financial situation, or business plans. Only documents marked{' '}
                <span className="font-medium">&ldquo;My Cat Only&rdquo;</span> or{' '}
                <span className="font-medium">&ldquo;Public&rdquo;</span> will be visible to My Cat.
              </p>
            </div>
          </div>
        </div>

        <EntityList
          items={documents}
          isLoading={documentsLoading}
          makeHref={documentEntityConfig.makeHref}
          makeCardProps={documentEntityConfig.makeCardProps}
          emptyState={documentEntityConfig.emptyState}
          gridCols={documentEntityConfig.gridCols}
        />

        {total > 12 && (
          <CommercePagination page={page} limit={12} total={total} onPageChange={setPage} />
        )}
      </div>
    </EntityListShell>
  );
}
