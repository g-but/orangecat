'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Zap, ArrowRight, Check } from 'lucide-react'

interface ProjectFormData {
  name: string
  description: string
  category: string
  websiteUrl: string
  githubUrl: string
  visibility: 'public' | 'private'
}

export function ProjectWizard() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    category: '',
    websiteUrl: '',
    githubUrl: '',
    visibility: 'public'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (updates: Partial<ProjectFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const canProceedToStep2 = formData.name.trim() && formData.description.trim()
  const canSubmit = canProceedToStep2 && formData.category.trim()

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create a project')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          website_url: formData.websiteUrl,
          github_url: formData.githubUrl,
          visibility: formData.visibility
        })
      })

      if (!response.ok) throw new Error('Failed to create project')

      const data = await response.json()
      toast.success('Project created successfully!')
      router.push(`/projects/${data.data.id}`)
    } catch (error) {
      toast.error('Failed to create project')
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
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {step < currentStep ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 2 && (
              <div className={`w-12 h-0.5 mx-2 ${
                step < currentStep ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Details</h2>
          <p className="text-gray-600 mb-6">Tell us about your project</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="e.g., Bitcoin Wallet App"
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
                placeholder="Describe your project, its goals, and what you're building..."
                rows={4}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateFormData({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                <option value="opensource">Open Source</option>
                <option value="mobile">Mobile App</option>
                <option value="web">Web Application</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="research">Research</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Links & Submit */}
      {currentStep === 2 && (
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Links</h2>
          <p className="text-gray-600 mb-6">Add links to help others find and contribute to your project</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <Input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => updateFormData({ websiteUrl: e.target.value })}
                placeholder="https://yourproject.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitHub Repository
              </label>
              <Input
                value={formData.githubUrl}
                onChange={(e) => updateFormData({ githubUrl: e.target.value })}
                placeholder="https://github.com/username/repository"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={(e) => updateFormData({ visibility: e.target.value as 'public' | 'private' })}
                    className="mr-2"
                  />
                  Public - Visible to everyone
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={(e) => updateFormData({ visibility: e.target.value as 'public' | 'private' })}
                    className="mr-2"
                  />
                  Private - Only visible to you and collaborators
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
