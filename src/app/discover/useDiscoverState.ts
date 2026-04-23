'use client';

import { logger } from '@/utils/logger';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSearch } from '@/hooks/useSearch';
import { SearchFundingPage, SearchProfile, SearchType, SortOption } from '@/services/search';
import { PUBLIC_SEARCH_STATUSES } from '@/config/project-statuses';
import supabase from '@/lib/supabase/browser';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getTableName } from '@/config/entity-registry';
import { ENTITY_STATUS } from '@/config/database-constants';
import type { DiscoverTabType } from '@/components/discover/DiscoverTabs';
import type { Loan } from '@/types/loans';
import type { Investment } from '@/types/investments';

export type ViewMode = 'grid' | 'list';

export function useDiscoverState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params
  const initialSearchTerm = searchParams?.get('search') || '';
  const initialCategories = (searchParams?.get('category') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  // Convert legacy sort values to current options
  const urlSort = searchParams?.get('sort') || 'recent';
  const initialSort = (['recent', 'relevance'].includes(urlSort) ? urlSort : 'recent') as
    | 'relevance'
    | 'recent';
  const urlType = (searchParams?.get('type') || 'all') as DiscoverTabType;
  const validTabTypes: DiscoverTabType[] = ['all', 'projects', 'profiles', 'loans', 'investments', 'causes', 'events', 'products', 'services', 'groups'];
  const initialType = validTabTypes.includes(urlType) ? urlType : 'all';
  const initialCountry = searchParams?.get('country') || '';
  const initialCity = searchParams?.get('city') || '';
  const initialPostal = searchParams?.get('postal') || '';
  const initialRadiusKm = Number(searchParams?.get('radius_km') || 0);

  // Use the optimized useSearch hook with pagination and debouncing
  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    searchType: _searchType,
    setSearchType,
    sortBy,
    setSortBy,
    filters: _filters,
    setFilters,
    results: searchResults,
    loading,
    totalResults,
    hasMore,
    loadMore,
    error: searchError,
  } = useSearch({
    initialQuery: initialSearchTerm,
    initialType:
      initialType === 'all' ? 'all' : initialType === 'profiles' ? 'profiles' : 'projects',
    initialSort: initialSort,
    initialFilters: {
      categories: initialCategories.length > 0 ? initialCategories : undefined,
      statuses: PUBLIC_SEARCH_STATUSES as ('active' | 'paused' | 'completed' | 'cancelled')[], // Default status filter
      country: initialCountry || undefined,
      city: initialCity || undefined,
      postal_code: initialPostal || undefined,
      radius_km: initialRadiusKm || undefined,
    },
    autoSearch: true,
    debounceMs: 300, // 300ms debounce for search input
  });

  // UI state
  const [activeTab, setActiveTab] = useState<DiscoverTabType>(initialType);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedStatuses, setSelectedStatuses] = useState<
    ('active' | 'paused' | 'completed' | 'cancelled')[]
  >(PUBLIC_SEARCH_STATUSES as ('active' | 'paused' | 'completed' | 'cancelled')[]); // Default: show active and paused
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [postal, setPostal] = useState(initialPostal);
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Total counts from database (for stats display)
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [totalProfilesCount, setTotalProfilesCount] = useState(0);
  const [_totalLoansCount, setTotalLoansCount] = useState(0);
  const [totalInvestmentsCount, setTotalInvestmentsCount] = useState(0);

  // Loans data (fetched separately since useSearch doesn't support loans yet)
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);

  // Investments data (fetched separately)
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [investmentsLoading, setInvestmentsLoading] = useState(false);

  // Fetch total counts from database with client-side caching
  useEffect(() => {
    const CACHE_KEY = 'discover_counts';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const fetchTotalCounts = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { projects, profiles, loans: loansCount, investments: investmentsCount, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setTotalProjectsCount(projects);
            setTotalProfilesCount(profiles);
            setTotalLoansCount(loansCount || 0);
            setTotalInvestmentsCount(investmentsCount || 0);
            return; // Use cached data
          }
        }

        // Fetch fresh data
        const [projectsResult, profilesResult, loansResult, investmentsResult] = await Promise.all([
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

        const projectCount = projectsResult.count ?? 0;
        const profileCount = profilesResult.count ?? 0;
        const loanCount = loansResult.count ?? 0;
        const investmentCount = investmentsResult.count ?? 0;

        setTotalProjectsCount(projectCount);
        setTotalProfilesCount(profileCount);
        setTotalLoansCount(loanCount);
        setTotalInvestmentsCount(investmentCount);

        // Cache the results
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            projects: projectCount,
            profiles: profileCount,
            loans: loanCount,
            investments: investmentCount,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        logger.error('Error fetching total counts', error, 'Discover');
      }
    };

    fetchTotalCounts();
  }, []);

  // Extract projects and profiles from search results
  const projects = useMemo(() => {
    return searchResults
      .filter(result => result.type === 'project')
      .map(result => result.data as SearchFundingPage);
  }, [searchResults]);

  const profiles = useMemo(() => {
    return searchResults
      .filter(result => result.type === 'profile')
      .map(result => result.data as SearchProfile);
  }, [searchResults]);

  // Fetch loans when needed (for 'all' or 'loans' tab)
  useEffect(() => {
    const fetchLoans = async () => {
      // Only fetch loans when on 'all' or 'loans' tab
      if (activeTab !== 'all' && activeTab !== 'loans') {
        setLoans([]);
        return;
      }

      setLoansLoading(true);
      try {
        let query = supabase
          .from(getTableName('loan'))
          .select('*')
          .eq('is_public', true)
          .eq('status', ENTITY_STATUS.ACTIVE)
          .order('created_at', { ascending: false })
          .limit(activeTab === 'loans' ? 50 : 12);

        // Apply search term filter if present
        if (searchTerm) {
          const escapedTerm = searchTerm.replace(/[%_]/g, '\\$&');
          query = query.or(`title.ilike.%${escapedTerm}%,description.ilike.%${escapedTerm}%`);
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

  // Fetch investments when needed (for 'all' or 'investments' tab)
  useEffect(() => {
    const fetchInvestments = async () => {
      if (activeTab !== 'all' && activeTab !== 'investments') {
        setInvestments([]);
        return;
      }

      setInvestmentsLoading(true);
      try {
        let query = supabase
          .from(getTableName('investment'))
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(activeTab === 'investments' ? 50 : 12);

        if (searchTerm) {
          const escapedTerm = searchTerm.replace(/[%_]/g, '\\$&');
          query = query.or(`title.ilike.%${escapedTerm}%,description.ilike.%${escapedTerm}%`);
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

  // Update search filters when local filter state changes
  useEffect(() => {
    setFilters({
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
      country: country || undefined,
      city: city || undefined,
      postal_code: postal || undefined,
      radius_km: radiusKm || undefined,
    });
  }, [selectedCategories, selectedStatuses, country, city, postal, radiusKm, setFilters]);

  // Sync URL params with search state
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams?.toString() || '');

    // Tab/type parameter
    if (activeTab !== 'all') {
      newSearchParams.set('type', activeTab);
    } else {
      newSearchParams.delete('type');
    }

    if (searchTerm) {
      newSearchParams.set('search', searchTerm);
    } else {
      newSearchParams.delete('search');
    }

    if (selectedCategories.length > 0) {
      newSearchParams.set('category', selectedCategories.join(','));
    } else {
      newSearchParams.delete('category');
    }

    // Only set sort if it's not the default (recent)
    if (sortBy !== 'recent') {
      newSearchParams.set('sort', sortBy);
    } else {
      newSearchParams.delete('sort');
    }

    if (country) {
      newSearchParams.set('country', country);
    } else {
      newSearchParams.delete('country');
    }

    if (city) {
      newSearchParams.set('city', city);
    } else {
      newSearchParams.delete('city');
    }

    if (postal) {
      newSearchParams.set('postal', postal);
    } else {
      newSearchParams.delete('postal');
    }

    if (radiusKm) {
      newSearchParams.set('radius_km', String(radiusKm));
    } else {
      newSearchParams.delete('radius_km');
    }

    const newUrl = `/discover?${newSearchParams.toString()}`;
    const currentUrl = searchParams ? `/discover?${searchParams.toString()}` : '/discover';
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [
    activeTab,
    searchTerm,
    selectedCategories,
    sortBy,
    country,
    city,
    postal,
    radiusKm,
    router,
    searchParams,
  ]);

  // Handle load more with loading state
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      await loadMore();
    } catch (error) {
      logger.error('Error loading more projects:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // URL update happens automatically via useEffect
  };

  const handleToggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => {
      const next = prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category];
      return next;
    });
    // URL update happens automatically via useEffect
  }, []);

  const handleSortChange = (sort: string) => {
    // Validate sort is a valid SortOption
    const validSorts: SortOption[] = ['relevance', 'recent'];
    if (validSorts.includes(sort as SortOption)) {
      setSortBy(sort as SortOption);
    }
    // URL update happens automatically via useEffect
  };

  const handleToggleStatus = useCallback(
    (status: 'active' | 'paused' | 'completed' | 'cancelled') => {
      setSelectedStatuses(prev => {
        const next = prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status];
        return next.length > 0 ? next : ['active', 'paused']; // Always have at least one status selected
      });
    },
    []
  );

  const handleTabChange = useCallback(
    (tab: DiscoverTabType) => {
      setActiveTab(tab);
      // Convert tab to search type
      const newSearchType: SearchType =
        tab === 'all' ? 'all' : tab === 'profiles' ? 'profiles' : 'projects';
      setSearchType(newSearchType);
    },
    [setSearchType]
  );

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedStatuses(
      PUBLIC_SEARCH_STATUSES as ('active' | 'paused' | 'completed' | 'cancelled')[]
    ); // Reset to default statuses
    setSortBy('recent');
    setCountry('');
    setCity('');
    setPostal('');
    setRadiusKm(0);
    router.push('/discover');
  };

  const stats = useMemo(() => {
    // Use total counts from database, not filtered results
    const totalProjects = totalProjectsCount;
    const totalProfiles = totalProfilesCount;
    // For now, we don't have supporter or funding data in the current schema
    const totalSupporters = 0;
    const totalFunding = 0;
    return { totalProjects, totalProfiles, totalSupporters, totalFunding };
  }, [totalProjectsCount, totalProfilesCount]);

  // Compute whether results are empty (used for empty/results state toggling)
  const isEmpty =
    (activeTab === 'projects' && projects.length === 0) ||
    (activeTab === 'profiles' && profiles.length === 0) ||
    (activeTab === 'loans' && loans.length === 0) ||
    (activeTab === 'investments' && investments.length === 0) ||
    (activeTab === 'causes' && projects.length === 0) ||
    (activeTab === 'events' && projects.length === 0) ||
    (activeTab === 'products' && projects.length === 0) ||
    (activeTab === 'services' && projects.length === 0) ||
    (activeTab === 'groups' && projects.length === 0) ||
    (activeTab === 'all' && projects.length === 0 && profiles.length === 0 && loans.length === 0 && investments.length === 0);

  const hasFilters = !!(searchTerm || selectedCategories.length > 0);

  return {
    // Search state
    searchTerm,
    searchError,
    loading,
    loansLoading,
    investmentsLoading,
    totalResults,
    hasMore,
    isLoadingMore,

    // Data
    projects,
    profiles,
    loans,
    investments,
    totalInvestmentsCount,
    stats,

    // UI state
    activeTab,
    viewMode,
    setViewMode,
    showFilters,
    setShowFilters,
    selectedCategories,
    selectedStatuses,
    sortBy,
    country,
    setCountry,
    city,
    setCity,
    postal,
    setPostal,
    radiusKm,
    setRadiusKm,

    // Derived state
    isEmpty,
    hasFilters,

    // Handlers
    handleSearch,
    handleSortChange,
    handleToggleCategory,
    handleToggleStatus,
    handleTabChange,
    handleLoadMore,
    clearFilters,
  };
}
