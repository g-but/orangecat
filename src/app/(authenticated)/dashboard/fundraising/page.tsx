'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/Loading'
import CampaignDashboard from '@/components/dashboard/CampaignDashboard'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function FundraisingDashboardPage() {
  const { user, isLoading, hydrated, session } = useAuth()
  const router = useRouter()

  // Handle loading states
  if (!hydrated || isLoading) {
    return <Loading fullScreen />
  }

  // Handle unauthenticated state
  if (!user || !session) {
    router.push('/auth?from=fundraising')
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <div className="h-4 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">
                My Campaigns
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <CampaignDashboard />
      </div>
    </div>
  )
} 