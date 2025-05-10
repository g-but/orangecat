'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { Bitcoin, Users, Share2, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createBrowserClient } from '@supabase/ssr'
import Loading from '@/components/Loading'

interface Stats {
  totalFunding: number
  totalContributors: number
  activePages: number
}

interface FundingPage {
  id: string
  total_funding: number | null
  contributor_count: number | null
  is_active: boolean
}

export default function DashboardPage() {
  const { user, profile, checkProfileCompletion } = useAuthStore()
  const [stats, setStats] = useState<Stats>({
    totalFunding: 0,
    totalContributors: 0,
    activePages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const [showProfileCta, setShowProfileCta] = useState(true)
  const { isLoading: authLoading, hydrated } = useAuth()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadStats() {
      try {
        const { data: fundingPages, error: fundingError } = await supabase
          .from('funding_pages')
          .select('id, total_funding, contributor_count, is_active')
          .eq('user_id', user!.id)

        if (fundingError) throw fundingError

        const stats = fundingPages?.reduce((acc: Stats, page: FundingPage) => {
          return {
            totalFunding: acc.totalFunding + (page.total_funding || 0),
            totalContributors: acc.totalContributors + (page.contributor_count || 0),
            activePages: acc.activePages + (page.is_active ? 1 : 0)
          }
        }, {
          totalFunding: 0,
          totalContributors: 0,
          activePages: 0
        })

        setStats(stats || {
          totalFunding: 0,
          totalContributors: 0,
          activePages: 0
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadStats()
    }
  }, [user, supabase])

  const statCards = [
    {
      name: 'Total Funding',
      value: `₿${stats.totalFunding.toFixed(8)}`,
      icon: Bitcoin,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    },
    {
      name: 'Total Contributors',
      value: stats.totalContributors,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      name: 'Active Pages',
      value: stats.activePages,
      icon: Share2,
      color: 'text-green-600',
      bg: 'bg-green-100'
    }
  ]

  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Onboarding CTA Banner */}
      {profile && !checkProfileCompletion() && showProfileCta && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded flex items-center justify-between shadow">
          <div>
            <div className="font-semibold text-yellow-800 text-lg mb-1 flex items-center gap-2">
              <span role="img" aria-label="wave">👋</span> Welcome to OrangeCat!
            </div>
            <div className="text-yellow-700 mb-2">
              To unlock all features and get the most out of your dashboard, please complete your profile.<br/>
              <span className="font-medium">Add your username, bio, avatar, and Bitcoin address.</span>
            </div>
            <Button size="sm" onClick={() => router.push('/profile')}>
              Complete My Profile
            </Button>
          </div>
          <button
            className="ml-6 text-yellow-400 hover:text-yellow-600 text-2xl font-bold"
            onClick={() => setShowProfileCta(false)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.display_name || profile?.username || 'Anonymous'}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here&apos;s an overview of your funding activity and statistics.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className={`${stat.bg} rounded-lg p-3`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/fundraising-campaigns/new">
            <Button className="w-full">
              <Share2 className="w-5 h-5 mr-2" />
              Create New Campaign
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="secondary" className="w-full">
              <Users className="w-5 h-5 mr-2" />
              Update Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <Link href="/dashboard/activity">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </div>
        {isLoading ? (
          <div className="mt-4 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-tiffany-600 border-t-transparent" />
          </div>
        ) : stats.totalContributors === 0 ? (
          <p className="mt-4 text-gray-600">
            No recent activity. Create a funding page to get started!
          </p>
        ) : (
          <div className="mt-4">
            {/* Activity items would go here */}
          </div>
        )}
      </div>
    </div>
  )
} 