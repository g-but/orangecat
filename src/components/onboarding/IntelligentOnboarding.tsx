'use client'

import { useState, useEffect } from 'react'
import {
  Lightbulb,
  Users,
  User,
  Building,
  Heart,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  DollarSign,
  Globe,
  Zap
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  component: React.ReactNode
}

interface UserIntent {
  isOrganization: boolean
  isPersonal: boolean
  needsCollective: boolean
  isBusiness: boolean
  isCharity: boolean
  needsFunding: boolean
  confidence: number
}

export default function IntelligentOnboarding() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [userIntent, setUserIntent] = useState<UserIntent | null>(null)
  const [userDescription, setUserDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Step 1: Ask what they need Bitcoin for
  const Step1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          What do you need Bitcoin for?
        </h2>
        <p className="text-gray-600">
          Tell us about your project, cause, or idea. We'll help you set up the perfect Bitcoin fundraising solution.
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="e.g., 'I run a local cat shelter and need funds for food and medical care' or 'I'm building an open source Bitcoin wallet and need development funding' or 'My community wants to organize a Bitcoin education event'..."
          value={userDescription}
          onChange={(e) => setUserDescription(e.target.value)}
          rows={6}
          className="w-full resize-none"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors cursor-pointer" onClick={() => setUserDescription(prev => prev + ' I run a local cat shelter and need funds for food and medical care')}>
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Charity/Non-profit</h3>
                <p className="text-sm text-gray-600">Animal shelters, community aid, disaster relief</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-tiffany-300 transition-colors cursor-pointer" onClick={() => setUserDescription(prev => prev + ' I am building an open source Bitcoin wallet and need development funding')}>
            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Business/Startup</h3>
                <p className="text-sm text-gray-600">Product development, business expansion</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors cursor-pointer" onClick={() => setUserDescription(prev => prev + ' My community wants to organize a Bitcoin education event')}>
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Community/Event</h3>
                <p className="text-sm text-gray-600">Meetups, conferences, group activities</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-2 border-dashed border-gray-200 hover:border-yellow-300 transition-colors cursor-pointer" onClick={() => setUserDescription(prev => prev + ' I am developing open source Bitcoin software and need funding')}>
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Open Source/Tech</h3>
                <p className="text-sm text-gray-600">Software development, research projects</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  // Step 2: AI analysis and recommendations
  const Step2 = () => {
    const analyzeIntent = async () => {
      setIsAnalyzing(true)

      try {
        // Call the API to analyze the description
        const response = await fetch('/api/onboarding/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: userDescription
          })
        })

        if (!response.ok) {
          throw new Error('Failed to analyze description')
        }

        const result = await response.json()
        setUserIntent({
          isOrganization: result.isOrganization,
          isPersonal: result.isPersonal,
          needsCollective: result.needsCollective,
          isBusiness: result.isBusiness,
          isCharity: result.isCharity,
          needsFunding: result.needsFunding,
          confidence: result.confidence
        })

        setTimeout(() => {
          setIsAnalyzing(false)
          setCurrentStep(2)
        }, 1500)
      } catch (error) {
        console.error('Error analyzing intent:', error)
        setIsAnalyzing(false)
        // Fallback to client-side analysis if API fails
        analyzeIntentLocal()
      }
    }

    const analyzeIntentLocal = () => {
      // Simple keyword-based analysis (fallback)
      const text = userDescription.toLowerCase()
      const intent: UserIntent = {
        isOrganization: false,
        isPersonal: true,
        needsCollective: false,
        isBusiness: false,
        isCharity: false,
        needsFunding: false,
        confidence: 0
      }

      // Analyze keywords
      const orgKeywords = ['organization', 'group', 'team', 'collective', 'community', 'association', 'foundation', 'company', 'business', 'startup', 'we', 'our', 'us']
      const personalKeywords = ['i', 'my', 'me', 'personal', 'individual']
      const charityKeywords = ['charity', 'non-profit', 'nonprofit', 'donation', 'help', 'support', 'aid', 'relief', 'shelter', 'rescue']
      const businessKeywords = ['business', 'startup', 'company', 'product', 'service', 'development', 'build', 'create']
      const fundingKeywords = ['fund', 'money', 'bitcoin', 'donate', 'support', 'help', 'need', 'require']

      // Check for organization indicators
      const orgMatches = orgKeywords.filter(word => text.includes(word)).length
      const personalMatches = personalKeywords.filter(word => text.includes(word)).length

      if (orgMatches > personalMatches) {
        intent.isOrganization = true
        intent.isPersonal = false
        intent.needsCollective = true
        intent.confidence += 30
      }

      // Check for charity
      if (charityKeywords.some(word => text.includes(word))) {
        intent.isCharity = true
        intent.confidence += 20
      }

      // Check for business
      if (businessKeywords.some(word => text.includes(word))) {
        intent.isBusiness = true
        intent.confidence += 20
      }

      // Check for funding need
      if (fundingKeywords.some(word => text.includes(word))) {
        intent.needsFunding = true
        intent.confidence += 25
      }

      // Boost confidence based on description length and detail
      if (userDescription.length > 50) intent.confidence += 15
      if (userDescription.length > 100) intent.confidence += 10

      setUserIntent(intent)

      setTimeout(() => {
        setIsAnalyzing(false)
        setCurrentStep(2)
      }, 1500)
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-tiffany-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lightbulb className="w-8 h-8 text-tiffany-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyzing Your Needs...
          </h2>
          <p className="text-gray-600">
            Our AI is analyzing your description to recommend the best Bitcoin fundraising approach.
          </p>
        </div>

        {isAnalyzing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
            <Progress value={66} className="w-full" />
            <p className="text-center text-sm text-gray-600">
              Analyzing keywords, context, and requirements...
            </p>
          </div>
        ) : (
          <Button
            onClick={analyzeIntent}
            disabled={!userDescription.trim()}
            className="w-full bg-gradient-to-r from-orange-600 to-tiffany-600 hover:from-orange-700 hover:to-tiffany-700"
          >
            Analyze My Needs
          </Button>
        )}
      </div>
    )
  }

  // Step 3: Show recommendations
  const Step3 = () => {
    if (!userIntent) return null

    const getRecommendation = () => {
      if (userIntent.isOrganization) {
        return {
          type: 'organization',
          title: 'Organization Setup Recommended',
          description: 'Your needs suggest creating an organization for collective management and shared responsibility.',
          icon: <Building className="w-8 h-8 text-blue-600" />,
          benefits: [
            'Multiple people can manage funds',
            'Professional organization profile',
            'Collective decision making',
            'Shared treasury management',
            'Organization-wide transparency'
          ]
        }
      } else {
        return {
          type: 'personal',
          title: 'Personal Campaign Recommended',
          description: 'Your needs are best served with a personal fundraising campaign.',
          icon: <User className="w-8 h-8 text-green-600" />,
          benefits: [
            'Simple personal fundraising',
            'Individual control',
            'Quick setup',
            'Personal branding',
            'Direct supporter connection'
          ]
        }
      }
    }

    const recommendation = getRecommendation()

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {recommendation.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {recommendation.title}
          </h2>
          <p className="text-gray-600">
            {recommendation.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-2 border-green-200 bg-green-50">
            <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Recommended Benefits
            </h3>
            <ul className="space-y-2">
              {recommendation.benefits.map((benefit, index) => (
                <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 border-2 border-blue-200 bg-blue-50">
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              What You'll Get
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-700">Bitcoin wallet setup</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-700">Public fundraising page</span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-700">Transparency dashboard</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Step 4: Setup flow
  const Step4 = () => {
    if (!userIntent) return null

    const handleSetup = (type: 'organization' | 'personal') => {
      if (type === 'organization') {
        router.push('/organizations/create')
      } else {
        router.push('/create')
      }
    }

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600">
            Choose your setup path and start receiving Bitcoin donations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userIntent.isOrganization ? (
            <Card className="p-6 border-2 border-blue-300 bg-blue-50 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSetup('organization')}>
              <div className="flex items-center gap-3 mb-4">
                <Building className="w-8 h-8 text-blue-600" />
                <h3 className="text-xl font-semibold text-blue-800">Create Organization</h3>
              </div>
              <p className="text-blue-700 mb-4">
                Set up a collective organization for shared management and professional fundraising.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Create Organization
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          ) : (
            <Card className="p-6 border-2 border-green-300 bg-green-50 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleSetup('personal')}>
              <div className="flex items-center gap-3 mb-4">
                <User className="w-8 h-8 text-green-600" />
                <h3 className="text-xl font-semibold text-green-800">Create Personal Campaign</h3>
              </div>
              <p className="text-green-700 mb-4">
                Set up a personal fundraising campaign for your individual project or cause.
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Create Campaign
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          )}

          <Card className="p-6 border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => router.push('/discover')}>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-8 h-8 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-800">Browse Existing Campaigns</h3>
            </div>
            <p className="text-gray-600 mb-4">
              See how others are using Bitcoin fundraising and get inspiration for your own project.
            </p>
            <Button variant="outline" className="w-full">
              Explore Campaigns
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  const steps: OnboardingStep[] = [
    {
      id: 'describe',
      title: 'Tell Us Your Story',
      description: 'Describe what you need Bitcoin funding for',
      icon: <MessageSquare className="w-6 h-6" />,
      component: <Step1 />
    },
    {
      id: 'analyze',
      title: 'Smart Analysis',
      description: 'AI analyzes your needs and suggests the best approach',
      icon: <Lightbulb className="w-6 h-6" />,
      component: <Step2 />
    },
    {
      id: 'recommend',
      title: 'Personalized Recommendation',
      description: 'See our recommendation based on your description',
      icon: <Target className="w-6 h-6" />,
      component: <Step3 />
    },
    {
      id: 'setup',
      title: 'Choose Your Path',
      description: 'Select the setup that works best for you',
      icon: <Sparkles className="w-6 h-6" />,
      component: <Step4 />
    }
  ]

  const currentStepData = steps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-tiffany-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index === currentStep ? 'bg-orange-600 text-white' :
                  index < currentStep ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <Card className="mb-8">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-orange-100 to-tiffany-100 rounded-lg">
                {currentStepData.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentStepData.title}</h1>
                <p className="text-gray-600">{currentStepData.description}</p>
              </div>
            </div>

                <div className="transition-opacity duration-300">
                  {currentStepData.component}
                </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {currentStep < steps.length - 1 && currentStep !== 1 && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && !userIntent}
              >
                Skip Analysis
              </Button>
            )}

            {currentStep < steps.length - 1 && currentStep !== 1 && (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-gradient-to-r from-orange-600 to-tiffany-600 hover:from-orange-700 hover:to-tiffany-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
