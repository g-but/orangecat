'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import DiscoverTabs from '@/components/discover/DiscoverTabs';
import DiscoverFilters from '@/components/discover/DiscoverFilters';
import DiscoverHero from '@/components/discover/DiscoverHero';
import DiscoverEmptyState from '@/components/discover/DiscoverEmptyState';
import DiscoverResults from '@/components/discover/DiscoverResults';
import { useDiscoverState } from './useDiscoverState';

export default function DiscoverPage() {
  const { user: _user } = useAuth();

  const {
    // Search state
    searchTerm,
    searchError,
    loading,
    loansLoading,
    totalResults,
    hasMore,
    isLoadingMore,

    // Data
    projects,
    profiles,
    loans,
    investments,
    causes,
    events,
    products,
    services,
    groups,
    investmentsLoading,
    genericLoading,
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
  } = useDiscoverState();

  // Shared filter props to avoid duplication between desktop and mobile
  const filterProps = {
    searchTerm,
    onSearchChange: handleSearch,
    loading,
    sortBy,
    onSortChange: handleSortChange,
    viewMode,
    onViewModeChange: setViewMode,
    selectedStatuses,
    onToggleStatus: handleToggleStatus,
    showStatusFilter: activeTab !== 'profiles',
    selectedCategories,
    onToggleCategory: handleToggleCategory,
    showCategoryFilter: activeTab !== 'profiles',
    country,
    onCountryChange: setCountry,
    city,
    onCityChange: setCity,
    postal,
    onPostalChange: setPostal,
    radiusKm,
    onRadiusChange: setRadiusKm,
    onClearFilters: clearFilters,
  };

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
                <DiscoverFilters variant="desktop" {...filterProps} />
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
              investmentCount={investments.length || totalInvestmentsCount}
              loading={loading || loansLoading || investmentsLoading}
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
                      <DiscoverFilters variant="mobile" {...filterProps} />
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
              {!loading && !loansLoading && !investmentsLoading && !genericLoading && !searchError && isEmpty && (
                <DiscoverEmptyState
                  activeTab={activeTab}
                  hasFilters={hasFilters}
                  onClearFilters={clearFilters}
                />
              )}

              {/* Results */}
              {!loading && !loansLoading && !investmentsLoading && !genericLoading && !searchError && !isEmpty && (
                <DiscoverResults
                  activeTab={activeTab}
                  viewMode={viewMode}
                  projects={projects}
                  profiles={profiles}
                  loans={loans}
                  investments={investments}
                  causes={causes}
                  events={events}
                  products={products}
                  services={services}
                  groups={groups}
                  totalResults={totalResults + loans.length + investments.length + causes.length + events.length + products.length + services.length + groups.length}
                  loading={loading || loansLoading || investmentsLoading || genericLoading}
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
