'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { timelineService } from '@/services/timeline';
import { TimelineFeedResponse } from '@/types/timeline';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { isProfileIncomplete } from '@/components/onboarding/ProfileCompletionModal';
import { usePendingActions } from '@/components/ai-chat/PendingActionsCard';

export function useDashboard() {
  const { user, profile, isLoading, hydrated } = useRequireAuth();
  const { projects, drafts, loadProjects, getStats } = useProjectStore();
  useTimelineEvents();
  const searchParams = useSearchParams();
  const { getPendingActions, confirmAction, rejectAction } = usePendingActions();

  const [localLoading, setLocalLoading] = useState(true);
  const [timelineFeed, setTimelineFeed] = useState<TimelineFeedResponse | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [pendingActions, setPendingActions] = useState<
    Awaited<ReturnType<typeof getPendingActions>>
  >([]);

  const loadTimelineFeed = useCallback(async (userId: string) => {
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const feed = await timelineService.getEnrichedUserFeed(userId);
      setTimelineFeed(feed);
      logger.debug(
        'Timeline feed loaded',
        { userId, eventCount: feed?.events?.length || 0 },
        'Dashboard'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Failed to load timeline feed', { error: errorMessage, userId }, 'Dashboard');
      setTimelineError(`Failed to load timeline: ${errorMessage}`);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  const reloadTimeline = useCallback(() => {
    if (user?.id) {
      loadTimelineFeed(user.id);
    }
  }, [user?.id, loadTimelineFeed]);

  useEffect(() => {
    if (hydrated) {
      setLocalLoading(false);
    }
  }, [hydrated]);

  useEffect(() => {
    if (user?.id && hydrated) {
      getPendingActions()
        .then(actions => setPendingActions(actions))
        .catch(error => logger.error('Failed to load pending actions', { error }, 'Dashboard'));
    }
  }, [user?.id, hydrated, getPendingActions]);

  useEffect(() => {
    if (user?.id && hydrated) {
      loadProjects(user.id)
        .then(() => {
          const currentProjects = useProjectStore.getState().projects;
          logger.debug(
            'Projects loaded',
            { userId: user.id, projectCount: currentProjects.length },
            'Dashboard'
          );
        })
        .catch(error => {
          logger.error('Failed to load projects', { error, userId: user.id }, 'Dashboard');
          toast.error('Failed to load your projects. Please refresh the page.');
        });
    }
  }, [user?.id, hydrated, loadProjects]);

  useEffect(() => {
    if (user?.id && hydrated) {
      loadTimelineFeed(user.id);
    }
  }, [user?.id, hydrated, loadTimelineFeed]);

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

  useEffect(() => {
    if (profile && hydrated && !localLoading && user?.id) {
      const completionKey = `orangecat-profile-completed-${user.id}`;
      const hasCompletedProfile = localStorage.getItem(completionKey) === 'true';
      if (!hasCompletedProfile && isProfileIncomplete(profile, user.email)) {
        setShowProfileCompletion(true);
      }
    }
  }, [profile, hydrated, localLoading, user?.id, user?.email]);

  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && hydrated) {
        loadProjects(user.id).catch(error =>
          logger.error('Failed to reload projects on focus', { error }, 'Dashboard')
        );
        reloadTimeline();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id, hydrated, loadProjects, reloadTimeline]);

  const handleProfileCompletionDone = useCallback(() => {
    setShowProfileCompletion(false);
    if (user?.id) {
      localStorage.setItem(`orangecat-profile-completed-${user.id}`, 'true');
    }
  }, [user?.id]);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    if (user?.id) {
      localStorage.setItem(`orangecat-welcome-shown-${user.id}`, 'true');
    }
  }, [user?.id]);

  const handleConfirmAction = useCallback(
    async (actionId: string) => {
      const displayMessage = await confirmAction(actionId);
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
      return displayMessage;
    },
    [confirmAction]
  );

  const handleRejectAction = useCallback(
    async (actionId: string) => {
      await rejectAction(actionId);
      setPendingActions(prev => prev.filter(a => a.id !== actionId));
    },
    [rejectAction]
  );

  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);
  const safeDrafts = useMemo(() => (Array.isArray(drafts) ? drafts : []), [drafts]);
  const stats = useMemo(() => getStats(), [getStats]);
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

  return {
    user,
    profile,
    isLoading,
    hydrated,
    localLoading,
    timelineFeed,
    timelineLoading,
    timelineError,
    showWelcome,
    showProfileCompletion,
    pendingActions,
    safeProjects,
    totalProjects: stats.totalProjects,
    totalDrafts,
    hasProjects: safeProjects.length > 0,
    sidebarStats: {
      totalProjects: stats.totalProjects,
      totalRaised,
      totalSupporters,
      primaryCurrency,
    },
    reloadTimeline,
    handleProfileCompletionDone,
    dismissWelcome,
    handleConfirmAction,
    handleRejectAction,
  };
}
