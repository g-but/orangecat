'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCampaignStore } from '@/stores/campaignStore'
import { useAnalytics } from '@/hooks/useAnalytics'
import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
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
  Wallet
} from 'lucide-react'
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay'

export default function DashboardPage() {
  const { user, profile, isLoading, error: authError, hydrated, session } = useAuth()
  const { drafts, loadCampaigns, isLoading: campaignLoading } = useCampaignStore()
  const { metrics, isLoading: analyticsLoading } = useAnalytics()
  const router = useRouter()
  const [localLoading, setLocalLoading] = useState(true)

  useEffect(() => {
    if (hydrated) {
      setLocalLoading(false)
    }
  }, [hydrated])

  // Load campaigns when user is available
  useEffect(() => {
    if (user?.id && hydrated) {
      loadCampaigns(user.id)
    }
  }, [user?.id, hydrated, loadCampaigns])

  // Handle loading states
  if (!hydrated || localLoading) {
    return <Loading fullScreen />
  }

  // Handle unauthenticated state
  if (!user && !session) {
    return <Loading fullScreen />
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
              <Button onClick={() => router.refresh()}>Refresh</Button>
              <Link href="/auth">
                <Button variant="outline">Go to Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get key metrics
  const fundraisingStats = metrics?.fundraising?.stats
  const totalCampaigns = Number(fundraisingStats?.totalCampaigns?.value || 0)
  const activeCampaigns = Number(fundraisingStats?.activeCampaigns?.value || 0)
  const totalRaised = Number(fundraisingStats?.totalRaised?.value || 0)
  const totalSupporters = Number(fundraisingStats?.totalSupporters?.value || 0)

  // Profile completion
  const hasUsername = !!profile?.username
  const hasBio = !!profile?.bio
  const hasBitcoinAddress = !!profile?.bitcoin_address
  const profileFields = [hasUsername, hasBio, hasBitcoinAddress]
  const profileCompletion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)
  
  // Get primary draft for urgent actions
  const hasAnyDraft = drafts.length > 0
  const primaryDraft = hasAnyDraft ? drafts[0] : null
  const totalDrafts = drafts.length

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.display_name || profile?.username || 'there'}! 👋
        </h1>
            <p className="text-gray-600 mt-1">
              Here&apos;s what&apos;s happening with your account
            </p>
          </div>
          <Link href="/create">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </Link>
            </div>
            
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
                        <span className="text-sm text-orange-600">{profileCompletion}% complete</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {!hasUsername && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Username needed</span>}
                        {!hasBitcoinAddress && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Bitcoin address needed</span>}
                        {!hasBio && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Bio needed</span>}
              </div>
                      <Link href="/profile">
                        <Button size="sm" variant="outline">
                          <Star className="w-4 h-4 mr-1" />
                          Complete Profile
                        </Button>
                      </Link>
                </div>
              )}
              
                  {/* Draft campaigns */}
                  {totalDrafts > 0 && (
                    <div className="p-3 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">
                          {totalDrafts} draft campaign{totalDrafts > 1 ? 's' : ''} waiting
                        </span>
                        {primaryDraft && (
                          <span className="text-sm text-orange-600">
                            &ldquo;{primaryDraft.title}&rdquo;
                            {primaryDraft.syncStatus === 'pending' && ' (unsaved)'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href="/create">
                          <Button size="sm" variant="outline">
                            <FileText className="w-4 h-4 mr-1" />
                            Continue Editing
                    </Button>
                  </Link>
                        <Link href="/dashboard/fundraising">
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Fundraising Overview */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/fundraising')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Target className="w-8 h-8 text-teal-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Fundraising</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>{totalCampaigns} total campaigns</div>
                <div>{activeCampaigns} active</div>
                {totalRaised > 0 && (
                  <div className="font-medium text-gray-900">
                    <CurrencyDisplay amount={totalRaised} currency="BTC" size="sm" /> raised
                </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Card */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/profile')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Star className="w-8 h-8 text-blue-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Profile</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>{profileCompletion}% complete</div>
                <div>{profile?.username ? `@${profile.username}` : 'No username set'}</div>
                <div className={profileCompletion === 100 ? 'text-green-600 font-medium' : 'text-orange-600'}>
                  {profileCompletion === 100 ? 'All set!' : 'Needs attention'}
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Community/Support (Future) */}
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/discover')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-600" />
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Explore campaigns</div>
                <div>Support projects</div>
                <div className="text-purple-600 font-medium">Discover</div>
            </div>
          </CardContent>
        </Card>

          {/* Analytics/Performance */}
          {totalCampaigns > 0 && (
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/fundraising')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>{totalSupporters} supporters</div>
                  <div>{activeCampaigns} active campaigns</div>
                  <div className="text-green-600 font-medium">View analytics</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/create">
                <Button variant="outline" className="w-full h-16 flex-col">
                  <Plus className="w-5 h-5 mb-2" />
                  Create Campaign
                </Button>
              </Link>
              
              {totalCampaigns > 0 ? (
                <Link href="/dashboard/fundraising">
                  <Button variant="outline" className="w-full h-16 flex-col">
                    <Eye className="w-5 h-5 mb-2" />
                    Manage Campaigns
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

        {/* Recent Activity Placeholder */}
        {totalCampaigns > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your campaigns</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Activity tracking coming soon</p>
                <Link href="/dashboard/fundraising">
                  <Button variant="outline" className="mt-4">
                    View Campaign Details
                  </Button>
                </Link>
              </div>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  )
}