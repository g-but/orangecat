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

type ViewMode = 'grid' | 'list';

const CATEGORIES = [
  'creative',
  'technology', 
  'community',
  'education',
  'charity',
  'business',
  'personal',
  'other'
];

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
    window.history.replaceState({}, '', `/fund-others${newUrl}`);
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
      className={`${viewMode === 'grid' ? 'p-6' : 'p-4'} hover:shadow-lg transition-all duration-200 cursor-pointer group`}
      onClick={() => router.push(`/profile/${profile.username || profile.id}`)}
    >
      <div className={`flex ${viewMode === 'grid' ? 'flex-col items-center text-center' : 'items-center space-x-4'}`}>
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={profile.display_name || profile.username || 'User avatar'}
            width={viewMode === 'grid' ? 64 : 48}
            height={viewMode === 'grid' ? 64 : 48}
            className="rounded-full object-cover border-2 border-tiffany-200 group-hover:border-tiffany-400 transition-colors"
          />
        ) : (
          <DefaultAvatar 
            size={viewMode === 'grid' ? 64 : 48}
            className="border-2 border-tiffany-200 group-hover:border-tiffany-400 transition-colors" 
          />
        )}
        
        <div className={`${viewMode === 'grid' ? 'mt-4' : 'flex-1'}`}>
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-tiffany-700 transition-colors">
            {profile.display_name || profile.username || 'Anonymous User'}
          </h3>
          {profile.username && profile.display_name && (
            <p className="text-sm text-gray-500">@{profile.username}</p>
          )}
          {profile.bio && (
            <p className={`text-gray-600 mt-2 ${viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-2'}`}>
              {profile.bio}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Users className="w-3 h-3 mr-1" />
              Profile
            </span>
            <span className="text-tiffany-600 group-hover:text-tiffany-700 transition-colors">→</span>
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
        className={`${viewMode === 'grid' ? 'p-6' : 'p-4'} hover:shadow-lg transition-all duration-200 cursor-pointer group`}
        onClick={() => router.push(`/campaign/${campaign.slug || campaign.id}`)}
      >
        <div className={`${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}>
          {campaign.featured_image_url && viewMode === 'grid' && (
            <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
              <Image
                src={campaign.featured_image_url}
                alt={campaign.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-tiffany-700 transition-colors line-clamp-2">
                {campaign.title}
              </h3>
              {!campaign.is_active && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ml-2">
                  Inactive
                </span>
              )}
            </div>
            
            {/* Creator info */}
            {campaign.profiles && (
              <div className="flex items-center mb-3 text-sm text-gray-600">
                <span>by {campaign.profiles.display_name || campaign.profiles.username || 'Anonymous'}</span>
              </div>
            )}
            
            {campaign.description && (
              <p className={`text-gray-600 mb-3 ${viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-2'}`}>
                {campaign.description}
              </p>
            )}
            
            <div className="space-y-3">
              {/* Progress bar */}
              {campaign.goal_amount && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{campaign.total_funding.toLocaleString()} sats raised</span>
                    <span>{Math.round(progress)}%</span>
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
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {campaign.contributor_count} supporters
                  </span>
                  {campaign.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {campaign.category}
                    </span>
                  )}
                </div>
                <span className="text-tiffany-600 group-hover:text-tiffany-700 transition-colors">→</span>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for people, projects, or campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-transparent transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Type Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', icon: Sparkles },
                { key: 'profiles', label: 'People', icon: Users },
                { key: 'campaigns', label: 'Campaigns', icon: Target }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSearchType(key as SearchType)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    searchType === key
                      ? 'bg-white text-tiffany-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
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
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-tiffany-500 focus:border-transparent"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="funding">Highest Funded</option>
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Filters Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? 'bg-tiffany-50 border-tiffany-300' : ''}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
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
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Categories</h3>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-tiffany-600 hover:text-tiffany-700 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
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
        <div className="space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {debouncedQuery ? `Search Results` : 'Discover'}
              </h2>
              <p className="text-gray-600 mt-1">
                {loading ? 'Searching...' : `${totalResults} results found`}
                {debouncedQuery && (
                  <span className="ml-1">for &quot;{debouncedQuery}&quot;</span>
                )}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tiffany-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="bg-red-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <X className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Something went wrong</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={loadResults} variant="outline">
                  Try Again
                </Button>
                {error.includes('no profiles or campaigns') && (
                  <>
                    <Button href="/create">
                      Create Campaign
                    </Button>
                    <Button href="/profile" variant="outline">
                      Create Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-tiffany-50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                {debouncedQuery ? (
                  <Search className="w-12 h-12 text-tiffany-500" />
                ) : (
                  <Sparkles className="w-12 h-12 text-tiffany-500" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {debouncedQuery ? 'No results found' : 'Be the first to get started!'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {debouncedQuery 
                  ? 'Try adjusting your search terms or filters, or be the first to create content that matches your search.'
                  : 'It looks like no one has created any profiles or campaigns yet. This is your chance to be a pioneer!'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {debouncedQuery ? (
                  <>
                    <Button onClick={clearFilters} variant="outline">
                      Clear Search
                    </Button>
                    <Button href="/create">
                      Create Campaign
                    </Button>
                  </>
                ) : (
                  <>
                    <Button href="/create" size="lg">
                      Start a Campaign
                    </Button>
                    <Button href="/profile" variant="outline" size="lg">
                      Create Your Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && results.length > 0 && (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'md:grid-cols-2 lg:grid-cols-3' 
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
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Make an Impact?</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join our community of creators and supporters. Start your own campaign or discover amazing projects to fund.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button href="/create" size="lg">
              Start a Campaign
            </Button>
            <Button href="/profile" variant="outline" size="lg">
              Create Your Profile
            </Button>
          </div>
        </div>
      </PageSection>
    </PageLayout>
  );
} 