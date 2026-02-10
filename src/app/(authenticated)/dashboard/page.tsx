'use client';

/**
 * DASHBOARD PAGE - Economic Activity Management View
 *
 * Purpose: Private management view of user's economic activity (projects, timeline, stats)
 * Design Principles:
 * - Focus on economic activity (projects + timeline) as primary content
 * - Clear visual hierarchy
 * - Responsive design (mobile-first, no duplicate code)
 * - Follows DRY, SSOT, Separation of Concerns
 *
 * Created: 2025-12-03
 * Last Modified: 2026-01-16
 * Last Modified Summary: Complete redesign - proper hierarchy, responsive, follows engineering principles
 */

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { timelineService } from '@/services/timeline';
import { TimelineFeedResponse } from '@/types/timeline';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { logger } from '@/utils/logger';
import Loading from '@/components/Loading';
import { toast } from 'sonner';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';

// Dashboard sections - modular components
import {
  DashboardHeader,
  DashboardWelcome,
  DashboardInviteCTA,
  DashboardJourney,
  DashboardQuickActions,
  DashboardProjects,
} from '@/components/dashboard/sections';

// Import lighter components directly (no dynamic import overhead)
import { MobileDashboardSidebar } from '@/components/dashboard/MobileDashboardSidebar';

