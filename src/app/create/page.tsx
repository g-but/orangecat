'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card, { CardContent } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { 
  Bitcoin, 
  Zap, 
  Loader2, 
  ArrowRight, 
  Info, 
  Globe, 
  Target,
  Sparkles,
  CheckCircle,
  ArrowLeft,
  Save,
  Check,
  Award,
  Clock,
  Eye,
  TrendingUp,
  Shield,
  Star,
  Lightbulb,
  Users,
  Heart
} from 'lucide-react'
import { createFundingPage, updateFundingPage, saveFundingPageDraft, updateFundingPageDraft } from '@/services/supabase/client'
import { toast } from 'sonner'

const categories = [
  { value: 'creative', label: 'Creative', icon: '🎨', description: 'Art, music, writing' },
  { value: 'technology', label: 'Technology', icon: '💻', description: 'Apps, websites, tech' },
  { value: 'community', label: 'Community', icon: '🏘️', description: 'Local initiatives' },
  { value: 'education', label: 'Education', icon: '📚', description: 'Learning, courses' },
  { value: 'charity', label: 'Charity', icon: '❤️', description: 'Helping others' },
  { value: 'business', label: 'Business', icon: '🚀', description: 'Startups, ventures' },
  { value: 'personal', label: 'Personal', icon: '🌟', description: 'Personal goals' },
  { value: 'other', label: 'Other', icon: '✨', description: 'Everything else' }
]

