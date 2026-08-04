'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import supabase from '@/lib/supabase/browser';
import { getTableName } from '@/config/entity-registry';
import { ENTITY_STATUS } from '@/config/database-constants';
import type { DiscoverTabType } from '@/components/discover/DiscoverTabs';
import type { Loan } from '@/types/loans';
import { narrowLoans } from '@/services/loans/queries/narrow';
import type { Investment } from '@/types/investments';
import type { GenericPublicEntity } from '@/components/entity/variants/GenericPublicCard';

interface DiscoverFinancialData {
  loans: Loan[];
  loansLoading: boolean;
  investments: Investment[];
  investmentsLoading: boolean;
  assets: GenericPublicEntity[];
  assetsLoading: boolean;
}

export function useDiscoverFinancialData(
  activeTab: DiscoverTabType,
  searchTerm: string
): DiscoverFinancialData {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);
  const [assets, setAssets] = useState<GenericPublicEntity[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 'all' && activeTab !== 'loans') {
      setLoans([]);
      return;
    }

    const fetchLoans = async () => {
      setLoansLoading(true);
      try {
        let query = supabase
          .from(getTableName('loan'))
          .select('*')
          .eq('is_public', true)
          .eq('status', ENTITY_STATUS.ACTIVE)
          .order('created_at', { ascending: false })
          .limit(activeTab === 'loans' ? 50 : 12);

        if (searchTerm) {
          const escaped = searchTerm.replace(/[%_]/g, '\\$&');
          query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching loans', error, 'Discover');
          setLoans([]);
        } else {
          setLoans(narrowLoans(data || []));
        }
      } catch (error) {
        logger.error('Error fetching loans', error, 'Discover');
        setLoans([]);
      } finally {
        setLoansLoading(false);
      }
    };

    fetchLoans();
  }, [activeTab, searchTerm]);

  useEffect(() => {
    if (activeTab !== 'all' && activeTab !== 'investments') {
      setInvestments([]);
      return;
    }

    const fetchInvestments = async () => {
      setInvestmentsLoading(true);
      try {
        let query = supabase
          .from(getTableName('investment'))
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(activeTab === 'investments' ? 50 : 12);

        if (searchTerm) {
          const escaped = searchTerm.replace(/[%_]/g, '\\$&');
          query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching investments', error, 'Discover');
          setInvestments([]);
        } else {
          // `investments.status`/`currency` are text columns with app-level
          // unions; investor_count is enriched, not selected.
          setInvestments((data || []) as unknown as Investment[]);
        }
      } catch (error) {
        logger.error('Error fetching investments', error, 'Discover');
        setInvestments([]);
      } finally {
        setInvestmentsLoading(false);
      }
    };

    fetchInvestments();
  }, [activeTab, searchTerm]);

  useEffect(() => {
    if (activeTab !== 'all' && activeTab !== 'assets') {
      setAssets([]);
      return;
    }

    const fetchAssets = async () => {
      setAssetsLoading(true);
      try {
        let query = supabase
          .from(getTableName('asset'))
          .select('id, title, description, status, type, created_at')
          // Assets are public when active (status-driven, like products); the
          // public_visibility flag is never set true, so it hid every asset (20260618000006).
          .eq('status', ENTITY_STATUS.ACTIVE)
          .order('created_at', { ascending: false })
          .limit(activeTab === 'assets' ? 50 : 12);

        if (searchTerm) {
          const escaped = searchTerm.replace(/[%_]/g, '\\$&');
          query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
        }

        const { data, error } = await query;
        if (error) {
          logger.error('Error fetching assets', error, 'Discover');
          setAssets([]);
        } else {
          setAssets((data || []) as GenericPublicEntity[]);
        }
      } catch (error) {
        logger.error('Error fetching assets', error, 'Discover');
        setAssets([]);
      } finally {
        setAssetsLoading(false);
      }
    };

    fetchAssets();
  }, [activeTab, searchTerm]);

  return { loans, loansLoading, investments, investmentsLoading, assets, assetsLoading };
}
