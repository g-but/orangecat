'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { logger } from '@/utils/logger';
import { useSearch } from '@/hooks/useSearch';
import { SearchFundingPage, SearchProfile, SearchType, SortOption } from '@/services/search';
import { PUBLIC_SEARCH_STATUSES } from '@/config/project-statuses';
import { useDiscoverCounts } from './useDiscoverCounts';
import { useDiscoverFinancialData } from './useDiscoverFinancialData';
import { useDiscoverGenericData } from './useDiscoverGenericData';
import type { DiscoverTabType } from '@/components/discover/DiscoverTabs';

export type ViewMode = 'grid' | 'list';

const VALID_TAB_TYPES: DiscoverTabType[] = [
  'all',
  'projects',
  'profiles',
  'loans',
  'investments',
  'causes',
  'events',
  'products',
  'services',
  'groups',
  'wishlists',
  'research',
  'ai_assistants',
];

export function useDiscoverState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial state from URL params
  const initialSearchTerm = searchParams?.get('search') || '';
  const initialCategories = (searchParams?.get('category') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const urlSort = searchParams?.get('sort') || 'recent';
  const initialSort = (['recent', 'relevance'].includes(urlSort) ? urlSort : 'recent') as
    | 'relevance'
    | 'recent';
  const urlType = (searchParams?.get('type') || 'all') as DiscoverTabType;
  const initialType = VALID_TAB_TYPES.includes(urlType) ? urlType : 'all';
  const initialCountry = searchParams?.get('country') || '';
  const initialCity = searchParams?.get('city') || '';
  const initialPostal = searchParams?.get('postal') || '';
  const initialRadiusKm = Number(searchParams?.get('radius_km') || 0);

  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    setSearchType,
    sortBy,
    setSortBy,
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
    initialSort,
    initialFilters: {
      categories: initialCategories.length > 0 ? initialCategories : undefined,
      statuses: PUBLIC_SEARCH_STATUSES as ('active' | 'paused' | 'completed' | 'cancelled')[],
      country: initialCountry || undefined,
      city: initialCity || undefined,
      postal_code: initialPostal || undefined,
      radius_km: initialRadiusKm || undefined,
    },
    autoSearch: true,
    debounceMs: 300,
  });

  // UI state
  const [activeTab, setActiveTab] = useState<DiscoverTabType>(initialType);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedStatuses, setSelectedStatuses] = useState<
    ('active' | 'paused' | 'completed' | 'cancelled')[]
  >(PUBLIC_SEARCH_STATUSES as ('active' | 'paused' | 'completed' | 'cancelled')[]);
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [postal, setPostal] = useState(initialPostal);
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sub-hook data
  const counts = useDiscoverCounts();
  const financial = useDiscoverFinancialData(activeTab, searchTerm);
  const generic = useDiscoverGenericData(activeTab, searchTerm);

  // Extract projects and profiles from search results
  const projects = useMemo(
    () => searchResults.filter(r => r.type === 'project').map(r => r.data as SearchFundingPage),
    [searchResults]
  );
  const profiles = useMemo(
    () => searchResults.filter(r => r.type === 'profile').map(r => r.data as SearchProfile),
    [searchResults]
  );

  // Sync filter state into search hook
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

  // Sync state back to URL
  useEffect(() => {
    const p = new URLSearchParams(searchParams?.toString() || '');
    if (activeTab !== 'all') {
      p.set('type', activeTab);
    } else {
      p.delete('type');
    }
    if (searchTerm) {
      p.set('search', searchTerm);
    } else {
      p.delete('search');
    }
    if (selectedCategories.length > 0) {
      p.set('category', selectedCategories.join(','));
    } else {
      p.delete('category');
    }
    if (sortBy !== 'recent') {
      p.set('sort', sortBy);
    } else {
      p.delete('sort');
    }
    if (country) {
      p.set('country', country);
    } else {
      p.delete('country');
    }
    if (city) {
      p.set('city', city);
    } else {
      p.delete('city');
    }
    if (postal) {
      p.set('postal', postal);
    } else {
      p.delete('postal');
    }
    if (radiusKm) {
      p.set('radius_km', String(radiusKm));
    } else {
      p.delete('radius_km');
    }

    const newUrl = `/discover?${p.toString()}`;
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

  // Handlers
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      await loadMore();
    } catch (error) {
      logger.error('Error loading more results', error, 'Discover');
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const handleSearch = (value: string) => setSearchTerm(value);

  const handleToggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  }, []);

  const handleSortChange = (sort: string) => {
    const validSorts: SortOption[] = ['relevance', 'recent'];
    if (validSorts.includes(sort as SortOption)) {
      setSortBy(sort as SortOption);
    }
  };

  const handleToggleStatus = useCallback(
    (status: 'active' | 'paused' | 'completed' | 'cancelled') => {
      setSelectedStatuses(prev => {
        const next = prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status];
        return next.length > 0 ? next : ['active', 'paused'];
      });
    },
    []
  );

  const handleTabChange = useCallback(
    (tab: DiscoverTabType) => {
      setActiveTab(tab);
      const newType: SearchType =
        tab === 'all' ? 'all' : tab === 'profiles' ? 'profiles' : 'projects';
      setSearchType(newType);
    },
    [setSearchType]
  );

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedStatuses(
      PUBLIC_SEARCH_STATUSES as ('active' | 'paused' | 'completed' | 'cancelled')[]
    );
    setSortBy('recent');
    setCountry('');
    setCity('');
    setPostal('');
    setRadiusKm(0);
    router.push('/discover');
  };

  const stats = useMemo(
    () => ({
      totalProjects: counts.totalProjectsCount,
      totalProfiles: counts.totalProfilesCount,
      totalFinancial: counts.totalLoansCount + counts.totalInvestmentsCount,
    }),
    [counts]
  );

  const isEmpty =
    (activeTab === 'projects' && projects.length === 0) ||
    (activeTab === 'profiles' && profiles.length === 0) ||
    (activeTab === 'loans' && financial.loans.length === 0) ||
    (activeTab === 'investments' && financial.investments.length === 0) ||
    (activeTab === 'causes' && generic.causes.length === 0) ||
    (activeTab === 'events' && generic.events.length === 0) ||
    (activeTab === 'products' && generic.products.length === 0) ||
    (activeTab === 'services' && generic.services.length === 0) ||
    (activeTab === 'groups' && generic.groups.length === 0) ||
    (activeTab === 'wishlists' && generic.wishlists.length === 0) ||
    (activeTab === 'research' && generic.research.length === 0) ||
    (activeTab === 'ai_assistants' && generic.aiAssistants.length === 0) ||
    (activeTab === 'all' &&
      projects.length === 0 &&
      profiles.length === 0 &&
      financial.loans.length === 0 &&
      financial.investments.length === 0 &&
      generic.causes.length === 0 &&
      generic.events.length === 0 &&
      generic.products.length === 0 &&
      generic.services.length === 0 &&
      generic.groups.length === 0 &&
      generic.wishlists.length === 0 &&
      generic.research.length === 0 &&
      generic.aiAssistants.length === 0);

  const hasFilters = !!(searchTerm || selectedCategories.length > 0);

  return {
    // Search state
    searchTerm,
    searchError,
    loading,
    loansLoading: financial.loansLoading,
    investmentsLoading: financial.investmentsLoading,
    genericLoading: generic.genericLoading,
    totalResults,
    hasMore,
    isLoadingMore,

    // Data
    projects,
    profiles,
    loans: financial.loans,
    investments: financial.investments,
    causes: generic.causes,
    events: generic.events,
    products: generic.products,
    services: generic.services,
    groups: generic.groups,
    wishlists: generic.wishlists,
    research: generic.research,
    aiAssistants: generic.aiAssistants,
    totalInvestmentsCount: counts.totalInvestmentsCount,
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
