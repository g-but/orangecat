'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { 
  Bitcoin, 
  Zap, 
  Loader2, 
  ArrowRight, 
  Info, 
  Globe, 
  Tag, 
  Target,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowLeft,
  Rocket,
  Heart,
  DollarSign,
  Plus,
  Trash2,
  ExternalLink,
  ShoppingCart,
  BarChart3,
  Award,
  Save,
  Check
} from 'lucide-react'
import { createFundingPage, updateFundingPage, saveFundingPageDraft, updateFundingPageDraft } from '@/services/supabase/client'
import { toast } from 'sonner'

const categories = [
  { value: 'creative', label: 'Creative Projects', icon: '🎨', description: 'Art, music, writing, and creative endeavors' },
  { value: 'technology', label: 'Technology', icon: '💻', description: 'Apps, websites, and tech innovations' },
  { value: 'community', label: 'Community', icon: '🏘️', description: 'Local initiatives and community projects' },
  { value: 'education', label: 'Education', icon: '📚', description: 'Learning, courses, and educational content' },
  { value: 'charity', label: 'Charity', icon: '❤️', description: 'Helping others and charitable causes' },
  { value: 'business', label: 'Business', icon: '🚀', description: 'Startups and business ventures' },
  { value: 'personal', label: 'Personal', icon: '🌟', description: 'Personal goals and life projects' },
  { value: 'other', label: 'Other', icon: '✨', description: 'Everything else amazing' }
]

