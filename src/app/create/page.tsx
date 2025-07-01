'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import CreateCampaignForm from '@/components/create/CreateCampaignForm'
import CreateProgressSidebar from '@/components/create/CreateProgressSidebar'
import { Step1, Step2, Step3, Step4 } from '@/components/create/CreateFormSteps'
import { 
  Sparkles,
  Eye
} from 'lucide-react'

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)

  // Handle redirect on client side only
  useEffect(() => {
    if (!user) {
      router.push('/auth?mode=login')
    }
  }, [user, router])

  // Get campaign form functionality
  const campaignForm = CreateCampaignForm({
    currentStep,
    setCurrentStep,
    onPreviewToggle: () => setShowPreview(!showPreview),
    showPreview
  })

  if (!user) {
    return null
  }

  const renderCurrentStep = () => {
    const stepProps = {
      ...campaignForm,
      currentStep,
      setCurrentStep
    }

    switch (currentStep) {
      case 1:
        return <Step1 {...stepProps} />
      case 2:
        return <Step2 {...stepProps} />
      case 3:
        return <Step3 {...stepProps} />
      case 4:
        return <Step4 {...stepProps} />
      default:
        return <Step1 {...stepProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/20 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Create Campaign</h1>
              </div>
              <div className="hidden sm:flex items-center text-sm text-gray-500">
                <span>Step {currentStep} of 4</span>
                <span className="mx-2">•</span>
                <span>{campaignForm.getCompletionPercentage()}% complete</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-gray-50 rounded-md transition-all duration-200"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Progress Sidebar */}
        <CreateProgressSidebar 
          currentStep={currentStep}
          completionPercentage={campaignForm.getCompletionPercentage()}
          formData={campaignForm.formData}
        />
        
        {/* Form Content */}
        <div className="flex-1 lg:pl-80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {renderCurrentStep()}
          </div>
        </div>
      </div>
    </div>
  )
} 