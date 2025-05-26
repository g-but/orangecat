'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import DashboardTemplate from '@/components/dashboard/DashboardTemplate'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Handshake, Plus, Edit2, Eye, Share2, BarChart3, Bitcoin, Users, Calendar, Globe } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { toast } from 'sonner'
import Link from 'next/link'
import { FundingPage } from '@/types/funding'
import { 
  fundraisingConfig, 
  getFundraisingStats, 
  fundraisingActivity 
} from '@/data/dashboardConfigs'

export default function FundraisingDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const [pages, setPages] = useState<FundingPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (user) {
      loadFundraisingPages()
    }
  }, [user])

  const loadFundraisingPages = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('funding_pages')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setPages(data || [])
    } catch (err) {
      console.error('Error loading fundraising pages:', err)
      setError('Failed to load your fundraising pages')
      toast.error('Failed to load fundraising pages')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'SATS') => {
    if (currency === 'BTC') {
      return `${(amount / 100000000).toFixed(8)} BTC`
    }
    return `${amount.toLocaleString()} sats`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryLabel = (category: string | null | undefined) => {
    if (!category) return 'Uncategorized'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  if (loading) {
    return (
      <DashboardTemplate
        config={fundraisingConfig}
        stats={getFundraisingStats()}
        activities={fundraisingActivity}
      >
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-tiffany-600 border-t-transparent" />
        </div>
      </DashboardTemplate>
    )
  }

  return (
    <DashboardTemplate
      config={fundraisingConfig}
      stats={getFundraisingStats()}
      activities={fundraisingActivity}
    >
      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {pages.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Handshake className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Fundraising Pages Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven&apos;t created any fundraising pages yet. Start raising Bitcoin for your projects, causes, or ideas.
            </p>
            <Link href="/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header with Create Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Fundraising Pages</h2>
              <p className="text-gray-600">Manage and track your fundraising campaigns</p>
            </div>
            <Link href="/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Page
              </Button>
            </Link>
          </div>

          {/* Fundraising Pages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((page) => (
              <Card key={page.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {page.title}
                      </h3>
                                             <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                         {getCategoryLabel(page.category || null)}
                       </span>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <span className={`w-2 h-2 rounded-full ${
                        page.is_active ? 'bg-green-400' : 'bg-gray-400'
                      }`} />
                      <span className="text-xs text-gray-500">
                        {page.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {page.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {page.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Total Raised:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(page.total_funding, page.currency)}
                      </span>
                    </div>
                    {page.goal_amount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Goal:</span>
                        <span className="font-medium">
                          {formatCurrency(page.goal_amount, page.currency)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Contributors:</span>
                      <span className="font-medium">{page.contributor_count}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {page.goal_amount && page.goal_amount > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((page.total_funding / page.goal_amount) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((page.total_funding / page.goal_amount) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(page.created_at)}
                    </div>
                    {page.website_url && (
                      <div className="flex items-center">
                        <Globe className="w-3 h-3 mr-1" />
                        <span>Website</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link href={`/fund-us/${page.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/fund-us/${page.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/fund-us/${page.id}`)
                        toast.success('Link copied to clipboard!')
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardTemplate>
  )
} 