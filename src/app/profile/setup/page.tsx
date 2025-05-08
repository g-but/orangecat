'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import supabase from '@/services/supabase/client'
import { User, Bitcoin, Zap, FileText } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { toast } from 'sonner'

interface ProfileData {
  username: string
  display_name: string
  bio: string
  bitcoin_address: string
  lightning_address: string
}

const steps = [
  {
    id: 'basic-info',
    name: 'Basic Info',
    icon: User,
    fields: ['username', 'display_name']
  },
  {
    id: 'about-you',
    name: 'About You',
    icon: FileText,
    fields: ['bio']
  },
  {
    id: 'payment-info',
    name: 'Payment Info',
    icon: Bitcoin,
    fields: ['bitcoin_address', 'lightning_address']
  }
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, setProfile } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    display_name: '',
    bio: '',
    bitcoin_address: '',
    lightning_address: ''
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-tiffany-600 border-t-transparent" />
      </div>
    )
  }

  // Don't render anything if not authenticated
  if (!user) {
    return null
  }

  const handleInputChange = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleNext = () => {
    // All fields are optional, so no validation is needed to move to the next step.
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updatedProfileData = {
        username: profileData.username || null,
        display_name: profileData.display_name || null,
        bio: profileData.bio || null,
        bitcoin_address: profileData.bitcoin_address || null,
        lightning_address: profileData.lightning_address || null,
        updated_at: new Date().toISOString()
      }

      const { data: returnedProfile, error: supabaseError } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', user!.id)
        .select()
        .single()

      if (supabaseError) throw supabaseError

      if (returnedProfile) {
        useAuthStore.getState().setProfile(returnedProfile)
      }
      
      toast.success('Profile updated successfully')
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error updating profile:', err)
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        {/* Enhanced Progress Steps */} boreal
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                {stepIdx < currentStep ? (
                  // Completed Step
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-tiffany-600" />
                    </div>
                    <div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-tiffany-600 hover:bg-tiffany-700 cursor-pointer"
                      onClick={() => setCurrentStep(stepIdx)} // Allow clicking to go back to completed steps
                    >
                      <step.icon className="h-5 w-5 text-white" aria-hidden="true" />
                      <span className="sr-only">{step.name} - Completed</span>
                    </div>
                  </>
                ) : stepIdx === currentStep ? (
                  // Current Step
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className={`h-0.5 w-full ${stepIdx === 0 ? 'bg-transparent' : 'bg-gray-200'}`} />
                    </div>
                    <div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-tiffany-600 bg-white"
                      aria-current="step"
                    >
                      <span className="absolute -bottom-6 whitespace-nowrap text-xs font-semibold text-tiffany-600">Step {stepIdx + 1}</span>
                      <step.icon className="h-5 w-5 text-tiffany-600" aria-hidden="true" />
                      <span className="sr-only">{step.name} - Current</span>
                    </div>
                  </>
                ) : (
                  // Upcoming Step
                  <>
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="h-0.5 w-full bg-gray-200" />
                    </div>
                    <div className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400">
                      <step.icon className="h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                      <span className="sr-only">{step.name} - Upcoming</span>
                    </div>
                  </>
                )}
                {stepIdx !== steps.length - 1 && (
                    <div className={`absolute top-4 ${stepIdx < currentStep ? 'bg-tiffany-600' : 'bg-gray-200'} h-0.5 w-full -right-1/2 transform translate-x-1/2 sm:block hidden`} />
                )}
                <p className={`mt-3 text-center text-xs font-medium ${stepIdx <= currentStep ? 'text-tiffany-600' : 'text-gray-500'}`}>
                  {step.name}
                </p>
              </li>
            ))}
          </ol>
        </nav>

        {/* Form Container */}
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-1 text-center">
            {steps[currentStep].name}
          </h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Step {currentStep + 1} of {steps.length}: Fill out your {steps[currentStep].name.toLowerCase()}.
          </p>

          <form onSubmit={currentStep === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
            {currentStepData.id === 'basic-info' && (
              <>
                <Input
                  label="Username"
                  value={profileData.username}
                  onChange={handleInputChange('username')}
                  placeholder="Choose a unique username (optional)"
                />
                <Input
                  label="Display Name"
                  value={profileData.display_name}
                  onChange={handleInputChange('display_name')}
                  placeholder="Your public display name (optional)"
                />
              </>
            )}

            {currentStepData.id === 'about-you' && (
              <Textarea
                label="Bio"
                value={profileData.bio}
                onChange={handleInputChange('bio')}
                placeholder="Tell us about yourself (optional)"
                rows={4}
              />
            )}

            {currentStepData.id === 'payment-info' && (
              <>
                <Input
                  label="Bitcoin Address"
                  value={profileData.bitcoin_address}
                  onChange={handleInputChange('bitcoin_address')}
                  placeholder="Your Bitcoin address (optional)"
                  icon={Bitcoin}
                />
                <Input
                  label="Lightning Address"
                  value={profileData.lightning_address}
                  onChange={handleInputChange('lightning_address')}
                  placeholder="Your Lightning address (optional)"
                  icon={Zap}
                />
              </>
            )}

            <div className="flex justify-between pt-4">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}
              {currentStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  className="ml-auto"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Complete Setup'}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="ml-auto"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 