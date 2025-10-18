'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Target, ArrowRight, Check, AlertCircle } from 'lucide-react'

interface CampaignFormData {
  title: string
  description: string
  goalAmount: string
  bitcoinAddress: string
  category: string
  tags: string[]
}

export function CampaignWizard() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    goalAmount: '',
    bitcoinAddress: '',
    category: '',
    tags: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (updates: Partial<CampaignFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const canProceedToStep2 = formData.title.trim() && formData.description.trim()
  const canProceedToStep3 = canProceedToStep2 && formData.goalAmount.trim() && formData.bitcoinAddress.trim()
  const canSubmit = canProceedToStep3 && formData.category.trim()

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create a campaign')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          goal_amount: parseInt(formData.goalAmount),
          bitcoin_address: formData.bitcoinAddress,
          category: formData.category,
          tags: formData.tags
        })
      })

      if (!response.ok) throw new Error('Failed to create campaign')

      const data = await response.json()
      toast.success('Campaign created successfully!')
      router.push(`/campaign/${data.data.id}`)
    } catch (error) {
      toast.error('Failed to create campaign')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step < currentStep ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-0.5 mx-2 ${
                step < currentStep ? 'bg-orange-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Details</h2>
          <p className="text-gray-600 mb-6">Tell us about your fundraising campaign</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="e.g., Help Build a Bitcoin Education Center"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Describe your project, its goals, and why people should support it..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Funding Details */}
      {currentStep === 2 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Funding Setup</h2>
          <p className="text-gray-600 mb-6">Configure your Bitcoin payment details</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goal Amount (sats) *
              </label>
              <Input
                type="number"
                value={formData.goalAmount}
                onChange={(e) => updateFormData({ goalAmount: e.target.value })}
                placeholder="1000000"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">How many satoshis do you want to raise?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bitcoin Address *
              </label>
              <Input
                value={formData.bitcoinAddress}
                onChange={(e) => updateFormData({ bitcoinAddress: e.target.value })}
                placeholder="bc1q..."
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Where donations will be sent</p>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Category & Submit */}
      {currentStep === 3 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Category & Launch</h2>
          <p className="text-gray-600 mb-6">Choose your campaign category and launch</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateFormData({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select a category</option>
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="technology">Technology</option>
                <option value="community">Community</option>
                <option value="charity">Charity</option>
                <option value="business">Business</option>
                <option value="creative">Creative</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Launch Campaign'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
