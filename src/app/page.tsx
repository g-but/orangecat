'use client'

import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Hero from '@/components/sections/Hero'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { user, isLoading, hydrated } = useAuth()
  const router = useRouter()

  // Wait for hydration before rendering
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
      </div>
    )
  }

  // Show loading state only briefly while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-tiffany-500" />
      </div>
    )
  }

  // Render the home page content regardless of auth state
  return (
    <>
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
    </>
  )
} 