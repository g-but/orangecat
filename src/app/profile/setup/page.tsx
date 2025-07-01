'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import supabase from '@/services/supabase/client'
import { User, Bitcoin, Zap, FileText, Globe, Lightbulb, CheckCircle, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { toast } from 'sonner'

interface ProfileData {
  username: string
  display_name: string
  bio: string
  website: string
  bitcoin_address: string
  lightning_address: string
}

const steps = [
  {
    id: 'basic-info',
    name: 'Basic Info',
    icon: User,
    fields: ['username', 'display_name'],
    title: 'Let\'s start with the basics',
    subtitle: 'Tell us who you are'
  },
  {
    id: 'about-you',
    name: 'About You',
    icon: FileText,
    fields: ['bio', 'website'],
    title: 'Share your story',
    subtitle: 'Help others understand what you\'re about'
  },
  {
    id: 'payment-info',
    name: 'Payment Info',
    icon: Bitcoin,
    fields: ['bitcoin_address', 'lightning_address'],
    title: 'Bitcoin setup',
    subtitle: 'Connect your Bitcoin addresses for payments'
  }
]

const stepAdvice = {
  'basic-info': {
    tips: [
      'Choose a username that represents you well - it can\'t be changed later',
      'Your display name is what others will see on your campaigns',
      'Keep it professional but authentic',
      'Both fields are optional, but recommended for better engagement'
    ],
    examples: [
      { label: 'Username', value: 'satoshi_builder' },
      { label: 'Display Name', value: 'Satoshi Builder' }
    ]
  },
  'about-you': {
    tips: [
      'A compelling bio increases donations by up to 40%',
      'Share your passion, mission, or what drives you',
      'Include your website or social media for credibility',
      'Keep it authentic and personal'
    ],
    examples: [
      { label: 'Bio', value: 'Bitcoin educator passionate about financial freedom. Building tools to make Bitcoin accessible to everyone.' },
      { label: 'Website', value: 'https://mybitcoinproject.com' }
    ]
  },
  'payment-info': {
    tips: [
      'Bitcoin address is required to receive donations',
      'Lightning address enables instant, low-fee payments',
      'Always double-check your addresses before saving',
      'You can update these anytime in settings'
    ],
    examples: [
      { label: 'Bitcoin', value: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
      { label: 'Lightning', value: 'you@getalby.com' }
    ]
  }
}

export default function ProfileSetupPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    display_name: '',
    bio: '',
    website: '',
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-teal-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
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
        website: profileData.website || null,
        bitcoin_address: profileData.bitcoin_address || null,
        lightning_address: profileData.lightning_address || null,
        updated_at: new Date().toISOString()
      }

      // Submitting profile setup data
      
      const timeoutId = setTimeout(() => {
        // Profile setup update timeout reached, reset loading state
        setIsLoading(false)
        toast.error('Update is taking longer than expected. Please try again.')
      }, 8000)

      const { data: returnedProfile, error: supabaseError } = await supabase
        .from('profiles')
        .update(updatedProfileData)
        .eq('id', user!.id)
        .select('*')
        .single()
      
      clearTimeout(timeoutId)

      if (supabaseError) {
        throw supabaseError
      }

      if (!returnedProfile) {
        throw new Error('Failed to update profile: No data returned')
      }

              // Profile setup successful
      
      await useAuthStore.getState().fetchProfile()
      
      toast.success('Profile updated successfully! Welcome to OrangeCat! 🎉')
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const currentStepData = steps[currentStep]
  const currentAdvice = stepAdvice[currentStepData.id as keyof typeof stepAdvice]
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
              <p className="text-gray-600 mt-1">Let&apos;s set up your Bitcoin fundraising profile</p>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Form - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              
              {/* Step Header */}
              <div className="bg-gradient-to-r from-orange-500 to-teal-500 px-8 py-6">
                <div className="flex items-center text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                    <currentStepData.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                    <p className="text-orange-100 mt-1">{currentStepData.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-8">
                <form onSubmit={currentStep === steps.length - 1 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
                  
                  {currentStepData.id === 'basic-info' && (
                    <div className="space-y-6">
                      <Input
                        label="Username"
                        value={profileData.username}
                        onChange={handleInputChange('username')}
                        placeholder="satoshi_builder"
                        className="text-lg"
                        icon={User}
                      />
                      <Input
                        label="Display Name"
                        value={profileData.display_name}
                        onChange={handleInputChange('display_name')}
                        placeholder="Satoshi Builder"
                        className="text-lg"
                      />
                    </div>
                  )}

                  {currentStepData.id === 'about-you' && (
                    <div className="space-y-6">
                      <Textarea
                        label="Bio"
                        value={profileData.bio}
                        onChange={handleInputChange('bio')}
                        placeholder="Tell your story... What drives you? What are you passionate about?"
                        rows={4}
                        className="text-lg"
                      />
                      <Input
                        label="Website"
                        value={profileData.website}
                        onChange={handleInputChange('website')}
                        placeholder="https://yourwebsite.com"
                        className="text-lg"
                        icon={Globe}
                      />
                    </div>
                  )}

                  {currentStepData.id === 'payment-info' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Input
                          label="Bitcoin Address"
                          value={profileData.bitcoin_address}
                          onChange={handleInputChange('bitcoin_address')}
                          placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                          className="text-lg font-mono"
                          icon={Bitcoin}
                        />
                        {!profileData.bitcoin_address && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Bitcoin className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <h4 className="font-semibold text-orange-900 mb-1">Don&apos;t have a Bitcoin wallet?</h4>
                                <p className="text-orange-800 text-sm mb-3">
                                  No worries! We&apos;ll help you get one set up in just a few minutes.
                                </p>
                                <Link 
                                  href="/bitcoin-wallet-guide" 
                                  target="_blank"
                                  className="inline-flex items-center px-3 py-1.5 border border-orange-600 text-orange-600 rounded-md text-sm font-medium hover:bg-orange-50 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Get Bitcoin Wallet Guide
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        label="Lightning Address"
                        value={profileData.lightning_address}
                        onChange={handleInputChange('lightning_address')}
                        placeholder="you@getalby.com"
                        className="text-lg"
                        icon={Zap}
                      />
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-8 border-t border-gray-100">
                    {currentStep > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isLoading}
                        className="flex items-center"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    ) : (
                      <div />
                    )}
                    
                    {currentStep === steps.length - 1 ? (
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white px-8 py-3 text-lg font-semibold"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Complete Setup
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white flex items-center px-6"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Advice Sidebar - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* Tips Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-teal-500 rounded-xl flex items-center justify-center mr-3">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Pro Tips</h3>
                </div>
                <ul className="space-y-3">
                  {currentAdvice.tips.map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Examples Card */}
              <div className="bg-gradient-to-br from-orange-50 to-teal-50 rounded-2xl border border-orange-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Examples</h3>
                <div className="space-y-4">
                  {currentAdvice.examples.map((example, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">{example.label}</div>
                      <div className="text-gray-800 font-mono text-sm break-all">{example.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Steps */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        index < currentStep 
                          ? 'bg-green-500 text-white' 
                          : index === currentStep 
                            ? 'bg-gradient-to-r from-orange-500 to-teal-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index < currentStep ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <step.icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 