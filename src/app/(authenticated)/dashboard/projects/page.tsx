'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/Loading';
import EntityListPage from '@/components/entities/EntityListPage';
import { Target, Trash2, CheckSquare, Square, Heart, Search, X } from 'lucide-react';
import { useProjectStore, Project } from '@/stores/projectStore';
import Button from '@/components/ui/Button';
import { ProjectTile } from '@/components/projects/ProjectTile';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { FavoriteProject } from '@/types/favorite';
import { ProjectsGridSkeleton } from '@/components/projects/ProjectSkeletons';
import Input from '@/components/ui/Input';

export default function ProjectsDashboardPage() {
  const { user, isLoading, hydrated, session } = useAuth();
  const router = useRouter();
  const { projects, loadProjects, deleteProject, isLoading: projectsLoading } = useProjectStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-projects' | 'favorites'>('my-projects');
  const [favorites, setFavorites] = useState<FavoriteProject[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load projects when user is available (hook must be called before any returns)
  useEffect(() => {
    if (user?.id) {
      loadProjects(user.id);
    }
  }, [user?.id, loadProjects]);

  // Preload favorites count on mount, then load full list when tab is active
  useEffect(() => {
    if (user?.id) {
      // Always preload favorites count for the tab badge
      const loadFavoritesCount = async () => {
        try {
          const response = await fetch('/api/projects/favorites');
          if (response.ok) {
            const result = await response.json();
            setFavorites(result.data || []);
          }
        } catch (error) {
          // Silently fail - favorites will load when tab is clicked
          logger.debug('Failed to preload favorites count', { error }, 'ProjectsDashboardPage');
        }
      };
      loadFavoritesCount();
    }
  }, [user?.id]);

  // Load favorites when favorites tab becomes active (if not already loaded)
  useEffect(() => {
    if (user?.id && activeTab === 'favorites' && favorites.length === 0 && !favoritesLoading) {
      const loadFavorites = async () => {
        setFavoritesLoading(true);
        try {
          const response = await fetch('/api/projects/favorites');
          if (response.ok) {
            const result = await response.json();
            setFavorites(result.data || []);
          } else {
            logger.error(
              'Failed to load favorites',
              { status: response.status },
              'ProjectsDashboardPage'
            );
            toast.error('Failed to load favorites');
          }
        } catch (error) {
          logger.error('Failed to load favorites', { error }, 'ProjectsDashboardPage');
          toast.error('Failed to load favorites');
        } finally {
          setFavoritesLoading(false);
        }
      };
      loadFavorites();
    } else if (activeTab === 'my-projects' && user?.id) {
      // Reload projects when switching back to my-projects tab
      loadProjects(user.id);
    }
  }, [user?.id, activeTab, loadProjects, favorites.length, favoritesLoading]);

  // Memoize items based on active tab with search and filter
  const filteredItems = useMemo(() => {
    let items = activeTab === 'favorites' ? favorites : projects;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        p =>
          p.title?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      items = items.filter(p => {
        if (statusFilter === 'draft') {
          return p.isDraft;
        }
        if (statusFilter === 'active') {
          return p.isActive;
        }
        if (statusFilter === 'paused') {
          return p.isPaused;
        }
        if (statusFilter === 'completed') {
          return p.status === 'completed';
        }
        if (statusFilter === 'cancelled') {
          return p.status === 'cancelled';
        }
        return true;
      });
    }

    return items;
  }, [activeTab, projects, favorites, searchQuery, statusFilter]);

  // Use filtered items for display
  const items = filteredItems;

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) {
      return;
    }

    setDeletingId(projectToDelete.id);
    try {
      await deleteProject(projectToDelete.id);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (error) {
      logger.error(
        'Failed to delete project',
        { projectId: projectToDelete.id, error },
        'ProjectsDashboardPage'
      );
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setProjectToDelete(null);
  };

  // Bulk selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(p => p.id)));
    }
  };

  const handleBulkDelete = () => {
    const selectedProjects = items.filter(p => selectedIds.has(p.id));
    if (selectedProjects.length === 1) {
      setProjectToDelete(selectedProjects[0]);
    } else {
      setProjectToDelete({ id: 'bulk', title: `${selectedProjects.length} projects` } as Project);
    }
    setShowDeleteConfirm(true);
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true);
    const selectedArray = Array.from(selectedIds);
    const results = { success: 0, failed: 0, failedIds: [] as string[] };

    try {
      // Delete one by one and track results
      for (const id of selectedArray) {
        try {
          await deleteProject(id);
          results.success++;
          // Remove from selection as we delete
          setSelectedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        } catch (error) {
          results.failed++;
          results.failedIds.push(id);
          logger.error(`Failed to delete project ${id}`, { error }, 'ProjectsDashboardPage');
        }
      }

      // Show appropriate message based on results
      if (results.failed === 0) {
        toast.success(
          `Successfully deleted ${results.success} project${results.success > 1 ? 's' : ''}`
        );
      } else if (results.success === 0) {
        toast.error('Failed to delete all projects. Please try again.');
      } else {
        toast.warning(
          `Deleted ${results.success} project${results.success > 1 ? 's' : ''}, but ${results.failed} failed. Please try again for the failed ones.`
        );
      }

      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (error) {
      logger.error('Unexpected error during bulk delete', { error }, 'ProjectsDashboardPage');
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const { convertToBTC } = useCurrencyConversion();

  const selectedProjects = useMemo(
    () => items.filter(p => selectedIds.has(p.id)),
    [items, selectedIds]
  );

  // Calculate total in BTC equivalent to avoid mixing currencies
  const totalFundsInBTC = useMemo(
    () =>
      selectedProjects.reduce((sum, p) => {
        const currency = p.currency || 'CHF';
        const btcAmount = convertToBTC(p.total_funding || 0, currency);
        return sum + btcAmount;
      }, 0),
    [selectedProjects, convertToBTC]
  );

  // Handle loading states
  if (!hydrated || isLoading) {
    return <Loading fullScreen />;
  }

  // Handle unauthenticated state
  if (!user || !session) {
    router.push('/auth?from=projects');
    return <Loading fullScreen />;
  }

  // Show loading skeleton while projects are loading (only for my-projects tab)
  const isLoadingProjects = activeTab === 'my-projects' && projectsLoading;

  return (
    <>
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">
                  {selectedIds.size} project{selectedIds.size > 1 ? 's' : ''} selected
                </span>
                {totalFundsInBTC > 0 && (
                  <span className="text-sm text-gray-600">
                    (
                    <CurrencyDisplay
                      amount={totalFundsInBTC}
                      currency="BTC"
                      size="sm"
                      showSymbol={true}
                    />{' '}
                    total )
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear selection
                </button>
                <Button
                  onClick={handleBulkDelete}
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('my-projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'my-projects'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                My Projects ({projects.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'favorites'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Favorites ({favorites.length})
              </div>
            </button>
          </nav>

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
                aria-hidden="true"
              />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 w-64"
                aria-label="Search projects by title, description, category, or tags"
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

            {/* Status Filter */}
            {activeTab === 'my-projects' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                aria-label="Filter projects by status"
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
      </div>

      {activeTab === 'my-projects' ? (
        <>
          {/* Search Results Info */}
          {(searchQuery || statusFilter !== 'all') && items.length > 0 && !isLoadingProjects && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {items.length} of {projects.length} projects
            </div>
          )}
          {isLoadingProjects ? (
            <ProjectsGridSkeleton count={6} />
          ) : (
            <EntityListPage<Project>
              title="My Projects"
              description="Projects you've created and manage."
              icon={<Target className="w-5 h-5" />}
              primaryHref="/projects/create"
              primaryLabel="Create New Project"
              secondaryHref="/discover?section=projects"
              secondaryLabel="Discover Projects"
              items={items}
              emptyTitle="No projects yet"
              emptyDescription="Create your first project to start accepting Bitcoin donations and building support for your cause."
              explanation="A project is any initiative, cause, or endeavor that needs funding. From personal projects to organizations and community efforts - accept Bitcoin donations directly to your wallet."
              examples={[
                {
                  title: 'Community Garden Project',
                  description:
                    'Creating a shared community space with raised garden beds and educational workshops.',
                },
                {
                  title: 'Local Animal Shelter',
                  description:
                    'Supporting animal rescue operations and veterinary care for abandoned pets.',
                },
                {
                  title: 'Art Exhibition Fundraiser',
                  description:
                    'Organizing a traveling art show featuring local artists and cultural exhibits.',
                },
              ]}
              headerActions={
                items.length > 0 ? (
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === items.length && items.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
                    />
                    <span>{selectedIds.size === items.length ? 'Deselect All' : 'Select All'}</span>
                  </label>
                ) : null
              }
              renderItem={c => (
                <ProjectTile
                  project={c}
                  isSelected={selectedIds.has(c.id)}
                  onToggleSelect={toggleSelect}
                  onDelete={handleDeleteClick}
                  isDeleting={deletingId === c.id}
                />
              )}
            />
          )}
        </>
      ) : (
        <>
          {/* Search Results Info */}
          {(searchQuery || statusFilter !== 'all') && items.length > 0 && !favoritesLoading && (
            <div className="mb-4 text-sm text-gray-600">
              Showing {items.length} of {favorites.length} favorites
            </div>
          )}
          {favoritesLoading ? (
            <ProjectsGridSkeleton count={6} />
          ) : (
            <EntityListPage<FavoriteProject>
              title="Favorites"
              description="Projects you've saved to your favorites"
              icon={<Heart className="w-5 h-5" />}
              primaryHref="/discover?section=projects"
              primaryLabel="Discover More Projects"
              secondaryHref="/dashboard/projects"
              secondaryLabel="My Projects"
              items={items}
              emptyTitle="No favorites yet"
              emptyDescription="Start exploring projects and save your favorites to see them here."
              explanation="Favorites help you keep track of projects you're interested in. You can favorite projects to donate later or follow their progress."
              renderItem={(project: FavoriteProject) => {
                // Convert FavoriteProject to Project format for ProjectTile
                // FavoriteProject from API has status and raised_amount fields
                const projectStatus = (project as any).status || 'draft';
                const raisedAmount = (project as any).raised_amount ?? project.total_funding ?? 0;
                const projectForTile: Project = {
                  ...project,
                  isDraft: projectStatus === 'draft',
                  isActive: projectStatus === 'active',
                  isPaused: projectStatus === 'paused',
                  total_funding: raisedAmount,
                  current_amount: raisedAmount,
                };
                return (
                  <ProjectTile
                    project={projectForTile}
                    // No selection or delete for favorites
                    isSelected={false}
                  />
                );
              }}
            />
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {projectToDelete.id === 'bulk' ? 'Delete Multiple Projects' : 'Delete Project'}
            </h3>
            <p className="text-gray-600 mb-4">
              {projectToDelete.id === 'bulk' ? (
                <>
                  Are you sure you want to delete {selectedIds.size} projects? This action cannot be
                  undone.
                </>
              ) : (
                <>
                  Are you sure you want to delete "{projectToDelete.title || 'Untitled Project'}"?
                  This action cannot be undone.
                </>
              )}
            </p>
            {projectToDelete.id === 'bulk'
              ? totalFundsInBTC > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> The selected projects have raised a total of{' '}
                      <CurrencyDisplay amount={totalFundsInBTC} currency="BTC" size="sm" />. Make
                      sure you have handled all donations appropriately.
                    </p>
                  </div>
                )
              : projectToDelete.total_funding &&
                projectToDelete.total_funding > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> This project has raised{' '}
                      <CurrencyDisplay
                        amount={projectToDelete.total_funding}
                        currency={projectToDelete.currency || 'CHF'}
                        size="sm"
                      />
                      . Make sure you have handled all donations appropriately.
                    </p>
                  </div>
                )}
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleDeleteCancel}
                variant="outline"
                disabled={isDeleting || deletingId === projectToDelete.id}
              >
                Cancel
              </Button>
              <Button
                onClick={
                  projectToDelete.id === 'bulk' ? handleBulkDeleteConfirm : handleDeleteConfirm
                }
                variant="primary"
                disabled={isDeleting || deletingId === projectToDelete.id}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting || deletingId === projectToDelete.id
                  ? 'Deleting...'
                  : projectToDelete.id === 'bulk'
                    ? `Delete ${selectedIds.size} Projects`
                    : 'Delete Project'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
