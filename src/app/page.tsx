'use client'

import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Hero from '@/components/sections/Hero'
import Loading from '@/components/Loading'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, isLoading, hydrated } = useAuth()
  const router = useRouter()

  // Wait for hydration and auth check to complete
  if (!hydrated || isLoading) {
    return <Loading fullScreen message={isLoading ? "Checking authentication..." : "Loading..."} />
  }

  // Redirect logged-in users to dashboard
  if (user) {
    // Check if user is new (has no projects) - for now, always redirect to dashboard
    // TODO: Add logic to detect if user has projects and redirect to onboarding if not
    router.push('/dashboard')
    return <Loading fullScreen message="Redirecting to dashboard..." />
  }

  // Show landing page for non-logged-in users
  return (
    <>
      {/* Experimental Version Notice */}
      <div className="bg-gradient-to-r from-orange-100 to-tiffany-100 border-b border-orange-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-orange-600 font-medium">🚧 Experimental Version</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-600">This is a development preview - features may not work as expected</span>
            <span className="text-gray-600">•</span>
            <a
              href="https://github.com/g-but/orangecat"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-700 font-medium underline"
            >
              View Source
            </a>
          </div>
        </div>
      </div>

      <Hero />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Introduction Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            The Bitcoin Yellow Pages
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Just like the yellow pages had phone numbers, we have Bitcoin wallets. 
            Create wallets for yourself, your projects, organizations, or anyone you care about. 
            Build circles of trust and support with the power of Bitcoin - whether you're organizing a cat shelter, art exhibition, community party, or any cause that matters.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-16">
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-tiffany-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Quick Setup</h3>
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Create your customized donation page in minutes with no technical knowledge required.</p>
          </Card>
          
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-tiffany-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Instant Payouts</h3>
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Receive donations directly to your Bitcoin wallet with no intermediaries or delays.</p>
          </Card>
          
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-tiffany-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-tiffany-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Real-time Stats</h3>
            </div>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Track donations, engagement, and impact with detailed analytics and insights.</p>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-tiffany-50 to-orange-50 rounded-2xl p-8 sm:p-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Ready to Fund Your Dreams with Bitcoin? 🚀
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Create a Bitcoin fundraising project in minutes. Whether you're organizing a cat shelter, art exhibition, community event, or any cause that matters - get funded directly in Bitcoin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                href="/projects/create"
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                🚀 Create Project
              </Button>
              <Button
                href="/discover"
                variant="outline"
                size="lg"
                className="px-8 py-4"
              >
                Browse Projects
              </Button>
            </div>

            <div className="mt-6 text-sm text-gray-600 space-y-2">
              <p className="font-medium">✨ Simple 3-step process</p>
              <p>Enter your project details, add your Bitcoin address (optional), and launch instantly. Sign in when ready to publish.</p>
              <p className="text-xs text-gray-500 mt-2">New here? <a href="/auth?mode=register" className="text-orange-600 hover:underline font-medium">Create an account</a> to get started.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 
