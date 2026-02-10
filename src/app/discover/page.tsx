'use client';

import { logger } from '@/utils/logger';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/hooks/useSearch';
import { SearchFundingPage, SearchProfile, SearchType, SortOption } from '@/services/search';
import { PUBLIC_SEARCH_STATUSES } from '@/lib/projectStatus';
import supabase from '@/lib/supabase/browser';
import DiscoverTabs, { DiscoverTabType } from '@/components/discover/DiscoverTabs';
import DiscoverFilters from '@/components/discover/DiscoverFilters';
import DiscoverHero from '@/components/discover/DiscoverHero';
import DiscoverEmptyState from '@/components/discover/DiscoverEmptyState';
import DiscoverResults from '@/components/discover/DiscoverResults';
import type { Loan } from '@/types/loans';

type ViewMode = 'grid' | 'list';

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: _user } = useAuth();

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
  const initialType = ['all', 'projects', 'profiles', 'loans'].includes(urlType) ? urlType : 'all';
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

  // Loans data (fetched separately since useSearch doesn't support loans yet)
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loansLoading, setLoansLoading] = useState(false);

  // Fetch total counts from database with client-side caching
  useEffect(() => {
    const CACHE_KEY = 'discover_counts';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    const fetchTotalCounts = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { projects, profiles, loans: loansCount, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            setTotalProjectsCount(projects);
            setTotalProfilesCount(profiles);
            setTotalLoansCount(loansCount || 0);
            return; // Use cached data
          }
        }

        // Fetch fresh data
        const [projectsResult, profilesResult, loansResult] = await Promise.all([
          supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase
            .from('loans')
            .select('*', { count: 'exact', head: true })
            .eq('is_public', true)
            .eq('status', 'active'),
        ]);

        const projectCount = projectsResult.count ?? 0;
        const profileCount = profilesResult.count ?? 0;
        const loanCount = loansResult.count ?? 0;

        setTotalProjectsCount(projectCount);
        setTotalProfilesCount(profileCount);
        setTotalLoansCount(loanCount);

        // Cache the results
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            projects: projectCount,
            profiles: profileCount,
            loans: loanCount,
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
          .from('loans')
          .select('*')
          .eq('is_public', true)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(activeTab === 'loans' ? 50 : 12);

        // Apply search term filter if present
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
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
    // These will be 0 until we add those fields to the database
    const totalSupporters = 0;
    const totalFunding = 0;
    return { totalProjects, totalProfiles, totalSupporters, totalFunding };
  }, [totalProjectsCount, totalProfilesCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-tiffany-50/30">
      {/* Hero Section */}
      <DiscoverHero
        totalProjects={stats.totalProjects}
        totalProfiles={stats.totalProfiles}
        totalFunding={stats.totalFunding}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Layout: left vertical sidebar (desktop), content on right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6"
        >
          {/* Left Sidebar - always visible on desktop, collapsible on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
                <DiscoverFilters
                  variant="desktop"
                  searchTerm={searchTerm}
                  onSearchChange={handleSearch}
                  loading={loading}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  selectedStatuses={selectedStatuses}
                  onToggleStatus={handleToggleStatus}
                  showStatusFilter={activeTab !== 'profiles'}
                  selectedCategories={selectedCategories}
                  onToggleCategory={handleToggleCategory}
                  showCategoryFilter={activeTab !== 'profiles'}
                  country={country}
                  onCountryChange={setCountry}
                  city={city}
                  onCityChange={setCity}
                  postal={postal}
                  onPostalChange={setPostal}
                  radiusKm={radiusKm}
                  onRadiusChange={setRadiusKm}
                  onClearFilters={clearFilters}
                />
              </div>
            </div>
          </aside>

          {/* Content column */}
          <div className="w-full lg:col-span-9">
            {/* Tabs */}
            <DiscoverTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              projectCount={projects.length}
              profileCount={profiles.length}
              loanCount={loans.length}
              loading={loading || loansLoading}
            />

            <div className="bg-white/70 backdrop-blur-sm rounded-b-2xl border border-gray-200/60 border-t-0 p-6">
              {/* Mobile Filter Button */}
              <div className="lg:hidden mb-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              {/* Mobile Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="lg:hidden mb-6 overflow-hidden"
                  >
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5">
                      <DiscoverFilters
                        variant="mobile"
                        searchTerm={searchTerm}
                        onSearchChange={handleSearch}
                        loading={loading}
                        sortBy={sortBy}
                        onSortChange={handleSortChange}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        selectedStatuses={selectedStatuses}
                        onToggleStatus={handleToggleStatus}
                        showStatusFilter={activeTab !== 'profiles'}
                        selectedCategories={selectedCategories}
                        onToggleCategory={handleToggleCategory}
                        showCategoryFilter={activeTab !== 'profiles'}
                        country={country}
                        onCountryChange={setCountry}
                        city={city}
                        onCityChange={setCity}
                        postal={postal}
                        onPostalChange={setPostal}
                        radiusKm={radiusKm}
                        onRadiusChange={setRadiusKm}
                        onClearFilters={clearFilters}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Error State */}
              {searchError && (
                <div className="text-center py-16">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md mx-auto">
                    <p className="text-red-800 font-medium mb-2">Error loading projects</p>
                    <p className="text-red-600 text-sm">{searchError}</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading &&
                !loansLoading &&
                !searchError &&
                ((activeTab === 'projects' && projects.length === 0) ||
                  (activeTab === 'profiles' && profiles.length === 0) ||
                  (activeTab === 'loans' && loans.length === 0) ||
                  (activeTab === 'all' &&
                    projects.length === 0 &&
                    profiles.length === 0 &&
                    loans.length === 0)) && (
                  <DiscoverEmptyState
                    activeTab={activeTab}
                    hasFilters={!!(searchTerm || selectedCategories.length > 0)}
                    onClearFilters={clearFilters}
                  />
                )}

              {/* Results */}
              {!loading &&
                !loansLoading &&
                !searchError &&
                !(
                  (activeTab === 'projects' && projects.length === 0) ||
                  (activeTab === 'profiles' && profiles.length === 0) ||
                  (activeTab === 'loans' && loans.length === 0) ||
                  (activeTab === 'all' &&
                    projects.length === 0 &&
                    profiles.length === 0 &&
                    loans.length === 0)
                ) && (
                  <DiscoverResults
                    activeTab={activeTab}
                    viewMode={viewMode}
                    projects={projects}
                    profiles={profiles}
                    loans={loans}
                    totalResults={totalResults + loans.length}
                    loading={loading || loansLoading}
                    hasMore={hasMore}
                    isLoadingMore={isLoadingMore}
                    onLoadMore={handleLoadMore}
                    onTabChange={handleTabChange}
                  />
                )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
