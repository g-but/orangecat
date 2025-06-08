'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function CreatePage() {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    router.push('/auth?mode=login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Campaign</h1>
        <p className="text-gray-600">Campaign creation page is temporarily simplified for build testing.</p>
      </div>
    </div>
  )
} 