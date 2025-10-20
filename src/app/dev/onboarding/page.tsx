"use client"

import IntelligentOnboarding from '@/components/onboarding/IntelligentOnboarding'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DevOnboardingPage() {
  const router = useRouter()
  // Hard guard to avoid exposure in production builds
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_E2E !== '1') {
    useEffect(() => {
      router.replace('/')
    }, [router])
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-tiffany-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dev: Smart Setup Guide</h1>
          <p className="text-gray-600">This page renders onboarding without auth for local testing.</p>
        </div>
        <IntelligentOnboarding />
      </div>
    </div>
  )
}
