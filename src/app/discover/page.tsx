'use client';

import { logger } from '@/utils/logger';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  TrendingUp,
  Grid3X3,
  List,
  ArrowUpDown,
  Bitcoin,
  Heart,
  Sparkles,
  Zap,
  Star,
  Target,
  Users,
  MapPin,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ModernProjectCard from '@/components/ui/ModernProjectCard';
import Input from '@/components/ui/Input';
import { categoryValues, simpleCategories } from '@/config/categories';
import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/hooks/useSearch';
import { SearchFundingPage } from '@/services/search';

type ViewMode = 'grid' | 'list';

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Initialize state from URL params
  const initialSearchTerm = searchParams.get('search') || '';
  const initialCategories = (searchParams.get('category') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  // Convert 'trending' to 'popular' (closest match) or use provided sort
  const urlSort = searchParams.get('sort') || 'popular';
  const initialSort = (urlSort === 'trending' ? 'popular' : urlSort) as
    | 'relevance'
    | 'recent'
    | 'popular'
    | 'funding';
  const initialCountry = searchParams.get('country') || '';
  const initialCity = searchParams.get('city') || '';
  const initialPostal = searchParams.get('postal') || '';
  const initialRadiusKm = Number(searchParams.get('radius_km') || 0);

  // Use the optimized useSearch hook with pagination and debouncing
  const {
    query: searchTerm,
    setQuery: setSearchTerm,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    results: searchResults,
    loading,
    totalResults,
    hasMore,
    loadMore,
    error: searchError,
  } = useSearch({
    initialQuery: initialSearchTerm,
    initialType: 'projects',
    initialSort: initialSort,
    initialFilters: {
      categories: initialCategories.length > 0 ? initialCategories : undefined,
      country: initialCountry || undefined,
      city: initialCity || undefined,
      postal_code: initialPostal || undefined,
      radius_km: initialRadiusKm || undefined,
    },
    autoSearch: true,
    debounceMs: 300, // 300ms debounce for search input
  });

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [postal, setPostal] = useState(initialPostal);
  const [radiusKm, setRadiusKm] = useState<number>(initialRadiusKm);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Extract projects from search results
  const projects = useMemo(() => {
    return searchResults
      .filter(result => result.type === 'project')
      .map(result => result.data as SearchFundingPage);
  }, [searchResults]);

  // Update search filters when local filter state changes
  useEffect(() => {
    setFilters({
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      country: country || undefined,
      city: city || undefined,
      postal_code: postal || undefined,
      radius_km: radiusKm || undefined,
    });
  }, [selectedCategories, country, city, postal, radiusKm, setFilters]);

  // Sync URL params with search state
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());

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

    // Only set sort if it's not the default (popular)
    if (sortBy !== 'popular') {
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
    if (newUrl !== `/discover?${searchParams.toString()}`) {
      router.replace(newUrl, { scroll: false });
    }
  }, [
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
    setSortBy(sort as any);
    // URL update happens automatically via useEffect
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedTags([]);
    setSortBy('popular' as any);
    setCountry('');
    setCity('');
    setPostal('');
    setRadiusKm(0);
    router.push('/discover');
  };

  // Get unique tags from all projects (tags don't exist in current schema)
  const allTags = useMemo(() => {
    return []; // No tags in current schema
  }, []);

  const stats = useMemo(() => {
    const totalProjects = totalResults; // Use totalResults from search hook
    // For now, we don't have supporter or funding data in the current schema
    // These will be 0 until we add those fields to the database
    const totalSupporters = 0;
    const totalFunding = 0;
    return { totalProjects, totalSupporters, totalFunding };
  }, [totalResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-tiffany-50/30">
      {/* Hero Section - Compact */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-bitcoinOrange/5 via-tiffany-50/80 to-orange-50/60 border-b border-gray-100/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <span className="block">Discover</span>
              <span className="block bg-gradient-to-r from-tiffany-600 via-bitcoinOrange to-orange-500 bg-clip-text text-transparent">
                Bitcoin Projects
              </span>
            </motion.h1>

            <motion.p
              className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Support innovative projects, help local communities, and be part of the Bitcoin
              revolution.
            </motion.p>

            {/* Stats - Compact */}
            <motion.div
              className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div className="text-xl font-bold text-gray-900">{stats.totalProjects}</div>
                <div className="text-xs text-gray-600">Active Projects</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div className="text-xl font-bold text-bitcoinOrange">{stats.totalSupporters}</div>
                <div className="text-xs text-gray-600">Total Supporters</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50">
                <div className="text-xl font-bold text-tiffany-600">0 BTC</div>
                <div className="text-xs text-gray-600">Funds Raised</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Layout: left vertical sidebar (desktop), content on right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
          className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-8"
        >
          {/* Left Sidebar - always visible on desktop, collapsible on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

                {/* Search Bar */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={e => handleSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 text-sm bg-white/80 border-gray-200/80 rounded-xl"
                    />
                    {loading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={e => handleSortChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                  >
                    <option value="popular">Popular</option>
                    <option value="recent">Newest</option>
                    <option value="funding">Most Funded</option>
                    <option value="relevance">Relevance</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-1 flex gap-1">
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="flex-1 h-8"
                    >
                      <Grid3X3 className="w-4 h-4 mr-1" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex-1 h-8"
                    >
                      <List className="w-4 h-4 mr-1" />
                      List
                    </Button>
                  </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'technology',
                      'education',
                      'environment',
                      'animals',
                      'business',
                      'community',
                      'creative',
                    ].map(cat => (
                      <button
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                          selectedCategories.includes(cat)
                            ? 'bg-orange-100 border-orange-300 text-orange-700'
                            : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Geography */}
                <div className="space-y-3 mb-6">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Country"
                    className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                  />
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="City/Region"
                    className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                  />
                  <input
                    value={postal}
                    onChange={e => setPostal(e.target.value)}
                    placeholder="Postal code"
                    className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                  />
                  <select
                    value={radiusKm}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setRadiusKm(v);
                    }}
                    className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                  >
                    <option value={0}>Anywhere</option>
                    <option value={10}>Within 10 km</option>
                    <option value={25}>Within 25 km</option>
                    <option value={50}>Within 50 km</option>
                    <option value={100}>Within 100 km</option>
                  </select>
                </div>

                {/* Active filters summary */}
                {(searchTerm ||
                  selectedCategories.length > 0 ||
                  country ||
                  city ||
                  postal ||
                  radiusKm ||
                  sortBy !== 'popular') && (
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Active filters
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {searchTerm && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          "{searchTerm}"
                        </span>
                      )}
                      {selectedCategories.map(cat => (
                        <span
                          key={cat}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                        >
                          {cat}
                        </span>
                      ))}
                      {(country || city || postal) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          {country || city || postal}
                        </span>
                      )}
                      {sortBy !== 'popular' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          {sortBy}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button onClick={clearFilters} variant="outline" size="sm" className="w-full">
                    Clear all
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Content column */}
          <div className="w-full lg:col-span-9">
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
                    {/* Same filter content as sidebar, but for mobile */}
                    {/* Search */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          type="text"
                          placeholder="Search projects..."
                          value={searchTerm}
                          onChange={e => handleSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 text-sm bg-white/80 border-gray-200/80 rounded-xl"
                        />
                        {loading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sort & View */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sort</label>
                        <select
                          value={sortBy}
                          onChange={e => handleSortChange(e.target.value)}
                          className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                        >
                          <option value="popular">Popular</option>
                          <option value="recent">Newest</option>
                          <option value="funding">Most Funded</option>
                          <option value="relevance">Relevance</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-1 flex gap-1">
                          <Button
                            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="flex-1 h-8"
                          >
                            <Grid3X3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="flex-1 h-8"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categories
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'technology',
                          'education',
                          'environment',
                          'animals',
                          'business',
                          'community',
                          'creative',
                        ].map(cat => (
                          <button
                            key={cat}
                            onClick={() => handleToggleCategory(cat)}
                            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                              selectedCategories.includes(cat)
                                ? 'bg-orange-100 border-orange-300 text-orange-700'
                                : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Geography */}
                    <div className="space-y-3 mb-6">
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        placeholder="Country"
                        className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                      />
                      <input
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="City/Region"
                        className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                      />
                      <input
                        value={postal}
                        onChange={e => setPostal(e.target.value)}
                        placeholder="Postal code"
                        className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                      />
                      <select
                        value={radiusKm}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setRadiusKm(v);
                        }}
                        className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                      >
                        <option value={0}>Anywhere</option>
                        <option value={10}>Within 10 km</option>
                        <option value={25}>Within 25 km</option>
                        <option value={50}>Within 50 km</option>
                        <option value={100}>Within 100 km</option>
                      </select>
                    </div>

                    <Button onClick={clearFilters} variant="outline" size="sm" className="w-full">
                      Clear all
                    </Button>
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

            {/* Empty State - Consolidated */}
            {!loading && !searchError && projects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16"
              >
                {!searchTerm && selectedCategories.length === 0 && selectedTags.length === 0 ? (
                  // No filters - show full CTA
                  <div className="bg-gradient-to-r from-orange-50 via-tiffany-50 to-orange-50 rounded-2xl border border-orange-200 p-8 text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Start the Bitcoin Revolution! 🚀
                    </h3>
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      No projects yet? Be the pioneer! Create the first Bitcoin fundraising project
                      and show the world how easy it is to fund dreams with Bitcoin.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-white/60 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 mb-1">1</div>
                        <div className="text-sm font-medium">Sign up</div>
                        <div className="text-xs text-gray-600">Create your account</div>
                      </div>
                      <div className="p-4 bg-white/60 rounded-lg">
                        <div className="text-2xl font-bold text-tiffany-600 mb-1">2</div>
                        <div className="text-sm font-medium">Create</div>
                        <div className="text-xs text-gray-600">Set up your project</div>
                      </div>
                      <div className="p-4 bg-white/60 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 mb-1">3</div>
                        <div className="text-sm font-medium">Fund</div>
                        <div className="text-xs text-gray-600">Receive Bitcoin donations</div>
                      </div>
                    </div>

                    <Button
                      href="/projects/create"
                      size="lg"
                      className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mb-4"
                    >
                      🎯 Create the First Project
                    </Button>

                    <p className="text-sm text-gray-500">
                      Already have an account?{' '}
                      <a href="/auth" className="text-orange-600 hover:underline font-medium">
                        Sign in
                      </a>{' '}
                      to get started.
                    </p>
                  </div>
                ) : (
                  // Has filters - show filtered empty state
                  <div className="max-w-md mx-auto">
                    <Target className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No projects match your criteria
                    </h3>
                    <p className="text-gray-600 mb-8">
                      Try adjusting your search criteria or browse all projects.
                    </p>
                    <div className="space-y-3">
                      <Button onClick={clearFilters} variant="outline" className="px-6 py-2">
                        Clear Filters
                      </Button>
                      <Button
                        href="/projects/create"
                        className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        🚀 Create Your First Project
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {totalResults > 0 ? (
                      <>
                        {totalResults} project{totalResults !== 1 ? 's' : ''} found
                        {projects.length < totalResults && (
                          <span className="text-gray-500 text-lg font-normal ml-2">
                            (showing {projects.length})
                          </span>
                        )}
                      </>
                    ) : (
                      'No projects found'
                    )}
                  </h2>
                </div>

                {/* Project Grid */}
                <div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      <ModernProjectCard project={project} viewMode={viewMode} />
                    </motion.div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      variant="outline"
                      size="lg"
                      className="min-w-[200px]"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More Projects
                          <ArrowUpDown className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
