"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  MapPin
} from "lucide-react";
import Button from "@/components/ui/Button";
import ModernCampaignCard from "@/components/ui/ModernCampaignCard";
import Input from '@/components/ui/Input';
import { categoryValues, simpleCategories } from '@/config/categories';
import { useAuth } from '@/hooks/useAuth';

type ViewMode = 'grid' | 'list';

// Mock campaign data for demonstration with enhanced structure
const mockCampaigns = [
  {
    id: '1',
    title: 'Support Local Bitcoin Education',
    description: 'Teaching Bitcoin fundamentals in underserved communities across Switzerland.',
    creator: 'BitcoinEdu Switzerland',
    category: 'education',
    goal_amount: 50000,
    current_amount: 32500,
    supporters_count: 143,
    days_left: 21,
    image: '/api/placeholder/400/250',
    featured: true,
    location: 'Zurich, Switzerland',
    created_at: '2025-01-15',
    tags: ['education', 'community', 'switzerland'],
    verified: true
  },
  {
    id: '2', 
    title: 'Orange Cat Sanctuary Expansion',
    description: 'Help us expand our cat sanctuary and rescue more orange cats in need.',
    creator: 'OrangeCat Foundation',
    category: 'animals',
    goal_amount: 25000,
    current_amount: 18750,
    supporters_count: 89,
    days_left: 35,
    image: '/api/placeholder/400/250',
    featured: false,
    location: 'Bern, Switzerland',
    created_at: '2025-01-20',
    tags: ['animals', 'rescue', 'charity'],
    verified: true
  },
  {
    id: '3',
    title: 'Decentralized Music Platform',
    description: 'Building a platform where musicians can receive Bitcoin payments directly from fans.',
    creator: 'DecentralSound',
    category: 'technology',
    goal_amount: 100000,
    current_amount: 45000,
    supporters_count: 234,
    days_left: 42,
    image: '/api/placeholder/400/250',
    featured: true,
    location: 'Basel, Switzerland',
    created_at: '2025-01-10',
    tags: ['technology', 'music', 'bitcoin'],
    verified: false
  },
  {
    id: '4',
    title: 'Open Source Bitcoin Wallet',
    description: 'Developing a secure, user-friendly Bitcoin wallet with advanced privacy features.',
    creator: 'CryptoDevs Collective',
    category: 'technology',
    goal_amount: 75000,
    current_amount: 62500,
    supporters_count: 178,
    days_left: 14,
    image: '/api/placeholder/400/250',
    featured: false,
    location: 'Geneva, Switzerland',
    created_at: '2025-01-25',
    tags: ['bitcoin', 'opensource', 'privacy'],
    verified: true
  },
  {
    id: '5',
    title: 'Climate Action with Bitcoin',
    description: 'Using Bitcoin mining to incentivize renewable energy adoption in rural areas.',
    creator: 'GreenBitcoin Initiative',
    category: 'environment',
    goal_amount: 80000,
    current_amount: 24000,
    supporters_count: 95,
    days_left: 28,
    image: '/api/placeholder/400/250',
    featured: false,
    location: 'Lausanne, Switzerland',
    created_at: '2025-01-18',
    tags: ['environment', 'renewable', 'mining'],
    verified: true
  },
  {
    id: '6',
    title: 'Bitcoin for Small Business',
    description: 'Helping local restaurants and shops accept Bitcoin payments easily.',
    creator: 'LocalBitcoin Network',
    category: 'business',
    goal_amount: 30000,
    current_amount: 19500,
    supporters_count: 67,
    days_left: 19,
    image: '/api/placeholder/400/250',
    featured: false,
    location: 'Lucerne, Switzerland', 
    created_at: '2025-01-22',
    tags: ['business', 'payments', 'local'],
    verified: true
  }
]

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // State management
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'trending');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filter and search logic
  const filteredCampaigns = useMemo(() => {
    let filtered = [...mockCampaigns];

    // Search term filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(campaign => 
        campaign.title.toLowerCase().includes(search) ||
        campaign.description.toLowerCase().includes(search) ||
        campaign.creator.toLowerCase().includes(search) ||
        campaign.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(campaign => campaign.category === selectedCategory);
    }

    // Tag filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(campaign =>
        selectedTags.some(tag => campaign.tags.includes(tag))
      );
    }

    // Sort campaigns
    switch (sortBy) {
      case 'trending':
        filtered.sort((a, b) => b.supporters_count - a.supporters_count);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'ending_soon':
        filtered.sort((a, b) => a.days_left - b.days_left);
        break;
      case 'most_funded':
        filtered.sort((a, b) => (b.current_amount / b.goal_amount) - (a.current_amount / a.goal_amount));
        break;
      default:
        break;
    }

    return filtered;
  }, [searchTerm, selectedCategory, selectedTags, sortBy]);

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
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setSortBy('trending');
    router.push('/discover');
  };

  // Get unique tags from all campaigns
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    mockCampaigns.forEach(campaign => {
      campaign.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, []);

  const stats = useMemo(() => {
    const totalCampaigns = filteredCampaigns.length;
    const totalSupporters = filteredCampaigns.reduce((sum, campaign) => sum + campaign.supporters_count, 0);
    const totalFunding = filteredCampaigns.reduce((sum, campaign) => sum + campaign.current_amount, 0);
    return { totalCampaigns, totalSupporters, totalFunding };
  }, [filteredCampaigns]);

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
              opacity: [0.2, 0.6, 0.2] 
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          <motion.div
            className="absolute top-40 right-20 w-2 h-2 bg-tiffany-400/30 rounded-full"
            animate={{ 
              y: [0, 20, 0],
              x: [0, 15, 0],
              opacity: [0.3, 0.7, 0.3] 
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5 
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
                Bitcoin Campaigns
              </span>
            </motion.h1>

            <motion.p 
              className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              Support innovative projects, help local communities, and be part of the Bitcoin revolution.
            </motion.p>

            {/* Stats */}
            <motion.div 
              className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <div className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</div>
                <div className="text-sm text-gray-600">Active Campaigns</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <div className="text-2xl font-bold text-bitcoinOrange">{stats.totalSupporters}</div>
                <div className="text-sm text-gray-600">Total Supporters</div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                <div className="text-2xl font-bold text-tiffany-600">CHF {stats.totalFunding.toLocaleString()}</div>
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
              placeholder="Search campaigns, creators, or keywords..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-4 py-4 text-lg bg-white/80 backdrop-blur-sm border-gray-200/80 rounded-2xl focus:ring-2 focus:ring-bitcoinOrange/20 focus:border-bitcoinOrange"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
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
              </select>

              {/* Sort Filter */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
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
              {(searchTerm || selectedCategory !== 'all' || selectedTags.length > 0 || sortBy !== 'trending') && (
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
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
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
                      {allTags.map((tag) => (
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
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or browse all campaigns.</p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''} found
                </h2>
              </div>

              {/* Campaign Grid */}
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <ModernCampaignCard 
                      campaign={campaign} 
                      viewMode={viewMode}
                    />
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