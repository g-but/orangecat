'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardTemplate from '@/components/dashboard/DashboardTemplate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  Handshake, 
  Plus, 
  Edit2, 
  Eye, 
  Share2, 
  BarChart3, 
  Users, 
  Calendar, 
  Globe, 
  Coins, 
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  Copy,
  ExternalLink,
  Filter,
  Search,
  FileText,
  Edit3,
  X,
  Zap,
  Shield
} from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import Link from 'next/link'
import { FundingPage } from '@/types/funding'
import { fundraisingConfig } from '@/data/dashboardConfigs'
import { 
  getUserFundraisingStats, 
  getUserFundraisingActivity,
  getRecentDonationsCount,
  FundraisingStats,
  FundraisingActivity 
} from '@/services/supabase/fundraising'
import { DashboardStats, DashboardActivity } from '@/types/dashboard'
import { MetricCard, MetricGrid } from '@/components/dashboard/MetricCard'
import { useFundraisingMetrics } from '@/hooks/useAnalytics'
import { analyticsService } from '@/services/analytics'
import { useDrafts } from '@/hooks/useDrafts'

type SortOption = 'recent' | 'raised' | 'progress' | 'supporters'
type FilterOption = 'all' | 'active' | 'inactive' | 'completed' | 'drafts'

