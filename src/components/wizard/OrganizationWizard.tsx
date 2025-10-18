'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Building, ArrowRight, Check } from 'lucide-react'

interface OrganizationFormData {
  name: string
  slug: string
  description: string
  type: string
  websiteUrl: string
  treasuryAddress: string
}

export function OrganizationWizard() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    slug: '',
    description: '',
    type: 'community',
    websiteUrl: '',
    treasuryAddress: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (updates: Partial<OrganizationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (value: string) => {
    updateFormData({ name: value })
    if (!formData.slug) {
      updateFormData({ slug: generateSlug(value) })
    }
  }

  const canProceedToStep2 = formData.name.trim() && formData.slug.trim()
  const canSubmit = canProceedToStep2 && formData.type.trim()

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create an organization')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          type: formData.type,
          website_url: formData.websiteUrl,
          treasury_address: formData.treasuryAddress
        })
      })

      if (!response.ok) throw new Error('Failed to create organization')

      const data = await response.json()
      toast.success('Organization created successfully!')
      router.push(`/organizations/${data.data.slug}`)
    } catch (error) {
      toast.error('Failed to create organization')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step < currentStep ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 2 && (
              <div className={`w-12 h-0.5 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Details</h2>
          <p className="text-gray-600 mb-6">Tell us about your organization</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Bitcoin Education Foundation"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization URL *
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={formData.slug}
                    onChange={(e) => updateFormData({ slug: e.target.value })}
                    placeholder="bitcoin-education"
                    className="w-full"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateFormData({ slug: generateSlug(formData.name) })}
                  disabled={!formData.name}
                >
                  Auto-generate
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">URL-friendly identifier</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Tell us about your organization's mission and goals..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Type & Submit */}
      {currentStep === 2 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Type</h2>
          <p className="text-gray-600 mb-6">Choose the type that best describes your organization</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => updateFormData({ type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="dao">DAO - Decentralized Autonomous Organization</option>
                <option value="company">Company - For-profit business</option>
                <option value="nonprofit">Non-profit - Charitable organization</option>
                <option value="community">Community - Community group</option>
                <option value="cooperative">Cooperative - Co-owned organization</option>
                <option value="foundation">Foundation - Educational foundation</option>
                <option value="collective">Collective - Member-owned collective</option>
                <option value="guild">Guild - Professional association</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <Input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
                placeholder="https://yourorganization.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treasury Address (Optional)
              </label>
              <Input
                value={formData.treasuryAddress}
                onChange={(e) => updateFormData({ treasuryAddress: e.target.value })}
                placeholder="bc1q... (Bitcoin address for collective funds)"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Where Bitcoin donations will be received</p>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
