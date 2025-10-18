'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/Loading'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Building, ArrowLeft } from 'lucide-react'
import { OrganizationWizard } from '@/components/wizard/OrganizationWizard'

export default function OrganizationWizardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <Loading fullScreen />
  }

  if (!user) {
    router.push('/auth?mode=login&redirect=/wizard/organization')
    return <Loading fullScreen message="Redirecting to login..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/')} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Organization</h1>
                <p className="text-sm text-gray-600">Set up a collective for shared management</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrganizationWizard />
      </div>
    </div>
  )
}