export default function FundraisingDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { metrics: fundraisingMetrics, isLoading: metricsLoading, error: metricsError } = useFundraisingMetrics()
  const { hasAnyDraft, hasDrafts, hasLocalDraft, drafts, getPrimaryDraft, isLoading: draftsLoading } = useDrafts()
  const [pages, setPages] = useState<FundingPage[]>([])
  const [filteredPages, setFilteredPages] = useState<FundingPage[]>([])
  const [stats, setStats] = useState<DashboardStats[]>([])
  const [activities, setActivities] = useState<DashboardActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const loadFundraisingData = useCallback(async () => {
    try {
      // Load funding pages
      const { data, error: fetchError } = await supabase
        .from('funding_pages')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setPages(data || [])

      // Load stats and activities
      const [statsData, activitiesData] = await Promise.all([
        getUserFundraisingStats(user!.id),
        getUserFundraisingActivity(user!.id, 10)
      ])

      // Enhanced stats with performance indicators
      const dashboardStats: DashboardStats[] = [
        {
          icon: Target,
          iconColor: "bg-teal-100 text-teal-600",
          label: "Active Campaigns",
          value: statsData.activeCampaigns,
          subtitle: statsData.totalCampaigns === 0 ? 'Get started below' : `${statsData.totalCampaigns} total campaigns`
        },
        {
          icon: Coins,
          iconColor: "bg-green-100 text-green-600",
          label: "Total Raised",
          value: formatCurrency(statsData.totalRaised),
          subtitle: statsData.totalSupporters === 0 ? 'Start your first campaign' : `Avg: ${formatCurrency(statsData.totalSupporters > 0 ? statsData.totalRaised / statsData.totalSupporters : 0)} per supporter`
        },
        {
          icon: Users,
          iconColor: "bg-blue-100 text-blue-600",
          label: "Total Supporters",
          value: statsData.totalSupporters,
          subtitle: statsData.totalSupporters === 0 ? 'Build your community' : 'Across all campaigns'
        },
        {
          icon: TrendingUp,
          iconColor: "bg-purple-100 text-purple-600",
          label: "Success Rate",
          value: `${calculateSuccessRate(data || [])}%`,
          subtitle: statsData.totalCampaigns === 0 ? 'Track your progress' : 'Campaigns reaching goals'
        }
      ]

      // Transform stats for MetricGrid
      const metricsForGrid = dashboardStats.map(stat => ({
        icon: stat.icon,
        iconColor: stat.iconColor,
        label: stat.label,
        metric: {
          value: stat.value,
          source: 'database' as const,
          confidence: 'high' as const,
          isDemo: false,
          lastUpdated: new Date()
        },
        subtitle: stat.subtitle
      }))

      const dashboardActivities: DashboardActivity[] = activitiesData.map(activity => ({
        type: activity.type,
        title: activity.title,
        context: activity.context,
        time: activity.time,
        icon: activity.type === 'donation' ? Coins : 
              activity.type === 'supporter' ? Users : 
              activity.type === 'milestone' ? Target : Handshake
      }))

      setStats(dashboardStats)
      setActivities(dashboardActivities)

    } catch (err) {
      console.error('Error loading fundraising data:', err)
      setError('Failed to load your fundraising data')
      toast.error('Failed to load fundraising data')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  const filterAndSortPages = useCallback(() => {
    let filtered = [...pages]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(page => 
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (page.description && page.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply status filter
    switch (filterBy) {
      case 'active':
        filtered = filtered.filter(page => page.is_active && page.is_public)
        break
      case 'inactive':
        filtered = filtered.filter(page => !page.is_active && page.is_public)
        break
      case 'completed':
        filtered = filtered.filter(page => 
          page.goal_amount && page.total_funding >= page.goal_amount
        )
        break
      case 'drafts':
        filtered = filtered.filter(page => !page.is_active && !page.is_public)
        break
      case 'all':
      default:
        // Show all pages
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'raised':
        filtered.sort((a, b) => b.total_funding - a.total_funding)
        break
      case 'progress':
        filtered.sort((a, b) => {
          const progressA = a.goal_amount ? (a.total_funding / a.goal_amount) * 100 : 0
          const progressB = b.goal_amount ? (b.total_funding / b.goal_amount) * 100 : 0
          return progressB - progressA
        })
        break
      case 'supporters':
        filtered.sort((a, b) => b.contributor_count - a.contributor_count)
        break
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredPages(filtered)
  }, [pages, searchTerm, filterBy, sortBy])

  useEffect(() => {
    if (user) {
      loadFundraisingData()
    }
  }, [user, loadFundraisingData])

  useEffect(() => {
    filterAndSortPages()
  }, [filterAndSortPages])

  const calculateSuccessRate = (pages: FundingPage[]) => {
    if (pages.length === 0) return 0
    const successfulPages = pages.filter(page => 
      page.goal_amount && page.total_funding >= page.goal_amount
    ).length
    return Math.round((successfulPages / pages.length) * 100)
  }

  const formatCurrency = (amount: number, currency: string = 'SATS') => {
    if (currency === 'SATS' || currency === 'satoshis') {
      return amount > 1000000 
        ? `${(amount / 100000000).toFixed(2)} BTC`
        : `${amount.toLocaleString()} sats`
    }
    return `${amount.toLocaleString()} ${currency}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const getCategoryLabel = (category: string | null | undefined) => {
    if (!category) return 'General'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-yellow-500'
    if (progress >= 50) return 'bg-orange-500'
    return 'bg-blue-500'
  }

  const getStatusIcon = (page: FundingPage) => {
    if (!page.is_active && !page.is_public) return <FileText className="w-4 h-4 text-blue-500" />
    if (!page.is_active) return <Pause className="w-4 h-4 text-gray-500" />
    if (page.goal_amount && page.total_funding >= page.goal_amount) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    }
    return <Play className="w-4 h-4 text-green-500" />
  }

  const copyPageLink = (pageId: string) => {
    const url = `${window.location.origin}/fund-us/${pageId}`
    navigator.clipboard.writeText(url)
    toast.success('Campaign link copied to clipboard!')
  }

  return (
    <DashboardTemplate 
      config={fundraisingConfig}
      stats={stats}
      activities={activities}
    >
      {/* Header */}
      <div className="space-y-4 sm:space-y-6 mb-6">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Fundraising Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your Bitcoin fundraising campaigns and track your progress
          </p>
        </div>

        {/* Quick Stats Cards - Mobile Optimized */}
        {!loading && !draftsLoading && (
          <MetricGrid 
            metrics={stats.map(stat => ({
              icon: stat.icon,
              iconColor: stat.iconColor,
              label: stat.label,
              metric: {
                value: stat.value,
                source: 'database' as const,
                confidence: 'high' as const,
                isDemo: false,
                lastUpdated: new Date()
              },
              subtitle: stat.subtitle
            }))}
            isLoading={loading || draftsLoading}
            className="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
          />
        )}

        {/* Loading state for metrics */}
        {(loading || draftsLoading) && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 animate-pulse">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Draft Campaigns Section */}
      {hasAnyDraft && (
        <Card className="mb-4 sm:mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 w-full">
                {(() => {
                  const primaryDraft = getPrimaryDraft()
                  const isDraftLocal = primaryDraft?.type === 'local'
                  const draftCount = hasDrafts ? drafts.length : 0
                  const totalDrafts = draftCount + (hasLocalDraft ? 1 : 0)
                  
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {isDraftLocal ? 'Unsaved Campaign Progress' : `${totalDrafts} Draft Campaign${totalDrafts > 1 ? 's' : ''}`}
                        </h3>
                        {isDraftLocal && (
                          <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium animate-pulse w-fit">
                            URGENT
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 mb-4 text-sm sm:text-base">
                        {isDraftLocal 
                          ? `You have unsaved changes for "${primaryDraft?.title}". Continue editing to save your progress and publish your campaign.`
                          : 'Complete your draft campaigns to start accepting Bitcoin donations.'
                        }
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/create" className="w-full sm:w-auto">
                          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto min-h-[44px] touch-manipulation">
                            <Edit3 className="w-4 h-4 mr-2" />
                            {isDraftLocal ? 'Continue Editing' : 'Continue Draft'}
                          </Button>
                        </Link>
                        {hasDrafts && (
                          <Button 
                            variant="outline" 
                            onClick={() => setFilterBy('drafts')}
                            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View All Drafts ({drafts.length})
                          </Button>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pages.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200 hover:border-teal-300 transition-colors">
          <CardContent className="p-6 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              {/* Icon with subtle animation */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-105 transition-transform">
                <Handshake className="w-8 h-8 sm:w-10 sm:h-10 text-teal-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                {hasAnyDraft ? 'Ready to Publish Your Campaign?' : 'Start Your Bitcoin Fundraising Journey'}
              </h3>
              
              {/* Description */}
              <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                {hasAnyDraft 
                  ? (() => {
                      const primaryDraft = getPrimaryDraft()
                      const draftCount = hasDrafts ? drafts.length : 0
                      const totalDrafts = draftCount + (hasLocalDraft ? 1 : 0)
                      return `You have ${totalDrafts} draft campaign${totalDrafts > 1 ? 's' : ''} waiting to be published. Complete them to start accepting Bitcoin donations.`
                    })()
                  : 'Create your first campaign and start accepting Bitcoin donations from supporters worldwide. No fees, no intermediaries – just direct peer-to-peer funding.'
                }
              </p>

              {/* Benefits */}
              {!hasAnyDraft && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8 text-sm">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Zap className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="font-medium text-gray-900">Quick Setup</p>
                    <p className="text-gray-500">Launch in minutes</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="font-medium text-gray-900">Zero Fees</p>
                    <p className="text-gray-500">Keep 100% of donations</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Globe className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="font-medium text-gray-900">Global Reach</p>
                    <p className="text-gray-500">Bitcoin supporters worldwide</p>
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/create" className="w-full sm:w-auto">
                  <Button size="lg" className="bg-teal-600 hover:bg-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto min-h-[48px] touch-manipulation">
                    <Plus className="w-5 h-5 mr-2" />
                    {hasAnyDraft ? 'Continue Draft Campaign' : 'Create Your First Campaign'}
                  </Button>
                </Link>
                <Link href="/fund-others" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="hover:bg-gray-50 w-full sm:w-auto min-h-[48px] touch-manipulation">
                    <Globe className="w-5 h-5 mr-2" />
                    Explore Other Campaigns
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Enhanced Header with Controls */}
          <div className="flex flex-col gap-4">
            {/* Title and Campaign Count */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Your Campaigns</h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {filteredPages.length} of {pages.length} campaigns
                </p>
              </div>
              
              {/* New Campaign Button - Always Visible */}
              <Link href="/create" className="w-full sm:w-auto">
                <Button className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto min-h-[44px] touch-manipulation">
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </Link>
            </div>
            
            {/* Controls - Mobile Optimized */}
            <div className="flex flex-col gap-3">
              {/* Search - Full Width on Mobile */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base min-h-[44px] touch-manipulation"
                />
              </div>

              {/* Filter and Sort - Side by Side on Mobile */}
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base min-h-[44px] touch-manipulation"
                >
                  <option value="all">All Campaigns</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="completed">Completed</option>
                  <option value="drafts">Drafts Only</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base min-h-[44px] touch-manipulation"
                >
                  <option value="recent">Most Recent</option>
                  <option value="raised">Highest Raised</option>
                  <option value="progress">Best Progress</option>
                  <option value="supporters">Most Supporters</option>
                </select>
              </div>
            </div>
          </div>

          {/* Campaign Performance Summary */}
          {pages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border">
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{pages.filter(p => p.is_active).length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Active Campaigns</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {formatCurrency(pages.reduce((sum, p) => sum + p.total_funding, 0))}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Raised</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  {pages.reduce((sum, p) => sum + p.contributor_count, 0)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Supporters</p>
              </div>
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{calculateSuccessRate(pages)}%</p>
                <p className="text-xs sm:text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          )}

          {/* Campaigns Grid */}
          {filteredPages.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns match your filters</h3>
                <p className="text-gray-600 mb-4 text-sm sm:text-base">Try adjusting your search or filter criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterBy('all')
                    setSortBy('recent')
                  }}
                  className="min-h-[44px] touch-manipulation"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredPages.map((page) => {
                const progress = page.goal_amount ? (page.total_funding / page.goal_amount) * 100 : 0
                const isCompleted = page.goal_amount && page.total_funding >= page.goal_amount
                const isDraft = !page.is_active && !page.is_public
                
                return (
                  <Card key={page.id} className={`hover:shadow-lg transition-all duration-200 group ${isDraft ? 'border-blue-200 bg-blue-50/30' : ''}`}>
                    <CardContent className="p-4 sm:p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(page)}
                            <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-teal-600 transition-colors text-sm sm:text-base">
                              {page.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                              {getCategoryLabel(page.category)}
                            </span>
                            {isDraft && (
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                <FileText className="w-3 h-3 inline mr-1" />
                                Draft
                              </span>
                            )}
                            {isCompleted && !isDraft && (
                              <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                Goal Reached!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {page.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {page.description}
                        </p>
                      )}

                      {/* Draft Notice */}
                      {isDraft && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800 mb-2">
                            This campaign is saved as a draft. Complete it to start accepting donations.
                          </p>
                          <Link href="/create">
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white min-h-[40px] touch-manipulation">
                              <Edit3 className="w-3 h-3 mr-1" />
                              Continue Editing
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* Key Metrics - only show for published campaigns */}
                      {!isDraft && (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-base sm:text-lg font-bold text-green-700">
                              {formatCurrency(page.total_funding, page.currency)}
                            </p>
                            <p className="text-xs text-green-600">Raised</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-base sm:text-lg font-bold text-blue-700">{page.contributor_count}</p>
                            <p className="text-xs text-blue-600">Supporters</p>
                          </div>
                        </div>
                      )}

                      {/* Progress Bar - only for published campaigns with goals */}
                      {!isDraft && page.goal_amount && page.goal_amount > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>Progress to Goal</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Goal: {formatCurrency(page.goal_amount, page.currency)}
                          </p>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {isDraft ? `Created ${formatDate(page.created_at)}` : formatDate(page.created_at)}
                        </div>
                        {page.website_url && (
                          <div className="flex items-center">
                            <Globe className="w-3 h-3 mr-1" />
                            <span>Website</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className={`grid gap-2 ${isDraft ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {isDraft ? (
                          <>
                            <Link href="/create">
                              <Button variant="outline" size="sm" className="w-full min-h-[40px] touch-manipulation">
                                <Edit3 className="w-3 h-3 mr-1" />
                                Continue
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                toast.info('Delete draft functionality coming soon')
                              }}
                              className="w-full text-red-600 hover:text-red-700 hover:border-red-300 min-h-[40px] touch-manipulation"
                            >
                              Delete
                            </Button>
                          </>
                        ) : (
                          <>
                            <Link href={`/fund-us/${page.id}/edit`}>
                              <Button variant="outline" size="sm" className="w-full min-h-[40px] touch-manipulation">
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <Link href={`/fund-us/${page.id}`}>
                              <Button variant="outline" size="sm" className="w-full min-h-[40px] touch-manipulation">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyPageLink(page.id)}
                              className="w-full min-h-[40px] touch-manipulation"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Quick Stats Footer - only for published campaigns */}
                      {!isDraft && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Avg donation: {page.contributor_count > 0 ? formatCurrency(page.total_funding / page.contributor_count) : '0 sats'}</span>
                            <Link href={`/fund-us/${page.id}`} className="text-teal-600 hover:text-teal-700 flex items-center min-h-[44px] touch-manipulation">
                              View Details <ExternalLink className="w-3 h-3 ml-1" />
                            </Link>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </DashboardTemplate>
  )
} 