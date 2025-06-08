"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PageLayout, PageHeader, PageSection } from "@/components/layout/PageLayout";
import { 
  UserCircle2, 
  Users, 
  Search, 
  Filter, 
  SlidersHorizontal,
  X,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  ChevronDown,
  Grid3X3,
  List,
  ArrowUpDown
} from "lucide-react";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import { 
  search, 
  getTrending,
  SearchResult, 
  SearchType, 
  SortOption, 
  SearchFilters,
  SearchProfile,
  SearchFundingPage 
} from "@/services/search";
import Link from 'next/link'
import { FundingPage } from '@/types/funding'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'
import { categoryValues } from '@/config/categories'
import { sanitizeBioForDisplay } from '@/utils/validation'

type ViewMode = 'grid' | 'list';

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Data state
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Performance optimization with debounced search
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load search results using the search service
  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: SearchFilters = {};
      if (selectedCategories.length > 0) {
        filters.categories = selectedCategories;
      }
      
      let response;
      if (!debouncedQuery && searchType === 'all' && selectedCategories.length === 0) {
        // Show trending content when no search query
        response = await getTrending();
      } else {
        // Perform search
        response = await search({
          query: debouncedQuery || undefined,
          type: searchType,
          sortBy,
          filters,
          limit: 20,
          offset: 0
        });
      }
      
      setResults(response.results);
      setTotalResults(response.totalCount);
      setHasMore(response.hasMore);
      
    } catch (err: any) {
      console.error('Error loading search results:', err);
      // More specific error messages
      if (err.message?.includes('Failed to get trending content')) {
        setError('No content available yet. Be the first to create a profile or campaign!');
      } else if (err.message?.includes('Failed to perform search')) {
        setError('Search is temporarily unavailable. Please try again in a moment.');
      } else {
        setError('Unable to load content. This might be because no profiles or campaigns have been created yet.');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, searchType, selectedCategories, sortBy]);

  // Load results when dependencies change
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (searchType !== 'all') params.set('type', searchType);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    window.history.replaceState({}, '', `/discover${newUrl}`);
  }, [debouncedQuery, searchType]);

  // Filter handlers
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
    setSearchType('all');
    setSortBy('relevance');
  };

  // Render functions
  const renderProfileCard = (profile: SearchProfile) => (
    <Card
      key={`profile-${profile.id}`}
      className={`${viewMode === 'grid' ? 'p-4 sm:p-6' : 'p-3 sm:p-4'} hover:shadow-lg transition-all duration-200 cursor-pointer group touch-manipulation`}
      onClick={() => router.push(`/profile/${profile.username || profile.id}`)}
    >
      <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center text-center' : 'items-center space-x-3 sm:space-x-4'}`}>
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name || profile.username || 'User avatar'}
            width={viewMode === 'grid' ? 64 : 48}
            height={viewMode === 'grid' ? 64 : 48}
            className="rounded-full object-cover border-2 border-tiffany-200 group-hover:border-tiffany-400 transition-colors flex-shrink-0"
          />
        ) : (
          <DefaultAvatar 
            size={viewMode === 'grid' ? 64 : 48}
            className="border-2 border-tiffany-200 group-hover:border-tiffany-400 transition-colors flex-shrink-0" 
          />
        )}
        
        <div className={`${viewMode === 'grid' ? 'mt-3 sm:mt-4' : 'flex-1 min-w-0'}`}>
          <h3 className={`${viewMode === 'grid' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-semibold text-gray-900 group-hover:text-tiffany-700 transition-colors ${viewMode === 'list' ? 'truncate' : ''}`}>
            {profile.display_name || profile.username || 'Anonymous User'}
          </h3>
          {profile.username && profile.display_name && (
            <p className={`${viewMode === 'grid' ? 'text-sm' : 'text-xs sm:text-sm'} text-gray-500 ${viewMode === 'list' ? 'truncate' : ''}`}>@{profile.username}</p>
          )}
          {profile.bio && (
            <p className={`text-gray-600 mt-1 sm:mt-2 ${viewMode === 'grid' ? 'line-clamp-3 text-sm sm:text-base' : 'line-clamp-2 text-xs sm:text-sm'} leading-relaxed`}>
              {sanitizeBioForDisplay(profile.bio)}
            </p>
          )}
          <div className={`flex items-center ${viewMode === 'grid' ? 'justify-between' : 'justify-between'} mt-2 sm:mt-3`}>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Users className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">Profile</span>
            </span>
            <span className="text-tiffany-600 group-hover:text-tiffany-700 transition-colors text-sm sm:text-base">→</span>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderCampaignCard = (campaign: SearchFundingPage) => {
    const progress = campaign.goal_amount ? (campaign.total_funding / campaign.goal_amount) * 100 : 0;
    
    return (
      <Card
        key={`campaign-${campaign.id}`}
        className={`${viewMode === 'grid' ? 'p-4 sm:p-6' : 'p-3 sm:p-4'} hover:shadow-lg transition-all duration-200 cursor-pointer group touch-manipulation`}
        onClick={() => router.push(`/campaign/${campaign.slug || campaign.id}`)}
      >
        <div className={`${viewMode === 'list' ? 'flex items-center space-x-3 sm:space-x-4' : ''}`}>
          {campaign.featured_image_url && viewMode === 'grid' && (
            <div className="relative h-40 sm:h-48 w-full mb-3 sm:mb-4 rounded-lg overflow-hidden">
              <Image
                src={campaign.featured_image_url}
                alt={campaign.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <h3 className={`${viewMode === 'grid' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'} font-semibold text-gray-900 group-hover:text-tiffany-700 transition-colors line-clamp-2 flex-1 pr-2`}>
                {campaign.title}
              </h3>
              {!campaign.is_active && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ml-2 flex-shrink-0">
                  Inactive
                </span>
              )}
            </div>
            
            {/* Creator info */}
            {campaign.profiles && (
              <div className="flex items-center mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600">
                <span className="truncate">by {campaign.profiles.display_name || campaign.profiles.username || 'Anonymous'}</span>
              </div>
            )}
            
            {campaign.description && (
              <p className={`text-gray-600 mb-2 sm:mb-3 ${viewMode === 'grid' ? 'line-clamp-3 text-sm sm:text-base' : 'line-clamp-2 text-xs sm:text-sm'} leading-relaxed`}>
                {campaign.description}
              </p>
            )}
            
            <div className="space-y-2 sm:space-y-3">
              {/* Progress bar */}
              {campaign.goal_amount && (
                <div>
                  <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-1">
                    <div className="truncate">
                                            <CurrencyDisplay
                        amount={campaign.total_funding || 0}
                        currency="BTC"
                        size="sm"
                        showSymbol={true}
                        className="text-xs sm:text-sm"
                      />
                      <span className="ml-1">raised</span>
                    </div>
                    <span className="flex-shrink-0 ml-2">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-tiffany-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500 min-w-0 flex-1">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{campaign.contributor_count} supporters</span>
                  </span>
                  {campaign.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 self-start">
                      {campaign.category}
                    </span>
                  )}
                </div>
                <span className="text-tiffany-600 group-hover:text-tiffany-700 transition-colors text-sm sm:text-base ml-2 flex-shrink-0">→</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <PageLayout>
      <PageHeader
        title="Discover & Support"
        description="Find amazing people and projects to support with Bitcoin"
      />

      <PageSection>
        {/* Search Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Search Bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search for people, projects, or campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-4 py-3 sm:py-4 text-base sm:text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-transparent transition-all duration-200 min-h-[48px] touch-manipulation"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 min-h-[44px] min-w-[44px] touch-manipulation"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

          {/* Search Type Tabs */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-0">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
              {[
                { key: 'all', label: 'All', icon: Sparkles },
                { key: 'profiles', label: 'People', icon: Users },
                { key: 'campaigns', label: 'Campaigns', icon: Target }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSearchType(key as SearchType)}
                  className={`flex items-center px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap min-h-[44px] touch-manipulation ${
                    searchType === key
                      ? 'bg-white text-tiffany-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 min-h-[44px] min-w-[44px] touch-manipulation ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 min-h-[44px] min-w-[44px] touch-manipulation ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent min-h-[44px] w-full sm:w-auto touch-manipulation"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="funding">Highest Funded</option>
                </select>
                <ArrowUpDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`min-h-[44px] px-3 sm:px-4 touch-manipulation ${showFilters ? 'bg-tiffany-50 border-tiffany-300' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span>
                {selectedCategories.length > 0 && (
                  <span className="ml-2 bg-tiffany-600 text-white text-xs rounded-full px-2 py-0.5">
                    {selectedCategories.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                <h3 className="text-sm font-medium text-gray-900">Categories</h3>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-tiffany-600 hover:text-tiffany-700 transition-colors self-start sm:self-auto min-h-[44px] px-2 touch-manipulation"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {categoryValues.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] touch-manipulation ${
                      selectedCategories.includes(category)
                        ? 'bg-tiffany-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4 sm:space-y-6">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {debouncedQuery ? `Search Results` : 'Discover'}
              </h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {loading ? 'Searching...' : `${totalResults} results found`}
                {debouncedQuery && (
                  <span className="ml-1">for &quot;{debouncedQuery}&quot;</span>
                )}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-16 sm:py-20">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-tiffany-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="bg-red-50 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <X className="w-8 h-8 sm:w-12 sm:h-12 text-red-500" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Something went wrong</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base leading-relaxed">{error}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button onClick={loadResults} variant="outline" className="min-h-[44px] touch-manipulation">
                  Try Again
                </Button>
                {error.includes('no profiles or campaigns') && (
                  <>
                    <Button href="/create" className="min-h-[44px] touch-manipulation">
                      Create Campaign
                    </Button>
                    <Button href="/profile" variant="outline" className="min-h-[44px] touch-manipulation">
                      Create Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="bg-tiffany-50 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                {debouncedQuery ? (
                  <Search className="w-8 h-8 sm:w-12 sm:h-12 text-tiffany-500" />
                ) : (
                  <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-tiffany-500" />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                {debouncedQuery ? 'No results found' : 'Be the first to get started!'}
              </h3>
              <p className="text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                {debouncedQuery 
                  ? 'Try adjusting your search terms or filters, or be the first to create content that matches your search.'
                  : 'It looks like no one has created any profiles or campaigns yet. This is your chance to be a pioneer!'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                {debouncedQuery ? (
                  <>
                    <Button onClick={clearFilters} variant="outline" className="min-h-[44px] touch-manipulation">
                      Clear Search
                    </Button>
                    <Button href="/create" className="min-h-[44px] touch-manipulation">
                      Create Campaign
                    </Button>
                  </>
                ) : (
                  <>
                    <Button href="/create" size="lg" className="min-h-[48px] touch-manipulation">
                      Start a Campaign
                    </Button>
                    <Button href="/profile" variant="outline" size="lg" className="min-h-[48px] touch-manipulation">
                      Create Your Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && results.length > 0 && (
            <div className={`grid gap-4 sm:gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1 max-w-4xl mx-auto'
            }`}>
              {results.map((result) => 
                result.type === 'profile' 
                  ? renderProfileCard(result.data as SearchProfile)
                  : renderCampaignCard(result.data as SearchFundingPage)
              )}
            </div>
          )}
        </div>
      </PageSection>

      {/* Call to Action */}
      <PageSection background="tiffany">
        <div className="text-center px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Make an Impact?</h2>
          <p className="text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Join our community of creators and supporters. Start your own campaign or discover amazing projects to fund.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button href="/create" size="lg" className="min-h-[48px] touch-manipulation">
              Start a Campaign
            </Button>
            <Button href="/profile" variant="outline" size="lg" className="min-h-[48px] touch-manipulation">
              Create Your Profile
            </Button>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
} 