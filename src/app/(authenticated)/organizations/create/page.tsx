'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import CreateOrganizationModal from '@/components/organizations/CreateOrganizationModal'
import Loading from '@/components/Loading'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Building, ArrowLeft, Sparkles } from 'lucide-react'

export default function CreateOrganizationPage() {
  const { user, profile, isLoading, hydrated } = useAuth()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  // Check authentication
  useEffect(() => {
    if (hydrated && !isLoading && !user) {
      router.push('/auth')
      return
    }
  }, [user, hydrated, isLoading, router])

  // Show loading state
  if (!hydrated || isLoading) {
    return <Loading fullScreen message="Setting up your account..." />
  }

  if (!user) {
    return <Loading fullScreen message="Redirecting to login..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-tiffany-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/onboarding')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Setup
          </Button>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Organization
            </h1>
            <p className="text-lg text-gray-600">
              Set up a collective organization for shared management and professional fundraising.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border-2 border-blue-200 bg-blue-50">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Collective Management
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Multiple people can manage funds</li>
              <li>• Professional organization profile</li>
              <li>• Collective decision making</li>
              <li>• Shared treasury management</li>
            </ul>
          </Card>

          <Card className="p-6 border-2 border-green-200 bg-green-50">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Professional Setup
            </h3>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Organization-wide transparency</li>
              <li>• Member role management</li>
              <li>• Professional branding</li>
              <li>• Scalable governance structure</li>
            </ul>
          </Card>
        </div>

        {/* CTA */}
        <Card className="p-8 text-center border-2 border-dashed border-orange-300 bg-orange-50">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6">
              Create your organization and start building a collective Bitcoin fundraising presence.
            </p>

            <Button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Create Organization
            </Button>
          </div>
        </Card>

        {/* Create Organization Modal */}
        <CreateOrganizationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={(organization) => {
            console.log('Organization created:', organization)
            // Redirect to organization dashboard or show success message
            router.push(`/organizations/${organization.slug}`)
          }}
        />
      </div>
    </div>
  )
}
