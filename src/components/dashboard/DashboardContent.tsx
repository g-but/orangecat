'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  Bitcoin, 
  TrendingUp, 
  Activity,
  Plus,
  Loader2
} from 'lucide-react'
import { useEffect } from 'react'

export default function DashboardContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile, loading: isProfileLoading } = useProfile()

  useEffect(() => {
    console.log('Dashboard Data:', {
      user,
      profile,
      isProfileLoading
    })
  }, [user, profile, isProfileLoading])

  if (!user || isProfileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-tiffany-600" />
      </div>
    )
  }

  // Calculate stats from real data
  const stats = {
    totalFunding: 0,
    uniqueFunders: 0,
    activePages: 0,
    averageDonation: 0,
    fundingTrend: '+0%',
    funderTrend: '+0%'
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {profile?.display_name || user.email}!
              </h1>
              <p className="mt-1 text-gray-600">Here's an overview of your funding activity</p>
            </div>
            <Button onClick={() => router.push('/create')} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Page
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                <span className="text-green-600 flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  {stats.fundingTrend}
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
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-orange-600">
                  0 total transactions
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
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-blue-600 flex items-center">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  {stats.funderTrend}
                </span>
                <span className="text-gray-500 ml-2">vs last month</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
} 