'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Loading from '@/components/Loading'
import Button from '@/components/ui/Button'
import { Target, Heart, Shield, Users, ArrowLeft } from 'lucide-react'
import { ProjectWizard } from '@/components/wizard/ProjectWizard'

export default function CreateCampaignPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/40">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mr-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Project</h1>
                <p className="text-sm text-gray-600">Launch a Bitcoin-powered project or initiative</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <ProjectWizard />
        </div>
        <aside className="md:col-span-1">
          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/60">
            <h2 className="font-semibold text-gray-900 mb-2">What’s a Project?</h2>
            <p className="text-sm text-gray-700 mb-3">
              A project is any initiative that needs funding — from personal goals to community causes. Accept Bitcoin donations directly to your wallet.
            </p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2"><Heart className="w-4 h-4 text-orange-600 mt-0.5" /> Accept Bitcoin donations instantly.</li>
              <li className="flex items-start gap-2"><Users className="w-4 h-4 text-orange-600 mt-0.5" /> Rally supporters and share updates.</li>
              <li className="flex items-start gap-2"><Shield className="w-4 h-4 text-orange-600 mt-0.5" /> Transparent and self-custodial by design.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">Looking to organize ongoing work with tasks and repos? This project interface supports that too!</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

