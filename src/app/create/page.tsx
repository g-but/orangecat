'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import CreateCampaignForm from '@/components/create/CreateCampaignForm'
import CreateProgressSidebar from '@/components/create/CreateProgressSidebar'
import { Step1, Step2, Step3, Step4 } from '@/components/create/CreateFormSteps'
import InlineAuthStep from '@/components/create/InlineAuthStep'
import {
  Sparkles,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuth()

  // Ensure non-authenticated users can access the create page
  // No redirects - let users explore the full creation process
  const [currentStep, setCurrentStep] = useState(1)
  const [showPreview, setShowPreview] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [needsAuth, setNeedsAuth] = useState(false)

  // Check if user is authenticated on mount
  useEffect(() => {
    setIsGuestMode(!user)
  }, [user])

  // Get campaign form functionality
  const campaignForm = CreateCampaignForm({
    currentStep,
    setCurrentStep,
    onPreviewToggle: () => setShowPreview(!showPreview),
    showPreview
  })

  // Handle publishing - check auth before final submit
  const handlePublishAttempt = async () => {
    if (!user && !needsAuth) {
      // User reached the end without auth - show inline auth step
      setNeedsAuth(true)
      setCurrentStep(5) // Step 5 is the auth step
      toast.info('Just one more step!', {
        description: 'Sign in or create an account to publish your campaign',
      })
      return false
    }
    return true
  }

  // Override the handlePublish to check auth
  const originalHandlePublish = campaignForm.handlePublish
  campaignForm.handlePublish = async (e: any) => {
    const canProceed = await handlePublishAttempt()
    if (canProceed) {
      return originalHandlePublish(e)
    }
  }

  // Handle successful authentication
  const handleAuthSuccess = async (userId: string) => {
    // User is now authenticated, publish the campaign
    try {
      await campaignForm.handlePublish({} as any)
      toast.success('Campaign published successfully! 🎉')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Failed to publish campaign', {
        description: 'Please try again',
      })
    }
  }

  const renderCurrentStep = () => {
    const stepProps = {
      ...campaignForm,
      currentStep,
      setCurrentStep
    }

    // Show auth step if needed
    if (currentStep === 5 && needsAuth) {
      return (
        <InlineAuthStep
          campaignData={campaignForm.formData}
          onSuccess={handleAuthSuccess}
          onBack={() => {
            setCurrentStep(4)
            setNeedsAuth(false)
          }}
        />
      )
    }

    switch (currentStep) {
      case 1:
        return <Step1 {...stepProps} isAuthenticated={!!user} />
      case 2:
        return <Step2 {...stepProps} />
      case 3:
        return <Step3 {...stepProps} />
      case 4:
        return <Step4 {...stepProps} />
      default:
        return <Step1 {...stepProps} isAuthenticated={!!user} />
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
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Create Campaign</h1>
                  {!user && (
                    <p className="text-xs text-gray-500">Guest mode - sign in when ready to publish</p>
                  )}
                </div>
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