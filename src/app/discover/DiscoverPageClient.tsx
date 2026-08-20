'use client';

import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';
import { useAuth } from '@/hooks/useAuth';
import DiscoverTabs from '@/components/discover/DiscoverTabs';
import DiscoverFilters from '@/components/discover/DiscoverFilters';
import DiscoverHero from '@/components/discover/DiscoverHero';
import DiscoverEmptyState from '@/components/discover/DiscoverEmptyState';
import { DiscoverLoadingState } from '@/components/discover/DiscoverLoadingState';
import DiscoverResults from '@/components/discover/DiscoverResults';
import { GRADIENTS } from '@/config/gradients';
import { DISCOVER_TAB_FILTERS } from './discoverConstants';
import { useDiscoverState } from './useDiscoverState';

/**
 * Interactive /discover experience (client). `topContent` is server-rendered
 * SEO content (see DiscoverFeatured) slotted in below the hero so it lands in
 * the initial crawlable HTML.
 */
export default function DiscoverPageClient({ topContent }: { topContent?: ReactNode }) {
  const { user: _user } = useAuth();

  const {
    // Search state
    searchTerm,
    searchError,
    loading,
    loansLoading,
    assetsLoading,
    hasMore,
    isLoadingMore,

    // Data
    projects,
    profiles,
    loans,
    investments,
    assets,
    causes,
    events,
    products,
    services,
    groups,
    circles,
    wishlists,
    research,
    aiAssistants,
    investmentsLoading,
    genericLoading,
    tabCounts,

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
    showInitialLoading,
    showEmptyState,
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
    showStatusFilter: DISCOVER_TAB_FILTERS[activeTab].projectStatus,
    selectedCategories,
    onToggleCategory: handleToggleCategory,
    showCategoryFilter: DISCOVER_TAB_FILTERS[activeTab].projectCategories,
    country,
    onCountryChange: setCountry,
    city,
    onCityChange: setCity,
    postal,
    onPostalChange: setPostal,
    radiusKm,
    onRadiusChange: setRadiusKm,
    onClearFilters: clearFilters,
    searchPlaceholder: activeTab === 'profiles' ? 'Search people…' : 'Search…',
  };

  return (
    <div className={`min-h-screen ${GRADIENTS.pageBg}`}>
      {/* Hero Section */}
      <DiscoverHero />

      {/* Server-rendered SEO content (recently-published entities) */}
      {topContent}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Layout: left vertical sidebar (desktop), content on right */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-6">
          {/* Left Sidebar - always visible on desktop, collapsible on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20">
              <div className="bg-surface-base/70 dark:bg-surface-base/70 backdrop-blur-sm rounded-lg border border-default dark:border-default/60 p-5">
                <h3 className="text-lg font-semibold text-fg-primary mb-4">Filters</h3>
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
              counts={tabCounts}
              loading={
                loading || loansLoading || investmentsLoading || assetsLoading || genericLoading
              }
            />

            <div className="bg-surface-base/70 dark:bg-surface-base/70 backdrop-blur-sm rounded-b-lg border border-default dark:border-default/60 border-t-0 p-6">
              {/* Mobile filter trigger — opens a bottom sheet rather than
                  re-rendering the desktop form inline in the page flow, so
                  filtering doesn't push results off-screen on a phone. */}
              <div className="lg:hidden mb-4">
                <Button variant="outline" onClick={() => setShowFilters(true)} className="w-full">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {hasFilters && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-warm px-1.5 text-xs font-medium text-on-accent">
                      •
                    </span>
                  )}
                </Button>
              </div>

              <BottomSheet
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                title="Filters"
                maxHeight="90vh"
              >
                <div className="p-4">
                  <DiscoverFilters variant="mobile" {...filterProps} />
                  <Button
                    variant="accent"
                    size="lg"
                    className="mt-6 w-full"
                    onClick={() => setShowFilters(false)}
                  >
                    Show results
                  </Button>
                </div>
              </BottomSheet>

              {/* Error State */}
              {searchError && (
                <div className="text-center py-16">
                  <div className="oc-error-surface rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-status-negative font-medium mb-2">Error loading projects</p>
                    <p className="text-status-negative text-sm">{searchError}</p>
                  </div>
                </div>
              )}

              {/* Loading skeleton — shown while fetching and until the first
                  load cycle settles, so a populated platform never flashes the
                  empty state on a slow connection. */}
              {showInitialLoading && (
                <DiscoverLoadingState viewMode={viewMode} activeTab={activeTab} />
              )}

              {/* Empty State — only after a load has genuinely completed empty */}
              {showEmptyState && (
                <DiscoverEmptyState
                  activeTab={activeTab}
                  hasFilters={hasFilters}
                  onClearFilters={clearFilters}
                />
              )}

              {/* Results */}
              {!showInitialLoading && !searchError && !isEmpty && (
                <DiscoverResults
                  activeTab={activeTab}
                  viewMode={viewMode}
                  projects={projects}
                  profiles={profiles}
                  loans={loans}
                  investments={investments}
                  assets={assets}
                  causes={causes}
                  events={events}
                  products={products}
                  services={services}
                  groups={groups}
                  circles={circles}
                  wishlists={wishlists}
                  research={research}
                  aiAssistants={aiAssistants}
                  loading={
                    loading || loansLoading || investmentsLoading || assetsLoading || genericLoading
                  }
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  onLoadMore={handleLoadMore}
                  onTabChange={handleTabChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
