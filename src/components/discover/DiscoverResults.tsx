/**
 * Discover Results Component
 *
 * Handles rendering of search results, loading states, and pagination.
 * Extracted from discover/page.tsx for better modularity.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from discover/page.tsx
 */

import { motion } from 'framer-motion';
import { ArrowUpDown, Loader2, Target, Users, DollarSign, TrendingUp, Gift, FlaskConical } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ProjectCard } from '@/components/entity/variants/ProjectCard';
import ProfileCard from '@/components/ui/ProfileCard';
import {
  ProjectCardSkeleton,
  ProfileCardSkeleton,
  LoanCardSkeleton,
} from '@/components/ui/Skeleton';
import ResultsSection from '@/components/discover/ResultsSection';
import { LoanCard } from '@/components/entity/variants/LoanCard';
import { InvestmentCard } from '@/components/entity/variants/InvestmentCard';
import { GenericPublicCard, type GenericPublicEntity } from '@/components/entity/variants/GenericPublicCard';
import type { SearchFundingPage, SearchProfile } from '@/services/search';
import type { DiscoverTabType } from '@/components/discover/DiscoverTabs';
import type { Loan } from '@/types/loans';
import type { Investment } from '@/types/investments';
import type { EntityType } from '@/config/entity-registry';
import { ROUTES } from '@/config/routes';

type ViewMode = 'grid' | 'list';

interface DiscoverResultsProps {
  activeTab: DiscoverTabType;
  viewMode: ViewMode;
  projects: SearchFundingPage[];
  profiles: SearchProfile[];
  loans?: Loan[];
  investments?: Investment[];
  causes?: GenericPublicEntity[];
  events?: GenericPublicEntity[];
  products?: GenericPublicEntity[];
  services?: GenericPublicEntity[];
  groups?: GenericPublicEntity[];
  wishlists?: GenericPublicEntity[];
  research?: GenericPublicEntity[];
  totalResults: number;
  loading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onTabChange: (tab: DiscoverTabType) => void;
}