// Only dynamic import for truly heavy component (Timeline with feed)
const DashboardTimeline = dynamic(
  () => import('@/components/dashboard/DashboardTimeline').then(mod => mod.DashboardTimeline),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { user, profile, isLoading, hydrated } = useRequireAuth();
  const { projects, drafts, loadProjects, getStats } = useProjectStore();
  useTimelineEvents();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state
  const [localLoading, setLocalLoading] = useState(true);
  const [timelineFeed, setTimelineFeed] = useState<TimelineFeedResponse | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Hydration effect
  useEffect(() => {
    if (hydrated) {
      setLocalLoading(false);
    }
  }, [hydrated]);

  // Load projects when user is available - critical for showing economic activity
  useEffect(() => {
    if (user?.id && hydrated) {
      loadProjects(user.id)
        .then(() => {
          const currentProjects = useProjectStore.getState().projects;
          logger.debug(
            'Projects loaded successfully',
            {
              userId: user.id,
              projectCount: currentProjects.length,
              hasProjects: currentProjects.length > 0,
            },
            'Dashboard'
          );
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error(
            'Failed to load projects in dashboard',
            {
              error: errorMessage,
              errorDetails: error,
              userId: user.id,
            },
            'Dashboard'
          );
          // Show toast notification for project loading errors
          toast.error('Failed to load your projects. Please refresh the page.');
        });
    }
  }, [user?.id, hydrated, loadProjects]);

  // Load timeline feed
  useEffect(() => {
    if (user?.id && hydrated) {
      loadTimelineFeed(user.id);
    }
  }, [user?.id, hydrated]);

  // Check welcome state - only show if not previously dismissed
  useEffect(() => {
    if (profile && hydrated && !localLoading && user?.id) {
      const isWelcome = searchParams?.get('welcome') === 'true';
      const isEmailConfirmed = searchParams?.get('confirmed') === 'true';
      const welcomeKey = `orangecat-welcome-shown-${user.id}`;
      const hasSeenWelcome = localStorage.getItem(welcomeKey) === 'true';
      const onboardingComplete = (profile as { onboarding_completed?: boolean })
        .onboarding_completed;

      if (
        !hasSeenWelcome &&
        (isWelcome || isEmailConfirmed || (onboardingComplete && !hasSeenWelcome))
      ) {
        setShowWelcome(true);
        if (isEmailConfirmed) {
          toast.success('Email confirmed! Welcome to OrangeCat 🎉', { duration: 5000 });
        }
      } else {
        setShowWelcome(false);
      }
    }
  }, [profile, hydrated, localLoading, searchParams, user?.id]);

  // Reload on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && hydrated) {
        loadProjects(user.id).catch(error => {
          logger.error('Failed to reload projects on focus', { error }, 'Dashboard');
        });
        loadTimelineFeed(user.id);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, hydrated, loadProjects]);

  const loadTimelineFeed = async (userId: string) => {
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const feed = await timelineService.getEnrichedUserFeed(userId);
      setTimelineFeed(feed);
      logger.debug(
        'Timeline feed loaded successfully',
        {
          userId,
          eventCount: feed?.events?.length || 0,
          hasEvents: feed && feed.events && feed.events.length > 0,
        },
        'Dashboard'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(
        'Failed to load timeline feed',
        {
          error: errorMessage,
          errorDetails: error,
          userId,
        },
        'Dashboard'
      );
      setTimelineError(`Failed to load timeline: ${errorMessage}`);
    } finally {
      setTimelineLoading(false);
    }
  };

  // Memoized values
  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);
  const safeDrafts = useMemo(() => (Array.isArray(drafts) ? drafts : []), [drafts]);
  const stats = useMemo(() => getStats(), [getStats]);
  const totalProjects = stats.totalProjects;
  const totalDrafts = safeDrafts.length;
  const fundingByCurrency = useMemo(
    () =>
      safeProjects.reduce(
        (acc, project) => {
          const currency = project.currency || PLATFORM_DEFAULT_CURRENCY;
          acc[currency] = (acc[currency] || 0) + (project.total_funding || 0);
          return acc;
        },
        {} as Record<string, number>
      ),
    [safeProjects]
  );

  const primaryCurrency = useMemo(
    () =>
      fundingByCurrency['CHF'] !== undefined
        ? 'CHF'
        : fundingByCurrency['BTC'] !== undefined
          ? 'BTC'
          : 'CHF',
    [fundingByCurrency]
  );

  const totalRaised = useMemo(
    () => fundingByCurrency[primaryCurrency] || 0,
    [fundingByCurrency, primaryCurrency]
  );
  const totalSupporters = useMemo(
    () => safeProjects.reduce((sum, c) => sum + (c.contributor_count || 0), 0),
    [safeProjects]
  );

  // Derived state (profile completion now handled by TasksSection SSOT)
  const hasProjects = useMemo(() => safeProjects.length > 0, [safeProjects]);

  // Loading states
  if (!hydrated || localLoading) {
    return <Loading fullScreen message="Loading your account..." />;
  }

  if (!user && !isLoading) {
    return <Loading fullScreen message="Redirecting to login..." />;
  }

  if (!user) {
    return null;
  }

  const sidebarStats = {
    totalProjects,
    totalRaised,
    totalSupporters,
    primaryCurrency,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      {/* Container with max-width and responsive padding */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-20 sm:pb-8">
        {/* Header Section */}
        <DashboardHeader
          profile={profile}
          totalProjects={totalProjects}
          totalDrafts={totalDrafts}
        />

        {/* Welcome Banner (conditional) */}
        {showWelcome && (
          <DashboardWelcome
            profile={profile}
            hasProjects={hasProjects}
            onDismiss={() => {
              setShowWelcome(false);
              if (user?.id) {
                const welcomeKey = `orangecat-welcome-shown-${user.id}`;
                localStorage.setItem(welcomeKey, 'true');
              }
            }}
          />
        )}

        {/* Recommended Next Steps - TasksSection handles its own visibility */}
        <DashboardJourney />

        {/* Primary Content: Economic Activity */}
        <div className="space-y-4 sm:space-y-6">
          {/* Mobile Sidebar - Stats shown above content on mobile */}
          <div className="block lg:hidden">
            <MobileDashboardSidebar stats={sidebarStats} />
          </div>

          {/* Main Content: Single column layout - no cluttered double sidebars */}
          <div className="space-y-6">
            {/* Timeline - User's activity feed */}
            <DashboardTimeline
              timelineFeed={timelineFeed}
              isLoading={timelineLoading}
              error={timelineError}
              onRefresh={() => user?.id && loadTimelineFeed(user.id)}
              onPostSuccess={() => user?.id && loadTimelineFeed(user.id)}
              userId={user?.id}
            />

            {/* Projects - User's economic activity */}
            <DashboardProjects projects={safeProjects} />
          </div>
        </div>

        {/* Secondary Actions (bottom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardInviteCTA profile={profile} userId={user.id} />
          <DashboardQuickActions hasProjects={hasProjects} />
        </div>
      </div>
    </div>
  );
}
