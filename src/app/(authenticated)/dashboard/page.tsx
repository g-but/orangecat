'use client'

import { useEffect, useState, useCallback } from 'react'
// import { useAuthStore } from '@/store/auth' // Not directly used now, useAuth handles it
import { Bitcoin, Users, Share2, TrendingUp, ExternalLink, Edit3, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
// import { createBrowserClient } from '@supabase/ssr' // Supabase client not directly used now
import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table' // Table not used now
// import { Badge } from '@/components/ui/badge' // Badge not used now
// import { Progress } from '@/components/ui/progress' // Progress not used now
// import type { FundingPage } from '@/types/funding' // Not used now

interface StatCardProps {
  title: string
  value: string | number
  description?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-4xl">{value}</CardTitle>
    </CardHeader>
    {description && (
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    )}
  </Card>
)

/* // Stats interface not used now
interface Stats {
  totalFunding: number
  totalContributors: number
  activePages: number
}
*/

/* // RecentContribution interface not used now
interface RecentContribution {
  id: string
  funding_page_title: string
  amount: number
  contributed_at: string
  contributor_name?: string
}
*/

export default function DashboardPage() {
  const { user, profile, isLoading, error: authError, hydrated } = useAuth()
  /* // Stats state not used now
  const [stats, setStats] = useState<Stats>({
    totalFunding: 0,
    totalContributors: 0,
    activePages: 0
  })
  */
  const router = useRouter()
  const authHydrated = hydrated
  
  // Import the shared Supabase client instead of creating a new one
  // import supabase from '@/services/supabase/client'

  // const [userFundingPages, setUserFundingPages] = useState<FundingPage[]>([]) // Not used now
  // const [recentContributions, setRecentContributions] = useState<RecentContribution[]>([]) // Not used now
  const [fetchingData, setFetchingData] = useState(false) // Kept for generic loading state, though no data is fetched currently
  // const [statsError, setStatsError] = useState<string | null>(null) // Not used now

  /* // fetchDashboardData not used now
  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setFetchingData(false)
      return
    }
    console.log('Fetching dashboard data for user:', user.id)
    setFetchingData(true)
    try {
      const { data, error } = await supabase
        .rpc('get_user_dashboard_stats', { p_user_id: user.id })

      console.log('Dashboard data received:', data, 'Error:', error)

      if (error) {
        console.error('Error loading dashboard data:', error)
        setStatsError('Failed to load dashboard statistics. Please try again later.')
      } else if (data) {
        setStats({
          totalFunding: data.total_funding_received || 0,
          totalContributors: data.total_contributors || 0,
          activePages: data.active_campaigns || 0,
        })
        setRecentContributions(data.recent_contributions || [])
        setStatsError(null)
      }
    } catch (e: any) {
      console.error('Unexpected error in fetchDashboardData:', e)
      setStatsError('An unexpected error occurred while fetching dashboard data.')
    } finally {
      setFetchingData(false)
    }
  }, [user, supabase])
  */

  useEffect(() => {
    if (!hydrated) return

    if (!isLoading && !user) {
      console.log('DashboardPage: No user detected, redirecting to /auth')
      router.push('/auth')
      return
    }

    /* // No data fetching triggered here now
    if (user) {
      // fetchDashboardData()
    } else if (!isLoading) {
      setFetchingData(false)
    }
    */
    // If user exists but no specific data is fetched now, ensure loading is false.
    if(user && !isLoading) {
      setFetchingData(false)
    }

  }, [user, isLoading, hydrated, router /*, fetchDashboardData */])

  const isProfileIncomplete = profile && (!profile.bio || !profile.bitcoin_address);

  if (isLoading || !authHydrated) {
    return <Loading fullScreen />
  }

  if (!isLoading && !user && hydrated) {
    router.push('/auth');
    return <Loading fullScreen />;
  }
  
  if (user && isLoading) {
      return <Loading fullScreen />;
  }

  if (authError && user) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Card className="overflow-hidden">
          <CardHeader className="bg-red-50">
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>{authError}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             <p className="text-sm text-muted-foreground mb-4">There was an issue loading your dashboard. Please try refreshing. If the problem persists, you might need to sign out and sign back in.</p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => router.refresh()}>Refresh</Button>
              <Link href="/auth"> 
                <Button variant="outline">Go to Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user) {
    return null; 
  }

  if (fetchingData) { // This will likely be false quickly as no data is fetched
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link href="/create">
            <Button>Create New Funding Page</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-8 flex justify-center items-center">
            <p className="text-gray-500">Loading dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (profile && isProfileIncomplete) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Welcome, {profile.display_name || user.email}!</h1>
        </div>
        <Card className="bg-amber-50 border-amber-300">
          <CardHeader>
            <CardTitle className="text-amber-700">Complete Your Profile</CardTitle>
            <CardDescription className="text-amber-600">
              Your profile is missing some important information (like a bio or Bitcoin address). 
              Completing it helps build trust and enables all features.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 pb-6">
            <Link href="/profile">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white">Complete Your Profile Now</Button>
            </Link>
          </CardContent>
        </Card>
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Dashboard</CardTitle>
              <CardDescription>Your main dashboard content will appear here once you complete your profile.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link href="/create">
          <Button>Create New Funding Page</Button>
        </Link>
      </div>

      <Card className="bg-white shadow-sm mb-6">
        <CardHeader>
          <CardTitle>Welcome, {profile?.display_name || user.email}!</CardTitle>
          <CardDescription>This is where your main content will be displayed.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>More features coming soon!</p>
        </CardContent>
      </Card>

      {/* Commented out placeholder StatCards and Tables content */}
      {/*
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Funding Received" value={`$${stats.totalFunding.toLocaleString()}`} description="Across all your pages" />
        <StatCard title="Total Contributors" value={stats.totalContributors} description="Unique contributors to your pages" />
        <StatCard title="Active Funding Pages" value={stats.activePages} description="Currently accepting contributions" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Funding Pages</CardTitle>
          <CardDescription>A quick overview of your most recent funding pages.</CardDescription>
        </CardHeader>
        <CardContent>
          {userFundingPages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              {// TableBody will be rendered with actual data }
            </Table>
          ) : (
            <p>You haven\'t created any funding pages yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
          <CardDescription>Latest contributions to your funding pages.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentContributions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funding Page</TableHead>
                  <TableHead>Contributor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentContributions.map((contrib) => (
                  <TableRow key={contrib.id}>
                    <TableCell>{contrib.funding_page_title}</TableCell>
                    <TableCell>{contrib.contributor_name || 'Anonymous'}</TableCell>
                    <TableCell>${contrib.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{new Date(contrib.contributed_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No recent contributions.</p>
          )}
        </CardContent>
      </Card>
      */}
    </div>
  )
} 