export default function DiscoverResults({
  activeTab,
  viewMode,
  projects,
  profiles,
  loans = [],
  investments = [],
  causes = [],
  events = [],
  products = [],
  services = [],
  groups = [],
  wishlists = [],
  research = [],
  totalResults,
  loading,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onTabChange,
}: DiscoverResultsProps) {
  // Loading State - Skeleton Grid
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Skeleton Grid */}
        <div
          className={`grid gap-6 ${
            viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {activeTab === 'profiles' ? (
            Array.from({ length: 6 }).map((_, index) => (
              <ProfileCardSkeleton key={index} viewMode={viewMode} />
            ))
          ) : activeTab === 'projects' ? (
            Array.from({ length: 6 }).map((_, index) => <ProjectCardSkeleton key={index} />)
          ) : activeTab === 'loans' || activeTab === 'investments' ? (
            Array.from({ length: 6 }).map((_, index) => (
              <LoanCardSkeleton key={index} viewMode={viewMode} />
            ))
          ) : (
            <>
              {Array.from({ length: 2 }).map((_, index) => (
                <ProjectCardSkeleton key={`project-${index}`} />
              ))}
              {Array.from({ length: 2 }).map((_, index) => (
                <ProfileCardSkeleton key={`profile-${index}`} viewMode={viewMode} />
              ))}
              {Array.from({ length: 2 }).map((_, index) => (
                <LoanCardSkeleton key={`loan-${index}`} viewMode={viewMode} />
              ))}
            </>
          )}
        </div>
      </div>
    );
  }

  // Calculate displayed count including all entity types
  const displayedCount =
    projects.length +
    profiles.length +
    loans.length +
    investments.length +
    causes.length +
    events.length +
    products.length +
    services.length +
    groups.length +
    wishlists.length +
    research.length;

  // Results Header
  const resultsHeader = (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        {totalResults > 0 ? (
          <>
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
            {displayedCount < totalResults && (
              <span className="text-gray-500 text-lg font-normal ml-2">
                (showing {displayedCount})
              </span>
            )}
          </>
        ) : (
          'No results found'
        )}
      </h2>
    </div>
  );

  // Results Grid Component for Projects and Profiles
  const ResultsGrid = ({
    items,
    type,
  }: {
    items: (SearchFundingPage | SearchProfile)[];
    type: 'project' | 'profile';
  }) => (
    <div
      className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
      }`}
    >
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          {type === 'project' ? (
            <ProjectCard project={item as SearchFundingPage} />
          ) : (
            <ProfileCard profile={item as SearchProfile} viewMode={viewMode} />
          )}
        </motion.div>
      ))}
    </div>
  );

  // Loans Grid Component
  const LoansGrid = ({ items }: { items: Loan[] }) => (
    <div
      className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
      }`}
    >
      {items.map((loan, index) => (
        <motion.div
          key={loan.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <LoanCard loan={loan} viewMode={viewMode} />
        </motion.div>
      ))}
    </div>
  );

  // Generic Entity Grid Component (causes, events, products, services, groups)
  const GenericGrid = ({
    items,
    entityType,
    makeHref,
  }: {
    items: GenericPublicEntity[];
    entityType: EntityType;
    makeHref: (entity: GenericPublicEntity) => string;
  }) => (
    <div
      className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
      }`}
    >
      {items.map((entity, index) => (
        <motion.div
          key={entity.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <GenericPublicCard
            entity={entity}
            entityType={entityType}
            href={makeHref(entity)}
            viewMode={viewMode}
          />
        </motion.div>
      ))}
    </div>
  );

  // Investments Grid Component
  const InvestmentsGrid = ({ items }: { items: Investment[] }) => (
    <div
      className={`grid gap-6 ${
        viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
      }`}
    >
      {items.map((investment, index) => (
        <motion.div
          key={investment.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <InvestmentCard investment={investment} viewMode={viewMode} />
        </motion.div>
      ))}
    </div>
  );

  // Load More Button
  const LoadMoreButton = ({ label }: { label: string }) => (
    <div className="mt-8 flex justify-center">
      <Button
        onClick={onLoadMore}
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
            {label}
            <ArrowUpDown className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );

  // Tab-Specific Content
  if (activeTab === 'all') {
    const sectionLengths = [
      projects.length, profiles.length, loans.length, investments.length,
      causes.length, events.length, products.length, services.length, groups.length, wishlists.length, research.length,
    ];
    const hasMultipleSections = sectionLengths.filter(n => n > 0).length > 1;
    return (
      <div className="space-y-8">
        {resultsHeader}
        {projects.length > 0 && (
          <ResultsSection title="Projects" count={projects.length} icon={<Target className="w-5 h-5" />} onViewAll={() => onTabChange('projects')} showViewAll={hasMultipleSections} viewAllLabel="View All Projects">
            <ResultsGrid items={projects.slice(0, 6)} type="project" />
          </ResultsSection>
        )}
        {causes.length > 0 && (
          <ResultsSection title="Causes" count={causes.length} icon={<Users className="w-5 h-5" />} onViewAll={() => onTabChange('causes')} showViewAll={hasMultipleSections} viewAllLabel="View All Causes">
            <GenericGrid items={causes.slice(0, 6)} entityType="cause" makeHref={e => ROUTES.CAUSES.VIEW(e.id)} />
          </ResultsSection>
        )}
        {investments.length > 0 && (
          <ResultsSection title="Investments" count={investments.length} icon={<TrendingUp className="w-5 h-5" />} onViewAll={() => onTabChange('investments')} showViewAll={hasMultipleSections} viewAllLabel="View All Investments">
            <InvestmentsGrid items={investments.slice(0, 6)} />
          </ResultsSection>
        )}
        {loans.length > 0 && (
          <ResultsSection title="Loans" count={loans.length} icon={<DollarSign className="w-5 h-5" />} onViewAll={() => onTabChange('loans')} showViewAll={hasMultipleSections} viewAllLabel="View All Loans">
            <LoansGrid items={loans.slice(0, 6)} />
          </ResultsSection>
        )}
        {products.length > 0 && (
          <ResultsSection title="Products" count={products.length} icon={<Users className="w-5 h-5" />} onViewAll={() => onTabChange('products')} showViewAll={hasMultipleSections} viewAllLabel="View All Products">
            <GenericGrid items={products.slice(0, 6)} entityType="product" makeHref={e => ROUTES.PRODUCTS.VIEW(e.id)} />
          </ResultsSection>
        )}
        {services.length > 0 && (
          <ResultsSection title="Services" count={services.length} icon={<Users className="w-5 h-5" />} onViewAll={() => onTabChange('services')} showViewAll={hasMultipleSections} viewAllLabel="View All Services">
            <GenericGrid items={services.slice(0, 6)} entityType="service" makeHref={e => ROUTES.SERVICES.VIEW(e.id)} />
          </ResultsSection>
        )}
        {events.length > 0 && (
          <ResultsSection title="Events" count={events.length} icon={<Users className="w-5 h-5" />} onViewAll={() => onTabChange('events')} showViewAll={hasMultipleSections} viewAllLabel="View All Events">
            <GenericGrid items={events.slice(0, 6)} entityType="event" makeHref={e => ROUTES.EVENTS.VIEW(e.id)} />
          </ResultsSection>
        )}
        {groups.length > 0 && (
          <ResultsSection title="Groups" count={groups.length} icon={<Users className="w-5 h-5" />} onViewAll={() => onTabChange('groups')} showViewAll={hasMultipleSections} viewAllLabel="View All Groups">
            <GenericGrid items={groups.slice(0, 6)} entityType="group" makeHref={e => ROUTES.GROUPS.VIEW(e.slug ?? e.id)} />
          </ResultsSection>
        )}
        {wishlists.length > 0 && (
          <ResultsSection title="Wishlists" count={wishlists.length} icon={<Gift className="w-5 h-5" />} onViewAll={() => onTabChange('wishlists')} showViewAll={hasMultipleSections} viewAllLabel="View All Wishlists">
            <GenericGrid items={wishlists.slice(0, 6)} entityType="wishlist" makeHref={e => ROUTES.WISHLISTS.VIEW(e.id)} />
          </ResultsSection>
        )}
        {research.length > 0 && (
          <ResultsSection title="Research" count={research.length} icon={<FlaskConical className="w-5 h-5" />} onViewAll={() => onTabChange('research')} showViewAll={hasMultipleSections} viewAllLabel="View All Research">
            <GenericGrid items={research.slice(0, 6)} entityType="research" makeHref={e => ROUTES.RESEARCH.VIEW(e.id)} />
          </ResultsSection>
        )}
        {profiles.length > 0 && (
          <ResultsSection title="People" count={profiles.length} icon={<Users className="w-5 h-5" />} onViewAll={() => onTabChange('profiles')} showViewAll={hasMultipleSections} viewAllLabel="View All People">
            <ResultsGrid items={profiles.slice(0, 6)} type="profile" />
          </ResultsSection>
        )}
      </div>
    );
  }

  if (activeTab === 'investments') {
    return (<>{resultsHeader}<InvestmentsGrid items={investments} />{hasMore && <LoadMoreButton label="Load More Investments" />}</>);
  }
  if (activeTab === 'causes') {
    return (<>{resultsHeader}<GenericGrid items={causes} entityType="cause" makeHref={e => ROUTES.CAUSES.VIEW(e.id)} />{hasMore && <LoadMoreButton label="Load More Causes" />}</>);
  }
  if (activeTab === 'events') {
    return (<>{resultsHeader}<GenericGrid items={events} entityType="event" makeHref={e => ROUTES.EVENTS.VIEW(e.id)} />{hasMore && <LoadMoreButton label="Load More Events" />}</>);
  }
  if (activeTab === 'products') {
    return (<>{resultsHeader}<GenericGrid items={products} entityType="product" makeHref={e => ROUTES.PRODUCTS.VIEW(e.id)} />{hasMore && <LoadMoreButton label="Load More Products" />}</>);
  }
  if (activeTab === 'services') {
    return (<>{resultsHeader}<GenericGrid items={services} entityType="service" makeHref={e => ROUTES.SERVICES.VIEW(e.id)} />{hasMore && <LoadMoreButton label="Load More Services" />}</>);
  }
  if (activeTab === 'groups') {
    return (<>{resultsHeader}<GenericGrid items={groups} entityType="group" makeHref={e => ROUTES.GROUPS.VIEW(e.slug ?? e.id)} />{hasMore && <LoadMoreButton label="Load More Groups" />}</>);
  }
  if (activeTab === 'wishlists') {
    return (<>{resultsHeader}<GenericGrid items={wishlists} entityType="wishlist" makeHref={e => ROUTES.WISHLISTS.VIEW(e.id)} />{hasMore && <LoadMoreButton label="Load More Wishlists" />}</>);
  }
  if (activeTab === 'research') {
    return (<>{resultsHeader}<GenericGrid items={research} entityType="research" makeHref={e => ROUTES.RESEARCH.VIEW(e.id)} />{hasMore && <LoadMoreButton label="Load More Research" />}</>);
  }
  if (activeTab === 'projects') {
    return (<>{resultsHeader}<ResultsGrid items={projects} type="project" />{hasMore && <LoadMoreButton label="Load More Projects" />}</>);
  }
  if (activeTab === 'profiles') {
    return (<>{resultsHeader}<ResultsGrid items={profiles} type="profile" />{hasMore && <LoadMoreButton label="Load More People" />}</>);
  }

  // LOANS TAB
  return (<>{resultsHeader}<LoansGrid items={loans} />{hasMore && <LoadMoreButton label="Load More" />}</>);
}
