'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { timelineService } from '@/services/timeline';
import { TimelineFeedResponse } from '@/types/timeline';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { logger } from '@/utils/logger';
import Loading from '@/components/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';

// Extracted dashboard sections
import {
  DashboardHeader,
  DashboardWelcome,
  DashboardInviteCTA,
  DashboardJourney,
  DashboardQuickActions,
  DashboardProjects,
} from '@/components/dashboard/sections';

// Dynamic imports for heavy components
const DashboardSidebar = dynamic(
  () => import('@/components/dashboard/DashboardSidebar').then(mod => mod.DashboardSidebar),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse h-80" />
    ),
  }
);

const MobileDashboardSidebar = dynamic(
  () =>
    import('@/components/dashboard/MobileDashboardSidebar').then(mod => mod.MobileDashboardSidebar),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse h-48" />
    ),
  }
);

const DashboardTimeline = dynamic(
  () => import('@/components/dashboard/DashboardTimeline').then(mod => mod.DashboardTimeline),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse h-96" />
    ),
  }
);

export default function DashboardPage() {
  const { user, profile, isLoading, error: authError, hydrated } = useAuth();
  const { projects, drafts, loadProjects, getStats } = useProjectStore();
  useTimelineEvents();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state
  const [localLoading, setLocalLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
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
          // Log after projects are loaded from store
          const currentProjects = useProjectStore.getState().projects;
          logger.debug(
            'Projects loaded successfully',
            { userId: user.id, projectCount: currentProjects.length },
            'Dashboard'
          );
        })
        .catch(error => {
          logger.error(
            'Failed to load projects in dashboard',
            { error, userId: user.id },
            'Dashboard'
          );
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

      // Only show welcome if:
      // 1. URL param explicitly requests it (welcome=true or confirmed=true)
      // 2. User completed onboarding but hasn't seen welcome yet
      // 3. AND user hasn't previously dismissed it
      if (
        !hasSeenWelcome &&
        (isWelcome || isEmailConfirmed || (onboardingComplete && !hasSeenWelcome))
      ) {
        setShowWelcome(true);
        // Don't auto-save here - let user dismiss it explicitly
        if (isEmailConfirmed) {
          toast.success('Email confirmed! Welcome to OrangeCat 🎉', { duration: 5000 });
        }
      } else {
        // If user has seen/dismissed it, don't show again
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

  // Auth redirect
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (hydrated && !isLoading && !user && !hasRedirected) {
      setHasRedirected(true);
      router.push('/auth');
    }
  }, [user, hydrated, isLoading, router, hasRedirected]);

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
        },
        'Dashboard'
      );
    } catch (error) {
      logger.error('Failed to load timeline feed', { error, userId }, 'Dashboard');
      setTimelineError('Failed to load timeline');
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

  // Profile completion
  const profileCompletion = useMemo(() => {
    const hasUsername = !!profile?.username;
    const hasBio = !!profile?.bio;
    const hasBitcoinAddress = !!profile?.bitcoin_address;
    const profileFields = [hasUsername, hasBio, hasBitcoinAddress];
    return Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  }, [profile?.username, profile?.bio, profile?.bitcoin_address]);

  const hasBitcoinAddress = useMemo(() => !!profile?.bitcoin_address, [profile?.bitcoin_address]);
  const hasAnyDraft = useMemo(() => safeDrafts.length > 0, [safeDrafts]);

  const hasTimelineActivity = useMemo(() => {
    const feed = timelineFeed as unknown as {
      events?: unknown[];
      items?: unknown[];
      data?: unknown[];
    };
    return Boolean(feed?.events?.length || feed?.items?.length || feed?.data?.length);
  }, [timelineFeed]);

  // Loading states
  if (!hydrated || localLoading) {
    return <Loading fullScreen message="Loading your account..." />;
  }

  if (!user && !isLoading) {
    return <Loading fullScreen message="Redirecting to login..." />;
  }

  if (authError && user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>{authError}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              There was an issue loading your dashboard. Please try refreshing.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarStats = {
    totalProjects,
    totalDrafts,
    totalRaised,
    totalSupporters,
    primaryCurrency,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
      <DashboardHeader profile={profile} totalProjects={totalProjects} totalDrafts={totalDrafts} />
      {showWelcome && (
        <DashboardWelcome
          profile={profile}
          onDismiss={() => {
            setShowWelcome(false);
            // Persist dismissal to localStorage so it doesn't show again
            if (user?.id) {
              const welcomeKey = `orangecat-welcome-shown-${user.id}`;
              localStorage.setItem(welcomeKey, 'true');
            }
          }}
        />
      )}
      <DashboardInviteCTA profile={profile} userId={user.id} />
      <DashboardJourney
        profileCompletion={profileCompletion}
        hasBitcoinAddress={hasBitcoinAddress}
        hasProjects={safeProjects.length > 0}
        hasAnyDraft={hasAnyDraft}
        totalDrafts={totalDrafts}
        hasTimelineActivity={hasTimelineActivity}
      />

      <div className="space-y-6">
        {/* Mobile sidebar */}
        <div className="block lg:hidden">
          <MobileDashboardSidebar
            stats={sidebarStats}
            profileCompletion={profileCompletion}
            profile={profile}
          />
        </div>
        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6">
          <DashboardSidebar stats={sidebarStats} profileCompletion={profileCompletion} />
          <DashboardTimeline
            timelineFeed={timelineFeed}
            isLoading={timelineLoading}
            error={timelineError}
            onRefresh={() => user?.id && loadTimelineFeed(user.id)}
            onPostSuccess={() => user?.id && loadTimelineFeed(user.id)}
            userId={user?.id}
          />
        </div>
        {/* Mobile timeline */}
        <div className="block lg:hidden">
          <DashboardTimeline
            timelineFeed={timelineFeed}
            isLoading={timelineLoading}
            error={timelineError}
            onRefresh={() => user?.id && loadTimelineFeed(user.id)}
            onPostSuccess={() => user?.id && loadTimelineFeed(user.id)}
            userId={user?.id}
          />
        </div>
      </div>

      <DashboardProjects projects={safeProjects} />
      <DashboardQuickActions hasProjects={safeProjects.length > 0} />
    </div>
  );
}
