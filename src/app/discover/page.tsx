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
import ModernCampaignCard from '@/components/ui/ModernCampaignCard';
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
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'trending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projects, setProjects] = useState<SearchFundingPage[]>([]);

  // Load real project data on mount and when search params change
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true);

        if (searchTerm || selectedCategory !== 'all') {
          // Use search function for filtered results
          const searchResults = await search({
            query: searchTerm || undefined,
            type: 'projects',
            sortBy: sortBy as any,
            limit: 50,
          });

          const projectResults = searchResults.results
            .filter(result => result.type === 'project')
            .map(result => result.data as SearchFundingPage);

          setProjects(projectResults);
        } else {
          // Use trending for default view
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
  }, [searchTerm, selectedCategory, sortBy]);

  // Filter and search logic (now using real data)
  const filteredProjects = useMemo(() => {
    // The search service already handles filtering and sorting
    // We just need to filter out any results that don't match our current filters
    const filtered = [...projects];

    // Additional client-side filtering for features not in the search service yet
    if (selectedCategory !== 'all') {
      // Categories don't exist in current schema, skip filtering
    }

    if (selectedTags.length > 0) {
      // Tags don't exist in current schema, skip filtering
    }

    return filtered;
  }, [projects, selectedCategory, selectedTags]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updateURL({ search: value });
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    updateURL({ category });
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateURL({ sort });
  };

  const updateURL = (params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    router.push(`/discover?${newSearchParams.toString()}`, { scroll: false });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setSortBy('trending');
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
      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden bg-gradient-to-br from-bitcoinOrange/5 via-tiffany-50/80 to-orange-50/60 border-b border-gray-100/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-3 h-3 bg-bitcoinOrange/20 rounded-full"
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-2 h-2 bg-tiffany-400/30 rounded-full"
            animate={{
              y: [0, 20, 0],
              x: [0, 15, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Hero Badge */}
            <motion.div
              className="mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-bitcoinOrange/20 to-tiffany-500/20 border border-bitcoinOrange/30">
                <Target className="w-4 h-4 text-bitcoinOrange mr-2" />
                <span className="text-sm font-medium bg-gradient-to-r from-bitcoinOrange to-tiffany-600 bg-clip-text text-transparent">
                  Discover Amazing Projects
                </span>
                <Sparkles className="w-4 h-4 text-tiffany-500 ml-2" />
              </div>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6"
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
              className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Support innovative projects, help local communities, and be part of the Bitcoin
              revolution.
            </motion.p>

            {/* Stats */}
            <motion.div
              className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <div className="text-2xl font-bold text-gray-900">{stats.totalProjects}</div>
                <div className="text-sm text-gray-600">Active Projects</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <div className="text-2xl font-bold text-bitcoinOrange">{stats.totalSupporters}</div>
                <div className="text-sm text-gray-600">Total Supporters</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <div className="text-2xl font-bold text-tiffany-600">0 BTC</div>
                <div className="text-sm text-gray-600">Funds Raised</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <motion.div
          className="mb-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
        >
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search projects, creators, or keywords..."
              value={searchTerm}
              onChange={e => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-bitcoinOrange/20 focus:border-bitcoinOrange"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter - Hidden for now since categories don't exist in schema */}
              {/* <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-bitcoinOrange/20 focus:border-bitcoinOrange"
              >
                <option value="all">All Categories</option>
                <option value="technology">Technology</option>
                <option value="education">Education</option>
                <option value="environment">Environment</option>
                <option value="animals">Animals</option>
                <option value="business">Business</option>
              </select> */}

              {/* Sort Filter */}
              <select
                value={sortBy}
                onChange={e => handleSortChange(e.target.value)}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-xl text-sm font-medium focus:ring-2 focus:ring-bitcoinOrange/20 focus:border-bitcoinOrange"
              >
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="ending_soon">Ending Soon</option>
                <option value="most_funded">Most Funded</option>
              </select>

              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-200/80 hover:bg-gray-50/80 backdrop-blur-sm"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>

              {/* Clear Filters */}
              {(searchTerm ||
                selectedCategory !== 'all' ||
                selectedTags.length > 0 ||
                sortBy !== 'trending') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/80 p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h3>

                  {/* Tags Filter */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                            selectedTags.includes(tag)
                              ? 'bg-bitcoinOrange text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          {/* Project Creation CTA (when no projects exist) */}
          {filteredProjects.length === 0 &&
            !searchTerm &&
            selectedCategory === 'all' &&
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
                  {searchTerm || selectedCategory !== 'all' || selectedTags.length > 0
                    ? 'No projects match your criteria'
                    : 'Be the first to create a Bitcoin project!'}
                </h3>
                <p className="text-gray-600 mb-8">
                  {searchTerm || selectedCategory !== 'all' || selectedTags.length > 0
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

                  {searchTerm || selectedCategory !== 'all' || selectedTags.length > 0 ? (
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
            (searchTerm || selectedCategory !== 'all' || selectedTags.length > 0) ? (
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
                  {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
                </h2>
              </div>

              {/* Project Grid */}
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                }`}
              >
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <ModernCampaignCard project={project} viewMode={viewMode} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
