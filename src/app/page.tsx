'use client'

import Hero from '@/components/sections/Hero'
import Features from '@/components/sections/Features'
import CTA from '@/components/sections/CTA'
import Button from '@/components/ui/Button'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { useAuth } from '@/hooks/useAuth'
import { dashboardCards } from '@/config/dashboard'

export default function Home() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        role="status"
        aria-label="Loading"
      >
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-tiffany-500"
          aria-hidden="true"
        />
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        role="alert"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <Button 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.email}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Manage your funding pages and donations
            </p>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            role="list"
            aria-label="Dashboard actions"
          >
            {dashboardCards.map((card) => (
              <DashboardCard key={card.title} card={card} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main>
      <Hero />
      <Features />
      <CTA />
    </main>
  )
} 