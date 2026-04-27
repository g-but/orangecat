'use client';

import Button from '@/components/ui/Button';
import Loading from '@/components/Loading';
import EntityListShell from '@/components/entity/EntityListShell';
import EntityList from '@/components/entity/EntityList';
import CommercePagination from '@/components/commerce/CommercePagination';
import BulkActionsBar from '@/components/entity/BulkActionsBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { projectEntityConfig } from '@/config/entities/projects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Heart } from 'lucide-react';
import { useProjectList } from './useProjectList';
import { ProjectsSearchFilter } from './ProjectsSearchFilter';

export default function ProjectsDashboardPage() {
  const {
    user,
    isLoading,
    hydrated,
    session,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isDeleting,
    showSelection,
    setShowSelection,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    activeTab,
    switchTab,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    myProjects,
    favorites,
    filteredProjects,
    projectsError,
    favPage,
    favTotal,
    setFavPage,
    currentLoading,
    currentPage,
    currentTotal,
    setCurrentPage,
    handleBulkDelete,
    executeBulkDelete,
  } = useProjectList();

  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Loading your projects..." />;
  }

  if (!user || !session) {
    return null;
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {activeTab === 'my-projects' && filteredProjects.length > 0 && (
        <Button onClick={() => setShowSelection(!showSelection)} variant="outline" size="sm">
          {showSelection ? 'Cancel' : 'Select'}
        </Button>
      )}
      <Button
        href={projectEntityConfig.createPath}
        className="bg-gradient-to-r from-orange-600 to-orange-700 w-full sm:w-auto"
      >
        Create Project
      </Button>
    </div>
  );

  return (
    <>
      <EntityListShell
        title="My Projects"
        description="Manage your projects and track funding"
        headerActions={headerActions}
      >
        <Tabs
          value={activeTab}
          onValueChange={v => switchTab(v as typeof activeTab)}
          className="space-y-6"
        >
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
                {favorites.length > 0 && <span className="ml-1 text-xs">({favorites.length})</span>}
              </TabsTrigger>
            </TabsList>

            <ProjectsSearchFilter
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              showStatusFilter={activeTab === 'my-projects'}
            />
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
                        checked={
                          selectedIds.size === filteredProjects.length &&
                          filteredProjects.length > 0
                        }
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
                <CommercePagination
                  page={currentPage}
                  limit={12}
                  total={currentTotal}
                  onPageChange={setCurrentPage}
                />
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
            <CommercePagination
              page={favPage}
              limit={12}
              total={favTotal}
              onPageChange={setFavPage}
            />
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
      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={executeBulkDelete}
        title={`Delete ${selectedIds.size} project${selectedIds.size === 1 ? '' : 's'}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
      />
    </>
  );
}