const steps = [
  { id: 1, name: 'Project Details', description: 'Tell us about your idea' },
  { id: 2, name: 'Payment Setup', description: 'How you&apos;ll receive funds' },
  { id: 3, name: 'Review & Launch', description: 'Final touches' }
]

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bitcoin_address: '',
    lightning_address: '',
    website_url: '',
    goal_amount: '',
    categories: [] as string[],
    currency: 'SATS' as 'BTC' | 'SATS'
  })

  // Load draft from localStorage on component mount
  useEffect(() => {
    if (user) {
      const savedDraft = localStorage.getItem(`funding-draft-${user.id}`)
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft)
          setFormData(draftData.formData)
          setCurrentStep(draftData.currentStep || 1)
          setDraftId(draftData.draftId || null)
          setLastSaved(draftData.lastSaved ? new Date(draftData.lastSaved) : null)
          toast.success('Draft restored')
        } catch (error) {
          console.error('Error loading draft:', error)
        }
      }
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCategoryToggle = (categoryValue: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryValue)
        ? prev.categories.filter(cat => cat !== categoryValue)
        : [...prev.categories, categoryValue]
    }))
  }

  const saveDraft = useCallback(async (showToast = true) => {
    if (!user || !formData.title.trim()) return

    setSavingDraft(true)
    try {
      const now = new Date()
      const draftData = {
        formData,
        currentStep,
        draftId,
        lastSaved: now.toISOString()
      }
      localStorage.setItem(`funding-draft-${user.id}`, JSON.stringify(draftData))

      if (draftId) {
        await updateFundingPageDraft(draftId, formData)
      } else {
        const result = await saveFundingPageDraft(user.id, formData)
        if (result.data) {
          setDraftId(result.data.id)
          const updatedDraftData = { ...draftData, draftId: result.data.id }
          localStorage.setItem(`funding-draft-${user.id}`, JSON.stringify(updatedDraftData))
        }
      }

      setLastSaved(now)
      if (showToast) {
        toast.success('Draft saved')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      if (showToast) {
        toast.error('Failed to save draft')
      }
    } finally {
      setSavingDraft(false)
    }
  }, [user, formData, currentStep, draftId])

  const nextStep = () => {
    if (currentStep < 3) {
      // Save draft when moving to next step
      saveDraft(false)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        throw new Error('You must be logged in to create a fundraising page')
      }

      if (!formData.title.trim()) {
        throw new Error('Please provide a title for your fundraising page')
      }

      const pageData = {
        user_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        bitcoin_address: formData.bitcoin_address.trim() || null,
        lightning_address: formData.lightning_address.trim() || null,
        website_url: formData.website_url.trim() || null,
        goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) : null,
        category: formData.categories.length > 0 ? formData.categories[0] : null,
        tags: formData.categories.length > 1 ? formData.categories.slice(1) : [],
        currency: formData.currency,
        is_active: true,
        is_public: true,
        total_funding: 0,
        contributor_count: 0
      }

      let result
      if (draftId) {
        result = await updateFundingPage(draftId, pageData)
        result = { data: { id: draftId }, error: result.error }
      } else {
        result = await createFundingPage(pageData)
      }

      if (!result.data) {
        throw new Error('Failed to create fundraising page')
      }

      localStorage.removeItem(`funding-draft-${user.id}`)
      toast.success('🎉 Campaign created successfully!')
      router.push(`/fund-us/${result.data.id}`)
    } catch (err) {
      console.error('Error creating page:', err)
      setError(err instanceof Error ? err.message : 'Failed to create fundraising page')
      toast.error('Failed to create fundraising page')
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep2 = formData.title.trim().length > 0
  const canProceedToStep3 = true

  // Calculate profile strength
  const calculateProfileStrength = () => {
    let score = 0
    let maxScore = 100
    
    // Essential fields (40 points)
    if (formData.title.trim()) score += 20
    if (formData.description.trim()) score += 20
    
    // Important fields (35 points)
    if (formData.categories.length > 0) score += 15
    if (formData.bitcoin_address.trim() || formData.lightning_address.trim()) score += 20
    
    // Nice to have fields (25 points)
    if (formData.website_url.trim()) score += 10
    if (formData.goal_amount) score += 10
    if (formData.description.length > 100) score += 5 // Detailed description bonus

    return Math.min(score, maxScore)
  }

  const profileStrength = calculateProfileStrength()
  
  const getStrengthLevel = () => {
    if (profileStrength >= 90) return { level: 'Excellent', color: 'emerald', icon: Star }
    if (profileStrength >= 75) return { level: 'Strong', color: 'green', icon: Shield }
    if (profileStrength >= 60) return { level: 'Good', color: 'blue', icon: TrendingUp }
    if (profileStrength >= 40) return { level: 'Fair', color: 'yellow', icon: Lightbulb }
    return { level: 'Getting Started', color: 'gray', icon: Heart }
  }

  const strengthInfo = getStrengthLevel()

  const getStrengthMessage = () => {
    if (profileStrength >= 90) return 'Outstanding! Your campaign will inspire maximum trust and donations 🌟'
    if (profileStrength >= 75) return 'Excellent! Your campaign looks very professional and trustworthy 🚀'
    if (profileStrength >= 60) return 'Good progress! Add more details to boost supporter confidence 💪'
    if (profileStrength >= 40) return 'You&apos;re on the right track! More details will help attract supporters 📈'
    return 'Great start! Keep adding details to build trust with potential supporters ✨'
  }

  const getNextSuggestion = () => {
    if (!formData.title.trim()) return 'Add a compelling project title'
    if (!formData.description.trim()) return 'Tell your story in the description'
    if (formData.categories.length === 0) return 'Select relevant categories'
    if (!formData.bitcoin_address.trim() && !formData.lightning_address.trim()) return 'Add payment methods'
    if (!formData.website_url.trim()) return 'Add your website or social media'
    if (!formData.goal_amount) return 'Set a funding goal'
    if (formData.description.length < 100) return 'Expand your description for more impact'
    return 'Your campaign looks amazing!'
  }

  if (!user) {
    router.push('/auth?mode=login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
              <p className="text-gray-600 mt-1">Share your project with the world</p>
            </div>
            
            {/* Auto-save indicator */}
            <div className="flex items-center space-x-4">
              {lastSaved && (
                <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4 mr-1" />
                  Saved {lastSaved.toLocaleTimeString()}
                </div>
              )}
              
              {savingDraft && (
                <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center mt-8 space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${currentStep >= step.id 
                      ? 'bg-tiffany-600 text-white shadow-lg shadow-tiffany-600/25' 
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="ml-3 text-left">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-6 transition-all duration-300 ${
                    currentStep > step.id ? 'bg-tiffany-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar - Profile Strength */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              
              {/* Profile Strength Card */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${
                      strengthInfo.color === 'emerald' ? 'from-emerald-400 to-emerald-600' :
                      strengthInfo.color === 'green' ? 'from-green-400 to-green-600' :
                      strengthInfo.color === 'blue' ? 'from-blue-400 to-blue-600' :
                      strengthInfo.color === 'yellow' ? 'from-yellow-400 to-yellow-600' :
                      'from-gray-400 to-gray-600'
                    } flex items-center justify-center`}>
                      <strengthInfo.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2">Campaign Strength</h3>
                    
                    <div className="mb-4">
                      <div className={`text-3xl font-bold mb-1 ${
                        strengthInfo.color === 'emerald' ? 'text-emerald-600' :
                        strengthInfo.color === 'green' ? 'text-green-600' :
                        strengthInfo.color === 'blue' ? 'text-blue-600' :
                        strengthInfo.color === 'yellow' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {profileStrength}%
                      </div>
                      <div className={`text-sm font-medium ${
                        strengthInfo.color === 'emerald' ? 'text-emerald-600' :
                        strengthInfo.color === 'green' ? 'text-green-600' :
                        strengthInfo.color === 'blue' ? 'text-blue-600' :
                        strengthInfo.color === 'yellow' ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {strengthInfo.level}
                      </div>
                    </div>
                    
                    {/* Circular progress */}
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={
                            strengthInfo.color === 'emerald' ? '#10b981' :
                            strengthInfo.color === 'green' ? '#22c55e' :
                            strengthInfo.color === 'blue' ? '#3b82f6' :
                            strengthInfo.color === 'yellow' ? '#eab308' :
                            '#6b7280'
                          }
                          strokeWidth="2"
                          strokeDasharray={`${profileStrength}, 100`}
                          className="transition-all duration-500"
                        />
                      </svg>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-4">
                      {getStrengthMessage()}
                    </p>
                    
                    {profileStrength < 100 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Next suggestion:</p>
                        <p className="text-xs text-gray-600">{getNextSuggestion()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Quick Tips</h3>
                  </div>
                  <div className="space-y-3 text-sm text-blue-800">
                    <div className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <p>Use clear, compelling language in your title</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <p>Tell your story with passion and authenticity</p>
                    </div>
                    <div className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                      <p>Add payment methods to start receiving donations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Success Stats */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <Users className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">Success Stats</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Complete campaigns</span>
                      <span className="font-semibold text-green-900">3x more funding</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">With payment methods</span>
                      <span className="font-semibold text-green-900">5x more donors</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Detailed descriptions</span>
                      <span className="font-semibold text-green-900">2x trust score</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-3">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  {/* Step 1: Project Details */}
                  {currentStep === 1 && (
                    <div className="space-y-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-tiffany-400 to-tiffany-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-tiffany-600/25">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your project</h2>
                        <p className="text-gray-600 text-lg">Share your vision and inspire supporters</p>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <Input
                            id="title"
                            name="title"
                            label="Project Title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Enter your project title..."
                            required
                            className="text-lg py-4 px-5 transition-all duration-200 focus:scale-[1.01]"
                          />
                          <div className="flex justify-between mt-2">
                            <p className="text-sm text-gray-500">Make it clear and compelling</p>
                            <span className={`text-xs ${formData.title.length > 80 ? 'text-orange-500' : 'text-gray-400'}`}>
                              {formData.title.length}/100
                            </span>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-3">
                            Project Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={6}
                            placeholder="Describe your project, its goals, and why it matters. Tell your story with passion and authenticity..."
                            className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 resize-none transition-all duration-200 focus:scale-[1.01]"
                          />
                          <div className="flex justify-between mt-2">
                            <p className="text-sm text-gray-500">
                              {formData.description.length < 50 ? 'Tell your story and connect with supporters' : 
                               formData.description.length < 100 ? 'Great start! Add more details for better impact' :
                               'Excellent! Detailed descriptions build trust'}
                            </p>
                            <span className={`text-xs ${formData.description.length > 900 ? 'text-orange-500' : 'text-gray-400'}`}>
                              {formData.description.length}/1000
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-4">
                            Categories
                          </label>
                          <p className="text-sm text-gray-500 mb-6">
                            Choose categories that best describe your project
                            {formData.categories.length > 0 && (
                              <span className="ml-2 px-3 py-1 bg-tiffany-100 text-tiffany-700 rounded-full text-xs font-medium">
                                {formData.categories.length} selected
                              </span>
                            )}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categories.map((category) => (
                              <button
                                key={category.value}
                                type="button"
                                onClick={() => handleCategoryToggle(category.value)}
                                className={`relative p-5 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                                  formData.categories.includes(category.value)
                                    ? 'border-tiffany-500 bg-tiffany-50 shadow-lg shadow-tiffany-500/20'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                {formData.categories.includes(category.value) && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-tiffany-500 text-white rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                                <div className="text-center">
                                  <div className="text-3xl mb-3">{category.icon}</div>
                                  <h3 className="font-medium text-sm text-gray-900 mb-1">{category.label}</h3>
                                  <p className="text-xs text-gray-500">{category.description}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Payment Setup */}
                  {currentStep === 2 && (
                    <div className="space-y-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-600/25">
                          <Bitcoin className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Setup</h2>
                        <p className="text-gray-600 text-lg">Configure how you&apos;ll receive Bitcoin donations</p>
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex">
                          <Info className="w-6 h-6 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-blue-900 mb-2">Payment Methods</h3>
                            <p className="text-sm text-blue-700">
                              Both payment methods are optional and can be added later. Bitcoin addresses work globally, 
                              while Lightning addresses enable instant micro-payments and tips.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                              <Bitcoin className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Bitcoin Address</label>
                              <p className="text-xs text-gray-500">For larger donations and long-term storage</p>
                            </div>
                          </div>
                          <Input
                            id="bitcoin_address"
                            name="bitcoin_address"
                            type="text"
                            value={formData.bitcoin_address}
                            onChange={handleChange}
                            placeholder="bc1q... or 1... or 3..."
                            className="font-mono text-sm py-3 px-4"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                              <Zap className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Lightning Address</label>
                              <p className="text-xs text-gray-500">For instant payments and tips</p>
                            </div>
                          </div>
                          <Input
                            id="lightning_address"
                            name="lightning_address"
                            type="text"
                            value={formData.lightning_address}
                            onChange={handleChange}
                            placeholder="you@wallet.com"
                            className="font-mono text-sm py-3 px-4"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review & Launch */}
                  {currentStep === 3 && (
                    <div className="space-y-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-600/25">
                          <Target className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Final Details</h2>
                        <p className="text-gray-600 text-lg">Add finishing touches to your campaign</p>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <div className="flex items-center mb-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <Globe className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Website or Social Media</label>
                              <p className="text-xs text-gray-500">Help supporters learn more about you</p>
                            </div>
                          </div>
                          <Input
                            id="website_url"
                            name="website_url"
                            type="url"
                            value={formData.website_url}
                            onChange={handleChange}
                            placeholder="https://your-website.com"
                            className="py-3 px-4"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Funding Goal (Optional)
                            </label>
                            <Input
                              id="goal_amount"
                              name="goal_amount"
                              type="number"
                              value={formData.goal_amount}
                              onChange={handleChange}
                              placeholder="100000"
                              className="py-3 px-4"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                              Currency
                            </label>
                            <select
                              id="currency"
                              name="currency"
                              value={formData.currency}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 transition-all duration-200"
                            >
                              <option value="SATS">SATS</option>
                              <option value="BTC">BTC</option>
                            </select>
                          </div>
                        </div>

                        {/* Campaign Preview */}
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-8 border border-gray-200">
                          <div className="flex items-center mb-6">
                            <Eye className="w-6 h-6 text-gray-500 mr-3" />
                            <h3 className="text-lg font-semibold text-gray-900">Campaign Preview</h3>
                          </div>
                          <div className="bg-white rounded-xl p-6 border shadow-sm">
                            <h4 className="font-bold text-xl text-gray-900 mb-3">
                              {formData.title || 'Your Project Title'}
                            </h4>
                            <p className="text-gray-600 mb-4 leading-relaxed">
                              {formData.description || 'Your project description will appear here...'}
                            </p>
                            <div className="flex items-center space-x-3">
                              {formData.categories.map((cat) => {
                                const category = categories.find(c => c.value === cat)
                                return category ? (
                                  <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                    {category.icon} {category.label}
                                  </span>
                                ) : null
                              })}
                            </div>
                            {formData.goal_amount && (
                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500">Funding Goal</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {Number(formData.goal_amount).toLocaleString()} {formData.currency}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                    <div className="flex space-x-3">
                      {currentStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="px-6 py-3"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Button>
                      )}
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3"
                      >
                        Cancel
                      </Button>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => saveDraft(true)}
                        disabled={savingDraft || !formData.title.trim()}
                        className="px-6 py-3"
                      >
                        {savingDraft ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                          </>
                        )}
                      </Button>

                      {currentStep < 3 ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={
                            (currentStep === 1 && !canProceedToStep2) ||
                            (currentStep === 2 && !canProceedToStep3)
                          }
                          className="bg-tiffany-600 hover:bg-tiffany-700 px-8 py-3 shadow-lg shadow-tiffany-600/25"
                        >
                          Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 px-8 py-3 shadow-lg shadow-green-600/25"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              Launch Campaign
                              <Sparkles className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 