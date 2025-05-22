'use client'

import { useEffect, useState } from 'react'
import { Bitcoin, Users, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/Loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

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
      <div className="max-w-4xl mx-auto">
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
    <div className="max-w-4xl mx-auto">
      {showProfileCompletionCTA && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-md">
          <div className="flex">
            <div className="py-1"><AlertCircle className="h-5 w-5 text-yellow-500 mr-3" /></div>
            <div>
              <p className="font-bold">Complete Your Profile</p>
              <p className="text-sm">Please update your profile details to enable all features and ensure your public funding page is complete.</p>
              <Link href="/profile" className="mt-2 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900 underline">
                Go to Edit Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {profile?.display_name || profile?.username || user?.email || 'there'}</h1>
        <Link href="/create">
          <Button>Create New Funding Page</Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Funding Pages</CardTitle>
            <CardDescription>Create and manage your funding pages to start receiving contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Bitcoin className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-medium">Create Your First Funding Page</h3>
                  <p className="text-sm text-muted-foreground">Set up a funding page to start receiving Bitcoin contributions</p>
                </div>
                <Link href="/create" className="ml-auto">
                  <Button variant="outline">Get Started</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>Exciting features we're working on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-gray-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                <h3 className="font-medium mb-1">Analytics Dashboard</h3>
                <p className="text-sm text-muted-foreground">Track your funding page performance and contributor insights</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-500 mb-2" />
                <h3 className="font-medium mb-1">Community Features</h3>
                <p className="text-sm text-muted-foreground">Engage with your contributors and build your community</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 