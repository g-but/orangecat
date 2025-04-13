import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { FundingPageList } from '@/components/funding/FundingPageList'
import { User } from '@supabase/supabase-js'
import Hero from '@/components/sections/Hero'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return (
      <main>
        <Hero />
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-tiffany-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Quick Setup</h3>
              </div>
              <p className="text-gray-600">Create your customized donation page in minutes with no technical knowledge required.</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-tiffany-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Instant Payouts</h3>
              </div>
              <p className="text-gray-600">Receive donations directly to your Bitcoin wallet with no intermediaries or delays.</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-tiffany-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">Real-time Stats</h3>
              </div>
              <p className="text-gray-600">Track donations, engagement, and impact with detailed analytics and insights.</p>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  const user = session.user as User

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user.user_metadata?.full_name || 'User'}</h1>
        <Button variant="primary" href="/create">
          Create Funding Page
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Total Funding</h3>
          <p className="text-3xl font-bold">0 sats</p>
          <p className="text-sm text-muted-foreground mt-2">All time</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Active Pages</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground mt-2">Currently running</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Contributors</h3>
          <p className="text-3xl font-bold">0</p>
          <p className="text-sm text-muted-foreground mt-2">Unique supporters</p>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Funding Pages</h2>
        </div>
        <FundingPageList />
      </div>
    </div>
  )
} 