const steps = [
  { id: 1, name: 'Basic Info', description: 'Tell us about your project' },
  { id: 2, name: 'Payment Setup', description: 'How you\'ll receive funds' },
  { id: 3, name: 'Final Details', description: 'Polish and launch' }
]

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [draftId, setDraftId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bitcoin_address: '',
    lightning_address: '',
    website_url: '',
    goal_amount: '',
    categories: [] as string[],
    currency: 'SATS' as 'BTC' | 'SATS',
    funding_breakdown: [] as Array<{
      id: string
      item: string
      description: string
      amount: string
      link?: string
    }>
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
          toast.info('Draft loaded! Continue where you left off.')
        } catch (error) {
          console.error('Error loading draft:', error)
        }
      }
    }
  }, [user])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!user) return

    const autoSaveInterval = setInterval(() => {
      saveDraft(false) // Silent save
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [user, formData, currentStep])

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

  const saveDraft = async (showToast = true) => {
    if (!user) return

    setSavingDraft(true)
    try {
      // Save to localStorage
      const draftData = {
        formData,
        currentStep,
        draftId,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(`funding-draft-${user.id}`, JSON.stringify(draftData))

      // If we have a draftId, update the database draft
      if (draftId) {
        await updateFundingPageDraft(draftId, formData)
      } else if (formData.title.trim()) {
        // Create a new draft in the database if we have at least a title
        const result = await saveFundingPageDraft(user.id, formData)
        if (result.data) {
          setDraftId(result.data.id)
          // Update localStorage with the new draftId
          const updatedDraftData = { ...draftData, draftId: result.data.id }
          localStorage.setItem(`funding-draft-${user.id}`, JSON.stringify(updatedDraftData))
        }
      }

      if (showToast) {
        toast.success('Draft saved!')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      if (showToast) {
        toast.error('Failed to save draft')
      }
    } finally {
      setSavingDraft(false)
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

      // Validate required fields
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
        // Update existing draft to make it live
        result = await updateFundingPage(draftId, pageData)
        result = { data: { id: draftId }, error: result.error }
      } else {
        // Create new page
        result = await createFundingPage(pageData)
      }

      if (!result.data) {
        throw new Error('Failed to create fundraising page')
      }

      // Clear the draft from localStorage
      localStorage.removeItem(`funding-draft-${user.id}`)

      toast.success('🎉 Your fundraising page is live!')
      router.push(`/fund-us/${result.data.id}/edit`)
    } catch (err) {
      console.error('Error creating page:', err)
      setError(err instanceof Error ? err.message : 'Failed to create fundraising page')
      toast.error('Failed to create fundraising page')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToStep2 = formData.title.trim().length > 0
  const canProceedToStep3 = true // No longer require payment methods to proceed

  // Helper functions for funding breakdown
  const addFundingItem = () => {
    const newItem = {
      id: Date.now().toString(),
      item: '',
      description: '',
      amount: '',
      link: ''
    }
    setFormData(prev => ({
      ...prev,
      funding_breakdown: [...prev.funding_breakdown, newItem]
    }))
  }

  const updateFundingItem = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      funding_breakdown: prev.funding_breakdown.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeFundingItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      funding_breakdown: prev.funding_breakdown.filter(item => item.id !== id)
    }))
  }

  // Calculate profile completion percentage
  const calculateCompletionPercentage = () => {
    let completed = 0
    let total = 10 // Total possible points

    // Required fields (1 point)
    if (formData.title.trim()) completed += 1

    // Optional but valuable fields (9 points)
    if (formData.description.trim()) completed += 1
    if (formData.categories.length > 0) completed += 1
    if (formData.bitcoin_address.trim()) completed += 1
    if (formData.lightning_address.trim()) completed += 1
    if (formData.website_url.trim()) completed += 1
    if (formData.goal_amount) completed += 1
    if (formData.funding_breakdown.length > 0) completed += 2
    if (formData.funding_breakdown.some(item => item.link?.trim())) completed += 1

    return Math.round((completed / total) * 100)
  }

  const completionPercentage = calculateCompletionPercentage()
  const getCompletionColor = () => {
    if (completionPercentage >= 80) return 'text-green-600'
    if (completionPercentage >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getCompletionMessage = () => {
    if (completionPercentage >= 90) return 'Outstanding! Your page will inspire maximum trust 🌟'
    if (completionPercentage >= 80) return 'Excellent! Your page looks very trustworthy 🚀'
    if (completionPercentage >= 60) return 'Good progress! Add more details to boost trust 💪'
    return 'Great start! More details will help donors trust your project 📈'
  }

  if (!user) {
    router.push('/auth?mode=login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-tiffany-50 via-white to-orange-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-tiffany-600 to-orange-500 py-16">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
              <Rocket className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Turn Your Dreams Into
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Reality
            </span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Create your fundraising page in minutes and start receiving Bitcoin donations from supporters worldwide. 
            Your next big idea is just a few clicks away! 🚀
          </p>
          <div className="flex justify-center space-x-8 text-white/80">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              <span>Instant Setup</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              <span>Global Reach</span>
            </div>
            <div className="flex items-center">
              <Bitcoin className="h-5 w-5 mr-2" />
              <span>Bitcoin Payments</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Progress Steps */}
        <div className="mb-8 space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                      ${currentStep >= step.id 
                        ? 'bg-tiffany-500 border-tiffany-500 text-white' 
                        : 'border-gray-300 text-gray-400'
                      }
                    `}>
                      {currentStep > step.id ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <span className="font-semibold">{step.id}</span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-tiffany-600' : 'text-gray-500'}`}>
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`
                      w-16 h-0.5 mx-4 transition-all duration-300
                      ${currentStep > step.id ? 'bg-tiffany-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Profile Completion Indicator */}
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-r from-tiffany-500 to-orange-500 rounded-lg">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">Profile Completion</h3>
                  <p className="text-sm text-gray-600">{getCompletionMessage()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getCompletionColor()}`}>
                  {completionPercentage}%
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-gradient-to-r from-tiffany-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-tiffany-500 to-orange-500 rounded-full">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">What's Your Big Idea?</h2>
                    <p className="text-gray-600">Tell the world about your amazing project. Make it compelling!</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Input
                        id="title"
                        name="title"
                        label="Project Title ✨"
                        type="text"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Revolutionary Bitcoin App, Community Garden Project..."
                        required
                        className="text-lg py-4 transition-all duration-200 focus:ring-2 focus:ring-tiffany-500 focus:scale-[1.02]"
                      />
                      <p className="text-sm text-gray-500 mt-1">Make it catchy and memorable! 🎯</p>
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Tell Your Story 📖
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={6}
                        placeholder="What are you building? Why does it matter? How will it change the world? Share your passion and vision here..."
                        className="w-full px-4 py-4 rounded-lg border border-gray-200 focus:border-tiffany-500 focus:ring-2 focus:ring-tiffany-500/20 transition-all duration-200 focus:scale-[1.01]"
                      />
                      <p className="text-sm text-gray-500 mt-1">The more compelling your story, the more likely people are to support you! 💪</p>
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-3">
                        <Tag className="inline w-4 h-4 mr-1" />
                        Choose Your Categories 🎯
                      </label>
                      <p className="text-sm text-gray-500 mb-4">Select one or more categories that best describe your project</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {categories.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => handleCategoryToggle(cat.value)}
                            className={`
                              p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 text-left
                              ${formData.categories.includes(cat.value) 
                                ? 'border-tiffany-500 bg-tiffany-50 shadow-lg' 
                                : 'border-gray-200 hover:border-tiffany-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-2xl">{cat.icon}</div>
                              {formData.categories.includes(cat.value) && (
                                <Check className="h-5 w-5 text-tiffany-600" />
                              )}
                            </div>
                            <div className="font-medium text-sm text-gray-900">{cat.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{cat.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Setup */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full">
                        <Bitcoin className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">How Will You Receive Funds?</h2>
                    <p className="text-gray-600">Set up your Bitcoin payment methods. Don't worry, you can add more later!</p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <DollarSign className="h-6 w-6 text-orange-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-orange-800">Ready to Receive Bitcoin? 🚀</h3>
                        <p className="mt-1 text-orange-700">
                          Add your payment methods below. Both are optional - you can add them now or later! 
                          Bitcoin addresses work globally, and Lightning addresses enable instant micro-payments!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <Bitcoin className="h-5 w-5 text-orange-500 mr-2" />
                        <h3 className="font-medium text-gray-900">Bitcoin Address</h3>
                      </div>
                      <Input
                        id="bitcoin_address"
                        name="bitcoin_address"
                        label=""
                        type="text"
                        value={formData.bitcoin_address}
                        onChange={handleChange}
                        placeholder="bc1q... or 1... or 3..."
                        className="transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:scale-[1.02]"
                      />
                      <p className="text-sm text-gray-500">Perfect for larger donations and long-term storage 💎</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                        <h3 className="font-medium text-gray-900">Lightning Address</h3>
                      </div>
                      <Input
                        id="lightning_address"
                        name="lightning_address"
                        label=""
                        type="text"
                        value={formData.lightning_address}
                        onChange={handleChange}
                        placeholder="you@wallet.com or you@domain.com"
                        className="transition-all duration-200 focus:ring-2 focus:ring-yellow-500 focus:scale-[1.02]"
                      />
                      <p className="text-sm text-gray-500">Instant payments, perfect for tips and small donations ⚡</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm text-blue-700">
                          <strong>No payment methods yet?</strong> No problem! You can add them later. 
                          Get a Bitcoin address from any wallet app, and Lightning addresses from services like Wallet of Satoshi or Strike.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Final Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-gradient-to-r from-tiffany-500 to-blue-500 rounded-full">
                        <Target className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Build Trust & Credibility! 🎯</h2>
                    <p className="text-gray-600">Show donors exactly what their money will fund. Transparency builds trust!</p>
                  </div>

                  <div className="space-y-6">
                    {/* Website URL */}
                    <div>
                      <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-2">
                        <Globe className="inline w-4 h-4 mr-1" />
                        Website or Social Media 🌐
                      </label>
                      <Input
                        id="website_url"
                        name="website_url"
                        label=""
                        type="url"
                        value={formData.website_url}
                        onChange={handleChange}
                        placeholder="https://your-website.com or https://twitter.com/yourhandle"
                        className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500 focus:scale-[1.02]"
                      />
                      <p className="text-sm text-gray-500 mt-1">Help people learn more about you and your project 🔗</p>
                    </div>

                    {/* Funding Goal */}
                    <div className="bg-gradient-to-r from-green-50 to-tiffany-50 p-6 rounded-xl border border-green-200">
                      <div className="flex items-start">
                        <Target className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-green-800 mb-2">Set Your Funding Goal 🎯</h3>
                          <p className="text-green-700 mb-4">
                            Having a clear goal helps supporters understand what you're working towards. 
                            You can always adjust this later!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Input
                          id="goal_amount"
                          name="goal_amount"
                          label="Funding Goal 💰"
                          type="number"
                          value={formData.goal_amount}
                          onChange={handleChange}
                          placeholder="100000"
                          className="transition-all duration-200 focus:ring-2 focus:ring-tiffany-500 focus:scale-[1.02]"
                        />
                      </div>
                      <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                          Currency
                        </label>
                        <select
                          id="currency"
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-tiffany-500 focus:ring-2 focus:ring-tiffany-500/20 transition-all duration-200"
                        >
                          <option value="SATS">SATS</option>
                          <option value="BTC">BTC</option>
                        </select>
                      </div>
                    </div>

                    {/* Funding Breakdown Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                      <div className="flex items-start mb-4">
                        <ShoppingCart className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                        <div className="ml-3">
                          <h3 className="text-lg font-medium text-blue-800 mb-2">What Will You Buy? 🛒</h3>
                          <p className="text-blue-700">
                            Break down your funding needs. Show donors exactly what their money will buy. 
                            This builds massive trust and increases donations by up to 300%! 📈
                          </p>
                        </div>
                      </div>
                      
                      {formData.funding_breakdown.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-blue-300 rounded-lg">
                          <ShoppingCart className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                          <p className="text-blue-600 font-medium mb-2">No funding items yet</p>
                          <p className="text-sm text-blue-500 mb-4">
                            Add specific items you need funding for to build trust with donors
                          </p>
                          <Button
                            type="button"
                            onClick={addFundingItem}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Item
                          </Button>
                        </div>
                      )}

                      {formData.funding_breakdown.length > 0 && (
                        <div className="space-y-4">
                          {formData.funding_breakdown.map((item, index) => (
                            <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium text-gray-900">Item #{index + 1}</h4>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFundingItem(item.id)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Input
                                    label="What do you need? 🎯"
                                    type="text"
                                    value={item.item}
                                    onChange={(e) => updateFundingItem(item.id, 'item', e.target.value)}
                                    placeholder="e.g., Professional Synthesizer, Office Rent, Equipment..."
                                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                
                                <div>
                                  <Input
                                    label="How much? 💰"
                                    type="number"
                                    value={item.amount}
                                    onChange={(e) => updateFundingItem(item.id, 'amount', e.target.value)}
                                    placeholder="50000"
                                    className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Why do you need this? 📝
                                </label>
                                <textarea
                                  value={item.description}
                                  onChange={(e) => updateFundingItem(item.id, 'description', e.target.value)}
                                  rows={2}
                                  placeholder="Explain why this item is essential for your project..."
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                />
                              </div>
                              
                              <div className="mt-4">
                                <Input
                                  label="Link to product/service (Optional) 🔗"
                                  type="url"
                                  value={item.link || ''}
                                  onChange={(e) => updateFundingItem(item.id, 'link', e.target.value)}
                                  placeholder="https://store.com/product or https://company.com/pricing"
                                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Link to where you found this item/service. Builds massive credibility! 🚀
                                </p>
                              </div>
                            </div>
                          ))}
                          
                          <Button
                            type="button"
                            onClick={addFundingItem}
                            variant="outline"
                            className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Item
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Motivation Section */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                      <div className="text-center">
                        <Heart className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-purple-800 mb-2">You're About to Go Live! 🚀</h3>
                        <p className="text-purple-700">
                          Your fundraising page will be public and ready to receive donations. 
                          The more details you add, the more people will trust and support your project!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex items-center"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="flex space-x-3">
                  {/* Save Draft Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => saveDraft(true)}
                    disabled={savingDraft || !formData.title.trim()}
                    className="flex items-center"
                  >
                    {savingDraft ? (
                      <>
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
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
                      className="flex items-center bg-gradient-to-r from-tiffany-500 to-orange-500 hover:from-tiffany-600 hover:to-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center bg-gradient-to-r from-green-500 to-tiffany-500 hover:from-green-600 hover:to-tiffany-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                          Creating Magic...
                        </div>
                      ) : (
                        <>
                          🚀 Launch My Page!
                          <Sparkles className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </Card>

        {/* Success Stories Section */}
        <div className="mt-12 mb-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Join Thousands of Successful Creators 🌟</h3>
            <p className="text-gray-600">Real people achieving real dreams with Bitcoin fundraising</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
              <div className="text-center">
                <div className="text-3xl mb-3">🎨</div>
                <h4 className="font-semibold text-gray-900 mb-2">Sarah's Art Studio</h4>
                <p className="text-sm text-gray-600 mb-3">Raised 2.5 BTC for her digital art platform</p>
                <div className="text-tiffany-600 font-medium">500+ supporters</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
              <div className="text-center">
                <div className="text-3xl mb-3">💻</div>
                <h4 className="font-semibold text-gray-900 mb-2">Tech Startup MVP</h4>
                <p className="text-sm text-gray-600 mb-3">Funded their first product launch</p>
                <div className="text-tiffany-600 font-medium">1.8 BTC raised</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
              <div className="text-center">
                <div className="text-3xl mb-3">🌱</div>
                <h4 className="font-semibold text-gray-900 mb-2">Community Garden</h4>
                <p className="text-sm text-gray-600 mb-3">Bringing fresh food to their neighborhood</p>
                <div className="text-tiffany-600 font-medium">300+ donors</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pb-12">
          <p className="text-sm text-gray-500">
            Need help? Check out our{' '}
            <a href="/docs" className="text-tiffany-600 hover:text-tiffany-700 font-medium">
              documentation
            </a>
            {' '}or{' '}
            <a href="/support" className="text-tiffany-600 hover:text-tiffany-700 font-medium">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 