'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import {
  Activity,
  Plus,
  Loader2,
  HelpCircle,
  UserPlus,
  Filter,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Eye,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Bitcoin
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { getFundingPages } from '@/lib/supabase'

export default function DashboardContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [pages, setPages] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [loading, setLoading] = useState(true)

  const stats = {
    activePages: 0,
    totalFunding: 0,
    uniqueFunders: 0,
    averageDonation: 0,
    fundingTrend: 0,
    funderTrend: 0,
    totalTransactions: 0
  }

  const handleCopyLink = (pageId: string) => {
    const url = `${window.location.origin}/fund-us/${pageId}`
    navigator.clipboard.writeText(url)
    // You might want to add a toast notification here
  }

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true)
        const data = await getFundingPages(user!.id)
        setPages(data)
      } catch (err) {
        console.error('Error loading pages:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadPages()
    }
  }, [user])

  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user.email}!
              </h1>
              <p className="mt-1 text-gray-600">Here&apos;s an overview of your funding activity</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/tutorial')} className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Quick Start Guide
              </Button>
              <Button onClick={() => router.push('/create')} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Page
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Pages</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.activePages}</h3>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-purple-600">
                  {stats.activePages} total pages
                </span>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Funding</p>
                  <h3 className="text-2xl font-bold text-gray-900">${stats.totalFunding.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Bitcoin className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`flex items-center ${stats.fundingTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.fundingTrend >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                  {Math.abs(stats.fundingTrend)}%
                </span>
                <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Donation</p>
                  <h3 className="text-2xl font-bold text-gray-900">${stats.averageDonation.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500">
                  {stats.totalTransactions} total transactions
                </span>
              </div>
            </div>
          </Card>

          <Card className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Funders</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.uniqueFunders}</h3>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <UserPlus className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`flex items-center ${stats.funderTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.funderTrend >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                  {Math.abs(stats.funderTrend)}%
                </span>
                <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Empty State or Pages List */}
        {pages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6">
                <img src="/empty-state-illustration.svg" alt="No pages yet" className="w-full h-full" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Funding Pages Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first funding page to start accepting Bitcoin donations. It only takes a few minutes!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push('/create')} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Page
                </Button>
                <Button variant="outline" onClick={() => router.push('/examples')}>
                  View Examples
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your Funding Pages</h2>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" onClick={() => setShowSort(!showSort)}>
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>

            {/* Pages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => (
                <Card key={page.id} className="bg-white border border-gray-200 hover:border-orange-200 transition-colors">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{page.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{page.description}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => router.push(`/fund-us/${page.id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/fund-us/${page.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(page.id)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium text-gray-900">
                            ${page.current_amount.toLocaleString()} / ${page.goal_amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all" 
                            style={{ width: `${(page.current_amount / page.goal_amount) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Contributors</p>
                          <p className="font-medium text-gray-900">{page.contributor_count}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status</p>
                          <p className="font-medium text-gray-900 capitalize">{page.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 