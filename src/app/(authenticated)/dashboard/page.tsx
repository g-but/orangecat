'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProjectStore } from '@/stores/projectStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import Loading from '@/components/Loading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import {
  Target,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  FileText,
  Eye,
  BarChart3,
  Rocket,
  AlertCircle,
  Star,
  Wallet,
  ExternalLink,
  Edit3,
  Zap,
} from 'lucide-react';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';
import { PROFILE_CATEGORIES } from '@/types/profile';

export default function DashboardPage() {
  const { user, profile, isLoading, error: authError, hydrated, session } = useAuth();
  const {
    projects,
    drafts,
    activeProjects,
    loadProjects,
    isLoading: projectLoading,
    getStats,
  } = useProjectStore();
  const { metrics, isLoading: analyticsLoading } = useAnalytics();
  const router = useRouter();
  const [localLoading, setLocalLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Debug logging
  useEffect(() => {
    // REMOVED: console.log statement for security
  }, [user, profile, session, isLoading, hydrated, authError, localLoading]);

  useEffect(() => {
    if (hydrated) {
      setLocalLoading(false);
    }
  }, [hydrated]);

  // Load projects when user is available
  useEffect(() => {
    if (user?.id && hydrated) {
      loadProjects(user.id);
    }
  }, [user?.id, hydrated, loadProjects]);

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

  // REMOVED: console.log statement

  // Get project stats
  const stats = getStats();
  const totalProjects = stats.totalProjects;
  const activeProjectsCount = stats.totalActive;
  const totalRaised = projects.reduce((sum, c) => sum + (c.total_funding || 0), 0);
  const totalSupporters = projects.reduce((sum, c) => sum + (c.contributor_count || 0), 0);

  // Profile completion
  const hasUsername = !!profile?.username;
  const hasBio = !!profile?.bio;
  const hasBitcoinAddress = !!profile?.bitcoin_address;
  const profileFields = [hasUsername, hasBio, hasBitcoinAddress];
  const profileCompletion = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100
  );

  // Get primary draft for urgent actions
  const hasAnyDraft = drafts.length > 0;
  const primaryDraft = hasAnyDraft ? drafts[0] : null;
  const totalDrafts = drafts.length;

  // Get featured project (most recent active or highest funded)
  const featuredProject =
    activeProjects.length > 0
      ? activeProjects.sort((a, b) => (b.total_funding || 0) - (a.total_funding || 0))[0]
      : projects.find(c => c.title?.toLowerCase().includes('orange cat')) || // Specifically look for Orange Cat
        projects[0]; // Fallback to first project

  // Profile category for display (default to individual for now)
  const profileCategory = PROFILE_CATEGORIES.individual;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Modern Welcome Section with Gradient Background */}
        <div className="relative overflow-hidden bg-gradient-to-br from-bitcoinOrange/5 via-tiffany-50/80 to-orange-50/40 rounded-3xl border border-white/50 backdrop-blur-sm p-8 mb-8">
          {/* Background decoration */}
          <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-bitcoinOrange/10 to-tiffany-400/10 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-tiffany-400/10 to-orange-300/10 rounded-full blur-xl" />

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-bitcoinOrange/20 to-orange-400/20 rounded-2xl backdrop-blur-sm">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                    Welcome back, {profile?.name || profile?.username || 'there'}! 👋
                  </h1>
                  {profileCategory && (
                    <div
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border backdrop-blur-sm mt-2 ${profileCategory.color}`}
                    >
                      <span>{profileCategory.icon}</span>
                      {profileCategory.label}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-lg text-gray-600 leading-relaxed">
              {totalProjects > 0
                ? `Managing ${totalProjects} project${totalProjects !== 1 ? 's' : ''} • ${activeProjectsCount} active`
                : "Welcome! Let's create your first Bitcoin fundraising project."}
            </p>
          </div>
        </div>

        {/* Featured Project Spotlight */}
        {featuredProject && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 via-yellow-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Rocket className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      🎯 Your Featured Project
                    </h2>
                    <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      {featuredProject.is_active ? 'Active' : 'Draft'}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">{featuredProject.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{featuredProject.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Raised</p>
                      <p className="font-semibold text-green-600">
                        <CurrencyDisplay
                          amount={featuredProject.total_funding || 0}
                          currency="BTC"
                          size="sm"
                        />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Goal</p>
                      <p className="font-semibold text-blue-600">
                        <CurrencyDisplay
                          amount={featuredProject.goal_amount || 0}
                          currency="BTC"
                          size="sm"
                        />
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Supporters</p>
                      <p className="font-semibold text-purple-600">
                        {featuredProject.contributor_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Progress</p>
                      <p className="font-semibold text-orange-600">
                        {featuredProject.goal_amount
                          ? Math.round(
                              ((featuredProject.total_funding || 0) / featuredProject.goal_amount) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/projects/${featuredProject.id}`}>
                      <Button size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Project
                      </Button>
                    </Link>
                    <Link href={`/projects/create?draft=${featuredProject.id}`}>
                      <Button size="sm" variant="outline">
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href="/dashboard/projects">
                      <Button size="sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Urgent Actions */}
        {(totalDrafts > 0 || profileCompletion < 100) && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Action Required</h2>

                  {/* Profile completion */}
                  {profileCompletion < 100 && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">Complete your profile</span>
                        <span className="text-sm text-orange-600">
                          {profileCompletion}% complete
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {!hasUsername && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            Username needed
                          </span>
                        )}
                        {!hasBitcoinAddress && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            Bitcoin address needed
                          </span>
                        )}
                        {!hasBio && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            Bio needed
                          </span>
                        )}
                      </div>
                      <Link href="/profile">
                        <Button size="sm" variant="outline">
                          <Star className="w-4 h-4 mr-1" />
                          Complete Profile
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Draft projects */}
                  {totalDrafts > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {totalDrafts} draft project{totalDrafts > 1 ? 's' : ''} waiting
                        </span>
                        {primaryDraft && (
                          <span className="text-sm text-orange-600">
                            &ldquo;{primaryDraft.title}&rdquo;
                            {primaryDraft.syncStatus === 'pending' && ' (unsaved)'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href="/projects/create">
                          <Button size="sm" variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            Continue Editing
                          </Button>
                        </Link>
                        <Link href="/dashboard/projects">
                          <Button size="sm" variant="outline">
                            View All Drafts
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards with Enhanced Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Fundraising Overview */}
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push('/dashboard/projects')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-teal-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Projects</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="font-medium text-lg text-gray-900">{totalProjects}</div>
                <div>
                  {activeProjectsCount} active • {totalDrafts} drafts
                </div>
                {totalRaised > 0 && (
                  <div className="font-medium text-green-600">
                    <CurrencyDisplay amount={totalRaised} currency="BTC" size="sm" /> raised
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push('/profile')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Star className="w-8 h-8 text-blue-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Profile</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="font-medium text-lg text-gray-900">{profileCompletion}%</div>
                <div>{profile?.username ? `@${profile.username}` : 'No username set'}</div>
                <div
                  className={
                    profileCompletion === 100 ? 'text-green-600 font-medium' : 'text-orange-600'
                  }
                >
                  {profileCompletion === 100 ? 'All set!' : 'Needs attention'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Community/Support */}
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push('/discover')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="font-medium text-lg text-gray-900">{totalSupporters}</div>
                <div>Total supporters</div>
                <div className="text-purple-600 font-medium">Explore more</div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics/Performance */}
          {totalProjects > 0 ? (
            <Card
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push('/dashboard/projects')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="font-medium text-lg text-gray-900">
                    {Math.round(
                      activeProjectsCount > 0 ? totalRaised / activeProjectsCount : 0 * 100000000
                    )}{' '}
                    sats
                  </div>
                  <div>Avg per project</div>
                  <div className="text-green-600 font-medium">View analytics</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card
              className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => router.push('/projects/create')}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Zap className="w-8 h-8 text-orange-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3 text-xl">Create Your First Project</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="font-semibold text-lg text-gray-900">🚀 Ready to launch?</div>
                  <div>Your Bitcoin fundraising page is just a few clicks away</div>
                  <div className="text-orange-600 font-medium">Get funded in minutes</div>
                </div>
                <Button className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800">
                  Start Creating Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* My Projects Section */}
        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Projects</CardTitle>
                  <CardDescription>Your Bitcoin fundraising projects</CardDescription>
                </div>
                <Link href="/dashboard/projects">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                {projects.slice(0, 3).map(project => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{project.title}</h4>
                        <div
                          className={`px-2 py-1 text-xs rounded-full ${
                            project.is_active
                              ? 'bg-green-100 text-green-700'
                              : project.is_public
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {project.is_active ? 'Active' : project.is_public ? 'Published' : 'Draft'}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          <CurrencyDisplay
                            amount={project.total_funding || 0}
                            currency="BTC"
                            size="sm"
                          />{' '}
                          raised
                        </span>
                        <span>{project.contributor_count || 0} supporters</span>
                        {project.goal_amount && (
                          <span>
                            {Math.round(((project.total_funding || 0) / project.goal_amount) * 100)}
                            % of goal
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/fund-us/${project.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/projects/create?draft=${project.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

        {/* Recent Activity */}
        {totalProjects > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your projects</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Activity tracking coming soon</p>
                <Link href="/dashboard/projects">
                  <Button variant="outline" className="mt-4">
                    View Project Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
