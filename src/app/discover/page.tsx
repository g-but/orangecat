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
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ModernProjectCard from '@/components/ui/ModernProjectCard';
import Input from '@/components/ui/Input';
import { categoryValues, simpleCategories } from '@/config/categories';
import { useAuth } from '@/hooks/useAuth';

type ViewMode = 'grid' | 'list';

// Import search functionality
import { search, getTrending, SearchFundingPage } from '@/services/search';

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const initialCategories = (searchParams.get('category') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'trending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projects, setProjects] = useState<SearchFundingPage[]>([]);
  // Left-rail geographic filters
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [postal, setPostal] = useState(searchParams.get('postal') || '');
  const [radiusKm, setRadiusKm] = useState<number>(Number(searchParams.get('radius_km') || 0));

  // Load real project data on mount and when search params change
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);

        // Always load ALL projects (not just trending) when on projects section
        const section = searchParams.get('section');
        const shouldLoadProjects = !section || section === 'projects';

        if (shouldLoadProjects) {
          // Always use search to get ALL active projects
          const searchResults = await search({
            query: searchTerm || undefined,
            type: 'projects',
            sortBy: sortBy as any,
            limit: 100, // Increase limit to show all projects
            filters: {
              categories: selectedCategories.length > 0 ? selectedCategories : undefined,
              country: country || undefined,
              city: city || undefined,
              postal_code: postal || undefined,
              radius_km: radiusKm || undefined,
            } as any,
          });

          const projectResults = searchResults.results
            .filter(result => result.type === 'project')
            .map(result => result.data as SearchFundingPage);

          setProjects(projectResults);
        } else {
          // For other sections, use trending
          const trendingResults = await getTrending();
          const projectResults = trendingResults.results
            .filter(result => result.type === 'project')
            .map(result => result.data as SearchFundingPage);

          setProjects(projectResults);
        }
      } catch (error) {
        logger.error('Error loading projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [searchTerm, selectedCategories, sortBy, country, city, postal, radiusKm, searchParams]);

  // Filter and search logic (now using real data)
  const filteredProjects = useMemo(() => {
    // The search service already handles filtering and sorting
    // We just need to filter out any results that don't match our current filters
    const filtered = [...projects];

    // Additional client-side filtering for features not in the search service yet
    if (selectedCategories.length > 0) {
      // Categories don't exist in current schema, skip filtering
    }

    if (selectedTags.length > 0) {
      // Tags don't exist in current schema, skip filtering
    }

    return filtered;
  }, [projects, selectedCategories, selectedTags]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateURL({ search: value });
  };

  const updateURL = useCallback(
    (params: Record<string, string>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newSearchParams.set(key, value);
        } else {
          newSearchParams.delete(key);
        }
      });
      router.push(`/discover?${newSearchParams.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleToggleCategory = useCallback(
    (category: string) => {
      setSelectedCategories(prev => {
        const next = prev.includes(category)
          ? prev.filter(c => c !== category)
          : [...prev, category];
        // Update URL after state updates
        queueMicrotask(() => {
          updateURL({ category: next.join(',') });
        });
        return next;
      });
    },
    [updateURL]
  );

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateURL({ sort });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedTags([]);
    setSortBy('trending');
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
    const totalProjects = filteredProjects.length;
    // For now, we don't have supporter or funding data in the current schema
    // These will be 0 until we add those fields to the database
    const totalSupporters = 0;
    const totalFunding = 0;
    return { totalProjects, totalSupporters, totalFunding };
  }, [filteredProjects]);

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
                    <option value="trending">Trending</option>
                    <option value="newest">Newest</option>
                    <option value="ending_soon">Ending Soon</option>
                    <option value="most_funded">Most Funded</option>
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
                    onChange={e => {
                      setCountry(e.target.value);
                      updateURL({ country: e.target.value });
                    }}
                    placeholder="Country"
                    className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                  />
                  <input
                    value={city}
                    onChange={e => {
                      setCity(e.target.value);
                      updateURL({ city: e.target.value });
                    }}
                    placeholder="City/Region"
                    className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                  />
                  <input
                    value={postal}
                    onChange={e => {
                      setPostal(e.target.value);
                      updateURL({ postal: e.target.value });
                    }}
                    placeholder="Postal code"
                    className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                  />
                  <select
                    value={radiusKm}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setRadiusKm(v);
                      updateURL({ radius_km: v ? String(v) : '' });
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
                  sortBy !== 'trending') && (
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
                      {sortBy !== 'trending' && (
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
                          <option value="trending">Trending</option>
                          <option value="newest">Newest</option>
                          <option value="ending_soon">Ending Soon</option>
                          <option value="most_funded">Most Funded</option>
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
                        onChange={e => {
                          setCountry(e.target.value);
                          updateURL({ country: e.target.value });
                        }}
                        placeholder="Country"
                        className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                      />
                      <input
                        value={city}
                        onChange={e => {
                          setCity(e.target.value);
                          updateURL({ city: e.target.value });
                        }}
                        placeholder="City/Region"
                        className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                      />
                      <input
                        value={postal}
                        onChange={e => {
                          setPostal(e.target.value);
                          updateURL({ postal: e.target.value });
                        }}
                        placeholder="Postal code"
                        className="w-full px-3 py-2 bg-white/80 border border-gray-200/80 rounded-xl text-sm"
                      />
                      <select
                        value={radiusKm}
                        onChange={e => {
                          const v = Number(e.target.value);
                          setRadiusKm(v);
                          updateURL({ radius_km: v ? String(v) : '' });
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
            {/* Project Creation CTA (when no projects exist) */}
            {filteredProjects.length === 0 &&
              !searchTerm &&
              selectedCategories.length === 0 &&
              selectedTags.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                  className="mb-8"
                >
                  <div className="bg-gradient-to-r from-orange-50 via-tiffany-50 to-orange-50 rounded-2xl border border-orange-200 p-8 text-center">
                    <div className="max-w-2xl mx-auto">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-orange-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Start the Bitcoin Revolution! 🚀
                      </h3>
                      <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                        No projects yet? Be the pioneer! Create the first Bitcoin fundraising
                        project and show the world how easy it is to fund dreams with Bitcoin.
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
                        className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        🎯 Create the First Project
                      </Button>

                      <p className="text-sm text-gray-500 mt-4">
                        Already have an account?{' '}
                        <a href="/auth" className="text-orange-600 hover:underline font-medium">
                          Sign in
                        </a>{' '}
                        to get started.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            {filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <Target className="w-16 h-16 text-orange-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchTerm || selectedCategories.length > 0 || selectedTags.length > 0
                      ? 'No projects match your criteria'
                      : 'Be the first to create a Bitcoin project!'}
                  </h3>
                  <p className="text-gray-600 mb-8">
                    {searchTerm || selectedCategories.length > 0 || selectedTags.length > 0
                      ? 'Try adjusting your search criteria or browse all projects.'
                      : 'Start a Bitcoin fundraising project and be part of the revolution. It takes just a few minutes!'}
                  </p>

                  <div className="space-y-3">
                    <Button
                      href="/projects/create"
                      className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      🚀 Create Your First Project
                    </Button>

                    {searchTerm || selectedCategories.length > 0 || selectedTags.length > 0 ? (
                      <Button onClick={clearFilters} variant="outline" className="px-6 py-2">
                        Clear Filters
                      </Button>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <p>
                          Need inspiration? Check out our{' '}
                          <a href="/blog" className="text-orange-600 hover:underline">
                            blog
                          </a>{' '}
                          for project ideas.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Quick Start Guide */}
                  <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2">Quick Start:</h4>
                    <ol className="text-sm text-orange-700 space-y-1 text-left">
                      <li>1. Sign up (or sign in)</li>
                      <li>2. Click "Create Project" above</li>
                      <li>3. Add your Bitcoin address</li>
                      <li>4. Share your project link</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : filteredProjects.length === 0 &&
              (searchTerm || selectedCategories.length > 0 || selectedTags.length > 0) ? (
              <>
                {/* Filtered Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    No projects match your criteria
                  </h2>
                </div>
              </>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}{' '}
                    found
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
                  {filteredProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <ModernProjectCard project={project} viewMode={viewMode} />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
