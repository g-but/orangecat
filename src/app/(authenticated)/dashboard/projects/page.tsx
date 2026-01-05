'use client';

/**
 * Projects Dashboard Page
 *
 * Refactored to use modular entity components for consistency with other entity pages.
 * Maintains tabs functionality (My Projects, Favorites) while using EntityListShell.
 *
 * Created: 2025-01-27
 * Last Modified: 2025-12-31
 * Last Modified Summary: Refactored to use modular EntityList pattern with EntityListShell
 */

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import BulkActionsBar from '@/components/entity/BulkActionsBar';
import { useEntityList } from '@/hooks/useEntityList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { projectEntityConfig, type ProjectListItem } from '@/config/entities/projects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Heart, Search, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export default function ProjectsDashboardPage() {
  const { user, isLoading, hydrated, session } = useAuth();
  const router = useRouter();
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useBulkSelection();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-projects' | 'favorites'>('my-projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch my projects
  const {
    items: myProjects,
    loading: projectsLoading,
    error: projectsError,
    page,
    total,
    setPage,
    refresh,
  } = useEntityList<ProjectListItem>({
    apiEndpoint: projectEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading && activeTab === 'my-projects',
  });

  // Fetch favorites
  const {
    items: favorites,
    loading: favoritesLoading,
    page: favPage,
    total: favTotal,
    setPage: setFavPage,
    refresh: refreshFavorites,
  } = useEntityList<ProjectListItem>({
    apiEndpoint: '/api/projects/favorites',
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading && activeTab === 'favorites',
    transformResponse: (data) => {
      // Handle favorites API response format
      const items = data?.data?.data || data?.data || data?.items || [];
      const count = data?.data?.count || data?.count || data?.total || items.length;
      return { items, total: count };
    },
  });

  // Memoize and filter projects
  const filteredProjects = useMemo(() => {
    let items = activeTab === 'favorites' ? favorites : myProjects;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        p =>
          p?.title?.toLowerCase().includes(query) ||
          p?.description?.toLowerCase().includes(query) ||
          p?.category?.toLowerCase().includes(query) ||
          p?.tags?.some(tag => tag?.toLowerCase().includes(query))
      );
    }

    // Apply status filter (only for my projects)
    if (activeTab === 'my-projects' && statusFilter !== 'all') {
      items = items.filter(p => {
        if (!p) return false;
        if (statusFilter === 'draft') return p.isDraft;
        if (statusFilter === 'active') return p.isActive;
        if (statusFilter === 'paused') return p.isPaused;
        if (statusFilter === 'completed') return p.status === 'completed';
        if (statusFilter === 'cancelled') return p.status === 'cancelled';
        return true;
      });
    }

    return items;
  }, [activeTab, myProjects, favorites, searchQuery, statusFilter]);

  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth?from=projects');
    }
  }, [user, hydrated, isLoading, router]);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} project${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map(async (id) => {
        const response = await fetch(`/api/projects/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete project ${id}`);
        }
        const result = await response.json().catch(() => ({}));
        if (result.error) {
          throw new Error(result.error);
        }
        return result;
      });

      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${selectedIds.size} project${selectedIds.size > 1 ? 's' : ''}`);
      clearSelection();
      setShowSelection(false);
      await refresh();
    } catch (error) {
      logger.error('Failed to delete projects', { error }, 'ProjectsDashboardPage');
      toast.error('Failed to delete some projects. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle loading states
  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your projects..." />;
  }

  if (!user || !session) {
    return null;
  }

  const currentLoading = activeTab === 'favorites' ? favoritesLoading : projectsLoading;
  const currentPage = activeTab === 'favorites' ? favPage : page;
  const currentTotal = activeTab === 'favorites' ? favTotal : total;
  const setCurrentPage = activeTab === 'favorites' ? setFavPage : setPage;

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeTab === 'my-projects' && filteredProjects.length > 0 && (
        <Button
          onClick={() => setShowSelection(!showSelection)}
          variant="outline"
          size="sm"
        >
          {showSelection ? 'Cancel' : 'Select'}
        </Button>
      )}
      <Button href={projectEntityConfig.createPath} className="bg-gradient-to-r from-orange-600 to-orange-700 w-full sm:w-auto">
        Create Project
      </Button>
    </div>
  );

  return (
    <>
      <EntityListShell
        title="My Projects"
        description="Manage your crowdfunding projects and track donations"
        headerActions={headerActions}
      >
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as typeof activeTab);
          setShowSelection(false);
          clearSelection();
        }} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="my-projects" className="gap-2">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">My Projects</span>
                <span className="sm:hidden">Mine</span>
                {myProjects.length > 0 && (
                  <span className="ml-1 text-xs">({myProjects.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favorites</span>
                <span className="sm:hidden">Favs</span>
                {favorites.length > 0 && (
                  <span className="ml-1 text-xs">({favorites.length})</span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 w-full sm:w-48 md:w-64"
                  aria-label="Search projects"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {activeTab === 'my-projects' && (
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full sm:w-auto min-w-[140px]"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}
            </div>
          </div>

          <TabsContent value="my-projects" className="space-y-6">
            {projectsError ? (
              <div className="rounded-xl border bg-white p-6 text-red-600">{projectsError}</div>
            ) : (
              <>
                {showSelection && filteredProjects.length > 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredProjects.length && filteredProjects.length > 0}
                        onChange={() => toggleSelectAll(filteredProjects.map(p => p.id))}
                        className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span>Select All</span>
                    </label>
                  </div>
                )}
                <EntityList
                  items={filteredProjects}
                  isLoading={currentLoading}
                  makeHref={projectEntityConfig.makeHref}
                  makeCardProps={projectEntityConfig.makeCardProps}
                  emptyState={projectEntityConfig.emptyState}
                  gridCols={projectEntityConfig.gridCols}
                  selectedIds={showSelection ? selectedIds : undefined}
                  onToggleSelect={showSelection ? toggleSelect : undefined}
                  showSelection={showSelection}
                />
                <CommercePagination page={currentPage} limit={12} total={currentTotal} onPageChange={setCurrentPage} />
              </>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <EntityList
              items={filteredProjects}
              isLoading={currentLoading}
              makeHref={projectEntityConfig.makeHref}
              makeCardProps={projectEntityConfig.makeCardProps}
              emptyState={{
                title: 'No favorites yet',
                description: 'Start exploring projects and save your favorites to see them here.',
                action: (
                  <Button href="/discover?section=projects" variant="outline">
                    Discover Projects
                  </Button>
                ),
              }}
              gridCols={projectEntityConfig.gridCols}
            />
            <CommercePagination page={favPage} limit={12} total={favTotal} onPageChange={setFavPage} />
          </TabsContent>
        </Tabs>
      </EntityListShell>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onClearSelection={() => {
          clearSelection();
          setShowSelection(false);
        }}
        onDelete={handleBulkDelete}
        isDeleting={isDeleting}
        entityNamePlural="projects"
      />
    </>
  );
}
