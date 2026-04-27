import { useState, useMemo } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useEntityList } from '@/hooks/useEntityList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { projectEntityConfig, type ProjectListItem } from '@/config/entities/projects';
import { PROJECT_STATUS } from '@/config/project-statuses';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

type ActiveTab = 'my-projects' | 'favorites';

export function useProjectList() {
  const { user, isLoading, hydrated, session } = useRequireAuth();
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useBulkSelection();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const {
    items: favorites,
    loading: favoritesLoading,
    page: favPage,
    total: favTotal,
    setPage: setFavPage,
  } = useEntityList<ProjectListItem>({
    apiEndpoint: '/api/projects/favorites',
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading && activeTab === 'favorites',
    transformResponse: data => {
      const items = data?.data?.data || data?.data || data?.items || [];
      const count = data?.data?.count || data?.count || data?.total || items.length;
      return { items, total: count };
    },
  });

  const filteredProjects = useMemo(() => {
    let items = activeTab === 'favorites' ? favorites : myProjects;

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

    if (activeTab === 'my-projects' && statusFilter !== 'all') {
      items = items.filter(p => {
        if (!p) {
          return false;
        }
        if (statusFilter === PROJECT_STATUS.DRAFT) {
          return p.isDraft;
        }
        if (statusFilter === PROJECT_STATUS.ACTIVE) {
          return p.isActive;
        }
        if (statusFilter === PROJECT_STATUS.PAUSED) {
          return p.isPaused;
        }
        if (statusFilter === PROJECT_STATUS.COMPLETED) {
          return p.status === PROJECT_STATUS.COMPLETED;
        }
        if (statusFilter === PROJECT_STATUS.CANCELLED) {
          return p.status === PROJECT_STATUS.CANCELLED;
        }
        return true;
      });
    }

    return items;
  }, [activeTab, myProjects, favorites, searchQuery, statusFilter]);

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      return;
    }
    setBulkDeleteConfirm(true);
  };

  const executeBulkDelete = async () => {
    setBulkDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(async id => {
          const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to delete project ${id}`);
          }
          const result = await response.json().catch(() => ({}));
          if (result.error) {
            throw new Error(result.error);
          }
          return result;
        })
      );
      toast.success(
        `Successfully deleted ${selectedIds.size} project${selectedIds.size > 1 ? 's' : ''}`
      );
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

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setShowSelection(false);
    clearSelection();
  };

  const currentLoading = activeTab === 'favorites' ? favoritesLoading : projectsLoading;
  const currentPage = activeTab === 'favorites' ? favPage : page;
  const currentTotal = activeTab === 'favorites' ? favTotal : total;
  const setCurrentPage = activeTab === 'favorites' ? setFavPage : setPage;

  return {
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
    projectsLoading,
    projectsError,
    favPage,
    favTotal,
    setFavPage,
    currentLoading,
    currentPage,
    currentTotal,
    setCurrentPage,
    refresh,
    handleBulkDelete,
    executeBulkDelete,
  };
}
