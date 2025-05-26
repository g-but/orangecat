'use client'

import { useEffect, useState } from 'react'
import { 
  AlertCircle, 
  ArrowRight,
  Plus,
  Star,
  Eye,
  Handshake
} from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { WalletOverview } from '@/components/dashboard/WalletOverview'
import { FeaturePreview } from '@/components/sections/FeaturePreview'
import { comingSoonFeatures, availableFeatures } from '@/data/features'



export default function DashboardPage() {
  const { user, profile, isLoading, error: authError, hydrated, session } = useAuth()
  const router = useRouter()
  const [localLoading, setLocalLoading] = useState(true)

  useEffect(() => {
    // Only run after hydration
    if (!hydrated) return

    // If we're not loading and have no user, redirect to auth
    if (!isLoading && !user && !session) {
      console.log('DashboardPage: No user detected, redirecting to /auth')
      router.push('/auth')
      return
    }

    // No longer loading locally once we have hydration and auth state is determined
    if (hydrated && !isLoading) {
      setLocalLoading(false)
    }
  }, [user, session, isLoading, hydrated, router])

  // Handle loading states
  if (!hydrated || localLoading) {
    return <Loading fullScreen />
  }

  // Handle unauthenticated state
  if (!user && !session) {
    // Don't render anything, the useEffect will redirect
    return <Loading fullScreen />
  }

  // Show error state if there's an authentication error but we have a user
  if (authError && user) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>{authError}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-4">There was an issue loading your dashboard. Please try refreshing. If the problem persists, you might need to sign out and sign back in.</p>
            <div className="flex items-center gap-3">
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

  // Profile completion CTA
  const showProfileCompletionCTA = profile && (!profile.username || !profile.display_name || !profile.bio || !profile.bitcoin_address);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Profile Completion CTA */}
      {showProfileCompletionCTA && (
        <div className="p-4 bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-1">Complete Your Profile</h3>
              <p className="text-orange-800 text-sm mb-3">Add your Bitcoin address to see your balance and transaction history, plus unlock all funding features.</p>
              <Link href="/profile">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Complete Profile <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Welcome back, {profile?.display_name || profile?.username || 'there'}! 👋
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Your Bitcoin-powered dashboard
        </p>
      </div>

      {/* Primary Dashboard - Balance & Transactions (Functional) */}
      <WalletOverview 
        walletAddress={profile?.bitcoin_address} 
        className="mb-8"
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-orange-200 bg-orange-50">
            <CardContent className="p-6 text-center">
              <Plus className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-orange-900 mb-2">Create Funding Page</h3>
              <p className="text-orange-700 text-sm">Start accepting Bitcoin donations</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/profile/me">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <Eye className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-900 mb-2">View Public Profile</h3>
              <p className="text-blue-700 text-sm">See how others see your profile</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-purple-200 bg-purple-50">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-900 mb-2">Edit Profile</h3>
              <p className="text-purple-700 text-sm">Update your information</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* User's Fundraising Pages */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Fundraising Pages</h2>
          <p className="text-gray-600">
            Manage your active fundraising campaigns
          </p>
        </div>
        
        {/* This would be replaced with actual user fundraising pages */}
        <Card className="border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50">
          <CardContent className="p-8 text-center">
            <Handshake className="w-12 h-12 text-teal-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Fundraising Pages Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first fundraising page to start accepting Bitcoin donations for your cause.
            </p>
            <Link href="/create">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Page
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 