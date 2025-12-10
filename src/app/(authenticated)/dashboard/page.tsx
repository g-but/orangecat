'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { timelineService } from '@/services/timeline';
import { TimelineFeedResponse } from '@/types/timeline';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { logger } from '@/utils/logger';
import Loading from '@/components/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { BarChart3, Star, Eye, Users, Target, Wallet, Plus, MessageCircle, Share2, Copy } from 'lucide-react';
import ProfileShare from '@/components/sharing/ProfileShare';
import { toast } from 'sonner';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { PROFILE_CATEGORIES } from '@/types/profile';
import { DashboardProjectCard } from '@/components/dashboard/DashboardProjectCard';
import TasksSection from '@/components/dashboard/TasksSection';

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
  () => import('@/components/dashboard/MobileDashboardSidebar').then(mod => mod.MobileDashboardSidebar),
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
  const { dispatchProjectCreated } = useTimelineEvents(); // Enable automatic timeline event creation
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [timelineFeed, setTimelineFeed] = useState<TimelineFeedResponse | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (hydrated) {
      setLocalLoading(false);
    }
  }, [hydrated]);

  // Load projects when user is available
  useEffect(() => {
    if (user?.id && hydrated) {
      loadProjects(user.id).catch(error => {
        logger.error('Failed to load projects in dashboard', { error }, 'Dashboard');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hydrated]);

  // Load timeline feed when user is available
  useEffect(() => {
    if (user?.id && hydrated) {
      loadTimelineFeed(user.id);
    }
  }, [user?.id, hydrated]);

  // Reload projects when returning to dashboard (e.g., after creating a project)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && hydrated) {
        loadProjects(user.id).catch(error => {
          logger.error('Failed to reload projects on focus', { error }, 'Dashboard');
        });
        // Also reload timeline
        loadTimelineFeed(user.id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, hydrated]);

  const loadTimelineFeed = async (userId: string) => {
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const feed = await timelineService.getEnrichedUserFeed(userId);
      setTimelineFeed(feed);
    } catch (error) {
      logger.error('Failed to load timeline feed', error, 'Dashboard');
      setTimelineError('Failed to load timeline');
    } finally {
      setTimelineLoading(false);
    }
  };

  // FIXED: Handle authentication redirect with proper client-side check
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    } // Don't run on server

    if (hydrated && !isLoading && !user && !hasRedirected) {
      setHasRedirected(true);
      router.push('/auth');
    }
  }, [user, hydrated, isLoading, router, hasRedirected]);

  // CRITICAL: All hooks must be called before any early returns (Rules of Hooks)
  // Get project stats - ensure projects is an array before using reduce
  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);
  const safeDrafts = useMemo(() => (Array.isArray(drafts) ? drafts : []), [drafts]);
  const stats = useMemo(() => getStats(), [projects, drafts, getStats]);
  const totalProjects = stats.totalProjects;

  // Calculate totals by currency to avoid mixing BTC and CHF - MEMOIZED
  const fundingByCurrency = useMemo(
    () =>
      safeProjects.reduce(
        (acc, project) => {
          const currency = project.currency || 'CHF';
          acc[currency] = (acc[currency] || 0) + (project.total_funding || 0);
          return acc;
        },
        {} as Record<string, number>
      ),
    [safeProjects]
  );

  // Use the primary currency (CHF by default, or BTC if that's the only one) - MEMOIZED
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

  // Profile completion - MEMOIZED
  const profileCompletion = useMemo(() => {
    const hasUsername = !!profile?.username;
    const hasBio = !!profile?.bio;
    const hasBitcoinAddress = !!profile?.bitcoin_address;
    const profileFields = [hasUsername, hasBio, hasBitcoinAddress];
    return Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  }, [profile?.username, profile?.bio, profile?.bitcoin_address]);

  // Profile completion flags for UI - MEMOIZED
  const hasUsername = useMemo(() => !!profile?.username, [profile?.username]);
  const hasBio = useMemo(() => !!profile?.bio, [profile?.bio]);
  const hasBitcoinAddress = useMemo(() => !!profile?.bitcoin_address, [profile?.bitcoin_address]);

  // Get primary draft for urgent actions - MEMOIZED
  const hasAnyDraft = useMemo(() => safeDrafts.length > 0, [safeDrafts]);
  const primaryDraft = useMemo(
    () => (hasAnyDraft ? safeDrafts[0] : null),
    [hasAnyDraft, safeDrafts]
  );
  const totalDrafts = useMemo(() => safeDrafts.length, [safeDrafts]);

  const hasTimelineActivity = useMemo(() => {
    const feed = timelineFeed as unknown as { events?: unknown[]; items?: unknown[]; data?: unknown[] };
    return Boolean(feed?.events?.length || feed?.items?.length || feed?.data?.length);
  }, [timelineFeed]);

  const guidedSuggestions = useMemo(() => {
    const suggestions: {
      title: string;
      description: string;
      href: string;
      icon: React.ReactNode;
    }[] = [];

    if (!hasBitcoinAddress) {
      suggestions.push({
        title: 'Add a Bitcoin wallet',
        description: 'Enable receiving funds and payouts.',
        href: '/dashboard/wallets',
        icon: <Wallet className="w-4 h-4 text-orange-600" />,
      });
    }

    if (hasAnyDraft) {
      suggestions.push({
        title: 'Finish your draft',
        description: `Complete ${totalDrafts} pending project${totalDrafts > 1 ? 's' : ''}.`,
        href: '/projects/create',
        icon: <Target className="w-4 h-4 text-emerald-600" />,
      });
    }

    if (safeProjects.length === 0) {
      suggestions.push({
        title: 'Create your first project',
        description: 'Launch a campaign in minutes.',
        href: '/projects/create',
        icon: <Plus className="w-4 h-4 text-blue-600" />,
      });
    }

    if (!hasTimelineActivity) {
      suggestions.push({
        title: 'Post an update',
        description: 'Share a quick update to engage supporters.',
        href: '/timeline',
        icon: <MessageCircle className="w-4 h-4 text-indigo-600" />,
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: 'View dashboard',
        description: 'Check activity across projects and wallets.',
        href: '/dashboard',
        icon: <BarChart3 className="w-4 h-4 text-purple-600" />,
      });
    }

    return suggestions.slice(0, 4);
  }, [
    hasAnyDraft,
    hasBitcoinAddress,
    hasTimelineActivity,
    safeProjects.length,
    totalDrafts,
  ]);

  // Get featured project (most recent published or highest funded) - MEMOIZED
  const featuredProject = useMemo(() => {
    const publishedProjects = safeProjects.filter(p => !p.isDraft);
    if (publishedProjects.length > 0) {
      // Sort by funding amount (highest first) - use spread to avoid mutation
      return [...publishedProjects].sort(
        (a, b) => (b.total_funding || 0) - (a.total_funding || 0)
      )[0];
    }
    // Fallback: look for Orange Cat project or first project
    return (
      safeProjects.find(c => c.title?.toLowerCase().includes('orange cat')) ||
      safeProjects[0] ||
      null
    );
  }, [safeProjects]);

  // Profile category for display (use profile_type if available, default to individual) - MEMOIZED
  const profileCategory = useMemo(() => {
    const profileType = (profile as { profile_type?: string })?.profile_type;
    return profileType && profileType in PROFILE_CATEGORIES
      ? PROFILE_CATEGORIES[profileType as keyof typeof PROFILE_CATEGORIES]
      : PROFILE_CATEGORIES.individual;
  }, [profile]);

  // Handle loading states - simplified to avoid infinite loading
  if (!hydrated || localLoading) {
    return <Loading fullScreen message="Loading your account..." />;
  }

  // If no user after hydration, show loading while redirecting
  if (!user && !isLoading) {
    return <Loading fullScreen message="Redirecting to login..." />;
  }

  // Show error state if there's an authentication error
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
            <div className="flex items-center gap-3">
              <Button onClick={() => window.location.reload()}>Refresh</Button>
              <Link href="/auth">
                <Button variant="outline">Go to Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure user is authenticated before rendering dashboard content
  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
      {/* Mobile-Optimized Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-50/50 to-tiffany-50/50 rounded-xl border border-gray-100 p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-tiffany-500 rounded-xl">
              <span className="text-2xl">👤</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                Welcome back, {profile?.name || profile?.username || 'there'}!
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {totalProjects > 0
                  ? `${totalProjects} project${totalProjects !== 1 ? 's' : ''}${totalDrafts > 0 ? ` • ${totalDrafts} draft${totalDrafts !== 1 ? 's' : ''}` : ''}`
                  : "Let's get started"}
              </p>
            </div>
          </div>
          {profileCategory && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border border-orange-200 text-orange-700 shrink-0">
              <span>{profileCategory.icon}</span>
              {profileCategory.label}
            </div>
          )}
        </div>
      </div>

      {/* Invite / Share CTA */}
      <div className="mb-6">
        <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-teal-50 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-gray-900">Invite friends to OrangeCat</h3>
              <p className="text-sm text-gray-600">Share your profile link and start building your network</p>
            </div>
            <div className="flex items-center gap-2 relative">
              <Link href="/dashboard/people">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" /> Discover People
                </Button>
              </Link>
              <div className="flex items-center gap-2 relative">
                <Button onClick={() => setShowShare(!showShare)} className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Share2 className="w-4 h-4 mr-2" /> Share My Profile
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const url = `${window.location.origin}/profiles/${profile?.username || user!.id}`;
                    navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success('Invite link copied'))
                      .catch(() => toast.error('Failed to copy link'));
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Link
                </Button>
                {showShare && (
                  <div className="absolute right-0 mt-2 z-50">
                    <ProfileShare
                      username={profile?.username || user!.id}
                      profileName={profile?.name || profile?.username || 'My Profile'}
                      profileBio={profile?.bio || undefined}
                      onClose={() => setShowShare(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GUIDED JOURNEY SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Your OrangeCat journey</CardTitle>
            <CardDescription>Stay on track with clear next steps.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Profile completion</span>
                <span className="text-sm font-semibold text-gray-900">{profileCompletion}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-tiffany-500 transition-all"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Complete your profile to build trust and unlock suggestions tailored to you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
              {guidedSuggestions.map(suggestion => (
                <Link key={suggestion.title} href={suggestion.href}>
                  <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-orange-200 hover:shadow-sm transition-colors">
                    <div className="mt-1">{suggestion.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                      <p className="text-sm text-gray-600 leading-tight">{suggestion.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-1">
          <TasksSection />
        </div>
      </div>

      {/* MOBILE-FIRST RESPONSIVE LAYOUT */}
      <div className="space-y-6">
        {/* MOBILE: Rich Sidebar Experience */}
        <MobileDashboardSidebar
          stats={{
            totalProjects,
            totalDrafts,
            totalRaised,
            totalSupporters,
            primaryCurrency,
          }}
          profileCompletion={profileCompletion}
          profile={profile}
        />

        {/* DESKTOP: 2-COLUMN LAYOUT */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-6">
          {/* LEFT: Compact Sidebar with Metrics and Actions */}
          <DashboardSidebar
            stats={{
              totalProjects,
              totalDrafts,
              totalRaised,
              totalSupporters,
              primaryCurrency,
            }}
            profileCompletion={profileCompletion}
            profile={profile}
          />

          {/* RIGHT: Main Timeline Feed with Composer */}
          <DashboardTimeline
            timelineFeed={timelineFeed}
            isLoading={timelineLoading}
            error={timelineError}
            onRefresh={() => user?.id && loadTimelineFeed(user.id)}
            onPostSuccess={() => user?.id && loadTimelineFeed(user.id)}
            userId={user?.id}
          />
        </div>

        {/* MOBILE: Timeline Feed */}
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

      {/* My Projects Section - Hidden on mobile to avoid clutter, shown on desktop */}
      {safeProjects.length > 0 && (
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Projects</CardTitle>
                  <CardDescription>My Bitcoin fundraising projects</CardDescription>
                </div>
                <Link href="/dashboard/projects">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid gap-4">
                {safeProjects.slice(0, 3).map(project => (
                  <DashboardProjectCard key={project.id} project={project} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totalProjects > 0 ? (
              <Link href="/dashboard/projects">
                <Button variant="outline" className="w-full h-16 flex-col">
                  <Eye className="w-5 h-5 mb-2" />
                  Manage Projects
                </Button>
              </Link>
            ) : (
              <Link href="/discover">
                <Button variant="outline" className="w-full h-16 flex-col">
                  <Users className="w-5 h-5 mb-2" />
                  Explore Projects
                </Button>
              </Link>
            )}

            <Link href="/profile">
              <Button variant="outline" className="w-full h-16 flex-col">
                <Star className="w-5 h-5 mb-2" />
                Update Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
