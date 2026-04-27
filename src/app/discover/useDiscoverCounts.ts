'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';
import supabase from '@/lib/supabase/browser';
import { getTableName } from '@/config/entity-registry';
import { DATABASE_TABLES } from '@/config/database-tables';
import { ENTITY_STATUS } from '@/config/database-constants';

const CACHE_KEY = 'discover_counts';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface DiscoverCounts {
  totalProjectsCount: number;
  totalProfilesCount: number;
  totalLoansCount: number;
  totalInvestmentsCount: number;
}

export function useDiscoverCounts(): DiscoverCounts {
  const [counts, setCounts] = useState<DiscoverCounts>({
    totalProjectsCount: 0,
    totalProfilesCount: 0,
    totalLoansCount: 0,
    totalInvestmentsCount: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as {
            projects: number;
            profiles: number;
            loans: number;
            investments: number;
            timestamp: number;
          };
          if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            setCounts({
              totalProjectsCount: parsed.projects,
              totalProfilesCount: parsed.profiles,
              totalLoansCount: parsed.loans ?? 0,
              totalInvestmentsCount: parsed.investments ?? 0,
            });
            return;
          }
        }

        const [projectsRes, profilesRes, loansRes, investmentsRes] = await Promise.all([
          supabase
            .from(getTableName('project'))
            .select('*', { count: 'exact', head: true })
            .eq('status', ENTITY_STATUS.ACTIVE),
          supabase.from(DATABASE_TABLES.PROFILES).select('*', { count: 'exact', head: true }),
          supabase
            .from(getTableName('loan'))
            .select('*', { count: 'exact', head: true })
            .eq('is_public', true)
            .eq('status', ENTITY_STATUS.ACTIVE),
          supabase
            .from(getTableName('investment'))
            .select('*', { count: 'exact', head: true })
            .eq('is_public', true),
        ]);

        const next: DiscoverCounts = {
          totalProjectsCount: projectsRes.count ?? 0,
          totalProfilesCount: profilesRes.count ?? 0,
          totalLoansCount: loansRes.count ?? 0,
          totalInvestmentsCount: investmentsRes.count ?? 0,
        };

        setCounts(next);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            projects: next.totalProjectsCount,
            profiles: next.totalProfilesCount,
            loans: next.totalLoansCount,
            investments: next.totalInvestmentsCount,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        logger.error('Error fetching discover counts', error, 'Discover');
      }
    };

    fetchCounts();
  }, []);

  return counts;
}
