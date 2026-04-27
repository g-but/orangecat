'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import supabase from '@/lib/supabase/browser';
import { getTableName } from '@/config/entity-registry';
import { ENTITY_STATUS } from '@/config/database-constants';
import type { DiscoverTabType } from '@/components/discover/DiscoverTabs';
import type { Loan } from '@/types/loans';
import type { Investment } from '@/types/investments';

interface DiscoverFinancialData {
  loans: Loan[];
  loansLoading: boolean;
  investments: Investment[];
  investmentsLoading: boolean;
}

export function useDiscoverFinancialData(
  activeTab: DiscoverTabType,
  searchTerm: string
): DiscoverFinancialData {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);

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
          setLoans(data || []);
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
          setInvestments(data || []);
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

  return { loans, loansLoading, investments, investmentsLoading };
}
