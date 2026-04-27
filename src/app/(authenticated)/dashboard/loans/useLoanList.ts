import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useEntityList } from '@/hooks/useEntityList';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { loanEntityConfig } from '@/config/entities/loans';
import { Loan, LoanOffer } from '@/types/loans';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import loansService from '@/services/loans';

type ActiveTab = 'my-loans' | 'available' | 'offers';

const AVAILABLE_PAGE_SIZE = 12;

export function useLoanList() {
  const { user, isLoading, hydrated } = useRequireAuth();
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection } = useBulkSelection();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-loans');
  const [myOffers, setMyOffers] = useState<LoanOffer[]>([]);
  const [availableLoans, setAvailableLoans] = useState<Loan[]>([]);
  const [availablePage, setAvailablePage] = useState(1);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const {
    items: myLoans,
    loading,
    error,
    page,
    total,
    setPage,
    refresh,
  } = useEntityList<Loan>({
    apiEndpoint: loanEntityConfig.apiEndpoint,
    userId: user?.id,
    limit: 12,
    enabled: !!user?.id && hydrated && !isLoading && activeTab === 'my-loans',
  });

  const memoizedLoans = useMemo(() => myLoans, [myLoans]);

  const loadOffers = useCallback(async () => {
    try {
      const result = await loansService.getUserOffers();
      if (result.success) {
        setMyOffers(result.offers || []);
      }
    } catch (err) {
      logger.error('Failed to load offers', { error: err }, 'LoansPage');
    }
  }, []);

  const loadAvailableLoans = useCallback(async () => {
    try {
      const result = await loansService.getAvailableLoans(undefined, {
        pageSize: AVAILABLE_PAGE_SIZE,
        offset: (availablePage - 1) * AVAILABLE_PAGE_SIZE,
      });
      if (result.success) {
        setAvailableLoans(result.loans || []);
        setAvailableTotal(result.total || 0);
      }
    } catch (err) {
      logger.error('Failed to load available loans', { error: err }, 'LoansPage');
    }
  }, [availablePage]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    if (activeTab === 'offers') {
      loadOffers();
    }
    if (activeTab === 'available') {
      loadAvailableLoans();
    }
  }, [activeTab, user?.id, loadOffers, loadAvailableLoans]);

  const switchTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab !== 'my-loans') {
      clearSelection();
      setShowSelection(false);
    }
  };

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
          const response = await fetch(`/api/loans/${id}`, { method: 'DELETE' });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to delete loan ${id}`);
          }
          const result = await response.json().catch(() => ({}));
          if (result.error) {
            throw new Error(result.error);
          }
          return result;
        })
      );
      toast.success(
        `Successfully deleted ${selectedIds.size} loan${selectedIds.size > 1 ? 's' : ''}`
      );
      clearSelection();
      await refresh();
    } catch (err) {
      logger.error('Failed to delete loans', { error: err }, 'LoansPage');
      toast.error('Failed to delete some loans. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLoanCreated = () => {
    setCreateDialogOpen(false);
    refresh();
    loadOffers();
    loadAvailableLoans();
    toast.success('Loan created successfully!');
  };

  return {
    user,
    isLoading,
    hydrated,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    isDeleting,
    showSelection,
    setShowSelection,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    activeTab,
    switchTab,
    myLoans: memoizedLoans,
    myOffers,
    availableLoans,
    availablePage,
    setAvailablePage,
    availableTotal,
    availablePageSize: AVAILABLE_PAGE_SIZE,
    createDialogOpen,
    setCreateDialogOpen,
    loading,
    error,
    page,
    total,
    setPage,
    loadOffers,
    loadAvailableLoans,
    handleBulkDelete,
    executeBulkDelete,
    handleLoanCreated,
    clearSelection,
  };
}
